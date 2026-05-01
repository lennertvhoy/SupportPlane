#!/usr/bin/env node
const { chromium } = require('playwright');
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

const repoRoot = path.resolve(__dirname, '..');
const evidenceDir = path.join(repoRoot, 'output/playwright/session-124-large-backlog-slice');
const apiBase = process.env.SUPPORTPLANE_EVIDENCE_API_BASE || 'http://localhost:4110';
const webBase = process.env.SUPPORTPLANE_EVIDENCE_WEB_BASE || 'http://localhost:3200';
const tenantId = 'dev-tenant';
let adminCookie = '';

function adminHeaders() {
  return {
    'content-type': 'application/json',
    'x-tenant-id': tenantId,
    'x-user-id': 'dev-admin',
    'x-user-role': 'admin',
    ...(adminCookie ? { cookie: adminCookie } : {}),
  };
}

function sh(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

async function api(pathname, options = {}) {
  const res = await fetch(`${apiBase}${pathname}`, {
    ...options,
    headers: { ...(options.headers || {}) },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { text };
  }
  if (!res.ok) {
    throw new Error(`${options.method || 'GET'} ${pathname} failed: ${res.status} ${text}`);
  }
  return body;
}

function writeJson(name, value) {
  fs.writeFileSync(path.join(evidenceDir, name), `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(name, value) {
  fs.writeFileSync(path.join(evidenceDir, name), value.endsWith('\n') ? value : `${value}\n`);
}

async function login(page) {
  await page.goto(webBase, { waitUntil: 'networkidle' });
  if (await page.getByRole('button', { name: 'Log in' }).count()) {
    await page.getByRole('button', { name: 'Log in' }).click();
    await page.waitForLoadState('networkidle');
  }
}

async function loginApi() {
  const res = await fetch(`${apiBase}/auth/local/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@supportplane.local',
      password: 'supportplane-demo',
      tenantSlug: tenantId,
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`API login failed: ${res.status} ${text}`);
  }
  adminCookie = res.headers.get('set-cookie')?.split(';')[0] ?? '';
  if (!adminCookie) {
    throw new Error('API login did not return a session cookie');
  }
}

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(evidenceDir, name), fullPage: false });
}

async function prepareRemediationRun() {
  const deviceKey = `session-124-linux-endpoint-${Date.now()}`;
  const register = await api('/endpoint-agent/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      tenantId,
      enrollmentToken: 'local-endpoint-enrollment-token',
      deviceKey,
      displayName: 'Session 124 Linux Endpoint',
      hostname: os.hostname(),
      platform: `${os.platform()} ${os.release()} ${os.arch()}`,
      agentVersion: '0.1.0-session-124',
      inventory: { readOnly: true, evidenceSession: 'session-124' },
    }),
  });

  const agentConfig = path.join(os.tmpdir(), `supportplane-session124-agent-${process.pid}.json`);
  fs.writeFileSync(agentConfig, JSON.stringify({
    apiUrl: apiBase,
    tenantId,
    enrollmentToken: 'local-endpoint-enrollment-token',
    deviceKey,
    deviceToken: register.deviceToken,
  }, null, 2), { mode: 0o600 });

  await api('/endpoint-agent/heartbeat', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-endpoint-tenant-id': tenantId,
      'x-endpoint-device-key': deviceKey,
      'x-endpoint-device-token': register.deviceToken,
    },
    body: JSON.stringify({
      agentVersion: '0.1.0-session-124',
      status: 'online',
      summary: { evidenceSession: 'session-124', platform: os.platform(), readOnly: true },
    }),
  });

  const invocation = await api(`/admin/devices/${register.device.id}/tools/remediation.flush_dns_cache/invoke`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ requestedInput: {}, idempotencyKey: `session-124-flush-dns-${Date.now()}` }),
  });

  return { device: register.device, agentConfig, invocation: invocation.invocation, policyDecision: invocation.policyDecision };
}

async function approveAndRun(remediation) {
  if (!remediation.invocation.approvalId) {
    throw new Error('Expected approvalId for remediation invocation');
  }
  await api(`/admin/tool-approvals/${remediation.invocation.approvalId}/approve`, {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ reason: 'Session 124 evidence approval for low-risk flush DNS' }),
  });

  const result = spawnSync('npm', ['run', 'dev', '--workspace', 'apps/endpoint-agent'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: {
      ...process.env,
      SUPPORTPLANE_ENDPOINT_ONCE: '1',
      SUPPORTPLANE_ENDPOINT_CONFIG: remediation.agentConfig,
      SUPPORTPLANE_API_URL: apiBase,
      SUPPORTPLANE_ENDPOINT_TENANT_ID: tenantId,
      SUPPORTPLANE_ENDPOINT_DEVICE_KEY: remediation.device.deviceKey,
    },
    timeout: 30000,
  });
  if (result.status !== 0) {
    throw new Error(`endpoint-agent run failed: ${result.stdout}\n${result.stderr}`);
  }

  const invocations = await api('/admin/tool-invocations', { headers: adminHeaders() });
  const finalInvocation = invocations.invocations.find((item) => item.id === remediation.invocation.id);
  return { agentStdout: result.stdout, agentStderr: result.stderr, finalInvocation };
}

