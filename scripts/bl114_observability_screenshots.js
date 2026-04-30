const { chromium } = require('playwright');
const path = require('path');

const WEB_URL = process.env.WEB_URL || 'http://localhost:3300';
const OUT_DIR = process.env.OUT_DIR || 'output/playwright/session-114-bl114-observability-baseline';

async function loginIfNeeded(page) {
  await page.goto(WEB_URL, { waitUntil: 'networkidle' });
  const loginButton = page.getByRole('button', { name: /log in/i });
  if (await loginButton.isVisible().catch(() => false)) {
    await loginButton.click();
    await page.waitForLoadState('networkidle');
  }
}

async function screenshotLocator(page, locator, fileName) {
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await locator.screenshot({ path: path.join(OUT_DIR, fileName) });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  try {
    await loginIfNeeded(page);
    await page.getByText('Local Observability', { exact: true }).waitFor({ timeout: 30000 });

    const observabilityPanel = page.getByTestId('observability-overview');
    await screenshotLocator(page, observabilityPanel, '12-ui-observability-overview-proof.png');

    const correlationPanel = page.getByTestId('observability-correlation-summary');
    await screenshotLocator(page, correlationPanel, '13-ui-correlation-drilldown-proof.png');

    const sandboxPanel = page.getByTestId('observability-worker-writeback');
    await screenshotLocator(page, sandboxPanel, '14-ui-sandbox-writeback-observability-proof.png');
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
