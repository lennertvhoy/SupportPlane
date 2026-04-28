#!/usr/bin/env node
/**
 * BL-098 Closure Repair Screenshot Script
 * Uses local auth via web UI login form, writes to canonical repair folder.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'playwright', 'session-099-bl098-closure-repair-final');
const WEB_URL = 'http://localhost:3200';
const API_URL = 'http://localhost:4110';
const MAX_SCREENSHOTS = 20;

const INST_ID = 'conn-inst-dev-001';

let screenshotCount = 0;
const proofMapping = [];

async function screenshot(page, name, proofState, opts = {}) {
  screenshotCount++;
  if (screenshotCount > MAX_SCREENSHOTS) {
    throw new Error(`Screenshot budget exceeded: ${screenshotCount} > ${MAX_SCREENSHOTS}`);
  }
  const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: filepath, ...opts });
  console.log(`Captured: ${filename} — ${proofState}`);
  proofMapping.push({ number: screenshotCount, filename, proofState });
  return filepath;
}

async function screenshotElement(page, locator, name, proofState) {
  screenshotCount++;
  if (screenshotCount > MAX_SCREENSHOTS) {
    throw new Error(`Screenshot budget exceeded: ${screenshotCount} > ${MAX_SCREENSHOTS}`);
  }
  const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await locator.screenshot({ path: filepath });
  console.log(`Captured: ${filename} — ${proofState}`);
  proofMapping.push({ number: screenshotCount, filename, proofState });
  return filepath;
}

function panelLocator(page, title) {
  return page.locator(`h2:has-text("${title}") >> xpath=ancestor::div[contains(@class,"rounded-lg")][1]`);
}

async function webLogin(page, email, password, tenantSlug) {
  // Check if already logged in on current page
  const identityPill = page.locator('text=/admin|viewer|support_agent/i').first();
  if (await identityPill.count() > 0 && await identityPill.isVisible()) {
    console.log('Already logged in');
    return;
  }
  await page.goto(WEB_URL);
  await page.waitForTimeout(2000);
  const inputs = page.locator('input');
  if (await inputs.count() >= 3) {
    await inputs.nth(0).fill(tenantSlug);
    await inputs.nth(1).fill(email);
    await inputs.nth(2).fill(password);
  }
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);
  await page.waitForSelector('h2:has-text("Connector")', { timeout: 15000 });
}

async function apiLogin(email, password, tenantSlug) {
  const res = await fetch(`${API_URL}/auth/local/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, tenantSlug }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API login failed: ${res.status} ${text}`);
  }
  const cookie = res.headers.get('set-cookie');
  const match = cookie?.match(/supportplane_session=([^;]+)/);
  if (!match) throw new Error('No session cookie in login response');
  return match[1];
}

async function apiCall(path, sessionToken, method = 'GET', body) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: `supportplane_session=${sessionToken}` },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${API_URL}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${path} failed: ${res.status} ${text}`);
  }
  return res.json();
}

async function styleApiPage(page, title, color, jsonObj) {
  const text = JSON.stringify(jsonObj, null, 2);
  await page.setContent(`
    <div style="font-family:monospace;padding:20px;background:#0f172a;color:#e2e8f0;min-height:100vh;">
      <div style="background:${color};color:white;padding:12px 16px;font-size:18px;font-weight:bold;margin-bottom:16px;border-radius:6px;">
        ${title}
      </div>
      <pre style="background:#1e293b;padding:16px;border-radius:6px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.5;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
  `);
  await page.waitForTimeout(300);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  for (const f of fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'))) {
    fs.unlinkSync(path.join(OUTPUT_DIR, f));
  }

  // ── Setup: API logins ──
  const adminToken = await apiLogin('admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const viewerToken = await apiLogin('viewer@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const altAdminToken = await apiLogin('admin@alt.supportplane.local', 'supportplane-demo', 'alt-tenant');

  // Create session and prep data for provenance/bundle proof
  const session = await apiCall('/support-sessions', adminToken, 'POST', {
    title: 'BL-099 Closure Repair Test',
    description: 'Session for BL-098 closure repair evidence',
    priority: 'normal',
  });
  const sessionId = session.id;

  // Load ticket context via API so provenance is visible (use non-seeded ticket to avoid unique constraint conflict)
  await apiCall(`/support-sessions/${sessionId}/zammad/ticket-context`, adminToken, 'POST', { externalTicketId: 'TICKET-999' });

  // Generate evidence bundle via API so it exists for screenshots
  await apiCall(`/support-sessions/${sessionId}/evidence-bundle`, adminToken);

  const browser = await chromium.launch({ headless: true });

  // ── 1. Admin runtime identity ──
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  await screenshot(adminPage, 'admin-runtime-identity', 'Admin runtime identity: user/tenant/role/API URL/local auth/postgres store/mock mode', { fullPage: false });

  // ── 2. Connector installation expanded with clean credential refs ──
  const chevron = adminPage.locator('svg[class*="lucide-chevron-down"]').first();
  if (await chevron.count() > 0) {
    await chevron.click();
    await adminPage.waitForTimeout(800);
  }
  // Scroll to credential refs section and verify clean count
  await adminPage.waitForSelector('text=/Credential References/i', { timeout: 5000 });
  const credSection = adminPage.locator('text=/Credential References/i').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
  await screenshotElement(adminPage, credSection, 'admin-connector-clean-credentials', 'Connector installation expanded with one linked active placeholder credential (clean set)');

  // ── 3. Safe config validation: valid: true ──
  const configBtn = adminPage.locator('button').filter({ hasText: 'Config' }).first();
  if (await configBtn.count() > 0) {
    await configBtn.click();
    await adminPage.waitForTimeout(1200);
  }
  await adminPage.waitForSelector('text=/Config validation/i', { timeout: 5000 });
  const configPanel = adminPage.locator('text=/Config validation/i').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
  await screenshotElement(adminPage, configPanel, 'admin-config-validation-valid', 'Safe config validation result shows Valid badge, valid: true, mockMode: true, realNetwork: false, writebackEnabled: false');

  // ── 4. Unsafe config validation rejected ──
  const unsafeResult = await apiCall(`/connector-installations/${INST_ID}/validate-config`, adminToken, 'POST', {
    config: { mockMode: false, apiToken: 'secret123', baseUrl: 'http://real.example.com' },
  });
  const apiPage = await adminContext.newPage();
  await styleApiPage(apiPage, `POST /connector-installations/${INST_ID}/validate-config (unsafe)`, '#ef4444', unsafeResult);
  await screenshot(apiPage, 'api-config-validation-unsafe-rejected', 'Unsafe config validation rejected: mockMode:false, apiToken, baseUrl all flagged as errors', { fullPage: true });

  // ── 5. Runtime readiness panel ──
  await adminPage.goto(WEB_URL);
  await adminPage.waitForTimeout(2000);
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const chevron2 = adminPage.locator('svg[class*="lucide-chevron-down"]').first();
  if (await chevron2.count() > 0) {
    await chevron2.click();
    await adminPage.waitForTimeout(800);
  }
  const readinessBtn = adminPage.locator('button').filter({ hasText: 'Readiness' }).first();
  if (await readinessBtn.count() > 0) {
    await readinessBtn.click();
    await adminPage.waitForTimeout(1200);
  }
  await adminPage.waitForSelector('text=/Runtime readiness/i', { timeout: 5000 });
  const readinessPanel = adminPage.locator('text=/Runtime readiness/i').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
  await screenshotElement(adminPage, readinessPanel, 'admin-runtime-readiness-panel', 'Runtime readiness panel shows mockReady, realReady: false, realNetwork: false, writebackEnabled: false, linkedCredentials count');

  // ── 6. Runtime resolver credential metadata only ──
  const resolveResult = await apiCall('/connector-installations/runtime/resolve?connectorType=zammad', adminToken);
  await styleApiPage(apiPage, 'GET /connector-installations/runtime/resolve?connectorType=zammad', '#10b981', resolveResult);
  await screenshot(apiPage, 'api-runtime-resolve-credential-metadata', 'Runtime resolver returns tenant-scoped result with credential metadata only, no secretRef, secretResolutionImplemented: false', { fullPage: true });

  // ── 7. Ticket/customer context provenance ──
  await adminPage.goto(`${WEB_URL}?session=${sessionId}`);
  await adminPage.waitForTimeout(4000);
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  // Ensure session is selected
  const sessionItem = adminPage.locator('div').filter({ hasText: /BL-099 Closure Repair Test/ }).first();
  if (await sessionItem.count() > 0) {
    await sessionItem.click();
    await adminPage.waitForTimeout(2000);
  }
  // Wait for ticket input to be enabled
  await adminPage.waitForSelector('input[placeholder="External ticket ID"]:not([disabled])', { timeout: 15000 });
  const ticketInput = adminPage.locator('input[placeholder="External ticket ID"]').first();
  await ticketInput.fill('TICKET-999');
  const loadBtn = adminPage.locator('button').filter({ hasText: 'Load' }).first();
  await loadBtn.click();
  await adminPage.waitForTimeout(2500);
  // Wait for ticket to load first, then provenance
  await adminPage.waitForSelector('text=/Zammad ticket TICKET-999/i', { timeout: 15000 });
  await adminPage.waitForTimeout(1000);
  const ticketPanel = panelLocator(adminPage, 'Ticket Context');
  await screenshotElement(adminPage, ticketPanel, 'admin-ticket-context-provenance', 'Ticket/customer context provenance showing connector installation source, mock mode, linked credentials, capabilities, no real network');

  // ── 8. Evidence bundle summary with connector/runtime/credential provenance ──
  const evidencePanel = panelLocator(adminPage, 'Evidence Bundle');
  await screenshotElement(adminPage, evidencePanel, 'admin-evidence-bundle-summary', 'Evidence bundle summary with connector installations count, mock/dev-only disclaimers');

  // ── 9. Evidence bundle JSON no-secret proof ──
  await apiPage.goto(`${API_URL}/support-sessions/${sessionId}/evidence-bundle.json`);
  await apiPage.waitForTimeout(1200);
  await apiPage.context().addCookies([{
    name: 'supportplane_session',
    value: adminToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  await apiPage.reload();
  await apiPage.waitForTimeout(1200);
  const bundleJson = await apiCall(`/support-sessions/${sessionId}/evidence-bundle.json`, adminToken);
  await styleApiPage(apiPage, `GET /support-sessions/${sessionId}/evidence-bundle.json`, '#f59e0b', bundleJson);
  await screenshot(apiPage, 'api-evidence-bundle-json-no-secret', 'Evidence bundle JSON includes connector installations with realNetwork:false, writebackEnabled:false, externalWriteAttempted:false, credentialReferenceCount, no raw secrets', { fullPage: true });

  // ── 10. Audit trail showing BL-098 connector events ──
  const auditEvents = await apiCall('/auth/audit-events', adminToken);
  // Filter to BL-098 relevant events for clarity
  const bl098Events = {
    ...auditEvents,
    events: (auditEvents.events || auditEvents).filter(e =>
      ['connector_config_validated', 'connector_readiness_checked', 'connector_runtime_resolved'].includes(e.eventType)
    ).slice(0, 10),
  };
  await styleApiPage(apiPage, 'GET /auth/audit-events (BL-098 connector events)', '#8b5cf6', bl098Events);
  await screenshot(apiPage, 'api-audit-bl098-events', 'Audit trail showing connector_config_validated, connector_readiness_checked, connector_runtime_resolved events with tenant/actor/metadata', { fullPage: true });

  // ── 11. Viewer read-only connector panel ──
  const viewerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const viewerPage = await viewerContext.newPage();
  await webLogin(viewerPage, 'viewer@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const vChevron = viewerPage.locator('svg[class*="lucide-chevron-down"]').first();
  if (await vChevron.count() > 0) {
    await vChevron.click();
    await viewerPage.waitForTimeout(800);
  }
  await screenshotElement(viewerPage, panelLocator(viewerPage, 'Connector'), 'viewer-readonly-connector-panel', 'Viewer sees read-only connector panel with disabled Config/Readiness buttons and view-only message');

  // ── 12. Viewer server-side mutation denial ──
  const viewerDenialRes = await fetch(`${API_URL}/connector-installations/${INST_ID}/validate-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `supportplane_session=${viewerToken}` },
    body: JSON.stringify({ config: { mockMode: true } }),
  });
  const viewerDenialBody = await viewerDenialRes.json().catch(() => ({ status: viewerDenialRes.status, error: 'Forbidden' }));
  await styleApiPage(apiPage, `POST /connector-installations/${INST_ID}/validate-config (viewer)`, '#dc2626', { status: viewerDenialRes.status, ...viewerDenialBody });
  await screenshot(apiPage, 'api-viewer-mutation-denied', 'Viewer server-side mutation denied with 403 on config validation');

  // ── 13. Cross-tenant connector/credential access denied ──
  const crossRes = await fetch(`${API_URL}/connector-installations/${INST_ID}/config-schema`, {
    method: 'GET',
    headers: { Cookie: `supportplane_session=${altAdminToken}` },
  });
  const crossBody = await crossRes.json().catch(() => ({ status: crossRes.status, error: 'Not Found' }));
  await styleApiPage(apiPage, `GET /connector-installations/${INST_ID}/config-schema (alt-tenant)`, '#dc2626', { status: crossRes.status, ...crossBody });
  await screenshot(apiPage, 'api-cross-tenant-denied', 'Cross-tenant connector installation access denied with 404');

  // ── 14. Delivery policy still denies real writeback ──
  const policies = await apiCall('/delivery-policies', adminToken);
  const policyId = (policies.policies || policies)[0]?.id;
  const policyCheck = await apiCall(`/delivery-policies/${policyId}/validate`, adminToken, 'POST');
  await styleApiPage(apiPage, `POST /delivery-policies/${policyId}/validate`, '#dc2626', policyCheck);
  await screenshot(apiPage, 'api-delivery-policy-denies-writeback', 'Delivery policy validation returns realNetworkAllowed: false, writebackEnabled: false');

  // ── 15. Final local/mock/no-real-network/no-secret proof ──
  await adminPage.goto(`${WEB_URL}?session=${sessionId}`);
  await adminPage.waitForTimeout(3000);
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const sessionItem2 = adminPage.locator('div').filter({ hasText: /BL-099 Closure Repair Test/ }).first();
  if (await sessionItem2.count() > 0) {
    await sessionItem2.click();
    await adminPage.waitForTimeout(1500);
  }
  // Scroll to connector panel and capture it as final proof
  const connectorPanel = panelLocator(adminPage, 'Connector');
  await screenshotElement(adminPage, connectorPanel, 'final-mock-no-secret-proof', 'Final local/mock/no-real-network/no-secret proof: connector panel shows Mock-only badge, Locked ON, secret values hidden');

  await apiPage.close();
  await adminPage.close();
  await viewerPage.close();
  await browser.close();

  // ── Duplicate detection ──
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'));
  const hashes = {};
  let duplicates = 0;
  for (const f of files) {
    const buf = fs.readFileSync(path.join(OUTPUT_DIR, f));
    const h = crypto.createHash('md5').update(buf).digest('hex');
    if (hashes[h]) {
      console.log(`DUPLICATE: ${f} === ${hashes[h]}`);
      duplicates++;
    } else {
      hashes[h] = f;
    }
  }

  console.log(`\n=== BL-098 Closure Repair Screenshot Summary ===`);
  console.log(`Folder: ${OUTPUT_DIR}`);
  console.log(`Screenshots: ${screenshotCount} (max ${MAX_SCREENSHOTS})`);
  console.log(`Duplicates: ${duplicates}`);
  console.log(`\nProof-state mapping:`);
  for (const m of proofMapping) {
    console.log(`  ${m.number}. ${m.filename} — ${m.proofState}`);
  }

  if (screenshotCount > MAX_SCREENSHOTS) {
    console.error(`\nFATAL: Screenshot count ${screenshotCount} exceeds max ${MAX_SCREENSHOTS}`);
    process.exit(1);
  }
  if (duplicates > 0) {
    console.error(`\nFATAL: ${duplicates} duplicate screenshot(s) detected`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
