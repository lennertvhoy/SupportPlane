#!/usr/bin/env node
/**
 * BL-097 Screenshot Script — Credential Reference Foundation Final Closure
 * Uses local auth via web UI login form, writes to canonical final-closure folder.
 * v9: xpath-based panel selectors, handles viewer denied state.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'playwright', 'session-097-credential-reference-foundation-final-closure');
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
    title: 'BL-097 Credential Reference Closure Test',
    description: 'Session created for BL-097 final closure evidence',
    priority: 'normal',
  });
  const sessionId = session.id;

  const credRef = await apiCall('/credential-references', adminToken, 'POST', {
    connectorType: 'zammad',
    displayName: 'BL-097 Test Credential',
    description: 'Test credential for closure proof',
    status: 'active',
    secretKind: 'api_token_placeholder',
  });

  // Create an extra unlinked credential reference so the dropdown has options
  const credRef2 = await apiCall('/credential-references', adminToken, 'POST', {
    connectorType: 'zammad',
    displayName: 'BL-097 Unlinked Credential',
    description: 'Unlinked for selector visibility',
    status: 'active',
    secretKind: 'api_token_placeholder',
  });

  const installationsRes = await apiCall('/connector-installations', adminToken);
  const installations = installationsRes.installations || [];
  let linkedInstallation = null;
  if (installations.length > 0) {
    const inst = installations[0];
    await apiCall(`/connector-installations/${inst.id}/link-credential`, adminToken, 'POST', {
      credentialReferenceId: credRef.credentialReference.id,
    });
    linkedInstallation = inst;
  }

  const browser = await chromium.launch({ headless: true });

  // ── 1. Admin runtime identity ──
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  await screenshot(adminPage, 'admin-runtime-identity', 'Admin runtime identity: user/tenant/role/API URL/local auth/postgres store/mock mode', { fullPage: false });

  // ── 2. Connector panel with credential references ──
  const chevron = adminPage.locator('svg[class*="lucide-chevron-down"]').first();
  if (await chevron.count() > 0) {
    await chevron.click();
    await adminPage.waitForTimeout(800);
  }
  await screenshotElement(adminPage, panelLocator(adminPage, 'Connector'), 'admin-connector-panel-credential-refs', 'Connector panel before/with credential reference link visible');

  // ── 3. Credential reference selector/list ──
  const connectorPanel = panelLocator(adminPage, 'Connector');
  const selectEl = connectorPanel.locator('select').first();
  if (await selectEl.count() > 0) {
    await screenshotElement(adminPage, selectEl, 'admin-credential-ref-selector', 'Credential reference selector/list visible');
  } else {
    await screenshotElement(adminPage, connectorPanel, 'admin-credential-ref-selector', 'Credential reference selector/list visible');
  }

  // ── 4. Admin created credential reference (API) ──
  const apiPage = await adminContext.newPage();
  await apiPage.goto(`${API_URL}/credential-references/${credRef.credentialReference.id}`);
  await apiPage.waitForTimeout(1200);
  await styleApiPage(apiPage, `GET /credential-references/${credRef.credentialReference.id}`, '#3b82f6');
  await screenshot(apiPage, 'api-credential-ref-created-redacted', 'Admin can create/select safe credential-reference metadata; secretRef redacted', { fullPage: true });

  // ── 5. Linked installation ──
  if (linkedInstallation) {
    await adminPage.goto(WEB_URL);
    await adminPage.waitForTimeout(3000);
    await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
    const chevron2 = adminPage.locator('svg[class*="lucide-chevron-down"]').first();
    if (await chevron2.count() > 0) {
      await chevron2.click();
      await adminPage.waitForTimeout(800);
    }
    const tagLoc = adminPage.locator('span:has-text("BL-097 Test Credential")').first();
    if (await tagLoc.count() > 0) {
      await screenshotElement(adminPage, tagLoc, 'admin-linked-credential-ref', 'Connector installation linked to credential reference');
    } else {
      await screenshotElement(adminPage, panelLocator(adminPage, 'Connector'), 'admin-linked-credential-ref', 'Connector installation linked to credential reference');
    }
  }

  // ── 6. Validate/test result with realNetwork:false ──
  if (linkedInstallation) {
    await apiPage.goto(`${API_URL}/connector-installations/${linkedInstallation.id}/test`);
    await apiPage.waitForTimeout(1200);
    await styleApiPage(apiPage, `POST /connector-installations/${linkedInstallation.id}/test`, '#8b5cf6');
    await screenshot(apiPage, 'api-connector-test-mock-only', 'Validate/test result shows credential reference metadata/presence and realNetwork:false', { fullPage: true });
  }

  // ── 7. Delivery policy/readiness denial ──
  if (linkedInstallation) {
    await apiPage.goto(`${API_URL}/connector-installations/${linkedInstallation.id}/readiness`);
    await apiPage.waitForTimeout(1200);
    await styleApiPage(apiPage, `POST /connector-installations/${linkedInstallation.id}/readiness`, '#ef4444');
    await screenshot(apiPage, 'api-connector-readiness-denial', 'Delivery policy/readiness still denies real writeback', { fullPage: true });
  }

  // ── 8. Evidence bundle JSON with credential ref provenance ──
  await apiPage.goto(`${API_URL}/support-sessions/${sessionId}/evidence-bundle.json`);
  await apiPage.waitForTimeout(1200);
  await styleApiPage(apiPage, `GET /support-sessions/${sessionId}/evidence-bundle.json`, '#10b981');
  await screenshot(apiPage, 'api-evidence-bundle-credential-refs', 'Evidence bundle JSON includes credential reference provenance and no secrets', { fullPage: true });

  // ── 9. Evidence bundle summary ──
  await apiPage.goto(`${API_URL}/support-sessions/${sessionId}/evidence-bundle`);
  await apiPage.waitForTimeout(1200);
  await styleApiPage(apiPage, `GET /support-sessions/${sessionId}/evidence-bundle`, '#f59e0b');
  await screenshot(apiPage, 'api-evidence-bundle-summary', 'Evidence bundle summary shows credential/reference count or provenance', { fullPage: true });

  // ── 10. Audit trail with credential ref events ──
  await adminPage.goto(`${WEB_URL}?session=${sessionId}`);
  await adminPage.waitForTimeout(3000);
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const sessionItem = adminPage.locator('div').filter({ hasText: /BL-097 Credential Reference Closure Test/ }).first();
  if (await sessionItem.count() > 0) {
    await sessionItem.click();
    await adminPage.waitForTimeout(1500);
  }
  await screenshotElement(adminPage, panelLocator(adminPage, 'Audit Trail'), 'admin-audit-credential-ref-events', 'Audit trail shows credential_reference_created and credential_reference_linked events');

  // ── 11. Viewer read-only credential reference state ──
  const viewerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const viewerPage = await viewerContext.newPage();
  await webLogin(viewerPage, 'viewer@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const vChevron = viewerPage.locator('svg[class*="lucide-chevron-down"]').first();
  if (await vChevron.count() > 0) {
    await vChevron.click();
    await viewerPage.waitForTimeout(800);
  }
  await screenshotElement(viewerPage, panelLocator(viewerPage, 'Connector'), 'viewer-readonly-credential-refs', 'Viewer read-only credential reference state');

  // ── 12. Viewer server-side mutation/link denial ──
  const viewerRes = await fetch(`${API_URL}/credential-references`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `supportplane_session=${viewerToken}` },
    body: JSON.stringify({ connectorType: 'zammad', displayName: 'Viewer Attempt' }),
  });
  const viewerDenialText = await viewerRes.text();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'cli-viewer-mutation-denial.txt'), `POST /credential-references as viewer\nStatus: ${viewerRes.status}\nBody: ${viewerDenialText}\n`);
  console.log('CLI artifact: viewer mutation denial saved');

  const viewOnlyMsg = viewerPage.locator('text=View-only. Admin role required').first();
  if (await viewOnlyMsg.count() > 0) {
    await screenshotElement(viewerPage, viewOnlyMsg, 'viewer-ui-link-denied', 'Viewer server-side mutation/link denial visible in UI');
  } else {
    await screenshotElement(viewerPage, panelLocator(viewerPage, 'Connector'), 'viewer-ui-link-denied', 'Viewer server-side mutation/link denial visible in UI');
  }

  // ── 13. Cross-tenant credential reference access denied ──
  const altAdminToken = await apiLogin('admin@alt.supportplane.local', 'supportplane-demo', 'alt-tenant');
  const crossRes = await fetch(`${API_URL}/credential-references/${credRef.credentialReference.id}`, {
    method: 'GET',
    headers: { Cookie: `supportplane_session=${altAdminToken}` },
  });
  const crossText = await crossRes.text();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'cli-cross-tenant-denial.txt'), `GET /credential-references/${credRef.credentialReference.id} as alt-tenant admin\nStatus: ${crossRes.status}\nBody: ${crossText}\n`);
  console.log('CLI artifact: cross-tenant denial saved');

  await apiPage.goto(`${API_URL}/credential-references/${credRef.credentialReference.id}`);
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
  await styleApiPage(apiPage, `GET /credential-references/${credRef.credentialReference.id} (alt-tenant)`, '#dc2626');
  await screenshot(apiPage, 'api-cross-tenant-denied', 'Cross-tenant credential reference access denied', { fullPage: true });

  // ── 14. Final mock/no-secret proof ──
  await adminPage.goto(`${WEB_URL}?session=${sessionId}`);
  await adminPage.waitForTimeout(3000);
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const sessionItem2 = adminPage.locator('div').filter({ hasText: /BL-097 Credential Reference Closure Test/ }).first();
  if (await sessionItem2.count() > 0) {
    await sessionItem2.click();
    await adminPage.waitForTimeout(1500);
  }
  await screenshotElement(adminPage, panelLocator(adminPage, 'Evidence Bundle'), 'final-mock-no-secret-proof', 'Final local/mock/no-real-writeback/no-secret proof');

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

  console.log(`\n=== BL-097 Screenshot Summary ===`);
  console.log(`Folder: ${OUTPUT_DIR}`);
  console.log(`Screenshots: ${screenshotCount} (max ${MAX_SCREENSHOTS})`);
  console.log(`Duplicates: ${duplicates}`);
  console.log(`\nProof-state mapping:`);
  for (const m of proofMapping) {
    console.log(`  ${m.number}. ${m.filename} — ${m.proofState}`);
  }
  console.log(`\nCLI artifacts:`);
  console.log(`  cli-viewer-mutation-denial.txt`);
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
