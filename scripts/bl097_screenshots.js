#!/usr/bin/env node
/**
 * BL-097 Screenshot Script — Credential Reference Foundation
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'playwright', 'session-097-credential-reference-foundation-canonical');
const WEB_URL = 'http://localhost:3200';
const API_URL = 'http://localhost:4110';

let screenshotCount = 0;

async function screenshot(page, name) {
  screenshotCount++;
  const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: false });
  console.log(`Captured: ${filename}`);
  return filepath;
}

async function expandFirstConnectorInstallation(page) {
  const chevron = page.locator('svg[class*="lucide-chevron-down"]').first();
  if (await chevron.count() > 0) {
    await chevron.click();
    await page.waitForTimeout(500);
  }
}

async function scrollToCredentialRefs(page) {
  await page.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.includes('Credential References')) {
        node.parentElement.scrollIntoView({ behavior: 'instant', block: 'center' });
        break;
      }
    }
  });
  await page.waitForTimeout(500);
}

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });

  // ── 1. Admin view: Connector panel with credential references ──
  const adminContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: {
      'x-tenant-id': 'dev-tenant',
      'x-user-id': 'dev-admin',
      'x-user-role': 'admin',
    },
  });
  const adminPage = await adminContext.newPage();
  await adminPage.goto(WEB_URL);
  await adminPage.waitForTimeout(3000);
  await expandFirstConnectorInstallation(adminPage);
  await screenshot(adminPage, 'admin-connector-panel-with-credential-refs');

  // ── 2. Admin view: Credential reference selector dropdown ──
  await scrollToCredentialRefs(adminPage);
  await screenshot(adminPage, 'admin-credential-ref-selector');

  // ── 3. Viewer role: Read-only credential references ──
  const viewerContext = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: {
      'x-tenant-id': 'dev-tenant',
      'x-user-id': 'dev-viewer',
      'x-user-role': 'viewer',
    },
  });
  const viewerPage = await viewerContext.newPage();
  await viewerPage.goto(WEB_URL);
  await viewerPage.waitForTimeout(3000);
  await expandFirstConnectorInstallation(viewerPage);
  await scrollToCredentialRefs(viewerPage);
  await screenshot(viewerPage, 'viewer-readonly-credential-refs');

  // ── 4. API: Credential reference list (redacted) ──
  const apiPage = await adminContext.newPage();
  await apiPage.goto(`${API_URL}/credential-references`);
  await apiPage.waitForTimeout(1000);
  await screenshot(apiPage, 'api-credential-refs-list-redacted');

  // ── 5. API: Single credential reference (redacted secretRef) ──
  await apiPage.goto(`${API_URL}/credential-references/cred-ref-dev-001`);
  await apiPage.waitForTimeout(1000);
  await screenshot(apiPage, 'api-credential-ref-single-redacted');

  // ── 6. API: Evidence bundle with credential references ──
  await apiPage.goto(`${API_URL}/support-sessions/session-dev-001/evidence-bundle?format=json`);
  await apiPage.waitForTimeout(1000);
  await apiPage.evaluate(() => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.includes('credentialReferences')) {
        node.parentElement.scrollIntoView({ behavior: 'instant', block: 'center' });
        break;
      }
    }
  });
  await apiPage.waitForTimeout(500);
  await screenshot(apiPage, 'api-evidence-bundle-credential-refs');

  await apiPage.close();
  await adminPage.close();
  await viewerPage.close();
  await browser.close();

  console.log(`\nDone. Captured ${screenshotCount} screenshots to ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
