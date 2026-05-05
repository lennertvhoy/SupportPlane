import { test, expect } from '@playwright/test';
import { login, assertNoConsoleErrors } from './helpers';

test.describe('Admin Dashboard', () => {
  test('admin can navigate to model usage without crash', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'admin@supportplane.local', 'supportplane-demo');

    await page.goto('/admin');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.getByRole('navigation').getByText('Model Usage')).toBeVisible();

    await page.getByRole('navigation').getByText('Model Usage').click();
    await expect(page.locator('text=Model Usage Log')).toBeVisible({ timeout: 10000 });

    // Verify no 500/crash state
    await expect(page.locator('text=Error')).not.toBeVisible();
    await expect(page.locator('text=500')).not.toBeVisible();

    await consoleMonitor.verify();
  });

  test('admin dashboard shows governance cards', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'admin@supportplane.local', 'supportplane-demo');

    await page.goto('/admin');
    await expect(page.getByRole('main').getByText('Policies').first()).toBeVisible();
    await expect(page.getByRole('main').getByText('Users').first()).toBeVisible();
    await expect(page.getByRole('main').getByText('Roles').first()).toBeVisible();
    await expect(page.getByRole('main').getByText('Audit Explorer').first()).toBeVisible();

    await consoleMonitor.verify();
  });
});
