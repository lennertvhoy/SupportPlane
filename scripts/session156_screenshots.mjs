import { chromium } from 'playwright';

const BASE = 'http://localhost:3300';
const E = 'output/playwright/session-156-final-tester-readiness-closure';
const W = 1280;
const H = 900;

async function main() {
  const b = await chromium.launch({ headless: true });
  const ctx = await b.newContext({ viewport: { width: W, height: H } });
  const p = await ctx.newPage();

  try {
    // LOGIN
    await p.goto(BASE, { waitUntil: 'domcontentloaded' });
    await p.waitForTimeout(2000);
    const loginBtn = p.getByRole('button', { name: 'Log in' });
    if (await loginBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await p.getByRole('textbox', { name: 'Email' }).fill('admin@supportplane.local');
      await p.getByRole('textbox', { name: 'Password' }).fill('supportplane-demo');
      await loginBtn.click();
      await p.waitForTimeout(5000);
    }
    console.log('Logged in');

    // 1. DEMO GUIDE / START HERE
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${E}/01-browser-start-here.png`, fullPage: false });
    console.log('1. start-here');

    // 2. CONNECTOR STATUS — scroll down to see panels below Demo Guide
    await p.evaluate(() => window.scrollTo(0, 700));
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${E}/02-browser-connector-status.png`, fullPage: false });
    console.log('2. connector-status');

    // 3. ZAMMAD LOADED TICKET CONTEXT
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(300);

    // Click New session in sidebar
    const newBtn = p.locator('aside button:has-text("New")');
    if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await newBtn.click();
      await p.waitForTimeout(500);
      await p.locator('input[placeholder="Session title"]').fill('Zammad Ticket #68002');
      await p.locator('button:has-text("Create")').click();
      await p.waitForTimeout(3000);
    }

    // Load Zammad ticket
    const extInput = p.locator('input[placeholder="External ticket ID"]').first();
    if (await extInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await extInput.fill('2');
      await extInput.locator('..').locator('button:has-text("Load")').click();
      await p.waitForTimeout(5000);
      console.log('Zammad ticket load clicked');
    }

    // Scroll to show loaded ticket data
    await p.evaluate(() => window.scrollTo(0, 250));
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${E}/03-browser-zammad-loaded.png`, fullPage: false });
    console.log('3. zammad-loaded');

    // 4. GLPI LOADED TICKET CONTEXT — scroll down to second TicketContext panel
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(300);

    // Find the GLPI ticket input (second "External ticket ID" field)
    const glpiInputs = p.locator('input[placeholder="External ticket ID"]');
    const count = await glpiInputs.count();
    console.log(`Found ${count} ticket inputs`);

    if (count >= 2) {
      // Use second input for GLPI
      const glpiInput = glpiInputs.nth(1);
      await glpiInput.fill('1');
      // Find the Load button in the same flex container
      await glpiInput.locator('..').locator('button:has-text("Load")').click();
      await p.waitForTimeout(5000);
      console.log('GLPI ticket load clicked');
    } else if (count === 1) {
      // Only one input — the GLPI panel might not be visible (no session selected or layout issue)
      console.log('Only 1 ticket input found — GLPI panel may not be rendered');
    }

    // Scroll to second TicketContext panel location (further down)
    await p.evaluate(() => window.scrollTo(0, 600));
    await p.waitForTimeout(500);
    await p.screenshot({ path: `${E}/04-browser-glpi-loaded.png`, fullPage: false });
    console.log('4. glpi-loaded');

    // 5. DRAFT NOTE — scroll to Draft Note panel after ticket is loaded
    await p.evaluate(() => window.scrollTo(0, 1000));
    await p.waitForTimeout(500);
    // Try to generate a draft
    const genBtn = p.locator('button:has-text("Generate Draft")');
    if (await genBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await genBtn.click();
      await p.waitForTimeout(5000);
      console.log('Draft generation triggered');
    }
    await p.screenshot({ path: `${E}/05-browser-draft-review.png`, fullPage: false });
    console.log('5. draft-review');

    // 6. ADMIN GOVERNANCE
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(300);
    const adminBtn = p.getByRole('button', { name: 'Admin' });
    if (await adminBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await adminBtn.click();
      await p.waitForTimeout(5000);
    }
    await p.screenshot({ path: `${E}/06-browser-admin-governance.png`, fullPage: false });
    console.log('6. admin-governance');

    console.log('DONE — 6 screenshots');
  } catch (err) {
    console.error('Error:', err.message);
    try { await p.screenshot({ path: `${E}/error.png` }); } catch {}
  } finally {
    await b.close();
  }
}

main().catch(console.error);
