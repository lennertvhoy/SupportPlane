const { chromium } = require('playwright');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'playwright', 'session-165-e2e-ci-ticket-accessibility-hardening');
const BASE_URL = 'http://localhost:3201';
const API_URL = 'http://localhost:4111';

async function login(page, email, password) {
  await page.goto(`${BASE_URL}/`);
  await page.getByRole('textbox', { name: 'Email' }).fill(email);
  await page.getByRole('textbox', { name: 'Password' }).fill(password);
  await page.getByRole('button', { name: /Log in/i }).click();
  await page.waitForURL(/dashboard/);
}

async function capture(name, page) {
  const file = path.join(OUTPUT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`Captured: ${file}`);
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();

  // 1. Login page
  await page.goto(`${BASE_URL}/`);
  await capture('01-login-page', page);

  // 2. Operator dashboard
  await login(page, 'operator@supportplane.local', 'supportplane-demo');
  await capture('02-operator-dashboard', page);

  // 3. Session + ticket context
  await page.getByRole('button', { name: /New/i }).click();
  const titleInput = page.locator('input[placeholder*="title" i], input[name*="title" i]').first();
  await titleInput.fill('E2E Evidence Session');
  await page.locator('button', { hasText: /^Create$/i }).click();
  await page.locator('text=E2E Evidence Session').first().click();
  const loadButton = page.locator('[data-testid="load-ticket-context"]').first();
  await loadButton.click();
  await page.waitForSelector('text=Mock Connector Data', { timeout: 10000 });
  await capture('03-session-ticket-context', page);

  // 4. Admin dashboard
  await page.goto(`${BASE_URL}/admin`);
  await capture('04-admin-dashboard', page);

  // 5. Model usage
  await page.getByRole('navigation').getByText('Model Usage').click();
  await page.waitForTimeout(1000);
  await capture('05-admin-model-usage', page);

  // 6. Approval queue
  await page.goto(`${BASE_URL}/approval-queue`);
  await capture('06-approval-queue', page);

  // 7. Tool registry admin
  await page.goto(`${BASE_URL}/tool-registry`);
  await capture('07-tool-registry-admin', page);

  // 8. Tool registry viewer denied
  await page.goto(`${BASE_URL}/`);
  await page.getByRole('button', { name: /Logout/i }).click();
  await login(page, 'viewer@supportplane.local', 'supportplane-demo');
  await page.goto(`${BASE_URL}/tool-registry`);
  await capture('08-tool-registry-viewer-denied', page);

  // 9. Device console
  await page.goto(`${BASE_URL}/device-console`);
  await capture('09-device-console', page);

  await browser.close();
  console.log('All screenshots captured.');
})();
