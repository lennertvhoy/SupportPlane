import { test, expect } from '@playwright/test';
import { login, assertNoConsoleErrors } from './helpers';

test.describe('Tool Registry RBAC', () => {
  test('admin can view tool registry', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'admin@supportplane.local', 'supportplane-demo');

    await page.goto('/tool-registry');
    await expect(page.locator('text=Tool Registry')).toBeVisible();
    await expect(
      page.locator('text=Signed/local-verified fixed implementation tools only'),
    ).toBeVisible();

    // Tools should be visible (seeded manifest loads 7+ tools)
    await expect(
      page.locator('text=diagnostic.inventory').or(page.locator('text=Read-only')).first(),
    ).toBeVisible({ timeout: 10000 });

    await consoleMonitor.verify();
  });

  test('viewer is denied access to tool registry', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'viewer@supportplane.local', 'supportplane-demo');

    await page.goto('/tool-registry');

    // Should show forbidden/denied state rather than tool list
    const forbidden = page.locator('text=/Forbidden|403|Denied|forbidden/i');
    const noTools = page.locator('text=No tools loaded');
    await expect(forbidden.or(noTools).first()).toBeVisible({ timeout: 10000 });

    // Command templates should NOT be visible
    await expect(page.locator('text=diagnostic.inventory')).not.toBeVisible();

    await consoleMonitor.verify();
  });
});
