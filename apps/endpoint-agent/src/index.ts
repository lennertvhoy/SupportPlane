import fs from 'fs/promises';
import os from 'os';
import { AGENT_VERSION, collectInventory, runFixedDiagnostic } from './collectors/index.js';

interface AgentConfig {
  apiUrl: string;
  tenantId: string;
  enrollmentToken: string;
  deviceKey: string;
  deviceToken?: string;
}

const CONFIG_PATH =
  process.env['SUPPORTPLANE_ENDPOINT_CONFIG'] ?? '.supportplane-endpoint-agent.json';

async function loadConfig(): Promise<AgentConfig> {
  const saved: Partial<AgentConfig> = await fs
    .readFile(CONFIG_PATH, 'utf8')
    .then((v) => JSON.parse(v) as Partial<AgentConfig>)
    .catch(() => ({}));
  return {
    apiUrl: process.env['SUPPORTPLANE_API_URL'] ?? saved.apiUrl ?? 'http://localhost:4110',
    tenantId: process.env['SUPPORTPLANE_ENDPOINT_TENANT_ID'] ?? saved.tenantId ?? 'dev-tenant',
    enrollmentToken:
      process.env['SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN'] ??
      saved.enrollmentToken ??
      'local-endpoint-enrollment-token',
    deviceKey:
      process.env['SUPPORTPLANE_ENDPOINT_DEVICE_KEY'] ??
      saved.deviceKey ??
      `${os.hostname()}-${os.platform()}-${os.arch()}`,
    deviceToken: process.env['SUPPORTPLANE_ENDPOINT_DEVICE_TOKEN'] ?? saved.deviceToken,
  };
}

async function saveConfig(config: AgentConfig) {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), { mode: 0o600 });
}

