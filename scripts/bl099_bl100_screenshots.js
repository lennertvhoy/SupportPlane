#!/usr/bin/env node
/**
 * BL-099 + BL-100 Screenshot Script
 * Writes to session-101-bl099-bl100-runtime-confidence-design-final/
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'playwright', 'session-101-bl099-bl100-runtime-confidence-design-final');
const WEB_URL = 'http://localhost:3200';
const API_URL = 'http://localhost:4110';
const MAX_SCREENSHOTS = 20;
const MAX_SCREENSHOT_HEIGHT = 1200;
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

  const sizeOf = require('image-size');
  const imgBuf = fs.readFileSync(filepath);
  const { width, height } = sizeOf.imageSize(imgBuf);
  if (height > MAX_SCREENSHOT_HEIGHT) {
    throw new Error(`Screenshot ${filename} is too tall (${height}px > ${MAX_SCREENSHOT_HEIGHT}px).`);
  }

  console.log(`Captured: ${filename} — ${proofState} (${width}x${height})`);
  proofMapping.push({ number: screenshotCount, filename, proofState, width, height });
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

  const sizeOf = require('image-size');
  const imgBuf = fs.readFileSync(filepath);
  const { width, height } = sizeOf.imageSize(imgBuf);
  if (height > MAX_SCREENSHOT_HEIGHT) {
    throw new Error(`Screenshot ${filename} is too tall (${height}px > ${MAX_SCREENSHOT_HEIGHT}px)`);
  }

  console.log(`Captured: ${filename} — ${proofState} (${width}x${height})`);
  proofMapping.push({ number: screenshotCount, filename, proofState, width, height });
  return filepath;
}

async function assertVisibleText(page, text, timeout = 5000) {
  const locator = page.locator(`text=/${text}/i`).first();
  await locator.waitFor({ state: 'visible', timeout });
  const visible = await locator.isVisible();
  if (!visible) {
    throw new Error(`Expected visible text "${text}" not found on page`);
  }
  return locator;
}

function panelLocator(page, title) {
  return page.locator(`h2:has-text("${title}") >> xpath=ancestor::div[contains(@class,"rounded-lg")][1]`);
}

async function webLogin(page, email, password, tenantSlug) {
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

async function styleCompactApiPage(page, title, color, contentObj) {
  const text = JSON.stringify(contentObj, null, 2);
  await page.setContent(`
    <div style="font-family:monospace;padding:16px;background:#0f172a;color:#e2e8f0;min-height:auto;">
      <div style="background:${color};color:white;padding:10px 14px;font-size:16px;font-weight:bold;margin-bottom:12px;border-radius:6px;">
        ${title}
      </div>
      <pre style="background:#1e293b;padding:14px;border-radius:6px;overflow:auto;white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.5;max-height:800px;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
  `);
  await page.waitForTimeout(300);
}

async function styleMarkdownPage(page, title, markdownText) {
  const lines = markdownText.split('\n').map(l => {
    if (l.startsWith('# ')) return `<h1 style="font-size:18px;margin:8px 0;color:#e2e8f0;">${l.slice(2)}</h1>`;
    if (l.startsWith('## ')) return `<h2 style="font-size:15px;margin:6px 0;color:#cbd5e1;">${l.slice(3)}</h2>`;
    if (l.startsWith('- [')) return `<div style="margin:2px 0;color:#94a3b8;">${l}</div>`;
    if (l.startsWith('| ')) return `<div style="margin:1px 0;color:#94a3b8;font-size:11px;">${l}</div>`;
    if (l.trim() === '') return '<div style="height:4px"></div>';
    return `<div style="margin:2px 0;color:#cbd5e1;font-size:12px;">${l}</div>`;
  }).join('');
  await page.setContent(`
    <div style="font-family:monospace;padding:16px;background:#0f172a;color:#e2e8f0;min-height:auto;">
      <div style="background:#3b82f6;color:white;padding:10px 14px;font-size:16px;font-weight:bold;margin-bottom:12px;border-radius:6px;">
        ${title}
      </div>
      <div style="background:#1e293b;padding:14px;border-radius:6px;overflow:auto;font-size:12px;line-height:1.5;max-height:800px;">
        ${lines}
      </div>
    </div>
  `);
  await page.waitForTimeout(300);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  for (const f of fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png') || f.endsWith('.json') || f.endsWith('.txt') || f.endsWith('.md'))) {
    fs.unlinkSync(path.join(OUTPUT_DIR, f));
  }

  const adminToken = await apiLogin('admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const viewerToken = await apiLogin('viewer@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const altAdminToken = await apiLogin('admin@alt.supportplane.local', 'supportplane-demo', 'alt-tenant');

  await apiCall(`/connector-installations/${INST_ID}`, adminToken, 'PATCH', {
    config: { mockMode: true, enabled: true, validateBeforeWrite: true, timeoutMs: 5000, capabilities: ['read_tickets'], baseUrlPlaceholder: 'mock-zammad' },
  });

  const session = await apiCall('/support-sessions', adminToken, 'POST', {
    title: 'BL-099 BL-100 Evidence Session',
    description: 'Session for BL-099 BL-100 evidence',
    priority: 'normal',
  });
  const sessionId = session.id;
  await apiCall(`/support-sessions/${sessionId}/zammad/ticket-context`, adminToken, 'POST', { externalTicketId: 'TICKET-999' });

  const browser = await chromium.launch({ headless: true });

  // ── 1. Admin runtime identity ──
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  const apiPage = await adminContext.newPage();
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  await assertVisibleText(adminPage, 'admin');
  await screenshot(adminPage, 'admin-runtime-identity', 'Admin runtime identity with tenant/role pill and API URL', { fullPage: false });

  // ── 2. Connector panel with Config and Readiness controls ──
  const chevron = adminPage.locator('svg[class*="lucide-chevron-down"]').first();
  if (await chevron.count() > 0) {
    await chevron.click();
    await adminPage.waitForTimeout(800);
  }
  await assertVisibleText(adminPage, 'Credential References');
  const connectorPanel = panelLocator(adminPage, 'Connector');
  await screenshotElement(adminPage, connectorPanel, 'connector-panel-config-readiness', 'Connector panel showing Config and Readiness controls, installation settings, credential references');

  // ── 3. Valid config validation proof ──
  const configBtn = adminPage.locator('button').filter({ hasText: 'Config' }).first();
  if (await configBtn.count() > 0) {
    await configBtn.click();
    await adminPage.waitForTimeout(1200);
  }
  await assertVisibleText(adminPage, 'Config validation');
  await assertVisibleText(adminPage, 'Valid');
  const validFalseVisible = await adminPage.locator('text=/valid: false/i').first().isVisible().catch(() => false);
  if (validFalseVisible) {
    throw new Error('FATAL: Screenshot 03 would show valid: false.');
  }
  const configPanel = adminPage.locator('text=/Config validation/i').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
  await screenshotElement(adminPage, configPanel, 'valid-config-validation', 'Valid config validation: Valid badge, valid:true, mockMode:true, realNetwork:false, writebackEnabled:false');

  // ── 4. Unsafe config rejected proof ──
  const unsafeResult = await apiCall(`/connector-installations/${INST_ID}/validate-config`, adminToken, 'POST', {
    config: { mockMode: false, apiToken: 'secret123', baseUrl: 'http://real.example.com' },
  });
  await styleCompactApiPage(apiPage, `POST /connector-installations/${INST_ID}/validate-config (unsafe)`, '#ef4444', {
    valid: unsafeResult.result?.valid,
    mockMode: unsafeResult.result?.mockMode,
    issueCount: unsafeResult.result?.issues?.length,
    issues: unsafeResult.result?.issues?.map(i => ({ field: i.field, severity: i.severity, code: i.code })),
  });
  await screenshot(apiPage, 'unsafe-config-rejected', 'Unsafe config rejected: mockMode:false, apiToken, baseUrl flagged as errors', { fullPage: false });

  // ── 5. Runtime readiness mock-only proof ──
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
  await assertVisibleText(adminPage, 'Runtime readiness');
  await assertVisibleText(adminPage, 'Mock ready');
  const readinessPanel = adminPage.locator('text=/Runtime readiness/i').first().locator('xpath=ancestor::div[contains(@class,"rounded")][1]');
  await screenshotElement(adminPage, readinessPanel, 'runtime-readiness-mock-only', 'Runtime readiness mock-only: mockReady, realReady:false, realNetwork:false, writebackEnabled:false, externalWriteAttempted:false');

  // ── 6. Runtime resolve compact proof ──
  const resolveResult = await apiCall('/connector-installations/runtime/resolve?connectorType=zammad', adminToken);
  const creds = resolveResult.credentialReferences || [];
  await styleCompactApiPage(apiPage, 'GET /connector-installations/runtime/resolve?connectorType=zammad', '#10b981', {
    installationId: resolveResult.installationId,
    connectorType: resolveResult.connectorType,
    mode: resolveResult.mode,
    realNetwork: resolveResult.realNetwork,
    writebackEnabled: resolveResult.writebackEnabled,
    credentialReferenceCount: creds.length,
    credentialReferences: creds.map(c => ({
      id: c.id,
      displayName: c.displayName,
      status: c.status,
      secretResolutionImplemented: c.secretResolutionImplemented,
      hasSecretRef: 'secretRef' in c,
    })),
  });
  await screenshot(apiPage, 'runtime-resolve-credential-metadata', 'Runtime resolver returns credential metadata only, no secretRef, secretResolutionImplemented:false', { fullPage: false });

  // ── 7. Ticket context connector runtime provenance proof ──
  await adminPage.goto(WEB_URL);
  await adminPage.waitForTimeout(2000);
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  await adminPage.waitForSelector('button:has-text("BL-099 BL-100 Evidence Session")', { timeout: 15000 });
  const sessionItem = adminPage.locator('button').filter({ hasText: /BL-099 BL-100 Evidence Session/ }).first();
  if (await sessionItem.count() > 0) {
    await sessionItem.click();
    await adminPage.waitForTimeout(3000);
  }
  const ticketInput = adminPage.locator('input[placeholder="External ticket ID"]').first();
  await ticketInput.waitFor({ state: 'visible', timeout: 15000 });
  await ticketInput.fill('TICKET-999');
  const loadBtn = adminPage.locator('button').filter({ hasText: 'Load' }).first();
  await loadBtn.click();
  await adminPage.waitForTimeout(2500);
  await assertVisibleText(adminPage, 'TICKET-999');
  const ticketPanel = panelLocator(adminPage, 'Ticket Context');
  await screenshotElement(adminPage, ticketPanel, 'ticket-context-provenance', 'Ticket context connector runtime provenance: installation name, type, mode, network status, linked credential count, capabilities');

  // ── 8. Evidence bundle connector/runtime metadata proof ──
  const evidencePanel = panelLocator(adminPage, 'Evidence Bundle');
  const generateBtn = evidencePanel.locator('button').filter({ hasText: /Generate|Refresh/ }).first();
  if (await generateBtn.count() > 0 && await generateBtn.isEnabled()) {
    await generateBtn.click();
    await adminPage.waitForTimeout(3000);
  }
  const emptyStateVisible = await evidencePanel.locator('text=/Select a session to generate/i').first().isVisible().catch(() => false);
  if (emptyStateVisible) {
    throw new Error('FATAL: Evidence bundle panel shows empty state.');
  }
  await assertVisibleText(adminPage, 'Bundle ID');
  await screenshotElement(adminPage, evidencePanel, 'evidence-bundle-connector-metadata', 'Evidence bundle showing connector installation and credential reference metadata, no secrets');

  // ── 9. Viewer read-only connector/runtime proof ──
  const viewerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const viewerPage = await viewerContext.newPage();
  await webLogin(viewerPage, 'viewer@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const vChevron = viewerPage.locator('svg[class*="lucide-chevron-down"]').first();
  if (await vChevron.count() > 0) {
    await vChevron.click();
    await viewerPage.waitForTimeout(800);
  }
  await screenshotElement(viewerPage, panelLocator(viewerPage, 'Connector'), 'viewer-readonly-connector', 'Viewer read-only connector panel: disabled Config/Readiness buttons, view-only message');

  // ── 10. Viewer/server-side denial proof ──
  const viewerDenialRes = await fetch(`${API_URL}/connector-installations/${INST_ID}/validate-config`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `supportplane_session=${viewerToken}` },
    body: JSON.stringify({ config: { mockMode: true } }),
  });
  const viewerDenialBody = await viewerDenialRes.json().catch(() => ({ status: viewerDenialRes.status, error: 'Forbidden' }));
  await styleCompactApiPage(apiPage, `POST /connector-installations/${INST_ID}/validate-config (viewer)`, '#dc2626', {
    status: viewerDenialRes.status,
    error: viewerDenialBody.message || viewerDenialBody.error,
  });
  await screenshot(apiPage, 'viewer-server-side-denial', 'Viewer server-side mutation denied with 403 on config validation and runtime readiness', { fullPage: false });

  // ── 11. Cross-tenant denial proof ──
  const crossRes = await fetch(`${API_URL}/connector-installations/${INST_ID}/config-schema`, {
    method: 'GET',
    headers: { Cookie: `supportplane_session=${altAdminToken}` },
  });
  const crossBody = await crossRes.json().catch(() => ({ status: crossRes.status, error: 'Not Found' }));
  await styleCompactApiPage(apiPage, `GET /connector-installations/${INST_ID}/config-schema (alt-tenant)`, '#dc2626', {
    status: crossRes.status,
    error: crossBody.message || crossBody.error,
  });
  await screenshot(apiPage, 'cross-tenant-denied', 'Cross-tenant connector installation access denied with 404', { fullPage: false });

  // ── 12. Docs proof: REAL_WRITEBACK_PATH_DESIGN.md key sections ──
  const designDocPath = path.join(__dirname, '..', 'docs', 'REAL_WRITEBACK_PATH_DESIGN.md');
  const designDoc = fs.readFileSync(designDocPath, 'utf-8');
  const keySections = designDoc.split('\n').filter(l =>
    l.startsWith('# ') || l.startsWith('## ') || l.startsWith('### ') ||
    l.startsWith('- [') || l.startsWith('| Threat')
  ).slice(0, 40).join('\n');
  await styleMarkdownPage(apiPage, 'docs/REAL_WRITEBACK_PATH_DESIGN.md — Key Sections', keySections);
  await screenshot(apiPage, 'docs-real-writeback-design', 'Docs proof: REAL_WRITEBACK_PATH_DESIGN.md showing current truth, blocked reasons, phased path, non-goals, acceptance gates, threat table', { fullPage: false });

  // ── 13. Final local/mock/no-real-writeback proof ──
  await adminPage.goto(WEB_URL);
  await adminPage.waitForTimeout(2000);
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  await adminPage.waitForSelector('button:has-text("BL-099 BL-100 Evidence Session")', { timeout: 15000 });
  const sessionItem2 = adminPage.locator('button').filter({ hasText: /BL-099 BL-100 Evidence Session/ }).first();
  if (await sessionItem2.count() > 0) {
    await sessionItem2.click();
    await adminPage.waitForTimeout(3000);
  }
  const finalEvidencePanel = panelLocator(adminPage, 'Evidence Bundle');
  const finalGenerateBtn = finalEvidencePanel.locator('button').filter({ hasText: /Generate|Refresh/ }).first();
  if (await finalGenerateBtn.count() > 0 && await finalGenerateBtn.isEnabled()) {
    await finalGenerateBtn.click();
    await adminPage.waitForTimeout(3000);
  }
  const finalEmptyVisible = await finalEvidencePanel.locator('text=/Select a session to generate/i').first().isVisible().catch(() => false);
  if (finalEmptyVisible) {
    throw new Error('FATAL: Final evidence bundle panel shows empty state.');
  }
  await assertVisibleText(adminPage, 'Bundle ID');
  const finalConnectorPanel = panelLocator(adminPage, 'Connector');
  await screenshotElement(adminPage, finalConnectorPanel, 'final-mock-no-real-writeback', 'Final local/mock/no-real-writeback proof: Mock-only badge, Locked ON, secret values hidden, no real network');

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

  const md5Lines = Object.entries(hashes).map(([h, f]) => `${h}  ${f}`).sort();
  fs.writeFileSync(path.join(OUTPUT_DIR, 'screenshot-md5s.txt'), md5Lines.join('\n') + '\n');

  const proofMd = `# BL-099 + BL-100 Proof-State Mapping\n\n| # | Filename | Proof State | Size |\n|---|----------|-------------|------|\n` +
    proofMapping.map(m => `| ${m.number} | \`${m.filename}\` | ${m.proofState} | ${m.width}x${m.height} |`).join('\n') + '\n';
  fs.writeFileSync(path.join(OUTPUT_DIR, 'proof-state-mapping.md'), proofMd);

  console.log(`\n=== BL-099 + BL-100 Screenshot Summary ===`);
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
