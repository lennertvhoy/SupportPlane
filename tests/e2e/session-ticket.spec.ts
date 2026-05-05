import { test, expect } from '@playwright/test';
import { login, assertNoConsoleErrors } from './helpers';

test.describe('Support Session + Ticket Context', () => {
  const sessionTitle = 'E2E Smoke Session';

  test('create session, select it, and load deterministic mock ticket context', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'operator@supportplane.local', 'supportplane-demo');

    // Create a new session via the "+ New" button in the sidebar
    await page.getByRole('button', { name: /New/i }).click();

    // Fill title in the inline form that appears
    const titleInput = page
      .locator('input[placeholder*="title" i], input[name*="title" i]')
      .first();
    await expect(titleInput).toBeVisible({ timeout: 5000 });
    await titleInput.fill(sessionTitle);

    // Click the primary Create button
    await page.locator('button', { hasText: /^Create$/i }).click();

    // Session list should contain our new session
    await expect(page.locator(`text=${sessionTitle}`).first()).toBeVisible({ timeout: 10000 });

    // Select the session — dashboard should not crash
    await page.locator(`text=${sessionTitle}`).first().click();
    await expect(page.locator(`text=${sessionTitle}`).first()).toBeVisible();

    // Load Zammad ticket context using the deterministic mock adapter
    // The E2E env sets ZAMMAD_CONNECTOR_MODE=mock so this uses fixture data without OpenBao
    // In mock mode the default ticket ID is TICKET-101
    const loadButton = page.locator('[data-testid="load-ticket-context"]').first();
    await expect(loadButton).toBeVisible();
    await loadButton.click();

    // Wait for mock ticket data to appear
    await expect(page.locator('text=Mock Connector Data').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Zammad ticket TICKET-101').first()).toBeVisible();

    // Verify no crash states
    await expect(page.locator('text=Something went wrong')).not.toBeVisible();

    await consoleMonitor.verify();
  });
});
