const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.resolve(__dirname, '../output/playwright/session-119-bl083-oidc-login-completion');
if (!fs.existsSync(OUTPUT)) fs.mkdirSync(OUTPUT, { recursive: true });

const API_BASE = 'http://localhost:4210';
const WEB_BASE = 'http://localhost:3300';
const KEYCLOAK_BASE = 'http://localhost:8082';

async function renderJsonProof(page, title, data, filename) {
  const html = `<!doctype html><html><body style="background:#0f172a;color:#e2e8f0;font-family:monospace;padding:24px;"><h2>${title}</h2><pre>${JSON.stringify(data, null, 2).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre></body></html>`;
  await page.goto(`data:text/html,${encodeURIComponent(html)}`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(OUTPUT, filename), fullPage: true });
}

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1400 } });
  const page = await context.newPage();

  // 1. API OIDC config endpoint proof
  const oidcConfigRes = await fetch(`${API_BASE}/auth/oidc/config`);
  const oidcConfig = await oidcConfigRes.json();
  await renderJsonProof(page, 'API OIDC Config Endpoint', oidcConfig, '01-api-oidc-config.png');

  // 2. Web login page with Keycloak button and local auth fallback
  await page.goto(WEB_BASE);
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT, '02-web-login-keycloak-button.png'), fullPage: true });

  // 3. Click Keycloak login, reach Keycloak login page
  await page.click('text=Continue with Keycloak');
  await page.waitForURL(/.*localhost:8082.*/, { timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUTPUT, '03-keycloak-login-page.png'), fullPage: true });

  // 4. Log in as oidc-operator via Keycloak
  await page.fill('input[name="username"]', 'oidc-operator');
  await page.fill('input[name="password"]', 'supportplane-oidc-demo');
  await page.click('input[type="submit"]');
  // Wait for redirect back to SupportPlane
  await page.waitForURL(/.*localhost:3300.*/, { timeout: 15000 });
  await page.waitForTimeout(2500);
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
  await renderJsonProof(page, 'API /auth/me — OIDC Identity', meData, '06-api-auth-me-oidc.png');

  // 7. Logout and return to login
  await page.click('text=Logout');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(OUTPUT, '07-post-logout-login-page.png'), fullPage: true });

  // 8. Local auth fallback still works
  await page.fill('input[type="text"]', 'dev-tenant');
  const inputs = await page.locator('input').all();
  // Find email and password inputs
  for (const input of inputs) {
    const type = await input.getAttribute('type');
    if (type === 'text') {
      const val = await input.inputValue();
      if (val === 'dev-tenant') continue;
      await input.fill('operator@supportplane.local');
      break;
    }
  }
  await page.fill('input[type="password"]', 'supportplane-demo');
  await page.click('text=Log in');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.join(OUTPUT, '08-local-auth-fallback-works.png'), fullPage: true });

  // 9. Service account token creation proof (via API with local auth cookies)
  const localCookies = (await context.cookies()).map(c => `${c.name}=${c.value}`).join('; ');
  const saCreateRes = await fetch(`${API_BASE}/auth/service-accounts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', cookie: localCookies },
    body: JSON.stringify({ name: 'bl083-test-sa', description: 'BL-083 test', roles: ['viewer'] }),
  });
  const saCreate = saCreateRes.ok ? await saCreateRes.json() : { status: saCreateRes.status, text: await saCreateRes.text() };
  await renderJsonProof(page, 'Service Account Creation', saCreate, '09-service-account-create.png');

  let tokenCreate = { note: 'Skipped because SA creation failed' };
  if (saCreateRes.ok && saCreate.id) {
    const tokenRes = await fetch(`${API_BASE}/auth/service-accounts/${saCreate.id}/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', cookie: localCookies },
      body: JSON.stringify({ scopes: ['support_session:read'], ttlHours: 1 }),
    });
    tokenCreate = tokenRes.ok ? await tokenRes.json() : { status: tokenRes.status, text: await tokenRes.text() };
  }
  await renderJsonProof(page, 'Service Account Token Creation', { ...tokenCreate, tokenRedacted: tokenCreate.token ? '[REDACTED]' : undefined }, '10-service-account-token.png');

  // 11. Audit events proof showing OIDC login
  const auditRes = await fetch(`${API_BASE}/auth/audit-events`, {
    headers: { cookie: localCookies },
  });
  const auditData = auditRes.ok ? await auditRes.json() : { status: auditRes.status };
  const oidcLogins = Array.isArray(auditData) ? auditData.filter(e => e.eventType === 'user_login' && e.metadata?.authMode === 'oidc').slice(0, 3) : [];
  await renderJsonProof(page, 'Audit Events — OIDC Login Recorded', { oidcLogins, totalEvents: Array.isArray(auditData) ? auditData.length : 0 }, '11-audit-oidc-login.png');

  await browser.close();
  console.log(`BL-083 OIDC completion screenshots captured in ${OUTPUT}`);
  console.log(`Files: ${fs.readdirSync(OUTPUT).length}`);
}

capture().catch((err) => {
  console.error(err);
  process.exit(1);
});
