import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { login } from './helpers';

test.describe('Accessibility / Axe', () => {
  test('login page has no critical accessibility violations', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'SupportPlane' }).first()).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical',
    );

    expect(
      criticalViolations,
      `Expected 0 critical violations, found ${criticalViolations.length}: ${criticalViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
  });

  test('operator dashboard has no critical accessibility violations', async ({ page }) => {
    await login(page, 'operator@supportplane.local', 'supportplane-demo');
    await expect(page.locator('text=DEV / MOCK DATA')).toBeVisible();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical',
    );

    expect(
      criticalViolations,
      `Expected 0 critical violations, found ${criticalViolations.length}: ${criticalViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
  });

  test('tool registry viewer denied has no critical accessibility violations', async ({ page }) => {
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

    expect(
      criticalViolations,
      `Expected 0 critical violations, found ${criticalViolations.length}: ${criticalViolations.map((v) => v.description).join(', ')}`,
    ).toHaveLength(0);
  });
});
