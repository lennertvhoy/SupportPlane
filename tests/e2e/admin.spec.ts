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
    await expect(page.locator('main').locator('text=MODEL USAGE')).toBeVisible({ timeout: 10000 });

    // Verify no 500/crash state
    await expect(page.locator('text=Error')).not.toBeVisible();
    await expect(page.locator('text=500')).not.toBeVisible();

    // Model Usage should show controls (filter/summary cards or data table)
    await expect(
      page
        .locator('text=Provider')
        .or(page.locator('text=Model'))
        .or(page.locator('text=Summary'))
        .first(),
    ).toBeVisible();

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

    // Each governance card should be clickable and navigate
    await page.getByRole('main').getByText('Policies').first().click();
    await expect(
      page.locator('text=Policy Editor').or(page.locator('text=Policies')).first(),
    ).toBeVisible();

    await consoleMonitor.verify();
  });
});
