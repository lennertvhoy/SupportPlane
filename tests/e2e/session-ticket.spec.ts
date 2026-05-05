import { test, expect } from '@playwright/test';
import { login, assertNoConsoleErrors } from './helpers';

test.describe('Support Session + Ticket Context', () => {
  test('create session and select it', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'operator@supportplane.local', 'supportplane-demo');

    // Create a new session via the "+ New" button in the sidebar
    await page.getByRole('button', { name: /New/i }).click();

    // Fill title in the inline form that appears
    const titleInput = page
      .locator('input[placeholder*="title" i], input[name*="title" i]')
      .first();
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    const sessionTitle = `E2E Smoke Session ${Date.now()}`;
    await titleInput.fill(sessionTitle);

    // Click the primary Create button
    await page.locator('button', { hasText: /^Create$/i }).click();

    // Session list should contain our new session
    await expect(page.locator(`text=${sessionTitle}`).first()).toBeVisible({ timeout: 10000 });

    // Select the session — dashboard should not crash
    await page.locator(`text=${sessionTitle}`).first().click();
    await expect(page.locator(`text=${sessionTitle}`).first()).toBeVisible();

    // Verify no crash states (allow connector config errors which are expected in E2E)
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();

    await consoleMonitor.verify();
  });
});
