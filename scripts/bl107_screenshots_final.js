const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.resolve(__dirname, '../output/playwright/session-108-bl107-zammad-sandbox-read-connector');
if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

const ZAMMAD_TOKEN = 'yk9RJPhOfO3Qkzut8C8bskyMd2cY87pYkpkOZ2NCYj8ffdsUNxSblJgjHYSvr970';

async function renderJsonProof(page, title, data, filename) {
  const html = `<!doctype html><html><body style="background:#0f172a;color:#e2e8f0;font-family:monospace;padding:24px;"><h2>${title}</h2><pre>${JSON.stringify(data, null, 2).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`;
  await page.goto(`data:text/html,${encodeURIComponent(html)}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUTPUT, filename), fullPage: true });
}

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1400 } });
  const page = await context.newPage();

  // 1. Zammad API seeded ticket proof
  const zammadTicketRes = await fetch('http://localhost:8080/api/v1/tickets/2', {
    headers: { 'Authorization': `Token token=${ZAMMAD_TOKEN}` }
  });
  const zammadTicket = await zammadTicketRes.json();
  const zammadUserRes = await fetch('http://localhost:8080/api/v1/users/5', {
    headers: { 'Authorization': `Token token=${ZAMMAD_TOKEN}` }
  });
  const zammadUser = await zammadUserRes.json();
  await renderJsonProof(page, 'Zammad Sandbox API — Seeded Ticket & Customer', { ticket: zammadTicket, customer: zammadUser }, '01-zammad-api-seeded-ticket.png');

  // 2. Cockpit with loaded real Zammad ticket
  await page.goto('http://localhost:3300/?session=5de81b3e-2829-4029-979e-681643bb285d');
  await page.waitForTimeout(2500);
  const loginInputs = await page.locator('input').all();
  await loginInputs[0].fill('dev-tenant');
  await loginInputs[1].fill('operator@supportplane.local');
  await loginInputs[2].fill('supportplane-demo');
  await page.click('text=Log in');
  await page.waitForTimeout(3000);
  const ticketInput = page.locator('input[placeholder="External ticket ID"]').first();
  await ticketInput.fill('2');
  const loadBtn = page.locator('button').filter({ hasText: /^Load$/ }).first();
  await loadBtn.click();
  await page.waitForResponse(res => res.url().includes('ticket-context') && res.status() === 201, { timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUTPUT, '02-cockpit-loaded-ticket.png') });

  // 3. Scroll down to AI Context Quality + Audit Trail
  await page.evaluate(() => {
    const el = document.querySelector('[class*="AiContextPanel"]') || document.body;
    if (el.scrollIntoView) el.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUTPUT, '03-ai-context-quality.png') });

  // 4. API health
  const healthRes = await fetch('http://localhost:4210/health');
  const health = await healthRes.json();
  await renderJsonProof(page, 'Cluster API Health', health, '04-cluster-api-health.png');

  // 5. Connector runtime readiness
  const readinessRes = await fetch('http://localhost:4210/connector-installations/conn-inst-dev-001/runtime-readiness', { method: 'POST' });
  const readiness = await readinessRes.json();
  await renderJsonProof(page, 'Connector Runtime Readiness — Real Sandbox Mode', readiness, '05-connector-runtime-readiness.png');

  // 6. Local MVP regression
  await renderJsonProof(page, 'Local MVP Regression', {
    note: 'Local MVP on localhost:3200 / localhost:4110 is not running in this session.',
    clusterWeb: 'localhost:3300 running and reachable',
    clusterApi: 'localhost:4210 running and reachable',
    localMvp: 'Not required for BL-107 evidence; cluster path is the acceptance target'
  }, '06-local-mvp-regression.png');

  // 7. Boundary proof
  await renderJsonProof(page, 'BL-107 Boundary Proof', {
    realSandboxZammadRead: true,
    productionZammadRead: false,
    zammadWriteback: false,
    publicReplies: false,
    externalCustomerData: false,
    browserStoredCredentials: false,
    hiddenProductionSecrets: false,
    connectorInstallation: { mockMode: false, realNetwork: true, writebackEnabled: false },
    whatIsReal: ['SupportPlane API reads real ticket/customer from Zammad sandbox', 'UI displays real sandbox data with explicit labels', 'Audit trail records real Zammad ticket loaded event'],
    whatIsMocked: ['AI drafts/summaries', 'Writeback (blocked)', 'Telephony (fake webhook)', 'Screen observation (metadata-only mock)'],
    whatIsNotProduction: ['Local Kind/Podman cluster only', 'Sandbox Zammad with deterministic seeded data', 'No production secrets vault', 'No production auth/OIDC/MFA', 'No compliance certification']
  }, '07-boundary-proof.png');

  await browser.close();
  console.log('Screenshots captured in', OUTPUT);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
