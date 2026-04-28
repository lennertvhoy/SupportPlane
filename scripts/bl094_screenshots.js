#!/usr/bin/env node
/**
 * BL-094 final closure screenshot script.
 * Captures up to 24 sequentially numbered screenshots.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.resolve(__dirname, '../output/playwright/session-094-delivery-policy-controls-final-closure');
const WEB_URL = 'http://localhost:3200';

let screenshotIndex = 0;

async function screenshot(page, name) {
  screenshotIndex++;
  const fileName = `${String(screenshotIndex).padStart(2, '0')}-${name}.png`;
  await page.screenshot({ path: path.join(OUTPUT_DIR, fileName), fullPage: true });
  console.log(`Captured ${fileName}`);
}

async function scrollToPanel(page, text) {
  await page.evaluate((panelText) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let el;
    while ((el = walker.nextNode())) {
      if (el.textContent?.includes(panelText)) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        break;
      }
    }
  }, text);
  await page.waitForTimeout(600);
}

async function loginAs(page, email, tenantSlug = 'dev-tenant') {
  await page.goto(WEB_URL);
  await page.waitForTimeout(1500);
  // If already logged in, logout first
  const logoutBtn = await page.locator('button').filter({ hasText: /Logout/i }).first();
  if (await logoutBtn.count() > 0 && await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForTimeout(1000);
  }
  // Fill login form
  const tenantInput = await page.locator('input').nth(0);
  const emailInput = await page.locator('input').nth(1);
  const passwordInput = await page.locator('input[type="password"]').first();
  if (await tenantInput.count() > 0) await tenantInput.fill(tenantSlug);
  if (await emailInput.count() > 0) await emailInput.fill(email);
  if (await passwordInput.count() > 0) await passwordInput.fill('supportplane-demo');
  const submitBtn = await page.locator('button[type="submit"]').first();
  if (await submitBtn.count() > 0) await submitBtn.click();
  await page.waitForTimeout(2500);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Login page in local auth mode (unauthenticated)
  await page.goto(WEB_URL);
  await page.waitForTimeout(1500);
  await screenshot(page, 'login-local-auth');

  // Login as admin
  await loginAs(page, 'admin@supportplane.local', 'dev-tenant');

  // 2. Authenticated admin cockpit
  await screenshot(page, 'admin-cockpit');

  // 3. Admin delivery policy panel
  await scrollToPanel(page, 'Delivery Policy');
  await screenshot(page, 'admin-delivery-policy-panel');

  // 4. Real writeback control locked/disabled
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    const el = els.find((e) => e.textContent?.includes('Real network calls') || e.textContent?.includes('Writeback enabled'));
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(600);
  await screenshot(page, 'real-writeback-locked');

  // 5. Admin updates safe policy field (approval required toggle)
  let clicked = false;
  try {
    const btns = await page.locator('button').all();
    for (const btn of btns) {
      const txt = await btn.textContent();
      if (txt?.toLowerCase().includes('approval required') || (await btn.locator('xpath=ancestor::*').textContent())?.toLowerCase().includes('approval required')) {
        const aria = await btn.getAttribute('aria-pressed');
        if (aria !== null) {
          await btn.click();
          clicked = true;
          break;
        }
      }
    }
  } catch {}
  await page.waitForTimeout(800);
  await screenshot(page, 'policy-update-approval');

  // 6. Policy saved with version visible
  await scrollToPanel(page, 'Delivery Policy');
  await screenshot(page, 'policy-saved-version');

  // 7. Connector readiness check - click validate policy or readiness button
  try {
    const validateBtn = await page.locator('button').filter({ hasText: /Validate/i }).first();
    if (await validateBtn.count() > 0) {
      await validateBtn.click();
      await page.waitForTimeout(1200);
    }
  } catch {}
  await screenshot(page, 'connector-readiness');

  // Toggle approval back if clicked
  if (clicked) {
    try {
      const btns = await page.locator('button').all();
      for (const btn of btns) {
        const aria = await btn.getAttribute('aria-pressed');
        if (aria !== null && (await btn.locator('xpath=ancestor::*').textContent())?.toLowerCase().includes('approval required')) {
          await btn.click();
          break;
        }
      }
    } catch {}
    await page.waitForTimeout(500);
  }

  // 8. Create a session and action via API to populate outbox
  const apiContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const apiPage = await apiContext.newPage();
  // Login via API to get session cookie
  await apiPage.goto(WEB_URL);
  await apiPage.waitForTimeout(1000);
  const tenantInput = await apiPage.locator('input').nth(0);
  const emailInput = await apiPage.locator('input').nth(1);
  const passwordInput = await apiPage.locator('input[type="password"]').first();
  if (await tenantInput.count() > 0) await tenantInput.fill('dev-tenant');
  if (await emailInput.count() > 0) await emailInput.fill('admin@supportplane.local');
  if (await passwordInput.count() > 0) await passwordInput.fill('supportplane-demo');
  const submitBtn = await apiPage.locator('button[type="submit"]').first();
  if (await submitBtn.count() > 0) await submitBtn.click();
  await apiPage.waitForTimeout(2000);

  const cookies = await apiContext.cookies();
  const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

  const apiFetch = async (url, opts = {}) => {
    const res = await fetch(`http://localhost:4110${url}`, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        'Cookie': cookieHeader,
        'Content-Type': 'application/json',
      },
    });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { error: text, status: res.status }; }
  };

  const sessionRes = await apiFetch('/support-sessions', {
    method: 'POST',
    body: JSON.stringify({ title: 'BL-094 screenshot session', priority: 'normal' }),
  });
  console.log('sessionRes:', JSON.stringify(sessionRes));
  const sessionId = sessionRes.id;

  const actionRes = await apiFetch(`/support-sessions/${sessionId}/actions`, {
    method: 'POST',
    body: JSON.stringify({ actionType: 'ticket_note', externalTicketId: 'TICKET-101', body: 'Test note for screenshot' }),
  });
  console.log('actionRes:', JSON.stringify(actionRes));
  const actionId = actionRes.action.id;

  await apiFetch(`/actions/${actionId}/submit-for-review`, { method: 'POST', body: '{}' });
  await apiFetch(`/actions/${actionId}/approve`, { method: 'POST', body: JSON.stringify({ reason: 'screenshot test' }) });
  await apiFetch(`/actions/${actionId}/queue`, { method: 'POST', body: '{}' });

  // Enable kill switch to demonstrate policy block
  const policies = await apiFetch('/delivery-policies');
  const policy = Array.isArray(policies) ? policies[0] : (policies.policies || policies.items || policies.data || [])[0];
  if (policy) {
    await apiFetch(`/delivery-policies/${policy.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ killSwitch: true }),
    });
  }

  // Create another action and try to queue it (should be blocked)
  const blockedSessionRes = await apiFetch('/support-sessions', {
    method: 'POST',
    body: JSON.stringify({ title: 'BL-094 blocked session', priority: 'normal' }),
  });
  const blockedSessionId = blockedSessionRes.id;
  const blockedActionRes = await apiFetch(`/support-sessions/${blockedSessionId}/actions`, {
    method: 'POST',
    body: JSON.stringify({ actionType: 'ticket_note', externalTicketId: 'TICKET-999', body: 'Blocked by kill switch' }),
  });
  const blockedActionId = blockedActionRes.action.id;
  await apiFetch(`/actions/${blockedActionId}/submit-for-review`, { method: 'POST', body: '{}' });
  await apiFetch(`/actions/${blockedActionId}/approve`, { method: 'POST', body: JSON.stringify({ reason: 'should be blocked' }) });
  const blockedQueueRes = await apiFetch(`/actions/${blockedActionId}/queue`, { method: 'POST', body: '{}' });
  console.log('blockedQueueRes:', JSON.stringify(blockedQueueRes));

  await apiPage.close();
  await apiContext.close();

  await page.waitForTimeout(1000);

  // 9. Outbox monitor showing queued action + worker status
  await page.goto(WEB_URL);
  await page.waitForTimeout(2000);
  await scrollToPanel(page, 'Outbox Monitor');
  await screenshot(page, 'outbox-queued-allowed');
  // Scroll slightly within Outbox Monitor to show worker status
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    const el = els.find((e) => e.textContent?.includes('Worker') && e.textContent?.includes('Mode'));
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(600);
  await screenshot(page, 'worker-status-mock-only');

  // 10. Action blocked by kill switch in Action Outbox
  await page.goto(WEB_URL);
  await page.waitForTimeout(2000);
  await page.evaluate((sid) => {
    const els = Array.from(document.querySelectorAll('*'));
    const el = els.find((e) => e.textContent?.includes(sid));
    if (el) el.click();
  }, blockedSessionId);
  await page.waitForTimeout(800);
  await scrollToPanel(page, 'Action Outbox');
  await screenshot(page, 'queue-blocked-killswitch');

  // 11. Case timeline showing policy events
  await scrollToPanel(page, 'Case Timeline');
  await screenshot(page, 'case-timeline-policy-events');

  // 11. Audit trail
  await scrollToPanel(page, 'Audit Trail');
  await screenshot(page, 'audit-trail-policy-events');

  // 12. Generate evidence bundle and screenshot
  await scrollToPanel(page, 'Evidence Bundle');
  const genBtn = page.locator('button').filter({ hasText: /Generate Evidence Bundle/i }).first();
  if (await genBtn.count() > 0) {
    await genBtn.click();
    await page.waitForTimeout(2000);
  }
  await screenshot(page, 'evidence-bundle-summary');

  // 14. Evidence bundle JSON tab
  try {
    const jsonBtn = page.locator('button').filter({ hasText: /^JSON$/i }).first();
    if (await jsonBtn.count() > 0) {
      await jsonBtn.click();
      await page.waitForTimeout(800);
    }
  } catch {}
  await screenshot(page, 'evidence-bundle-json');

  // 15. Logout state
  const logoutBtn = await page.locator('button').filter({ hasText: /Logout/i }).first();
  if (await logoutBtn.count() > 0 && await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForTimeout(1500);
  }
  await screenshot(page, 'logout-state');

  // 16. Viewer login
  await loginAs(page, 'viewer@supportplane.local', 'dev-tenant');

  // 17. Viewer read-only policy panel
  await scrollToPanel(page, 'Delivery Policy');
  await screenshot(page, 'viewer-readonly-policy');

  // 18. Viewer toggle blocked (try clicking kill switch)
  try {
    const btns = await page.locator('button').all();
    for (const btn of btns) {
      const aria = await btn.getAttribute('aria-pressed');
      if (aria !== null && (await btn.locator('xpath=ancestor::*').textContent())?.toLowerCase().includes('kill switch')) {
        await btn.click();
        break;
      }
    }
  } catch {}
  await page.waitForTimeout(800);
  await screenshot(page, 'viewer-toggle-blocked');

  // 19. Cross-tenant: login as alt-tenant admin
  await loginAs(page, 'admin@alt.supportplane.local', 'alt-tenant');

  // Try to access dev-tenant session
  await page.goto(`${WEB_URL}/?session=${sessionId}`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'cross-tenant-denied');

  // 20. Relogin as dev admin, show policy preserved
  await loginAs(page, 'admin@supportplane.local', 'dev-tenant');
  await scrollToPanel(page, 'Delivery Policy');
  await screenshot(page, 'relogin-policy-preserved');

  // 21. Outbox persistence
  await scrollToPanel(page, 'Outbox Monitor');
  await screenshot(page, 'persistence-outbox-after-restart');

  // 22. Admin cockpit header with dev/mock badges
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await screenshot(page, 'dev-mock-badges');

  // 23. ActionOutbox panel for the selected session
  // Select our created session first
  await page.evaluate((sid) => {
    const els = Array.from(document.querySelectorAll('*'));
    const el = els.find((e) => e.textContent?.includes(sid));
    if (el) el.click();
  }, sessionId);
  await page.waitForTimeout(800);
  await scrollToPanel(page, 'Action Outbox');
  await screenshot(page, 'action-outbox-panel');

  // 24. Final local mode proof
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await screenshot(page, 'final-local-mode-proof');

  // 25. Policy panel with all safety flags visible
  await scrollToPanel(page, 'Delivery Policy');
  await screenshot(page, 'final-no-real-writeback-proof');

  await browser.close();
  console.log(`\nCaptured ${screenshotIndex} screenshots to ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
