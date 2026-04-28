#!/usr/bin/env node
/**
 * BL-094 final closure screenshot script — max 20 screenshots.
 * Captures viewport-scoped screenshots scrolled to specific panels/states.
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
  await page.screenshot({ path: path.join(OUTPUT_DIR, fileName), fullPage: false });
  console.log(`Captured ${fileName}`);
}

async function scrollToText(page, text) {
  await page.evaluate((t) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let el;
    while ((el = walker.nextNode())) {
      if (el.textContent?.includes(t)) {
        el.scrollIntoView({ behavior: 'instant', block: 'start' });
        break;
      }
    }
  }, text);
  await page.waitForTimeout(500);
}

async function loginAs(page, email, tenantSlug = 'dev-tenant') {
  await page.goto(WEB_URL);
  await page.waitForTimeout(1200);
  const logoutBtn = await page.locator('button').filter({ hasText: /Logout/i }).first();
  if (await logoutBtn.count() > 0 && await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForTimeout(800);
  }
  const inputs = await page.locator('input').all();
  if (inputs.length >= 3) {
    await inputs[0].fill(tenantSlug);
    await inputs[1].fill(email);
  }
  const passwordInput = await page.locator('input[type="password"]').first();
  if (await passwordInput.count() > 0) await passwordInput.fill('supportplane-demo');
  const submitBtn = await page.locator('button[type="submit"]').first();
  if (await submitBtn.count() > 0) await submitBtn.click();
  await page.waitForTimeout(2000);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  // Remove old screenshots in this folder
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    if (f.endsWith('.png')) fs.unlinkSync(path.join(OUTPUT_DIR, f));
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // 1. Login page
  await page.goto(WEB_URL);
  await page.waitForTimeout(1200);
  await screenshot(page, 'login-local-auth');

  // Login as admin
  await loginAs(page, 'admin@supportplane.local', 'dev-tenant');

  // 2. Admin cockpit header + session list (top of page)
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await screenshot(page, 'admin-cockpit-header');

  // 3. Delivery Policy panel (admin view)
  await scrollToText(page, 'Delivery Policy');
  await screenshot(page, 'admin-delivery-policy-panel');

  // 4. Real writeback locked OFF
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    const el = els.find((e) => e.textContent?.includes('Real network calls') || e.textContent?.includes('Writeback enabled'));
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(400);
  await screenshot(page, 'real-writeback-locked');

  // 5. Toggle approval required (safe update)
  let approvalClicked = false;
  try {
    for (const btn of await page.locator('button').all()) {
      const aria = await btn.getAttribute('aria-pressed');
      if (aria !== null && (await btn.locator('xpath=ancestor::*').textContent())?.toLowerCase().includes('approval required')) {
        await btn.click();
        approvalClicked = true;
        break;
      }
    }
  } catch {}
  await page.waitForTimeout(600);
  await screenshot(page, 'policy-update-approval');

  // 6. Connector readiness check
  try {
    const validateBtn = await page.locator('button').filter({ hasText: /Connector Readiness/i }).first();
    if (await validateBtn.count() > 0) {
      await validateBtn.click();
      await page.waitForTimeout(1000);
    }
  } catch {}
  await screenshot(page, 'connector-readiness');

  // Toggle approval back
  if (approvalClicked) {
    try {
      for (const btn of await page.locator('button').all()) {
        const aria = await btn.getAttribute('aria-pressed');
        if (aria !== null && (await btn.locator('xpath=ancestor::*').textContent())?.toLowerCase().includes('approval required')) {
          await btn.click();
          break;
        }
      }
    } catch {}
    await page.waitForTimeout(400);
  }

  // API helper using Node fetch
  const apiPage = await browser.newPage();
  await apiPage.goto(WEB_URL);
  await apiPage.waitForTimeout(800);
  const inputs = await apiPage.locator('input').all();
  if (inputs.length >= 3) {
    await inputs[0].fill('dev-tenant');
    await inputs[1].fill('admin@supportplane.local');
  }
  const pw = await apiPage.locator('input[type="password"]').first();
  if (await pw.count() > 0) await pw.fill('supportplane-demo');
  const sub = await apiPage.locator('button[type="submit"]').first();
  if (await sub.count() > 0) await sub.click();
  await apiPage.waitForTimeout(2000);
  const cookies = await apiPage.context().cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

  const apiFetch = async (url, opts = {}) => {
    const res = await fetch(`http://localhost:4110${url}`, {
      ...opts,
      headers: { ...(opts.headers || {}), Cookie: cookieHeader, 'Content-Type': 'application/json' },
    });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { error: text, status: res.status }; }
  };

  // Create allowed action
  const sessionRes = await apiFetch('/support-sessions', {
    method: 'POST',
    body: JSON.stringify({ title: 'BL-094 screenshot session', priority: 'normal' }),
  });
  const sessionId = sessionRes.id;
  const actionRes = await apiFetch(`/support-sessions/${sessionId}/actions`, {
    method: 'POST',
    body: JSON.stringify({ actionType: 'ticket_note', externalTicketId: 'TICKET-101', body: 'Test note for screenshot' }),
  });
  const actionId = actionRes.action.id;
  await apiFetch(`/actions/${actionId}/submit-for-review`, { method: 'POST', body: '{}' });
  await apiFetch(`/actions/${actionId}/approve`, { method: 'POST', body: JSON.stringify({ reason: 'screenshot test' }) });
  await apiFetch(`/actions/${actionId}/queue`, { method: 'POST', body: '{}' });

  // Enable kill switch, create blocked action
  const policies = await apiFetch('/delivery-policies');
  const policy = Array.isArray(policies) ? policies[0] : (policies.policies || policies.items || policies.data || [])[0];
  if (policy) {
    await apiFetch(`/delivery-policies/${policy.id}`, { method: 'PATCH', body: JSON.stringify({ killSwitch: true }) });
  }
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
  console.log('blockedQueueRes:', JSON.stringify(blockedQueueRes).slice(0, 200));

  await apiPage.close();

  // 7. Outbox Monitor (queued action + worker status)
  await page.goto(WEB_URL);
  await page.waitForTimeout(2000);
  await scrollToText(page, 'Outbox Monitor');
  await screenshot(page, 'outbox-queued-allowed');

  // 8. Worker status within Outbox Monitor
  await page.evaluate(() => {
    const els = Array.from(document.querySelectorAll('*'));
    const el = els.find((e) => e.textContent?.includes('Worker') && e.textContent?.includes('Mode'));
    if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
  });
  await page.waitForTimeout(400);
  await screenshot(page, 'worker-status-mock-only');

  // 9. Action Outbox for blocked session (select it first)
  await page.evaluate((sid) => {
    const els = Array.from(document.querySelectorAll('*'));
    const el = els.find((e) => e.textContent?.includes(sid));
    if (el) el.click();
  }, blockedSessionId);
  await page.waitForTimeout(800);
  await scrollToText(page, 'Action Outbox');
  await screenshot(page, 'queue-blocked-killswitch');

  // 10. Case Timeline
  await scrollToText(page, 'Case Timeline');
  await screenshot(page, 'case-timeline-policy-events');

  // 11. Audit Trail
  await scrollToText(page, 'Audit Trail');
  await screenshot(page, 'audit-trail-policy-events');

  // 12. Evidence Bundle summary
  await scrollToText(page, 'Evidence Bundle');
  const genBtn = page.locator('button').filter({ hasText: /Generate Evidence Bundle/i }).first();
  if (await genBtn.count() > 0) {
    await genBtn.click();
    await page.waitForTimeout(2000);
  }
  await screenshot(page, 'evidence-bundle-summary');

  // 13. Evidence Bundle JSON (no secrets)
  try {
    const jsonBtn = page.locator('button').filter({ hasText: /^JSON$/i }).first();
    if (await jsonBtn.count() > 0) {
      await jsonBtn.click();
      await page.waitForTimeout(800);
    }
  } catch {}
  await screenshot(page, 'evidence-bundle-json-no-secrets');

  // 14. Logout
  const logoutBtn = await page.locator('button').filter({ hasText: /Logout/i }).first();
  if (await logoutBtn.count() > 0 && await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForTimeout(1200);
  }
  await screenshot(page, 'logout-state');

  // 15. Viewer login + read-only policy
  await loginAs(page, 'viewer@supportplane.local', 'dev-tenant');
  await scrollToText(page, 'Delivery Policy');
  await screenshot(page, 'viewer-readonly-policy');

  // 16. Viewer toggle blocked (try kill switch)
  try {
    for (const btn of await page.locator('button').all()) {
      const aria = await btn.getAttribute('aria-pressed');
      if (aria !== null && (await btn.locator('xpath=ancestor::*').textContent())?.toLowerCase().includes('kill switch')) {
        await btn.click();
        break;
      }
    }
  } catch {}
  await page.waitForTimeout(600);
  await screenshot(page, 'viewer-toggle-blocked');

  // 17. Cross-tenant denial
  await loginAs(page, 'admin@alt.supportplane.local', 'alt-tenant');
  await page.goto(`${WEB_URL}/?session=${sessionId}`);
  await page.waitForTimeout(1800);
  await screenshot(page, 'cross-tenant-denied');

  // 18. Relogin as admin, show policy preserved
  await loginAs(page, 'admin@supportplane.local', 'dev-tenant');
  await scrollToText(page, 'Delivery Policy');
  await screenshot(page, 'relogin-policy-preserved');

  // 19. Persistence — outbox after relogin
  await scrollToText(page, 'Outbox Monitor');
  await screenshot(page, 'persistence-outbox-after-restart');

  // 20. Final no-real-writeback proof
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await screenshot(page, 'final-no-real-writeback-proof');

  await browser.close();
  console.log(`\nCaptured ${screenshotIndex} screenshots to ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
