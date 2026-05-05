const { chromium } = require('playwright');
const path = require('path');

const outDir = path.resolve(__dirname, '../output/playwright/session-167-bl144-bl147-e2e-fixes-control-inventory-visual-ci');

async function screenshot(page, name) {
  await page.screenshot({ path: path.join(outDir, name), fullPage: false });
  console.log('Captured:', name);
}

async function login(page, email, password) {
  await page.goto('http://localhost:3201/');
  await page.getByRole('heading', { name: 'SupportPlane' }).first().waitFor();
  await page.locator('text=or local auth').waitFor();
  await page.getByLabel('Tenant').fill('dev-tenant');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.locator('button[type="submit"]', { hasText: /Log in/i }).click();
  await page.waitForSelector('text=Start Here', { timeout: 10000 });
  await page.waitForTimeout(500);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

  // 1. Login page
  await page.goto('http://localhost:3201/');
  await page.getByRole('heading', { name: 'SupportPlane' }).first().waitFor();
  await screenshot(page, '01-login-page.png');

  // 2. Operator dashboard
  await login(page, 'operator@supportplane.local', 'supportplane-demo');
  await screenshot(page, '02-operator-dashboard.png');

  // 3. Admin dashboard
  await page.goto('http://localhost:3201/admin');
  await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });
  await screenshot(page, '03-admin-dashboard.png');

  // 4. Tool Registry (admin)
  await page.goto('http://localhost:3201/tool-registry');
  await page.waitForSelector('text=Tool Registry', { timeout: 10000 });
  await page.waitForTimeout(1000);
  await screenshot(page, '04-tool-registry-admin.png');

  // 5. Approval Queue
  await page.goto('http://localhost:3201/approval-queue');
  await page.waitForSelector('text=Approval Queue', { timeout: 10000 });
  await screenshot(page, '05-approval-queue.png');

  // 6. Device Console
  await page.goto('http://localhost:3201/device-console');
  await page.waitForSelector('text=Device Console', { timeout: 10000 });
  await screenshot(page, '06-device-console.png');

  // 7. Model Usage
  await page.goto('http://localhost:3201/admin/model-usage');
  await page.waitForSelector('text=Model Usage', { timeout: 10000 });
  await screenshot(page, '07-model-usage.png');

  // 8. Call Console
  await page.goto('http://localhost:3201/call-console');
  await page.waitForTimeout(2000);
  await screenshot(page, '08-call-console.png');

  // 9. GDPR
  await page.goto('http://localhost:3201/gdpr');
  await page.waitForTimeout(2000);
  await screenshot(page, '09-gdpr-page.png');

  // 10. Viewer tool registry denied
  const page2 = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await login(page2, 'viewer@supportplane.local', 'supportplane-demo');
  await page2.goto('http://localhost:3201/tool-registry');
  await page2.waitForSelector('text=/Forbidden|403|Denied/i', { timeout: 10000 });
  await screenshot(page2, '10-viewer-tool-registry-denied.png');

  await browser.close();
  console.log('All screenshots captured to', outDir);
})();
