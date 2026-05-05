import { test, expect } from '@playwright/test';
import { login, assertNoConsoleErrors } from './helpers';

test.describe('Control Inventory / First-Tester Path', () => {
  test('viewer sees disabled create-session button with explanation', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'viewer@supportplane.local', 'supportplane-demo');

    // Viewer warning banner should be visible
    await expect(
      page.locator('text=Viewer role can inspect sessions but cannot create operator work'),
    ).toBeVisible();

    // The "+ New" button should be present in the session list header and disabled
    const newButton = page.locator('button', { hasText: 'New' }).first();
    await expect(newButton).toBeVisible();
    await expect(newButton).toBeDisabled();

    await consoleMonitor.verify();
  });

  test('operator can create a session', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'operator@supportplane.local', 'supportplane-demo');

    // Operator should see enabled create button
    const newButton = page.locator('button', { hasText: 'New' }).first();
    await expect(newButton).toBeVisible();
    await expect(newButton).toBeEnabled();

    // Create a session
    await newButton.click();
    await page.locator('input[placeholder*="title" i]').fill('E2E Control Test Session');
    await page.locator('button', { hasText: /Create/i }).click();

    // Session should appear in list
    await expect(page.locator('text=E2E Control Test Session').first()).toBeVisible();

    // Select the session from the sidebar list
    await page.locator('text=E2E Control Test Session').first().click();
    await expect(page.locator('text=E2E Control Test Session').first()).toBeVisible();

    await consoleMonitor.verify();
  });

  test('operator admin dashboard shows locked cards with Admin required label', async ({
    page,
  }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'operator@supportplane.local', 'supportplane-demo');

    await page.goto('/admin');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();

    // Policies card should be enabled (no lock)
    const main = page.locator('main');
    const policiesCard = main.locator('button').filter({ hasText: 'Policies' }).first();
    await expect(policiesCard).toBeVisible();
    await expect(policiesCard).toBeEnabled();

    // Other cards should show lock icon and "Admin required" text
    const lockedLabels = ['Users', 'Roles', 'Model Usage', 'Audit Explorer', 'GDPR', 'Connectors'];
    for (const label of lockedLabels) {
      const card = main.locator('button').filter({ hasText: label }).first();
      await expect(card).toBeVisible();
      await expect(card).toBeDisabled();
    }
    // At least one "Admin required" label should be visible
    await expect(page.locator('text=Admin required').first()).toBeVisible();

    await consoleMonitor.verify();
  });

  test('admin can navigate all admin cards and pages', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'admin@supportplane.local', 'supportplane-demo');

    await page.goto('/admin');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();

    // All cards should be enabled for admin (check in main area)
    const main = page.locator('main');
    const cards = [
      'Policies',
      'Users',
      'Roles',
      'Model Usage',
      'Audit Explorer',
      'GDPR',
      'Connectors',
    ];
    for (const label of cards) {
      const card = main.locator('button').filter({ hasText: label }).first();
      await expect(card).toBeVisible({ timeout: 5000 });
      await expect(card).toBeEnabled();
    }

    // Navigate to Users (stub page should load)
    await main.locator('button').filter({ hasText: 'Users' }).first().click();
    await expect(page.locator('text=Tenant user directory')).toBeVisible();
    await expect(page.locator('text=Full user management API is not yet wired')).toBeVisible();

    // Navigate to Roles (stub page should load)
    await page.goto('/admin/roles');
    await expect(page.locator('text=Tenant role definitions')).toBeVisible();
    await expect(page.locator('text=Full role management API is not yet wired')).toBeVisible();

    await consoleMonitor.verify();
  });

  test('tool registry viewer denial is clear and visually polished', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'viewer@supportplane.local', 'supportplane-demo');

    await page.goto('/tool-registry');
    await expect(page.locator('text=Tool Registry')).toBeVisible();

    // Should show clear forbidden message
    await expect(page.locator('text=Forbidden')).toBeVisible();
    await expect(page.locator('text=tool:read requires a higher role')).toBeVisible();

    await consoleMonitor.verify();
  });

  test('approval queue shows meaningful empty state', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'admin@supportplane.local', 'supportplane-demo');

    await page.goto('/approval-queue');
    await expect(page.locator('text=Approval Queue')).toBeVisible();

    // Should show empty state with clear messaging
    await expect(page.locator('text=No approval requests')).toBeVisible();

    await consoleMonitor.verify();
  });

  test('device console shows read-only policy boundary for viewer', async ({ page }) => {
    const consoleMonitor = await assertNoConsoleErrors(page);
    await login(page, 'viewer@supportplane.local', 'supportplane-demo');

    await page.goto('/device-console');
    await expect(page.locator('text=Device Console')).toBeVisible();

    // Viewer should see forbidden banner for tool access
    await expect(page.locator('text=Forbidden')).toBeVisible();
    await expect(page.locator('text=tool:read requires a higher role')).toBeVisible();

    await consoleMonitor.verify();
  });
});
