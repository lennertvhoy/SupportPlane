import { Page, expect } from '@playwright/test';

export async function login(
  page: Page,
  email = 'operator@supportplane.local',
  password = 'supportplane-demo',
  tenantSlug = 'dev-tenant',
) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'SupportPlane' }).first()).toBeVisible();
  await expect(page.locator('text=or local auth')).toBeVisible();

  const tenantInput = page.getByLabel('Tenant');
  await tenantInput.fill(tenantSlug);

  const emailInput = page.getByLabel('Email');
  await emailInput.fill(email);

  const passwordInput = page.getByLabel('Password');
  await passwordInput.fill(password);

  await page.locator('button[type="submit"]', { hasText: /Log in/i }).click();
  // Wait for a dashboard-unique element to confirm login succeeded
  await expect(page.getByRole('button', { name: /New/i })).toBeVisible();
  // Brief pause to ensure the browser has processed the Set-Cookie header
  // before subsequent navigations that rely on the session cookie.
  await page.waitForTimeout(500);
}

export async function logout(page: Page) {
  await page.locator('button', { hasText: /Logout/i }).click();
  await expect(page.getByRole('heading', { name: 'SupportPlane' }).first()).toBeVisible();
  await expect(page.locator('button[type="submit"]', { hasText: /Log in/i })).toBeVisible();
}

export async function assertNoConsoleErrors(page: Page, allowedPatterns: RegExp[] = []) {
  const defaultAllowed = [
    /401 \(Unauthorized\)/,
    /403 \(Forbidden\)/,
    /Failed to load resource: the server responded with a status of 401/,
    /Failed to load resource: the server responded with a status of 403/,
  ];
  const allAllowed = [...defaultAllowed, ...allowedPatterns];
  const errors: string[] = [];
  page.on('pageerror', (err) => {
    const msg = err.message;
    if (allAllowed.some((p) => p.test(msg))) return;
    errors.push(`pageerror: ${msg}`);
  });
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (allAllowed.some((p) => p.test(text))) return;
      errors.push(`console.error: ${text}`);
    }
  });
  return {
    verify: async () => {
      await page.waitForTimeout(500);
      expect(errors).toEqual([]);
    },
  };
}