async function postJson(config: AgentConfig, path: string, body: unknown, agentAuth = true) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (agentAuth) {
    headers['x-endpoint-tenant-id'] = config.tenantId;
    headers['x-endpoint-device-key'] = config.deviceKey;
    headers['x-endpoint-device-token'] = config.deviceToken ?? '';
  }
  const res = await fetch(`${config.apiUrl}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

async function register(config: AgentConfig): Promise<AgentConfig> {
  if (config.deviceToken) return config;
  const inventory = await collectInventory();
  const result = await postJson(
    config,
    '/endpoint-agent/register',
    {
      tenantId: config.tenantId,
      enrollmentToken: config.enrollmentToken,
      deviceKey: config.deviceKey,
      displayName: os.hostname(),
      hostname: os.hostname(),
      platform: `${os.platform()} ${os.release()} ${os.arch()}`,
      agentVersion: AGENT_VERSION,
      inventory,
    },
    false,
  );
  const deviceToken = result['deviceToken'];
  if (typeof deviceToken !== 'string')
    throw new Error('Registration response did not include a device token.');
  const next = { ...config, deviceToken };
  await saveConfig(next);
  return next;
}

async function heartbeat(config: AgentConfig) {
  await postJson(config, '/endpoint-agent/heartbeat', {
    agentVersion: AGENT_VERSION,
    status: 'online',
    summary: {
      hostname: os.hostname(),
      platform: os.platform(),
      uptimeSeconds: Math.round(os.uptime()),
      readOnly: true,
    },
  });
}

async function claimAndRun(config: AgentConfig) {
  const claimed = await postJson(config, '/endpoint-agent/commands/claim', {});
  const command = claimed['command'] as {
    id?: string;
    commandKind?: string;
    nonce?: string;
  } | null;
  if (!command?.id || !command.commandKind || !command.nonce) return false;
  try {
    const diagnostic = await runFixedDiagnostic(command.commandKind);
    const payload = diagnostic.payload as Record<string, unknown>;
    if (diagnostic.kind !== 'remediation') {
      await postJson(config, `/endpoint-agent/snapshots`, diagnostic);
    }
    await postJson(config, `/endpoint-agent/commands/${command.id}/result`, {
      nonce: command.nonce,
      status: payload['ok'] === false ? 'failed' : 'succeeded',
      payload: diagnostic,
      errorCode:
        payload['ok'] === false ? String(payload['resultStatus'] ?? 'command_failed') : undefined,
      errorMessage:
        payload['ok'] === false
          ? String(payload['stderrSummary'] ?? payload['note'] ?? 'Command failed')
          : undefined,
    });
  } catch (err) {
    await postJson(config, `/endpoint-agent/commands/${command.id}/result`, {
      nonce: command.nonce,
      status: 'failed',
      errorCode: 'diagnostic_failed',
      errorMessage: err instanceof Error ? err.message : 'Unknown diagnostic error',
    });
  }
  return true;
}

export async function runOnce() {
  const config = await register(await loadConfig());
  await heartbeat(config);
  await claimAndRun(config);
}

function parseArgs(): {
  mode: 'daemon' | 'register' | 'heartbeat' | 'diagnostic';
  diagnosticKind?: string;
} | null {
  const args = process.argv.slice(2);
  if (args.length === 0) return { mode: 'daemon' };
  if (args.includes('--register')) return { mode: 'register' };
  if (args.includes('--heartbeat')) return { mode: 'heartbeat' };
  const diagIdx = args.indexOf('--diagnostic');
  if (diagIdx >= 0 && diagIdx + 1 < args.length) {
    return { mode: 'diagnostic', diagnosticKind: args[diagIdx + 1] };
  }
  if (args.includes('--help') || args.includes('-h')) {
    console.error('Usage: node dist/src/index.js [--register | --heartbeat | --diagnostic <kind>]');
    console.error('  --register          Register with SupportPlane API and receive device token');
    console.error('  --heartbeat         Send heartbeat to SupportPlane API');
    console.error(
      '  --diagnostic <kind> Run a fixed diagnostic (inventory, disk, network, services, software, status)',
    );
    console.error('');
    console.error('No flags: run as daemon (register, heartbeat, claim/run loop)');
    console.error('');
    console.error('Environment variables:');
    console.error('  SUPPORTPLANE_API_URL                     API base URL');
    console.error('  SUPPORTPLANE_ENDPOINT_TENANT_ID          Tenant ID for enrollment');
    console.error('  SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN   Enrollment token');
    console.error('  SUPPORTPLANE_ENDPOINT_DEVICE_KEY         Unique device key');
    console.error('  SUPPORTPLANE_ENDPOINT_ONCE=1             Run once instead of looping');
    return null;
  }
  return null;
}

async function cliRegister() {
  const config = await loadConfig();
  const result = await register(config);
  console.log(
    JSON.stringify({
      agentId: result.deviceKey,
      platform: os.platform(),
      hostname: os.hostname(),
      registered: true,
      note: 'Agent registered successfully. Device token saved locally.',
    }),
  );
}

async function cliHeartbeat() {
  const config = await loadConfig();
  if (!config.deviceToken) {
    console.error('ERROR: Not registered. No device token found. Run --register first.');
    process.exit(1);
  }
  await heartbeat(config);
  console.log(
    JSON.stringify({
      platform: os.platform(),
      hostname: os.hostname(),
      heartbeat: true,
      status: 'online',
    }),
  );
}

async function cliDiagnostic(kind: string) {
  const kindMap: Record<string, string> = {
    inventory: 'collect_inventory',
    disk: 'collect_disk',
    network: 'collect_network',
    services: 'collect_services',
    software: 'collect_software',
    status: 'ping_self',
  };
  const commandKind = kindMap[kind] ?? kind;
  const result = await runFixedDiagnostic(commandKind);
  console.log(JSON.stringify(result.payload));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cli = parseArgs();
  if (cli === null) process.exit(1);
  if (cli.mode === 'register') {
    await cliRegister();
    process.exit(0);
  }
  if (cli.mode === 'heartbeat') {
    await cliHeartbeat();
    process.exit(0);
  }
  if (cli.mode === 'diagnostic' && cli.diagnosticKind) {
    await cliDiagnostic(cli.diagnosticKind);
    process.exit(0);
  }
  const once = process.env['SUPPORTPLANE_ENDPOINT_ONCE'] === '1';
  await runOnce();
  if (!once) {
    setInterval(
      () => {
        runOnce().catch((err) => console.error(err instanceof Error ? err.message : err));
      },
      Number(process.env['SUPPORTPLANE_ENDPOINT_INTERVAL_MS'] ?? 15000),
    );
  }
}
