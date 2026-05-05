const { chromium } = require('playwright');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '../output/playwright/session-168-first-tester-control-visual-ci');

async function login(page, email, password) {
  await page.context().clearCookies();
  await page.goto('http://localhost:3200/');
  await page.waitForSelector('text=or local auth', { timeout: 10000 });
  await page.getByLabel('Tenant').fill('dev-tenant');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForSelector('text=Sessions', { timeout: 10000 });
  await page.waitForTimeout(500);
}

async function capture(page, name) {
  const filePath = path.join(OUTPUT_DIR, name);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log('Captured:', filePath);
}

(async () => {
  const fs = require('fs');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });

  // 1. Login page
  {
    const page = await context.newPage();
    await page.goto('http://localhost:3200/');
    await page.waitForSelector('text=SupportPlane', { timeout: 10000 });
    await capture(page, '01-login-page.png');
    await page.close();
  }

  // 2. Operator dashboard
  {
    const page = await context.newPage();
    await login(page, 'operator@supportplane.local', 'supportplane-demo');
    await capture(page, '02-operator-dashboard.png');
    await page.close();
  }

  // 3. Session with ticket context
  {
    const page = await context.newPage();
    await login(page, 'operator@supportplane.local', 'supportplane-demo');
    // Create and select a session, load ticket
    await page.locator('button', { hasText: 'New' }).first().click();
    await page.locator('input[placeholder*="title" i]').fill('Screenshot Session');
    await page.locator('button', { hasText: /^Create$/i }).click();
    await page.waitForSelector('text=Screenshot Session', { timeout: 10000 });
    await page.locator('text=Screenshot Session').first().click();
    // Click Load Ticket for Zammad
    await page.locator('[data-testid="load-ticket-context"]').first().click();
    await page.waitForTimeout(1500);
    await capture(page, '03-session-with-ticket-context.png');
    await page.close();
  }

  // 4. New session flow
  {
    const page = await context.newPage();
    await login(page, 'operator@supportplane.local', 'supportplane-demo');
    await page.locator('button', { hasText: 'New' }).first().click();
    await page.waitForTimeout(300);
    await capture(page, '04-new-session-flow.png');
    await page.close();
  }

  // 5. Admin dashboard (admin view)
  {
    const page = await context.newPage();
    await login(page, 'admin@supportplane.local', 'supportplane-demo');
    await page.goto('http://localhost:3200/admin');
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });
    await capture(page, '05-admin-dashboard-admin-view.png');
    await page.close();
  }

  // 6. Admin dashboard (operator view - locked cards)
  {
    const page = await context.newPage();
    await login(page, 'operator@supportplane.local', 'supportplane-demo');
    await page.goto('http://localhost:3200/admin');
    await page.waitForSelector('text=Admin Dashboard', { timeout: 10000 });
    await capture(page, '06-admin-dashboard-operator-view.png');
    await page.close();
  }

  // 7. Model Usage
  {
    const page = await context.newPage();
    await login(page, 'admin@supportplane.local', 'supportplane-demo');
    await page.goto('http://localhost:3200/admin/model-usage');
    await page.waitForSelector('text=MODEL USAGE', { timeout: 10000 });
    await capture(page, '07-model-usage.png');
    await page.close();
  }

  // 8. Tool Registry admin
  {
    const page = await context.newPage();
    await login(page, 'admin@supportplane.local', 'supportplane-demo');
    await page.goto('http://localhost:3200/tool-registry');
    await page.waitForSelector('text=Tool Registry', { timeout: 10000 });
    await capture(page, '08-tool-registry-admin.png');
    await page.close();
  }

  // 9. Tool Registry viewer denied
  {
    const page = await context.newPage();
    await login(page, 'viewer@supportplane.local', 'supportplane-demo');
    await page.goto('http://localhost:3200/tool-registry');
    await page.waitForSelector('text=Forbidden', { timeout: 10000 });
    await capture(page, '09-tool-registry-viewer-denied.png');
    await page.close();
  }

  // 10. Approval Queue empty state
  {
    const page = await context.newPage();
    await login(page, 'admin@supportplane.local', 'supportplane-demo');
    await page.goto('http://localhost:3200/approval-queue');
    await page.waitForSelector('text=Approval Queue', { timeout: 10000 });
    await capture(page, '10-approval-queue-empty-state.png');
    await page.close();
  }

  // 11. Device Console viewer boundary
  {
    const page = await context.newPage();
    await login(page, 'viewer@supportplane.local', 'supportplane-demo');
    await page.goto('http://localhost:3200/device-console');
    await page.waitForSelector('text=Device Console', { timeout: 10000 });
    await capture(page, '11-device-console-viewer-boundary.png');
    await page.close();
  }

  // 12. Users stub page
  {
    const page = await context.newPage();
    await login(page, 'admin@supportplane.local', 'supportplane-demo');
    await page.goto('http://localhost:3200/admin/users');
    await page.waitForSelector('text=Tenant user directory', { timeout: 10000 });
    await capture(page, '12-admin-users-stub-page.png');
    await page.close();
  }

  await browser.close();
  console.log('All screenshots captured to', OUTPUT_DIR);
})();
