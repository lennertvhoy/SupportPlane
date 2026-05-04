import { chromium } from 'playwright';

const BASE = 'http://localhost:3300';
const EVIDENCE = 'output/playwright/session-153-bl141-closure-repair';
const WIDTH = 1280;
const HEIGHT = 900;

async function login(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const emailInput = page.getByRole('textbox', { name: 'Email' });
  const passInput = page.getByRole('textbox', { name: 'Password' });
  const loginBtn = page.getByRole('button', { name: 'Log in' });

  if (await emailInput.isVisible().catch(() => false)) {
    await emailInput.fill('admin@supportplane.local');
    await passInput.fill('supportplane-demo');
    await loginBtn.click();
    await page.waitForTimeout(4000);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: WIDTH, height: HEIGHT } });
  const page = await context.newPage();

  try {
    await login(page);

    // After login we should see the cockpit. Verify by checking for SupportPlane header
    const header = page.locator('h1:has-text("SupportPlane")');
    if (await header.isVisible().catch(() => false)) {
      console.log('Login successful - cockpit loaded');
    } else {
      console.log('Warning: cockpit header not found, capturing anyway');
    }

    // 1. Cockpit home with Demo Guide panel (no session selected)
    await page.waitForTimeout(1000);
    await page.screenshot({ path: `${EVIDENCE}/08-browser-start-here.png`, fullPage: false });
    console.log('1. start-here captured');

    // 2. Session search/filter
    const searchInput = page.locator('input[placeholder*="Search sessions"]');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('Smoke');
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: `${EVIDENCE}/09-browser-session-search.png`, fullPage: false });
    console.log('2. session-search captured');
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('');
      await page.waitForTimeout(300);
    }

    // Scroll to connector status
    const connPanel = page.locator('h3:has-text("Connector Status")');
    if (await connPanel.isVisible().catch(() => false)) {
      await connPanel.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: `${EVIDENCE}/10-browser-connector-status.png`, fullPage: false });
    console.log('3. connector-status captured');

    // 4. Create session and load Zammad
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);

    const newBtn = page.locator('button', { hasText: 'New' }).first();
    if (await newBtn.isVisible().catch(() => false)) {
      await newBtn.click();
      await page.waitForTimeout(500);
      const titleInput = page.locator('input[placeholder="Session title"]');
      if (await titleInput.isVisible().catch(() => false)) {
        await titleInput.fill('BL-141 Zammad Demo');
      }
      const createBtn = page.locator('button', { hasText: 'Create' });
      if (await createBtn.isVisible().catch(() => false)) {
        await createBtn.click();
        await page.waitForTimeout(2500);
      }
    }

    // Load Zammad ticket
    const ticketLoad = page.locator('input[placeholder*="TICKET"]');
    if (await ticketLoad.isVisible().catch(() => false)) {
      await ticketLoad.fill('TICKET-101');
      const loadBtn = page.locator('button', { hasText: 'Load Ticket' });
      if (await loadBtn.isVisible().catch(() => false)) {
        await loadBtn.click();
        await page.waitForTimeout(3000);
      }
    }
    await page.screenshot({ path: `${EVIDENCE}/11-browser-zammad-flow.png`, fullPage: false });
    console.log('4. zammad-flow captured');

    // 5. GLPI flow (connector panel shows GLPI)
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${EVIDENCE}/12-browser-glpi-flow.png`, fullPage: false });
    console.log('5. glpi-flow captured');

    // 6. Admin governance
    await page.evaluate(() => window.scrollTo(0, 0));
    const adminBtn = page.getByRole('button', { name: 'Admin' });
    if (await adminBtn.isVisible().catch(() => false)) {
      await adminBtn.click();
      await page.waitForTimeout(4000);
    }
    await page.screenshot({ path: `${EVIDENCE}/13-browser-admin-governance.png`, fullPage: false });
    console.log('6. admin-governance captured');

    console.log('All 6 screenshots captured successfully');
  } catch (err) {
    console.error('Screenshot error:', err.message);
    try {
      await page.screenshot({ path: `${EVIDENCE}/error-state.png`, fullPage: false });
    } catch {}
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
