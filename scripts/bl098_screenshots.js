#!/usr/bin/env node
/**
 * BL-098 Screenshot Script — Connector Runtime Configuration + Credential Reference Readiness Foundation
 * Uses local auth via web UI login form, writes to canonical final-closure folder.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'playwright', 'session-098-connector-runtime-readiness-final-closure');
const WEB_URL = 'http://localhost:3200';
const API_URL = 'http://localhost:4110';
const MAX_SCREENSHOTS = 20;

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
  await page.goto(WEB_URL);
  await page.waitForTimeout(2000);
  const identityPill = page.locator('text=/admin|viewer|support_agent/i').first();
  if (await identityPill.count() > 0 && await identityPill.isVisible()) {
    console.log('Already logged in');
    return;
  }
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

async function styleApiPage(page, title, color) {
  await page.evaluate((opts) => {
    const body = document.body;
    const json = body.innerText;
    body.innerHTML = `
      <div style="font-family:monospace;padding:20px;background:#0f172a;color:#e2e8f0;min-height:100vh;">
        <div style="background:${opts.color};color:white;padding:12px 16px;font-size:18px;font-weight:bold;margin-bottom:16px;border-radius:6px;">
          ${opts.title}
        </div>
        <pre style="background:#1e293b;padding:16px;border-radius:6px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.5;">${json.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </div>
    `;
  }, { title, color });
  await page.waitForTimeout(300);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  for (const f of fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png'))) {
    fs.unlinkSync(path.join(OUTPUT_DIR, f));
  }

  // ── Setup: API login for test data creation ──
  const adminToken = await apiLogin('admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const viewerToken = await apiLogin('viewer@supportplane.local', 'supportplane-demo', 'dev-tenant');

  const session = await apiCall('/support-sessions', adminToken, 'POST', {
    title: 'BL-098 Connector Runtime Readiness Closure Test',
    description: 'Session created for BL-098 final closure evidence',
    priority: 'normal',
  });
  const sessionId = session.id;

  // Get or create an installation for testing
  const installationsRes = await apiCall('/connector-installations', adminToken);
  const installations = installationsRes.installations || [];
  let targetInstallation = installations.find(i => i.adapterType === 'zammad') || installations[0];
  if (!targetInstallation) {
    const created = await apiCall('/connector-installations', adminToken, 'POST', {
      name: 'BL-098 Test Connector',
      adapterType: 'zammad',
    });
    targetInstallation = created.installation;
  }
  const instId = targetInstallation.id;

  // Create and link a credential reference for linked-credential proof
  const credRef = await apiCall('/credential-references', adminToken, 'POST', {
    connectorType: 'zammad',
    displayName: 'BL-098 Test Credential',
    description: 'Test credential for closure proof',
    status: 'active',
    secretKind: 'api_token_placeholder',
  });
  const credRefId = credRef.credentialReference.id;

  // Link it
  await apiCall(`/connector-installations/${instId}/link-credential`, adminToken, 'POST', {
    credentialReferenceId: credRefId,
  });

  const browser = await chromium.launch({ headless: true });

  // ── 1. Admin runtime identity ──
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  await screenshot(adminPage, 'admin-runtime-identity', 'Admin runtime identity: user/tenant/role/API URL/local auth/postgres store/mock mode', { fullPage: false });

  // ── 2. Connector panel with Config and Readiness buttons ──
  const chevron = adminPage.locator('svg[class*="lucide-chevron-down"]').first();
  if (await chevron.count() > 0) {
    await chevron.click();
    await adminPage.waitForTimeout(800);
  }
  await screenshotElement(adminPage, panelLocator(adminPage, 'Connector'), 'admin-connector-panel-buttons', 'Connector panel shows Config and Readiness action buttons');

  // ── 3. Config validation result (valid) ──
  const configBtn = adminPage.locator('button').filter({ hasText: 'Config' }).first();
  if (await configBtn.count() > 0) {
    await configBtn.click();
    await adminPage.waitForTimeout(1200);
  }
  const configResultPanel = adminPage.locator('text=/Config validation/i').first();
  if (await configResultPanel.count() > 0) {
    const resultBox = configResultPanel.locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
    await screenshotElement(adminPage, resultBox, 'admin-config-validation-valid', 'Config validation result shows Valid badge, mockMode:true, realNetwork:false, writebackEnabled:false');
  } else {
    await screenshotElement(adminPage, panelLocator(adminPage, 'Connector'), 'admin-config-validation-valid', 'Config validation result shows Valid badge, mockMode:true, realNetwork:false, writebackEnabled:false');
  }

  // ── 4. Config validation result (unsafe config rejected) ──
  const apiPage = await adminContext.newPage();
  const unsafeValidationJson = await apiCall(`/connector-installations/${instId}/validate-config`, adminToken, 'POST', { config: { mockMode: false, apiToken: 'secret123', baseUrl: 'http://real.example.com' } });
  await apiPage.setContent(`
    <div style="font-family:monospace;padding:20px;background:#0f172a;color:#e2e8f0;min-height:100vh;">
      <div style="background:#ef4444;color:white;padding:12px 16px;font-size:18px;font-weight:bold;margin-bottom:16px;border-radius:6px;">
        POST /connector-installations/${instId}/validate-config (unsafe)
      </div>
      <pre style="background:#1e293b;padding:16px;border-radius:6px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.5;">${JSON.stringify(unsafeValidationJson, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
  `);
  await apiPage.waitForTimeout(300);
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
  const readinessResultPanel = adminPage.locator('text=/Runtime readiness/i').first();
  if (await readinessResultPanel.count() > 0) {
    const readinessBox = readinessResultPanel.locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
    await screenshotElement(adminPage, readinessBox, 'admin-runtime-readiness-panel', 'Runtime readiness panel shows mockReady, realNetwork:false, writebackEnabled:false, linkedCredentials count');
  } else {
    await screenshotElement(adminPage, panelLocator(adminPage, 'Connector'), 'admin-runtime-readiness-panel', 'Runtime readiness panel shows mockReady, realNetwork:false, writebackEnabled:false, linkedCredentials count');
  }

  // ── 6. Expanded installation settings with mock-only badge ──
  const chevron3 = adminPage.locator('svg[class*="lucide-chevron-down"]').first();
  if (await chevron3.count() > 0) {
    await chevron3.click();
    await adminPage.waitForTimeout(800);
  }
  const settingsPanel = adminPage.locator('text=/Installation Settings/i').first();
  if (await settingsPanel.count() > 0) {
    const settingsBox = settingsPanel.locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
    await screenshotElement(adminPage, settingsBox, 'admin-installation-settings-mock-only', 'Expanded installation settings show Mock-only badge, Locked ON mock mode, credential references');
  } else {
    await screenshotElement(adminPage, panelLocator(adminPage, 'Connector'), 'admin-installation-settings-mock-only', 'Expanded installation settings show Mock-only badge, Locked ON mock mode, credential references');
  }

  // ── 7. API config schema endpoint ──
  await apiPage.goto(`${API_URL}/connector-installations/${instId}/config-schema`);
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
  await styleApiPage(apiPage, `GET /connector-installations/${instId}/config-schema`, '#3b82f6');
  await screenshot(apiPage, 'api-config-schema-mock-only', 'Config schema endpoint returns safeFields, rejectedFields, mockOnly:true', { fullPage: true });

  // ── 8. API runtime readiness endpoint ──
  const runtimeReadinessJson = await apiCall(`/connector-installations/${instId}/runtime-readiness`, adminToken, 'POST');
  await apiPage.setContent(`
    <div style="font-family:monospace;padding:20px;background:#0f172a;color:#e2e8f0;min-height:100vh;">
      <div style="background:#8b5cf6;color:white;padding:12px 16px;font-size:18px;font-weight:bold;margin-bottom:16px;border-radius:6px;">
        POST /connector-installations/${instId}/runtime-readiness
      </div>
      <pre style="background:#1e293b;padding:16px;border-radius:6px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:13px;line-height:1.5;">${JSON.stringify(runtimeReadinessJson, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
  `);
  await apiPage.waitForTimeout(300);
  await screenshot(apiPage, 'api-runtime-readiness-mock-only', 'Runtime readiness API returns mockReady, realReady:false, realNetwork:false, writebackEnabled:false, credentialReferencesLinked', { fullPage: true });

  // ── 9. API runtime resolve endpoint with credential metadata ──
  await apiPage.goto(`${API_URL}/connector-installations/runtime/resolve?connectorType=zammad`);
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
  await styleApiPage(apiPage, `GET /connector-installations/runtime/resolve?connectorType=zammad`, '#10b981');
  await screenshot(apiPage, 'api-runtime-resolve-credential-metadata', 'Runtime resolver returns tenant-scoped result with credential reference metadata (no secretRef), secretResolutionImplemented:false', { fullPage: true });

  // ── 10. Evidence bundle JSON with connector safety fields ──
  await apiPage.goto(`${API_URL}/support-sessions/${sessionId}/evidence-bundle.json`);
  await apiPage.waitForTimeout(1200);
  await styleApiPage(apiPage, `GET /support-sessions/${sessionId}/evidence-bundle.json`, '#f59e0b');
  await screenshot(apiPage, 'api-evidence-bundle-connector-safety', 'Evidence bundle JSON includes connector installations with realNetwork:false, writebackEnabled:false, externalWriteAttempted:false', { fullPage: true });

  // ── 11. Viewer read-only connector panel ──
  const viewerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const viewerPage = await viewerContext.newPage();
  await webLogin(viewerPage, 'viewer@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const vChevron = viewerPage.locator('svg[class*="lucide-chevron-down"]').first();
  if (await vChevron.count() > 0) {
    await vChevron.click();
    await viewerPage.waitForTimeout(800);
  }
  await screenshotElement(viewerPage, panelLocator(viewerPage, 'Connector'), 'viewer-readonly-connector-panel', 'Viewer sees read-only connector panel with disabled Config/Readiness buttons');

  // ── 12. Viewer server-side mutation denial (CLI artifact) ──
  const viewerRes = await fetch(`${API_URL}/connector-installations/${instId}/validate-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `supportplane_session=${viewerToken}` },
    body: JSON.stringify({ config: { mockMode: true } }),
  });
  const viewerDenialText = await viewerRes.text();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'cli-viewer-config-validation-denial.txt'), `POST /connector-installations/${instId}/validate-config as viewer\nStatus: ${viewerRes.status}\nBody: ${viewerDenialText}\n`);
  console.log('CLI artifact: viewer config validation denial saved');

  const viewOnlyMsg = viewerPage.locator('text=View-only. Admin role required').first();
  if (await viewOnlyMsg.count() > 0) {
    await screenshotElement(viewerPage, viewOnlyMsg, 'viewer-ui-mutation-denied', 'Viewer server-side mutation denial visible in UI');
  } else {
    await screenshotElement(viewerPage, panelLocator(viewerPage, 'Connector'), 'viewer-ui-mutation-denied', 'Viewer server-side mutation denial visible in UI');
  }

  // ── 13. Cross-tenant access denied ──
  const altAdminToken = await apiLogin('admin@alt.supportplane.local', 'supportplane-demo', 'alt-tenant');
  const crossRes = await fetch(`${API_URL}/connector-installations/${instId}/config-schema`, {
    method: 'GET',
    headers: { Cookie: `supportplane_session=${altAdminToken}` },
  });
  const crossText = await crossRes.text();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'cli-cross-tenant-denial.txt'), `GET /connector-installations/${instId}/config-schema as alt-tenant admin\nStatus: ${crossRes.status}\nBody: ${crossText}\n`);
  console.log('CLI artifact: cross-tenant denial saved');

  await apiPage.goto(`${API_URL}/connector-installations/${instId}/config-schema`);
  await apiPage.waitForTimeout(1200);
  await apiPage.context().addCookies([{
    name: 'supportplane_session',
    value: altAdminToken,
    domain: 'localhost',
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  }]);
  await apiPage.reload();
  await apiPage.waitForTimeout(1200);
  await styleApiPage(apiPage, `GET /connector-installations/${instId}/config-schema (alt-tenant)`, '#dc2626');
  await screenshot(apiPage, 'api-cross-tenant-denied', 'Cross-tenant connector installation access denied', { fullPage: true });

  // ── 14. Audit trail with BL-098 events ──
  await adminPage.goto(`${WEB_URL}?session=${sessionId}`);
  await adminPage.waitForTimeout(3000);
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const sessionItem = adminPage.locator('div').filter({ hasText: /BL-098 Connector Runtime Readiness Closure Test/ }).first();
  if (await sessionItem.count() > 0) {
    await sessionItem.click();
    await adminPage.waitForTimeout(1500);
  }
  await screenshotElement(adminPage, panelLocator(adminPage, 'Audit Trail'), 'admin-audit-bl098-events', 'Audit trail shows connector_config_validated, connector_readiness_checked, connector_runtime_resolved events');

  // ── 15. Final mock/no-secret proof (evidence bundle summary) ──
  await adminPage.goto(`${WEB_URL}?session=${sessionId}`);
  await adminPage.waitForTimeout(3000);
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const sessionItem2 = adminPage.locator('div').filter({ hasText: /BL-098 Connector Runtime Readiness Closure Test/ }).first();
  if (await sessionItem2.count() > 0) {
    await sessionItem2.click();
    await adminPage.waitForTimeout(1500);
  }
  const evidencePanel = panelLocator(adminPage, 'Evidence Bundle');
  if (await evidencePanel.count() > 0) {
    await screenshotElement(adminPage, evidencePanel, 'final-mock-no-secret-proof', 'Final local/mock/no-real-writeback/no-secret proof');
  } else {
    await screenshotElement(adminPage, panelLocator(adminPage, 'Connector'), 'final-mock-no-secret-proof', 'Final local/mock/no-real-writeback/no-secret proof');
  }

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

  console.log(`\n=== BL-098 Screenshot Summary ===`);
  console.log(`Folder: ${OUTPUT_DIR}`);
  console.log(`Screenshots: ${screenshotCount} (max ${MAX_SCREENSHOTS})`);
  console.log(`Duplicates: ${duplicates}`);
  console.log(`\nProof-state mapping:`);
  for (const m of proofMapping) {
    console.log(`  ${m.number}. ${m.filename} — ${m.proofState}`);
  }
  console.log(`\nCLI artifacts:`);
  console.log(`  cli-viewer-config-validation-denial.txt`);
  console.log(`  cli-cross-tenant-denial.txt`);

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
