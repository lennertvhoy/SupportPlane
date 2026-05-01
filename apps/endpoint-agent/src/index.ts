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

const CONFIG_PATH = process.env['SUPPORTPLANE_ENDPOINT_CONFIG'] ?? '.supportplane-endpoint-agent.json';

async function loadConfig(): Promise<AgentConfig> {
  const saved: Partial<AgentConfig> = await fs.readFile(CONFIG_PATH, 'utf8').then((v) => JSON.parse(v) as Partial<AgentConfig>).catch(() => ({}));
  return {
    apiUrl: process.env['SUPPORTPLANE_API_URL'] ?? saved.apiUrl ?? 'http://localhost:4110',
    tenantId: process.env['SUPPORTPLANE_ENDPOINT_TENANT_ID'] ?? saved.tenantId ?? 'dev-tenant',
    enrollmentToken: process.env['SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN'] ?? saved.enrollmentToken ?? 'local-endpoint-enrollment-token',
    deviceKey: process.env['SUPPORTPLANE_ENDPOINT_DEVICE_KEY'] ?? saved.deviceKey ?? `${os.hostname()}-${os.platform()}-${os.arch()}`,
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
  const res = await fetch(`${config.apiUrl}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    throw new Error(`${path} failed: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<Record<string, unknown>>;
}

async function register(config: AgentConfig): Promise<AgentConfig> {
  if (config.deviceToken) return config;
  const inventory = await collectInventory();
  const result = await postJson(config, '/endpoint-agent/register', {
    tenantId: config.tenantId,
    enrollmentToken: config.enrollmentToken,
    deviceKey: config.deviceKey,
    displayName: os.hostname(),
    hostname: os.hostname(),
    platform: `${os.platform()} ${os.release()} ${os.arch()}`,
    agentVersion: AGENT_VERSION,
    inventory,
  }, false);
  const deviceToken = result['deviceToken'];
  if (typeof deviceToken !== 'string') throw new Error('Registration response did not include a device token.');
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
  const command = claimed['command'] as { id?: string; commandKind?: string; nonce?: string } | null;
  if (!command?.id || !command.commandKind || !command.nonce) return false;
  try {
    const diagnostic = await runFixedDiagnostic(command.commandKind);
    await postJson(config, `/endpoint-agent/snapshots`, diagnostic);
    await postJson(config, `/endpoint-agent/commands/${command.id}/result`, {
      nonce: command.nonce,
      status: 'succeeded',
      payload: diagnostic,
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const once = process.env['SUPPORTPLANE_ENDPOINT_ONCE'] === '1';
  await runOnce();
  if (!once) {
    setInterval(() => {
      runOnce().catch((err) => console.error(err instanceof Error ? err.message : err));
    }, Number(process.env['SUPPORTPLANE_ENDPOINT_INTERVAL_MS'] ?? 15000));
  }
}
