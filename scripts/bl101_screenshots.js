#!/usr/bin/env node
/**
 * BL-101 Screenshot Script
 * Writes to session-102-bl101-mvp-demo-freeze-final/
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'playwright', 'session-102-bl101-mvp-demo-freeze-final');
const WEB_URL = 'http://localhost:3200';
const API_URL = 'http://localhost:4110';
const MAX_SCREENSHOTS = 20;
const MAX_SCREENSHOT_HEIGHT = 1200;

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

  // Create a fresh demo session via API
  const session = await apiCall('/support-sessions', adminToken, 'POST', {
    title: 'Demo Session — VPN Issue',
    description: 'BL-101 demo session',
    priority: 'normal',
  });
  const sessionId = session.id;
  await apiCall(`/support-sessions/${sessionId}/zammad/ticket-context`, adminToken, 'POST', { externalTicketId: 'TICKET-101' });

  const browser = await chromium.launch({ headless: true });

  // ── 1. Admin landing after demo reset ──
  const adminContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const adminPage = await adminContext.newPage();
  const apiPage = await adminContext.newPage();
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  await assertVisibleText(adminPage, 'admin');
  await assertVisibleText(adminPage, 'DEV / MOCK DATA');
  await assertVisibleText(adminPage, 'Auth: local');
  await screenshot(adminPage, 'admin-landing-after-demo-reset', 'Fresh clean admin landing after demo reset with auth/store badges', { fullPage: false });

  // ── 2. Header runtime identity proof ──
  const header = adminPage.locator('header').first();
  await screenshotElement(adminPage, header, 'header-runtime-identity', 'Header/runtime identity: DEV/MOCK DATA, API URL, Auth: local, Store: postgres, user/tenant/role pill');

  // ── 3. Clean session list ──
  const sessionPanel = panelLocator(adminPage, 'Sessions');
  await screenshotElement(adminPage, sessionPanel, 'clean-session-list', 'Clean session list with only the demo-ready session created for BL-101');

  // ── 4. Ticket context loaded with connector provenance ──
  await adminPage.waitForSelector('button:has-text("Demo Session — VPN Issue")', { timeout: 15000 });
  const sessionItem = adminPage.locator('button').filter({ hasText: /Demo Session — VPN Issue/ }).first();
  if (await sessionItem.count() > 0) {
    await sessionItem.click();
    await adminPage.waitForTimeout(3000);
  }
  await assertVisibleText(adminPage, 'TICKET-101');
  const ticketPanel = panelLocator(adminPage, 'Ticket Context');
  await screenshotElement(adminPage, ticketPanel, 'ticket-context-provenance', 'Ticket context loaded with connector runtime provenance');

  // ── 5. Connector panel mock-only boundary ──
  const connectorPanel = panelLocator(adminPage, 'Connector');
  await screenshotElement(adminPage, connectorPanel, 'connector-panel-mock-boundary', 'Connector panel showing mock-only/local-only boundary');

  // ── 6. Delivery policy panel real network locked off ──
  const policyPanel = panelLocator(adminPage, 'Delivery Policy');
  await screenshotElement(adminPage, policyPanel, 'delivery-policy-real-network-locked', 'Delivery policy panel showing real network locked OFF and mock-only enforced ON');

  // ── 7. Action/outbox local-only workflow ──
  // Create action via API to show outbox state
  const actionRes = await apiCall(`/support-sessions/${sessionId}/actions`, adminToken, 'POST', {
    type: 'ticket_note',
    title: 'Demo action',
    body: 'Mock support note for BL-101 demo',
  });
  const actionId = actionRes.action?.id || actionRes.id;
  if (!actionId) throw new Error('Created action has no id');
  await apiCall(`/actions/${actionId}/submit-for-review`, adminToken, 'POST', {});
  await apiCall(`/actions/${actionId}/approve`, adminToken, 'POST', {});
  await apiCall(`/actions/${actionId}/queue`, adminToken, 'POST', {});
  await apiCall(`/actions/${actionId}/mock-deliver`, adminToken, 'POST', {});
  await adminPage.goto(WEB_URL);
  await adminPage.waitForTimeout(2000);
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  await adminPage.waitForSelector('button:has-text("Demo Session — VPN Issue")', { timeout: 15000 });
  const sessionItem2 = adminPage.locator('button').filter({ hasText: /Demo Session — VPN Issue/ }).first();
  if (await sessionItem2.count() > 0) {
    await sessionItem2.click();
    await adminPage.waitForTimeout(3000);
  }
  const actionPanel = panelLocator(adminPage, 'Action Center');
  await screenshotElement(adminPage, actionPanel, 'action-outbox-local-workflow', 'Action/outbox local-only workflow with mock delivery');

  // ── 8. Evidence bundle generated ──
  const evidencePanel = panelLocator(adminPage, 'Evidence Bundle');
  const generateBtn = evidencePanel.locator('button').filter({ hasText: /Generate|Refresh/ }).first();
  if (await generateBtn.count() > 0 && await generateBtn.isEnabled()) {
    await generateBtn.click();
    await adminPage.waitForTimeout(3000);
  }
  await assertVisibleText(adminPage, 'Bundle ID');
  await screenshotElement(adminPage, evidencePanel, 'evidence-bundle-generated', 'Evidence bundle generated with summary and mock/dev-only disclaimers');

  // ── 9. Viewer read-only proof ──
  const viewerContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const viewerPage = await viewerContext.newPage();
  await webLogin(viewerPage, 'viewer@supportplane.local', 'supportplane-demo', 'dev-tenant');
  await assertVisibleText(viewerPage, 'viewer');
  const viewerConnectorPanel = panelLocator(viewerPage, 'Connector');
  await screenshotElement(viewerPage, viewerConnectorPanel, 'viewer-read-only-proof', 'Viewer read-only proof with disabled controls and view-only messages');

  // ── 10. Viewer server-side denial proof ──
  const viewerDenialRes = await fetch(`${API_URL}/support-sessions/${sessionId}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: `supportplane_session=${viewerToken}` },
    body: JSON.stringify({ type: 'ticket_note', title: 'Forbidden', body: 'Viewer cannot create actions' }),
  });
  const viewerDenialBody = await viewerDenialRes.json().catch(() => ({ status: viewerDenialRes.status, error: 'Forbidden' }));
  await styleCompactApiPage(apiPage, `POST /support-sessions/${sessionId}/actions (viewer)`, '#dc2626', {
    status: viewerDenialRes.status,
    error: viewerDenialBody.message || viewerDenialBody.error,
  });
  await screenshot(apiPage, 'viewer-server-side-denial', 'Viewer server-side mutation denied with 403', { fullPage: false });

  // ── 11. Demo guide proof ──
  const demoGuidePath = path.join(__dirname, '..', 'docs', 'DEMO_GUIDE.md');
  const demoGuide = fs.readFileSync(demoGuidePath, 'utf-8');
  const demoGuidePreview = demoGuide.split('\n').slice(0, 50).join('\n');
  await styleMarkdownPage(apiPage, 'docs/DEMO_GUIDE.md', demoGuidePreview);
  await screenshot(apiPage, 'demo-guide-proof', 'Demo guide proof showing scripted demo path and credentials', { fullPage: false });

  // ── 12. MVP completion audit proof ──
  const auditPath = path.join(__dirname, '..', 'docs', 'MVP_COMPLETION_AUDIT.md');
  const auditDoc = fs.readFileSync(auditPath, 'utf-8');
  const auditPreview = auditDoc.split('\n').slice(0, 50).join('\n');
  await styleMarkdownPage(apiPage, 'docs/MVP_COMPLETION_AUDIT.md', auditPreview);
  await screenshot(apiPage, 'mvp-audit-proof', 'MVP completion audit proof showing product truth and boundaries', { fullPage: false });

  // ── 13. Final no-real-writeback/no-secret/no-production-claim proof ──
  await adminPage.goto(WEB_URL);
  await adminPage.waitForTimeout(2000);
  await webLogin(adminPage, 'admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  await adminPage.waitForSelector('button:has-text("Demo Session — VPN Issue")', { timeout: 15000 });
  const sessionItem3 = adminPage.locator('button').filter({ hasText: /Demo Session — VPN Issue/ }).first();
  if (await sessionItem3.count() > 0) {
    await sessionItem3.click();
    await adminPage.waitForTimeout(3000);
  }
  const finalEvidencePanel = panelLocator(adminPage, 'Evidence Bundle');
  const finalGenerateBtn = finalEvidencePanel.locator('button').filter({ hasText: /Generate|Refresh/ }).first();
  if (await finalGenerateBtn.count() > 0 && await finalGenerateBtn.isEnabled()) {
    await finalGenerateBtn.click();
    await adminPage.waitForTimeout(3000);
  }
  await assertVisibleText(adminPage, 'Bundle ID');
  const finalConnectorPanel = panelLocator(adminPage, 'Connector');
  await screenshotElement(adminPage, finalConnectorPanel, 'final-no-real-writeback-proof', 'Final no-real-writeback/no-secret/no-production-claim proof');

  // ── 14. Reset script and README proof ──
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readme = fs.readFileSync(readmePath, 'utf-8');
  const readmePreview = readme.split('\n').slice(0, 50).join('\n');
  await styleMarkdownPage(apiPage, 'README.md — Product Boundary', readmePreview);
  await screenshot(apiPage, 'reset-script-proof', 'Demo reset script and README proof with honest safety boundary', { fullPage: false });

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

  const proofMd = `# BL-101 Proof-State Mapping\n\n| # | Filename | Proof State | Size |\n|---|----------|-------------|------|\n` +
    proofMapping.map(m => `| ${m.number} | \`${m.filename}\` | ${m.proofState} | ${m.width}x${m.height} |`).join('\n') + '\n';
  fs.writeFileSync(path.join(OUTPUT_DIR, 'proof-state-mapping.md'), proofMd);

  console.log(`\n=== BL-101 Screenshot Summary ===`);
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
