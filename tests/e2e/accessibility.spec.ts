import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login } from './helpers';

test.describe('Accessibility / Axe', () => {
  test('login page has no critical or serious accessibility violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'SupportPlane' }).first()).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical',
    );
    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'serious',
    );

    expect(
      criticalViolations,
      `Expected 0 critical violations, found ${criticalViolations.length}: ${criticalViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
    expect(
      seriousViolations,
      `Expected 0 serious violations, found ${seriousViolations.length}: ${seriousViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
  });

  test('operator dashboard has no critical or serious accessibility violations', async ({
    page,
  }) => {
    await login(page, 'operator@supportplane.local', 'supportplane-demo');
    await expect(page.locator('text=DEV / MOCK DATA')).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical',
    );
    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'serious',
    );

    expect(
      criticalViolations,
      `Expected 0 critical violations, found ${criticalViolations.length}: ${criticalViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
    expect(
      seriousViolations,
      `Expected 0 serious violations, found ${seriousViolations.length}: ${seriousViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
  });

  test('tool registry viewer denied has no critical or serious accessibility violations', async ({
    page,
  }) => {
    await login(page, 'viewer@supportplane.local', 'supportplane-demo');
    await page.goto('/tool-registry');
    await expect(page.locator('text=/Forbidden|403|Denied/i').first()).toBeVisible({
      timeout: 10000,
    });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical',
    );
    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'serious',
    );

    expect(
      criticalViolations,
      `Expected 0 critical violations, found ${criticalViolations.length}: ${criticalViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
    expect(
      seriousViolations,
      `Expected 0 serious violations, found ${seriousViolations.length}: ${seriousViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
  });

  test('admin dashboard has no critical or serious accessibility violations', async ({ page }) => {
    await login(page, 'admin@supportplane.local', 'supportplane-demo');
    await page.goto('/admin');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical',
    );
    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'serious',
    );

    expect(
      criticalViolations,
      `Expected 0 critical violations, found ${criticalViolations.length}: ${criticalViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
    expect(
      seriousViolations,
      `Expected 0 serious violations, found ${seriousViolations.length}: ${seriousViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
  });

  test('model usage page has no critical or serious accessibility violations', async ({ page }) => {
    await login(page, 'admin@supportplane.local', 'supportplane-demo');
    await page.goto('/admin');
    await expect(page.locator('text=Admin Dashboard')).toBeVisible();
    await expect(page.getByRole('navigation').getByText('Model Usage')).toBeVisible();

    await page.getByRole('navigation').getByText('Model Usage').click();
    await expect(page.locator('text=Model Usage Log')).toBeVisible({ timeout: 10000 });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical',
    );
    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'serious',
    );

    expect(
      criticalViolations,
      `Expected 0 critical violations, found ${criticalViolations.length}: ${criticalViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
    expect(
      seriousViolations,
      `Expected 0 serious violations, found ${seriousViolations.length}: ${seriousViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
  });

  test('approval queue has no critical or serious accessibility violations', async ({ page }) => {
    await login(page, 'admin@supportplane.local', 'supportplane-demo');
    await page.goto('/approval-queue');
    await expect(page.getByRole('heading', { name: 'Approval Queue' })).toBeVisible({
      timeout: 10000,
    });

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical',
    );
    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'serious',
    );

    expect(
      criticalViolations,
      `Expected 0 critical violations, found ${criticalViolations.length}: ${criticalViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
    expect(
      seriousViolations,
      `Expected 0 serious violations, found ${seriousViolations.length}: ${seriousViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
  });

  test('device console has no critical or serious accessibility violations', async ({ page }) => {
    await login(page, 'admin@supportplane.local', 'supportplane-demo');
    await page.goto('/device-console');
    await expect(page.locator('text=Device Console')).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical',
    );
    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'serious',
    );

    expect(
      criticalViolations,
      `Expected 0 critical violations, found ${criticalViolations.length}: ${criticalViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
    expect(
      seriousViolations,
      `Expected 0 serious violations, found ${seriousViolations.length}: ${seriousViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
  });

  test('session with ticket context has no critical or serious accessibility violations', async ({
    page,
  }) => {
    const sessionTitle = 'Axe Accessibility Session';
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

    // Select the session
    await page.locator(`text=${sessionTitle}`).first().click();
    await expect(page.locator(`text=${sessionTitle}`).first()).toBeVisible();

    // Load ticket context
    const loadButton = page.locator('[data-testid="load-ticket-context"]').first();
    await expect(loadButton).toBeVisible();
    await loadButton.click();

    // Wait for mock ticket data to appear
    await expect(page.locator('text=Mock Connector Data').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Zammad ticket TICKET-101').first()).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical',
    );
    const seriousViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'serious',
    );

    expect(
      criticalViolations,
      `Expected 0 critical violations, found ${criticalViolations.length}: ${criticalViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
    expect(
      seriousViolations,
      `Expected 0 serious violations, found ${seriousViolations.length}: ${seriousViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
  });
});
