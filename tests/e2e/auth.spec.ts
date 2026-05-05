import { test, expect } from '@playwright/test';
import { login, assertNoConsoleErrors } from './helpers';

test.describe('Auth / Login', () => {
  test('login page renders with sandbox boundary', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await page.goto('/');

    await expect(page.getByRole('heading', { name: 'SupportPlane' }).first()).toBeVisible();
    await expect(page.locator('text=local development sandbox')).toBeVisible();
    await expect(page.locator('text=No production data')).toBeVisible();
    await expect(page.locator('text=or local auth')).toBeVisible();
    await expect(page.locator('input[value="dev-tenant"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]', { hasText: /Log in/i })).toBeVisible();

    await consoleMonitor.verify();
  });

  test('operator login → dashboard loads', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'operator@supportplane.local', 'supportplane-demo');

    await expect(page.locator('text=DEV / MOCK DATA')).toBeVisible();
    await expect(page.locator('text=Sandbox Demo')).toBeVisible();
    await expect(page.locator('text=Demo Operator')).toBeVisible();
    await expect(page.locator('text=Acme Support Demo')).toBeVisible();

    // Operator should see session list and be able to create sessions
    await expect(page.getByRole('button', { name: /New/i })).toBeVisible();

    await consoleMonitor.verify();
  });

  test('admin login → dashboard loads with admin link', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'admin@supportplane.local', 'supportplane-demo');

    await expect(page.locator('text=Demo Admin')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Admin' })).toBeVisible();

    // Admin should also see the session list
    await expect(page.getByRole('button', { name: /New/i })).toBeVisible();

    await consoleMonitor.verify();
  });
});