async function main() {
  fs.rmSync(evidenceDir, { recursive: true, force: true });
  fs.mkdirSync(evidenceDir, { recursive: true });

  const consoleEvents = [];
  const health = await api('/health');
  writeJson('01-runtime-identity-health.json', health);
  writeText('02-git-status-before-final.txt', sh('git', ['status', '--short', '--branch']));
  writeText('03-git-log-before-final.txt', sh('git', ['log', '--oneline', '-5']));

  await loginApi();
  const remediation = await prepareRemediationRun();

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const [cookieName, ...cookieValueParts] = adminCookie.split('=');
  await context.addCookies([{
    name: cookieName,
    value: cookieValueParts.join('='),
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  const page = await context.newPage();
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type())) consoleEvents.push(`${msg.type()}: ${msg.text()}`);
  });
  page.on('pageerror', (err) => consoleEvents.push(`pageerror: ${err.message}`));
  page.on('requestfailed', (req) => consoleEvents.push(`requestfailed: ${req.method()} ${req.url()} ${req.failure()?.errorText}`));

  await login(page);
  await page.goto(`${webBase}/tool-registry`, { waitUntil: 'networkidle' });
  await screenshot(page, '06-windows-endpoint-readiness.png');

  await page.goto(`${webBase}/approval-queue`, { waitUntil: 'networkidle' });
  await screenshot(page, '07-remediation-approval-queued.png');

  const runResult = await approveAndRun(remediation);
  writeJson('08-remediation-result.json', {
    invocationId: remediation.invocation.id,
    status: runResult.finalInvocation?.status,
    normalizedResult: runResult.finalInvocation?.normalizedResult,
    agentStdout: runResult.agentStdout.trim(),
    agentStderr: runResult.agentStderr.trim(),
  });

  await page.goto(`${webBase}/device-console`, { waitUntil: 'networkidle' });
  await page.getByText('Session 124 Linux Endpoint').click().catch(() => undefined);
  await screenshot(page, '09-remediation-approved-result.png');

  const knowledge = await api('/knowledge/retrieve', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ query: 'VPN', mode: 'auto', limit: 3 }),
  });
  writeJson('10-knowledge-retrieval-status.json', knowledge);

  await page.goto(webBase, { waitUntil: 'networkidle' });
  await screenshot(page, '11-connector-status-truth.png');

  writeText('04-validation-summary.txt', [
    'Validation commands are recorded in the final handoff.',
    'Runtime browser proof captured by scripts/session124_large_backlog_slice_evidence.js.',
    `API base: ${apiBase}`,
    `Web base: ${webBase}`,
    `Health head: ${health.head}`,
    `Remediation invocation: ${remediation.invocation.id}`,
    `Remediation final status: ${runResult.finalInvocation?.status}`,
    `Knowledge retrieval method: ${knowledge.retrievalMethod}`,
    `pgvector enabled: ${knowledge.pgvectorEnabled}`,
  ].join('\n'));

  writeText('05-backlog-status-check.md', [
    '# Backlog Status Check',
    '',
    '- BL-065: partial/linux-tested; flush DNS fixed-template path executed on local Linux when resolver tooling is available.',
    '- BL-073/074: partial/hybrid-ready; pgvector readiness and fallback reason exposed, semantic path remains gated.',
    '- BL-069/071/072/127: partial/local fixture or unconfigured; no real connector instance used.',
    '- BL-130/131/132: partial Linux-tested/docs-scaffold; Windows parsers/templates and packaging scaffold exist.',
    '- BL-133: blocked/no-windows-host; no real Windows runner was available.',
  ].join('\n'));

  writeText('13-console-network-summary.txt', consoleEvents.length ? consoleEvents.join('\n') : 'No browser console errors or request failures captured by the evidence script.');

  const files = fs.readdirSync(evidenceDir).sort();
  writeText('12-final-evidence-index.md', [
    '# Session 124 Evidence Index',
    '',
    `Generated: ${new Date().toISOString()}`,
    `API: ${apiBase}`,
    `Web: ${webBase}`,
    `Git HEAD observed by API health: ${health.head}`,
    '',
    '## Inventory',
    ...files.map((file, index) => `${index + 1}. ${file}`),
    '',
    '## Truth Notes',
    '- Real Windows runner was not available; BL-133 remains blocked/no-windows-host.',
    `- Knowledge retrieval mode: ${knowledge.retrievalMethod}; pgvectorEnabled: ${knowledge.pgvectorEnabled}; reason: ${knowledge.pgvectorReason}`,
    `- Flush DNS final status: ${runResult.finalInvocation?.status}; result captured in 08-remediation-result.json and 09-remediation-approved-result.png.`,
    '- Connector status proof is UI/API truth only; no real GLPI, MeshCentral, Fortinet, or osTicket instance was used.',
    '- AI output remains mock/local only; no cloud AI integration was enabled.',
  ].join('\n'));

  await browser.close();
  const finalFiles = fs.readdirSync(evidenceDir);
  if (finalFiles.length > 20) {
    throw new Error(`Evidence folder has ${finalFiles.length} files, exceeding max 20`);
  }
  console.log(`Wrote ${finalFiles.length} evidence files to ${evidenceDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
