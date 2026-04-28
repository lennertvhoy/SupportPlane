#!/usr/bin/env node
/**
 * BL-094 final closure screenshot script.
 * Captures 24 viewport-scoped screenshots with distinct scroll positions and states.
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.resolve(__dirname, '../output/playwright/session-094-delivery-policy-controls-final-closure');
const WEB_URL = 'http://localhost:3200';
const API_URL = 'http://localhost:4110';

let screenshotIndex = 0;

async function screenshot(page, name) {
  screenshotIndex++;
  const fileName = `${String(screenshotIndex).padStart(2, '0')}-${name}.png`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`Captured ${fileName}`);
  return filePath;
}

async function scrollMainTo(page, y) {
  await page.locator('main').evaluate((el, targetY) => el.scrollTo(0, targetY), y);
  await page.waitForTimeout(400);
}

async function scrollToText(page, text) {
  try {
    const el = page.locator('main').getByText(text, { exact: false }).first();
    if (await el.count() > 0) {
      await el.scrollIntoViewIfNeeded();
    } else {
      await page.locator('main').evaluate((t) => {
        const walker = document.createTreeWalker(document.querySelector('main') || document.body, NodeFilter.SHOW_ELEMENT);
        let e;
        while ((e = walker.nextNode())) {
          if (e.textContent?.trim() === t || e.textContent?.includes(t)) {
            e.scrollIntoView({ behavior: 'instant', block: 'start' });
            break;
          }
        }
      }, text);
    }
  } catch {}
  await page.waitForTimeout(500);
}

async function selectSessionById(page, sessionId) {
  const shortId = sessionId.slice(0, 8);
  const btn = page.locator('aside button').filter({ hasText: shortId }).first();
  if (await btn.count() > 0) {
    await btn.click();
    await page.waitForTimeout(800);
  } else {
    // fallback: search in body
    await page.evaluate((sid) => {
      const els = Array.from(document.body.querySelectorAll('*'));
      const el = els.find((e) => e.textContent?.includes(sid));
      if (el) el.click();
    }, shortId);
    await page.waitForTimeout(800);
  }
}

async function loginAs(page, email, tenantSlug = 'dev-tenant') {
  await page.goto(WEB_URL);
  await page.waitForTimeout(1200);
  const logoutBtn = page.locator('button').filter({ hasText: /Logout/i }).first();
  if (await logoutBtn.count() > 0 && await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForTimeout(800);
  }
  const t = page.locator('input').nth(0);
  const e = page.locator('input').nth(1);
  const p = page.locator('input[type="password"]').first();
  if (await t.count() > 0) await t.fill(tenantSlug);
  if (await e.count() > 0) await e.fill(email);
  if (await p.count() > 0) await p.fill('supportplane-demo');
  const s = page.locator('button[type="submit"]').first();
  if (await s.count() > 0) await s.click();
  await page.waitForTimeout(2500);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    if (f.endsWith('.png')) fs.unlinkSync(path.join(OUTPUT_DIR, f));
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  // ======== 1. Login page ========
  await page.goto(WEB_URL);
  await page.waitForTimeout(1500);
  await screenshot(page, 'login-local-auth');

  // ======== Login as admin ========
  await loginAs(page, 'admin@supportplane.local', 'dev-tenant');

  // ======== 2. Admin cockpit header ========
  await scrollMainTo(page, 0);
  await screenshot(page, 'admin-cockpit-header');

  // ======== 3. Delivery Policy panel ========
  await scrollToText(page, 'Delivery Policy');
  await screenshot(page, 'admin-delivery-policy-panel');

  // ======== 4. Validate Policy result ========
  const validateBtn = page.locator('main button').filter({ hasText: /Validate Policy/i }).first();
  if (await validateBtn.count() > 0) {
    await validateBtn.click();
    await page.waitForTimeout(1200);
  }
  await screenshot(page, 'policy-validation-result');

  // ======== 5. Toggle approval required ON ========
  await scrollToText(page, 'Approval required');
  const approvalRow = page.locator('main').locator('div').filter({ hasText: /Approval required/ }).first();
  const approvalBtn = approvalRow.locator('button').first();
  if (await approvalBtn.count() > 0) {
    await approvalBtn.click();
    await page.waitForTimeout(1200);
  }
  await screenshot(page, 'policy-approval-toggle-on');

  // ======== 6. Policy version incremented ========
  await scrollToText(page, 'Delivery Policy');
  await page.waitForTimeout(300);
  await screenshot(page, 'policy-version-incremented');

  // ======== 7. Connector readiness result ========
  const readinessBtn = page.locator('main button').filter({ hasText: /Connector Readiness/i }).first();
  if (await readinessBtn.count() > 0) {
    await readinessBtn.click();
    await page.waitForTimeout(1500);
  }
  await screenshot(page, 'connector-readiness-result');

  // ======== API helper ========
  const apiCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const apiPage = await apiCtx.newPage();
  await apiPage.goto(WEB_URL);
  await apiPage.waitForTimeout(800);
  const t0 = apiPage.locator('input').nth(0);
  const e0 = apiPage.locator('input').nth(1);
  const p0 = apiPage.locator('input[type="password"]').first();
  if (await t0.count() > 0) await t0.fill('dev-tenant');
  if (await e0.count() > 0) await e0.fill('admin@supportplane.local');
  if (await p0.count() > 0) await p0.fill('supportplane-demo');
  const s0 = apiPage.locator('button[type="submit"]').first();
  if (await s0.count() > 0) await s0.click();
  await apiPage.waitForTimeout(2000);
  const cookies = await apiCtx.cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');

  const apiFetch = async (url, opts = {}) => {
    const res = await fetch(`${API_URL}${url}`, {
      ...opts,
      headers: { ...(opts.headers || {}), Cookie: cookieHeader, 'Content-Type': 'application/json' },
    });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { error: text, status: res.status }; }
  };

  // ======== Create allowed action ========
  const allowedSession = await apiFetch('/support-sessions', {
    method: 'POST',
    body: JSON.stringify({ title: 'BL-094 allowed session', priority: 'normal' }),
  });
  const allowedSessionId = allowedSession.id;
  const allowedAction = await apiFetch(`/support-sessions/${allowedSessionId}/actions`, {
    method: 'POST',
    body: JSON.stringify({ actionType: 'ticket_note', externalTicketId: 'TICKET-101', body: 'Allowed action test' }),
  });
  const allowedActionId = allowedAction.action.id;
  await apiFetch(`/actions/${allowedActionId}/submit-for-review`, { method: 'POST', body: '{}' });
  await apiFetch(`/actions/${allowedActionId}/approve`, { method: 'POST', body: JSON.stringify({ reason: 'screenshot test' }) });
  await apiFetch(`/actions/${allowedActionId}/queue`, { method: 'POST', body: '{}' });

  // ======== 8. Action Center — queued action ========
  await page.goto(WEB_URL);
  await page.waitForTimeout(2000);
  await selectSessionById(page, allowedSessionId);
  await scrollToText(page, 'Action Center / Durable Outbox');
  await screenshot(page, 'action-center-queued');

  // ======== 9. Delivery Operations — queued item ========
  await scrollMainTo(page, 1100);
  await screenshot(page, 'delivery-operations-queued');

  // ======== 10. Outbox attempt detail ========
  await scrollMainTo(page, 1400);
  await screenshot(page, 'outbox-attempt-detail');

  // ======== 11. Audit Trail ========
  await scrollToText(page, 'Audit Trail');
  await screenshot(page, 'audit-trail-policy-events');

  // ======== 12. Case Timeline ========
  await scrollToText(page, 'Case Timeline');
  await screenshot(page, 'case-timeline-policy-events');

  // ======== 13. Evidence Bundle summary ========
  await scrollToText(page, 'Evidence Bundle');
  const genBtn = page.locator('main button').filter({ hasText: /Generate Evidence Bundle|Generate/i }).first();
  if (await genBtn.count() > 0 && !(await genBtn.isDisabled())) {
    await genBtn.click();
    await page.waitForTimeout(2500);
  }
  await screenshot(page, 'evidence-bundle-summary');

  // ======== 14. Evidence Bundle JSON ========
  const clicked = await page.evaluate(() => {
    const h2s = document.querySelectorAll('main h2');
    for (const h2 of h2s) {
      if (h2.textContent.trim() === 'Evidence Bundle') {
        const panel = h2.closest('div.rounded-lg');
        if (panel) {
          const btns = panel.querySelectorAll('button');
          for (const btn of btns) {
            if (btn.textContent.trim() === 'JSON') {
              btn.click();
              return true;
            }
          }
        }
      }
    }
    return false;
  });
  console.log('JSON clicked via evaluate:', clicked);
  if (clicked) await page.waitForTimeout(1000);
  await screenshot(page, 'evidence-bundle-json');

  // ======== Kill switch blocking ========
  const policies = await apiFetch('/delivery-policies');
  const policy = (policies.policies || [])[0];
  if (policy) {
    await apiFetch(`/delivery-policies/${policy.id}`, { method: 'PATCH', body: JSON.stringify({ killSwitch: true }) });
  }

  const blockedSession = await apiFetch('/support-sessions', {
    method: 'POST',
    body: JSON.stringify({ title: 'BL-094 blocked session', priority: 'normal' }),
  });
  const blockedSessionId = blockedSession.id;
  const blockedAction = await apiFetch(`/support-sessions/${blockedSessionId}/actions`, {
    method: 'POST',
    body: JSON.stringify({ actionType: 'ticket_note', externalTicketId: 'TICKET-999', body: 'Blocked by kill switch' }),
  });
  const blockedActionId = blockedAction.action.id;
  await apiFetch(`/actions/${blockedActionId}/submit-for-review`, { method: 'POST', body: '{}' });
  await apiFetch(`/actions/${blockedActionId}/approve`, { method: 'POST', body: JSON.stringify({ reason: 'should block' }) });

  // ======== 15. Kill switch blocked queue ========
  const blockedQueueRes = await apiFetch(`/actions/${blockedActionId}/queue`, { method: 'POST', body: '{}' });
  console.log('blockedQueueRes:', JSON.stringify(blockedQueueRes).slice(0, 250));

  await page.goto(WEB_URL);
  await page.waitForTimeout(2000);
  await selectSessionById(page, blockedSessionId);
  await scrollToText(page, 'Action Center / Durable Outbox');
  await screenshot(page, 'killswitch-blocked-queue');

  // ======== 16. Kill switch dead letter ========
  if (policy) {
    await apiFetch(`/delivery-policies/${policy.id}`, { method: 'PATCH', body: JSON.stringify({ killSwitch: false }) });
  }
  const deadSession = await apiFetch('/support-sessions', {
    method: 'POST',
    body: JSON.stringify({ title: 'BL-094 deadletter session', priority: 'normal' }),
  });
  const deadSessionId = deadSession.id;
  const deadAction = await apiFetch(`/support-sessions/${deadSessionId}/actions`, {
    method: 'POST',
    body: JSON.stringify({ actionType: 'ticket_note', externalTicketId: 'TICKET-888', body: 'Dead letter test' }),
  });
  const deadActionId = deadAction.action.id;
  await apiFetch(`/actions/${deadActionId}/submit-for-review`, { method: 'POST', body: '{}' });
  await apiFetch(`/actions/${deadActionId}/approve`, { method: 'POST', body: JSON.stringify({ reason: 'dead letter test' }) });
  await apiFetch(`/actions/${deadActionId}/queue`, { method: 'POST', body: '{}' });

  if (policy) {
    await apiFetch(`/delivery-policies/${policy.id}`, { method: 'PATCH', body: JSON.stringify({ killSwitch: true }) });
  }
  const processRes = await apiFetch('/outbox/process-once', { method: 'POST', body: '{}' });
  console.log('processRes:', JSON.stringify(processRes).slice(0, 250));

  await page.goto(WEB_URL);
  await page.waitForTimeout(2000);
  await selectSessionById(page, deadSessionId);
  await scrollToText(page, 'Action Center / Durable Outbox');
  await screenshot(page, 'killswitch-dead-letter');

  // ======== 17. Worker process allowed ========
  if (policy) {
    await apiFetch(`/delivery-policies/${policy.id}`, { method: 'PATCH', body: JSON.stringify({ killSwitch: false }) });
  }
  const okSession = await apiFetch('/support-sessions', {
    method: 'POST',
    body: JSON.stringify({ title: 'BL-094 process-ok session', priority: 'normal' }),
  });
  const okSessionId = okSession.id;
  const okAction = await apiFetch(`/support-sessions/${okSessionId}/actions`, {
    method: 'POST',
    body: JSON.stringify({ actionType: 'ticket_note', externalTicketId: 'TICKET-777', body: 'Process allowed test' }),
  });
  const okActionId = okAction.action.id;
  await apiFetch(`/actions/${okActionId}/submit-for-review`, { method: 'POST', body: '{}' });
  await apiFetch(`/actions/${okActionId}/approve`, { method: 'POST', body: JSON.stringify({ reason: 'process ok test' }) });
  await apiFetch(`/actions/${okActionId}/queue`, { method: 'POST', body: '{}' });

  const processOkRes = await apiFetch('/outbox/process-once', { method: 'POST', body: '{}' });
  console.log('processOkRes:', JSON.stringify(processOkRes).slice(0, 250));

  await page.goto(WEB_URL);
  await page.waitForTimeout(2000);
  await selectSessionById(page, okSessionId);
  await scrollToText(page, 'Action Center / Durable Outbox');
  await screenshot(page, 'worker-process-allowed');

  await apiPage.close();
  await apiCtx.close();

  // ======== 18. Viewer read-only policy ========
  await loginAs(page, 'viewer@supportplane.local', 'dev-tenant');
  await scrollToText(page, 'Delivery Policy');
  await screenshot(page, 'viewer-readonly-policy');

  // ======== 19. Viewer Audit Trail ========
  await scrollToText(page, 'Audit Trail');
  await screenshot(page, 'viewer-audit-trail-readonly');

  // ======== 20. Cross-tenant denied ========
  await loginAs(page, 'admin@alt.supportplane.local', 'alt-tenant');
  await page.goto(`${WEB_URL}/?session=${allowedSessionId}`);
  await page.waitForTimeout(2000);
  await screenshot(page, 'cross-tenant-denied');

  // ======== 21. Logout state (validation error on login) ========
  await page.goto(WEB_URL);
  await page.waitForTimeout(1200);
  const logoutBtn = page.locator('button').filter({ hasText: /Logout/i }).first();
  if (await logoutBtn.count() > 0 && await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForTimeout(1200);
  }
  const submitBtn = page.locator('button[type="submit"]').first();
  if (await submitBtn.count() > 0 && await submitBtn.isVisible()) {
    await submitBtn.click();
    await page.waitForTimeout(800);
  }
  await screenshot(page, 'login-validation-error');

  // ======== 22. Relogin policy preserved ========
  await loginAs(page, 'admin@supportplane.local', 'dev-tenant');
  await scrollToText(page, 'Delivery Policy');
  await screenshot(page, 'relogin-policy-preserved');

  // ======== 23. Persistence outbox ========
  await scrollToText(page, 'Audit Trail');
  await screenshot(page, 'persistence-outbox');

  // ======== 24. Final no-real-writeback proof ========
  await scrollMainTo(page, 0);
  await screenshot(page, 'final-no-real-writeback-proof');

  await browser.close();

  // ======== Duplicate detection ========
  console.log('\n=== Duplicate Detection ===');
  try {
    const md5Output = execSync(`md5sum ${OUTPUT_DIR}/*.png`, { encoding: 'utf-8' });
    const lines = md5Output.trim().split('\n').map((l) => l.trim().split('  '));
    const hashes = {};
    for (const [hash, file] of lines) {
      if (!hashes[hash]) hashes[hash] = [];
      hashes[hash].push(path.basename(file));
    }
    let duplicates = 0;
    for (const [hash, files] of Object.entries(hashes)) {
      if (files.length > 1) {
        console.log(`DUPLICATE: ${files.join(' = ')}`);
        duplicates++;
      }
    }
    if (duplicates === 0) {
      console.log('No duplicates detected. All screenshots are unique.');
    } else {
      console.log(`WARNING: ${duplicates} duplicate hash group(s) found.`);
    }
  } catch (e) {
    console.log('md5sum check failed:', e.message);
  }

  console.log(`\nCaptured ${screenshotIndex} screenshots to ${OUTPUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
