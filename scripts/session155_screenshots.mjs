import { chromium } from 'playwright';

const BASE = 'http://localhost:3300';
const EVIDENCE = 'output/playwright/session-155-tester-readiness-truth-repair';
const WIDTH = 1280;
const HEIGHT = 900;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  const page = await context.newPage();

  try {
    // Login
    await page.goto(BASE, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const loginForm = page.getByRole('button', { name: 'Log in' });
    if (await loginForm.isVisible({ timeout: 5000 }).catch(() => false)) {
      await page.getByRole('textbox', { name: 'Email' }).fill('admin@supportplane.local');
      await page.getByRole('textbox', { name: 'Password' }).fill('supportplane-demo');
      await loginForm.click();
      await page.waitForTimeout(5000);
    }

    // 1. Demo Guide / Start Here
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${EVIDENCE}/08-browser-start-here.png`, fullPage: false });
    console.log('1. start-here');

    // 2. Connector Status — scroll down past the Demo Guide
    await page.evaluate(() => window.scrollTo(0, 650));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${EVIDENCE}/09-browser-connector-status.png`, fullPage: false });
    console.log('2. connector-status');

    // 3. Create session and load Zammad ticket
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);

    // Click New in sidebar
    const newBtn = page.locator('aside button:has-text("New")');
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);
      await page.locator('input[placeholder="Session title"]').fill('Zammad TICKET-101');
      await page.locator('button:has-text("Create")').click();
      await page.waitForTimeout(3000);
    }

    // Load ticket using "External ticket ID" input and "Load" button
    const extIdInput = page.locator('input[placeholder="External ticket ID"]');
    if (await extIdInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await extIdInput.fill('2');
      // Click the Load button next to this input (in the same flex container)
      await extIdInput.locator('..').locator('button:has-text("Load")').click();
      await page.waitForTimeout(5000);
    }
    console.log('Zammad ticket load attempted');

    // Scroll to show ticket context with loaded data
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${EVIDENCE}/10-browser-zammad-loaded-ticket.png`, fullPage: false });
    console.log('3. zammad-loaded-ticket');

    // 4. Scroll further to show AI context / ticket info
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${EVIDENCE}/11-browser-ticket-detail.png`, fullPage: false });
    console.log('4. ticket-detail');

    // 5. Admin governance
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    const adminBtn = page.getByRole('button', { name: 'Admin' });
    if (await adminBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await adminBtn.click();
      await page.waitForTimeout(5000);
    }
    await page.screenshot({ path: `${EVIDENCE}/12-browser-admin-governance.png`, fullPage: false });
    console.log('5. admin-governance');

    console.log('Done');
  } catch (err) {
    console.error('Error:', err.message);
    try { await page.screenshot({ path: `${EVIDENCE}/error-state.png`, fullPage: false }); } catch {}
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
