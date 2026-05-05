const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3201';

async function login(page, email, password, tenantSlug = 'dev-tenant') {
  await page.goto(BASE_URL + '/');
  await page.waitForSelector('h1:has-text("SupportPlane")', { timeout: 15000 });
  await page.waitForSelector('text=or local auth', { timeout: 15000 });
  await page.getByLabel('Tenant').fill(tenantSlug);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.locator('button[type="submit"]', { hasText: /Log in/i }).click();
  await page.waitForSelector('text=DEV / MOCK DATA', { timeout: 15000 });
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const folder = 'output/playwright/session-166-accessibility-contrast-visual-confidence';

  // 1. Login page
  await page.goto(BASE_URL + '/');
  await page.waitForSelector('h1:has-text("SupportPlane")', { timeout: 15000 });
  await page.waitForSelector('text=or local auth', { timeout: 15000 });
  await page.screenshot({ path: `${folder}/01-login-page.png` });

  // 2. Operator dashboard
  await login(page, 'operator@supportplane.local', 'supportplane-demo');
  await page.screenshot({ path: `${folder}/02-operator-dashboard.png` });

  // 3. Session with ticket context
  await page.getByRole('button', { name: /New/i }).click();
  const titleInput = page.locator('input[placeholder*="title" i]').first();
  await titleInput.fill('Axe Accessibility Session');
  await page.locator('button', { hasText: /^Create$/i }).click();
  await page.locator('text=Axe Accessibility Session').first().click();
  const loadButton = page.locator('[data-testid="load-ticket-context"]').first();
  await loadButton.click();
  await page.waitForSelector('text=Mock Connector Data', { timeout: 15000 });
  await page.screenshot({ path: `${folder}/03-session-with-ticket-context.png` });

  // 4. Admin dashboard
  await page.goto(BASE_URL + '/admin');
  await page.waitForSelector('text=Admin Dashboard', { timeout: 15000 });
  await page.screenshot({ path: `${folder}/04-admin-dashboard.png` });

  // 5. Model Usage (direct navigation)
  await page.goto(BASE_URL + '/admin/model-usage');
  await page.waitForSelector('text=Model Usage Log', { timeout: 15000 });
  await page.screenshot({ path: `${folder}/05-model-usage.png` });

  // 6. Tool Registry admin
  await page.goto(BASE_URL + '/tool-registry');
  await page.waitForSelector('text=Tool Registry', { timeout: 15000 });
  await page.screenshot({ path: `${folder}/06-tool-registry-admin.png` });

  // 7. Tool Registry viewer denied
  await page.goto(BASE_URL + '/');
  await page.waitForSelector('text=Logout', { timeout: 15000 });
  await page.locator('button', { hasText: /Logout/i }).click();
  await page.waitForSelector('text=or local auth', { timeout: 15000 });
  await login(page, 'viewer@supportplane.local', 'supportplane-demo');
  await page.goto(BASE_URL + '/tool-registry');
  await page.waitForSelector('text=/Forbidden|403|Denied/i', { timeout: 15000 });
  await page.screenshot({ path: `${folder}/07-tool-registry-viewer-denied.png` });

  // 8. Approval Queue
  await page.goto(BASE_URL + '/approval-queue');
  await page.waitForSelector('text=Approval Queue', { timeout: 15000 });
  await page.screenshot({ path: `${folder}/08-approval-queue.png` });

  // 9. Device Console
  await page.goto(BASE_URL + '/device-console');
  await page.waitForSelector('text=Device Console', { timeout: 15000 });
  await page.screenshot({ path: `${folder}/09-device-console.png` });

  // 10. Focus state example (login button focused)
  await page.goto(BASE_URL + '/');
  await page.waitForSelector('text=or local auth', { timeout: 15000 });
  const loginBtn = page.locator('button[type="submit"]', { hasText: /Log in/i });
  await loginBtn.focus();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${folder}/10-focus-state-example.png` });

  await browser.close();
  console.log('Screenshots captured');
})();
