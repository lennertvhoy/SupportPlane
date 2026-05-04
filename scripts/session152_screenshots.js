const { chromium } = require('playwright');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const EVIDENCE_DIR = path.resolve(__dirname, '../output/playwright/session-152-demo-ux-polish-observation-readiness');
fs.mkdirSync(EVIDENCE_DIR, { recursive: true });

const BASE_URL = 'http://localhost:3300';
const API_URL = 'http://localhost:4210';

async function main() {
  // Authenticate via API
  console.log('Authenticating...');
  let sessionCookie = null;
  try {
    const result = execSync(
      `curl -s -c - --max-time 10 -X POST "${API_URL}/auth/local/login" -H "Content-Type: application/json" -d '{"email":"admin@supportplane.local","password":"supportplane-demo","tenantSlug":"dev-tenant"}'`,
      { encoding: 'utf-8' }
    );
    const match = result.match(/supportplane_session\s+(\S+)/);
    if (match) sessionCookie = match[1];
  } catch (e) {
    console.log('  Auth failed:', e.message);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  if (sessionCookie) {
    await context.addCookies([{
      name: 'supportplane_session', value: sessionCookie,
      domain: 'localhost', path: '/', httpOnly: true, sameSite: 'Lax',
    }]);
  }

  const page = await context.newPage();
  await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Login fallback
  const loginForm = page.locator('form button:has-text("Log in")').first();
  if (await loginForm.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('Browser login...');
    await page.locator('label:has-text("Tenant") input').first().fill('dev-tenant');
    await page.locator('label:has-text("Email") input').first().fill('admin@supportplane.local');
    await page.locator('label:has-text("Password") input').first().fill('supportplane-demo');
    await loginForm.click();
    await page.waitForTimeout(4000);
  }

  console.log('Logged in, capturing screenshots...');

  // 1. Demo home with Start Here guidance (full viewport)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '01-demo-home-start-here.png'), fullPage: false });
  console.log('  1 done');

  // 2. Session search/filter — first ensure sessions are loaded, then search
  // Wait for sessions to load (sidebar should have session items)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  const sessionItems = page.locator('aside li button').first();
  const hasSessions = await sessionItems.isVisible({ timeout: 3000 }).catch(() => false);
  if (hasSessions) {
    const searchBox = page.locator('input[placeholder="Search sessions..."]').first();
    if (await searchBox.isVisible({ timeout: 2000 }).catch(() => false)) {
      await searchBox.fill('Smoke');
      await page.waitForTimeout(500);
    }
  }
  // Capture sidebar area showing sessions + search
  const sidebar = page.locator('aside').first();
  if (await sidebar.isVisible({ timeout: 2000 }).catch(() => false)) {
    await sidebar.screenshot({ path: path.join(EVIDENCE_DIR, '02-session-search.png') });
    console.log('  2 done');
  } else {
    // Fallback: just take viewport screenshot
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '02-session-list.png'), fullPage: false });
    console.log('  2 done (fallback)');
  }
  // Clear search if we set it
  const sb = page.locator('input[placeholder="Search sessions..."]').first();
  if (await sb.isVisible({ timeout: 1000 }).catch(() => false)) {
    await sb.clear();
  }
  await page.waitForTimeout(300);

  // 3. Connector status — scroll down to show connector cards
  // Scroll to bring Connector Status into view
  await page.evaluate(() => window.scrollTo(0, window.innerHeight));
  await page.waitForTimeout(500);
  const connCards = page.locator('h3:has-text("Connector Status")').first();
  if (await connCards.isVisible({ timeout: 3000 }).catch(() => false)) {
    const connBox = await connCards.boundingBox();
    if (connBox) {
      // Capture the connector status panel area (extend below)
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, '03-connector-status.png'),
        clip: { x: 0, y: connBox.y - 40, width: 1440, height: 500 }
      });
    } else {
      await page.screenshot({ path: path.join(EVIDENCE_DIR, '03-connector-status.png'), fullPage: false });
    }
  } else {
    await page.screenshot({ path: path.join(EVIDENCE_DIR, '03-connector-status.png'), fullPage: false });
  }
  console.log('  3 done');

  // 4. Zammad flow — create session and load ticket
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const newBtn = page.locator('button:has-text("New")').first();
  if (await newBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await newBtn.click();
    await page.waitForTimeout(500);
    const titleInput = page.locator('input[placeholder="Session title"]').first();
    if (await titleInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await titleInput.fill('ROUND-001 Zammad Demo');
      await page.locator('button:has-text("Create")').first().click();
      await page.waitForTimeout(2000);
    }
  }
  // Load Zammad ticket
  const ticketField = page.locator('input[placeholder="External ticket ID"]').first();
  if (await ticketField.isVisible({ timeout: 3000 }).catch(() => false)) {
    await ticketField.clear();
    await ticketField.fill('TICKET-101');
    await page.locator('button:has-text("Load")').first().click();
    await page.waitForTimeout(4000);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '04-zammad-flow.png'), fullPage: false });
  console.log('  4 done');

  // 5. GLPI — go to admin/connectors to show GLPI is configured
  await page.goto(`${BASE_URL}/admin/connectors`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '05-admin-connectors-glpi.png'), fullPage: false });
  console.log('  5 done');

  // 6. Admin governance
  await page.goto(`${BASE_URL}/admin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, '06-admin-governance.png'), fullPage: false });
  console.log('  6 done');

  await browser.close();
  console.log('Done. All screenshots captured.');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
