const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.resolve(__dirname, '../output/playwright/session-119-bl083-oidc-login-completion');
if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

const API_BASE = 'http://localhost:4210';
const WEB_BASE = 'http://localhost:3300';
const KEYCLOAK_BASE = 'http://10.88.0.1:8080';

async function renderJsonProof(browserPage, title, data, filename) {
  const html = `<!doctype html><html><body style="background:#0f172a;color:#e2e8f0;font-family:monospace;padding:24px;"><h2>${title}</h2><pre>${JSON.stringify(data, null, 2).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`;
  await browserPage.goto(`data:text/html,${encodeURIComponent(html)}`);
  await browserPage.waitForTimeout(300);
  await browserPage.screenshot({ path: path.join(OUTPUT, filename), fullPage: true });
}

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1400 } });
  const page = await context.newPage();
  const proofPage = await context.newPage();

  // 1. API OIDC config endpoint proof
  const oidcConfigRes = await fetch(`${API_BASE}/auth/oidc/config`);
  const oidcConfig = await oidcConfigRes.json();
  await renderJsonProof(proofPage, 'API OIDC Config Endpoint', oidcConfig, '01-api-oidc-config.png');

  // 2. Web login page with Keycloak button and local auth fallback
  await page.goto(WEB_BASE);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT, '02-web-login-keycloak-button.png'), fullPage: true });

  // 3. Navigate to Keycloak login page via API redirect URL
  // We must call /auth/oidc/login IN the browser so the state cookie is set.
  const loginResponse = await page.goto(`${API_BASE}/auth/oidc/login`);
  const loginData = await loginResponse.json();
  await page.goto(loginData.redirectUrl);
  await page.waitForURL(/.*10\.88\.0\.1:8080.*/, { timeout: 10000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT, '03-keycloak-login-page.png'), fullPage: true });

  // 4. Log in as oidc-operator via Keycloak
  await page.fill('input[name="username"]', 'oidc-operator');
  await page.fill('input[name="password"]', 'supportplane-oidc-demo');
  await page.click('input[type="submit"]');
  // Wait for redirect back to SupportPlane
  try {
    await page.waitForURL(/.*localhost:3300.*/, { timeout: 15000 });
  } catch (e) {
    console.log('Timeout waiting for localhost:3300. Current URL:', page.url());
    await page.screenshot({ path: path.join(OUTPUT, '04-timeout-debug.png'), fullPage: true });
  }
  // Wait for identity to load
  await page.waitForSelector('text=Logout', { timeout: 10000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT, '04-post-oidc-cockpit.png'), fullPage: true });

  // 5. Identity pill showing OIDC auth mode
  const identityPill = page.locator('text=/OIDC/').first();
  if (await identityPill.isVisible().catch(() => false)) {
    await identityPill.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUTPUT, '05-oidc-identity-pill.png') });
  } else {
    await page.screenshot({ path: path.join(OUTPUT, '05-oidc-identity-pill.png') });
  }

  // 6. API /auth/me proof for OIDC identity
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { cookie: (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ') }
  });
  const meData = await meRes.json();
  await renderJsonProof(proofPage, 'API /auth/me — OIDC Identity', meData, '06-api-auth-me-oidc.png');

  // 7. Logout and return to login
  // Use first button since it's the Logout button in the header
  await page.locator('button').first().click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUTPUT, '07-post-logout-login-page.png'), fullPage: true });

  // 8. Local auth fallback still works (log in as admin so service account creation works)
  await page.waitForSelector('input[type="password"]', { timeout: 10000 });
  const inputs = page.locator('input');
  await inputs.nth(0).fill('dev-tenant');
  await inputs.nth(1).fill('admin@supportplane.local');
  await inputs.nth(2).fill('supportplane-demo');
  await page.click('text=Log in');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUTPUT, '08-local-auth-fallback-works.png'), fullPage: true });

  // 9. Service account token creation proof (via API with local auth cookies)
  // Use context.request so cookies are sent automatically across origins
  const saCreateRes = await context.request.post(`${API_BASE}/auth/service-accounts`, {
    data: { name: 'bl083-test-sa', description: 'BL-083 test', roles: ['viewer'] },
  });
  const saCreate = saCreateRes.ok() ? await saCreateRes.json() : { status: saCreateRes.status(), text: await saCreateRes.text() };
  await renderJsonProof(proofPage, 'Service Account Creation', saCreate, '09-service-account-create.png');

  let tokenCreate = { note: 'Skipped because SA creation failed' };
  if (saCreateRes.ok() && saCreate.id) {
    const tokenRes = await context.request.post(`${API_BASE}/auth/service-accounts/${saCreate.id}/tokens`, {
      data: { scopes: ['support_session:read'], ttlHours: 1 },
    });
    tokenCreate = tokenRes.ok() ? await tokenRes.json() : { status: tokenRes.status(), text: await tokenRes.text() };
  }
  await renderJsonProof(proofPage, 'Service Account Token Creation', { ...tokenCreate, tokenRedacted: tokenCreate.token ? '[REDACTED]' : undefined }, '10-service-account-token.png');

  // 11. Audit events proof showing OIDC login
  const auditRes = await context.request.get(`${API_BASE}/auth/audit-events`);
  const auditData = auditRes.ok() ? await auditRes.json() : { status: auditRes.status() };
  const oidcLogins = Array.isArray(auditData) ? auditData.filter(e => e.eventType === 'user_login' && e.metadata?.authMode === 'oidc').slice(0, 3) : [];
  await renderJsonProof(proofPage, 'Audit Events — OIDC Login Recorded', { oidcLogins, totalEvents: Array.isArray(auditData) ? auditData.length : 0 }, '11-audit-oidc-login.png');

  await browser.close();
  console.log(`BL-083 OIDC completion screenshots captured in ${OUTPUT}`);
  console.log(`Files: ${fs.readdirSync(OUTPUT).length}`);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
