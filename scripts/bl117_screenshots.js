/**
 * BL-117 Reproducible Screenshot Script
 * Usage: node scripts/bl117_screenshots.js
 * Pre-requisites: API and Web port-forwards active, cluster running
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'playwright', 'session-117-bl117-asterisk-telephony-bridge');
const API_BASE = 'http://localhost:4210';
const WEB_BASE = 'http://localhost:3300';

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  // 1. Call Console with Asterisk call event
  await page.goto(`${WEB_BASE}/call-console`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '15-ui-call-console-asterisk-proof.png') });

  // 2. Telephony registry JSON
  const token = process.env.SUPPORTPLANE_INTERNAL_SERVICE_TOKEN || 'dev-service-token';
  await page.goto(`${API_BASE}/telephony/registry?token=${token}`);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT_DIR, '16-ui-telephony-registry-proof.png') });

  await browser.close();
  console.log('Screenshots captured in', OUTPUT_DIR);
}

main().catch(e => { console.error(e); process.exit(1); });
