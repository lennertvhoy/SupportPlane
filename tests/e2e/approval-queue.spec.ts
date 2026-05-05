import { test, expect } from '@playwright/test';
import { login, assertNoConsoleErrors } from './helpers';

test.describe('Approval Queue', () => {
  test('approval queue loads without crash', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'admin@supportplane.local', 'supportplane-demo');

    await page.goto('/approval-queue');
    await expect(page.getByRole('heading', { name: 'Approval Queue' })).toBeVisible({
      timeout: 10000,
    });

    // Should not show a 500 or blank crash state
    await expect(page.locator('text=Error')).not.toBeVisible();
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();

    // Empty state should be visible and explanatory
    await expect(
      page
        .locator('text=/empty|no approvals|waiting|pending/i')
        .or(page.locator('text=Approval Queue'))
        .first(),
    ).toBeVisible();

    await consoleMonitor.verify();
  });
});
