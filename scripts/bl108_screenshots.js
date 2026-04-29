#!/usr/bin/env node
/**
 * BL-108 Ollama Host Call + Model Selection Browser Proof Script
 * Max 20 screenshots.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '../output/playwright/session-110-bl108-ollama-host-call-model-selection');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

let n = 0;
async function snap(page, name, opts = {}) {
  n++;
  const p = path.join(OUT, `${String(n).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: p, fullPage: opts.fullPage ?? false });
  console.log('Screenshot:', p);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1. Cluster API health
  await page.goto('http://localhost:4210/health');
  await page.waitForTimeout(600);
  await snap(page, 'cluster-api-health-current-head');

  // 2. Login and load cockpit
  await page.goto('http://localhost:3300/');
  await page.waitForTimeout(2000);

  const hasEmail = await page.$('input[type="email"]');
  if (hasEmail) {
    await page.fill('input[type="email"]', 'operator@supportplane.local');
    await page.fill('input[type="password"]', 'supportplane-demo');
    // Click by text since type="submit" may not match
    const loginBtn = await page.locator('button', { hasText: /Log in/i }).first();
    if (loginBtn) await loginBtn.click();
    await page.waitForTimeout(3000);
  }
  await snap(page, 'cockpit-header-dev-mock');

  // Try to find a session or create one
  const sessionCard = await page.locator('text=/open/i').first();
  if (sessionCard) {
    await sessionCard.click();
    await page.waitForTimeout(800);
  } else {
    // Create a session
    const createBtn = await page.locator('button', { hasText: /Create/i }).first();
    if (createBtn) {
      await createBtn.click();
      await page.waitForTimeout(500);
      const titleInput = await page.$('input[placeholder*="title" i], input[placeholder*="Title" i]');
      if (titleInput) {
        await titleInput.fill('BL-108 Test');
        const submitBtn = await page.locator('button', { hasText: /Create/i }).first();
        if (submitBtn) await submitBtn.click();
        await page.waitForTimeout(1500);
      }
    }
  }
  await snap(page, 'session-selected-or-created');

  // 3. Scroll to Draft Note panel and generate
  const draftHeading = await page.locator('h2, h3', { hasText: /Draft Note/i }).first();
  if (draftHeading) await draftHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  // Click generate local draft
  const genBtn = await page.locator('button', { hasText: /Generate/i }).first();
  if (genBtn) {
    await genBtn.click();
    await page.waitForTimeout(12000); // wait for Ollama response (model load + inference)
  }
  await snap(page, 'ollama-local-model-metadata');

  // 4. Scroll to see fallback used: No and other labels
  if (draftHeading) await draftHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await snap(page, 'ollama-fallback-used-no');

  // 5. Capture AI Context Quality panel
  const aiCtxHeading = await page.locator('h2, h3', { hasText: /AI Context Quality/i }).first();
  if (aiCtxHeading) await aiCtxHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await snap(page, 'ai-context-quality-panel');

  // 6. Capture writeback blocked / delivery policy
  const delivHeading = await page.locator('h2, h3', { hasText: /Delivery/i }).first();
  if (delivHeading) await delivHeading.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await snap(page, 'writeback-blocked-delivery-policy');

  // 7. State docs in browser (composite)
  await page.goto('file:///home/ff/Documents/Projects/SupportPlane/BACKLOG.md');
  await page.waitForTimeout(600);
  await snap(page, 'backlog-md-bl108-partial');

  await page.goto('file:///home/ff/Documents/Projects/SupportPlane/NEXT_ACTIONS.md');
  await page.waitForTimeout(600);
  await snap(page, 'next-actions-md');

  await browser.close();
  console.log('Done. Total screenshots:', n);
})();
