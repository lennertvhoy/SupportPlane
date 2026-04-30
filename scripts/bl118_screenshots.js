#!/usr/bin/env node
/**
 * BL-118 Production Readiness Screenshots
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '../output/playwright/session-118-bl083-bl086-bl087-bl090-production-readiness');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const WEB = process.env.WEB_URL || 'http://localhost:3300';
const API = process.env.API_URL || 'http://localhost:4210';

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const shot = async (name, fullPage = false) => {
    const p = path.join(OUT, name);
    await page.screenshot({ path: p, fullPage });
    console.log('Screenshot:', p);
  };

  // Login
  await page.goto(WEB, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  const inputs = await page.locator('form input').all();
  if (inputs.length >= 3) {
    await inputs[1].fill('admin@supportplane.local');
    await inputs[2].fill('supportplane-demo');
  }
  await page.click('button[type="submit"]');
  await page.waitForTimeout(3000);
  await shot('15-ui-auth-security-proof.png');

  // 16. Release/Ops proof — health endpoint JSON
  await page.goto(`${API}/health`);
  await page.waitForTimeout(500);
  await shot('16-ui-release-ops-proof.png');

  // 17. State docs proof — cockpit header
  await page.goto(WEB, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await shot('17-state-docs-proof.png');

  await browser.close();
  console.log('Screenshots complete.');
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
