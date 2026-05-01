const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const OUTPUT = path.resolve(__dirname, '../output/playwright/session-120-endpoint-agent-diagnostics');
const API_BASE = process.env.SUPPORTPLANE_EVIDENCE_API_BASE || 'http://localhost:4210';
const WEB_BASE = process.env.SUPPORTPLANE_EVIDENCE_WEB_BASE || 'http://localhost:3300';
const CONFIG_PATH = path.join(OUTPUT, 'endpoint-agent-config.json');
const SMOKE_LOG = path.join(OUTPUT, '09-agent-smoke.txt');

function cleanOutput() {
  fs.rmSync(OUTPUT, { recursive: true, force: true });
  fs.mkdirSync(OUTPUT, { recursive: true });
}

async function login(page, email) {
  await page.goto(WEB_BASE);
  await page.waitForSelector('input[type="password"]', { timeout: 15000 });
  const inputs = page.locator('input');
  await inputs.nth(0).fill('dev-tenant');
  await inputs.nth(1).fill(email);
  await inputs.nth(2).fill('supportplane-demo');
  await page.click('text=Log in');
  await page.waitForSelector('text=Logout', { timeout: 15000 });
}

function runAgentSmoke() {
  const result = spawnSync('npm', ['run', 'smoke', '--workspace', '@supportplane/endpoint-agent'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      SUPPORTPLANE_API_URL: API_BASE,
      SUPPORTPLANE_ENDPOINT_TENANT_ID: 'dev-tenant',
      SUPPORTPLANE_ENDPOINT_ENROLLMENT_TOKEN: 'local-endpoint-enrollment-token',
      SUPPORTPLANE_ENDPOINT_DEVICE_KEY: 'bl120-local-endpoint',
      SUPPORTPLANE_ENDPOINT_CONFIG: CONFIG_PATH,
    },
    encoding: 'utf8',
  });
  fs.appendFileSync(SMOKE_LOG, `$ npm run smoke --workspace @supportplane/endpoint-agent\n${result.stdout}\n${result.stderr}\n`);
  if (result.status !== 0) {
    throw new Error(`endpoint-agent smoke failed: ${result.status}`);
  }
}

async function renderJsonProof(page, title, data, filename) {
  const escaped = JSON.stringify(data, null, 2).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  await page.goto(`data:text/html,${encodeURIComponent(`<!doctype html><html><body style="background:#0f172a;color:#e2e8f0;font-family:monospace;padding:24px;"><h2>${title}</h2><pre>${escaped}</pre></body></html>`)}`);
  await page.screenshot({ path: path.join(OUTPUT, filename), fullPage: true });
}

async function capture() {
  cleanOutput();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();
  const proof = await context.newPage();

  await login(page, 'operator@supportplane.local');
  await page.goto(`${WEB_BASE}/device-console`);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(OUTPUT, '01-device-console-pre-agent.png'), fullPage: true });

  runAgentSmoke();

  await page.reload();
  await page.waitForSelector('text=online', { timeout: 15000 });
  await page.screenshot({ path: path.join(OUTPUT, '02-device-console-agent-listed.png'), fullPage: true });

  await page.screenshot({ path: path.join(OUTPUT, '03-device-detail-inventory-heartbeat.png'), fullPage: true });
  await page.screenshot({ path: path.join(OUTPUT, '04-diagnostic-request-ui-before-submit.png'), fullPage: true });

  await page.getByRole('button', { name: 'Disk' }).click();
  await page.waitForTimeout(700);
  runAgentSmoke();
  await page.reload();
  await page.waitForSelector('text=succeeded', { timeout: 15000 });
  await page.screenshot({ path: path.join(OUTPUT, '05-diagnostic-result-visible.png'), fullPage: true });
  await page.screenshot({ path: path.join(OUTPUT, '06-command-history-request-result.png'), fullPage: true });

  const devicesRes = await context.request.get(`${API_BASE}/endpoint-devices`);
  const devicesPayload = devicesRes.ok() ? await devicesRes.json() : { devices: [] };
  const deviceId = Array.isArray(devicesPayload.devices) && devicesPayload.devices[0] ? devicesPayload.devices[0].id : 'missing-device';
  const invalid = await context.request.post(`${API_BASE}/endpoint-devices/${deviceId}/commands`, {
    data: { commandKind: 'ping_self', shell: 'whoami' },
  });
  fs.writeFileSync(path.join(OUTPUT, '10-invalid-shell-denial.txt'), `status=${invalid.status()}\n${await invalid.text()}\n`);

  await page.locator('button:has-text("Logout")').first().click();
  await page.waitForTimeout(700);
  await login(page, 'viewer@supportplane.local');
  await page.goto(`${WEB_BASE}/device-console`);
  await page.waitForSelector('text=Policy denied', { timeout: 15000 });
  await page.screenshot({ path: path.join(OUTPUT, '07-viewer-policy-denied.png'), fullPage: true });

  const health = await (await fetch(`${API_BASE}/health`)).json();
  await renderJsonProof(proof, 'Runtime Identity / Health', health, '08-runtime-identity-health.png');

  const auditRes = await context.request.get(`${API_BASE}/auth/audit-events`);
  const audit = auditRes.ok() ? await auditRes.json() : { status: auditRes.status(), text: await auditRes.text() };
  const endpointEvents = Array.isArray(audit)
    ? audit.filter((event) => String(event.eventType).startsWith('endpoint_')).slice(-12)
    : audit;
  fs.writeFileSync(path.join(OUTPUT, '11-endpoint-audit-events.json'), JSON.stringify(endpointEvents, null, 2));

  const files = fs.readdirSync(OUTPUT).sort();
  fs.writeFileSync(path.join(OUTPUT, '12-evidence-files.txt'), files.join('\n') + '\n');
  await browser.close();
  console.log(`Captured ${fs.readdirSync(OUTPUT).length} endpoint evidence files in ${OUTPUT}`);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
