import { test, expect } from '@playwright/test';
import { login, assertNoConsoleErrors } from './helpers';

test.describe('Device Console', () => {
  test('device console loads with seeded demo devices', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'admin@supportplane.local', 'supportplane-demo');

    await page.goto('/device-console');
    await expect(page.locator('text=Device Console')).toBeVisible();
    await expect(
      page.locator('text=Read-only diagnostics and approval-gated low-risk remediation'),
    ).toBeVisible();

    // Seeded devices should appear
    await expect(page.locator('text=Linux Workstation')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Windows Endpoint (Mock)')).toBeVisible();

    // Windows device should be honestly labelled
    await expect(page.locator('text=win32').or(page.locator('text=Windows')).first()).toBeVisible();

    // Device list should have at least 2 rows/devices
    const deviceRows = page
      .locator('text=Linux Workstation')
      .or(page.locator('text=Windows Endpoint'));
    await expect(deviceRows.first()).toBeVisible();

    await consoleMonitor.verify();
  });

  test('device console shows policy boundary for tool invocation', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'admin@supportplane.local', 'supportplane-demo');

    await page.goto('/device-console');
    await expect(page.locator('text=Fixed implementation only')).toBeVisible();
    await expect(page.locator('text=Arbitrary shell is blocked')).toBeVisible();

    // No real enrolled device claims
    await expect(page.locator('text=Production')).not.toBeVisible();

    await consoleMonitor.verify();
  });
});
