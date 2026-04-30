#!/usr/bin/env node
/**
 * Evidence capture script for BL-123/124/125 (Plugin Registry + Runtime Resolver + Zammad Migration)
 */

const fs = require('fs');
const path = require('path');

const API_BASE = process.env.API_BASE || 'http://localhost:4210';
const OUT_DIR = process.env.OUT_DIR || 'output/playwright/session-116-bl089-bl123-bl124-bl125-plugin-registry';

const COOKIE_JAR = path.join(OUT_DIR, 'cookies.txt');

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

async function login() {
  const res = await fetch(`${API_BASE}/auth/local/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'operator@supportplane.local',
      password: 'supportplane-demo',
      tenantSlug: 'dev-tenant',
    }),
  });
  const cookies = res.headers.getSetCookie?.() || [];
  fs.writeFileSync(
    COOKIE_JAR,
    cookies.map((c) => c.split(';')[0]).join('\n')
  );
  return cookies;
}

function getCookieHeader() {
  if (!fs.existsSync(COOKIE_JAR)) return '';
  return fs.readFileSync(COOKIE_JAR, 'utf8').trim().split('\n').join('; ');
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  console.log('Logging in...');
  await login();
  const cookie = getCookieHeader();
  const headers = { Cookie: cookie, 'Content-Type': 'application/json' };

  // 1. Registry listing
  console.log('1. Registry listing');
  const registryList = await fetchJson(`${API_BASE}/connectors/registry`, { headers });
  fs.writeFileSync(path.join(OUT_DIR, '01-registry-listing.json'), JSON.stringify(registryList, null, 2));

  // 2. Connector status (should show registryPattern: true)
  console.log('2. Connector status');
  const status = await fetchJson(`${API_BASE}/connectors/zammad/status`, { headers });
  fs.writeFileSync(path.join(OUT_DIR, '02-connector-status.json'), JSON.stringify(status, null, 2));

  // 3. Connector installations
  console.log('3. Connector installations');
  const installations = await fetchJson(`${API_BASE}/connector-installations`, { headers });
  fs.writeFileSync(path.join(OUT_DIR, '03-connector-installations.json'), JSON.stringify(installations, null, 2));

  // 4. Get specific installation
  console.log('4. Specific installation');
  const installation = await fetchJson(`${API_BASE}/connector-installations/conn-inst-dev-001`, { headers });
  fs.writeFileSync(path.join(OUT_DIR, '04-specific-installation.json'), JSON.stringify(installation, null, 2));

  // 5. Runtime readiness
  console.log('5. Runtime readiness');
  const readiness = await fetchJson(`${API_BASE}/connector-installations/conn-inst-dev-001/readiness`, {
    method: 'POST',
    headers,
  });
  fs.writeFileSync(path.join(OUT_DIR, '05-runtime-readiness.json'), JSON.stringify(readiness, null, 2));

  // 6. Create session
  console.log('6. Create support session');
  const session = await fetchJson(`${API_BASE}/support-sessions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ title: 'BL-123 registry proof', priority: 'normal' }),
  });
  fs.writeFileSync(path.join(OUT_DIR, '06-create-session.json'), JSON.stringify(session, null, 2));

  // 7. Ticket context (registry-driven adapter)
  console.log('7. Ticket context via registry');
  const ticketContext = await fetchJson(`${API_BASE}/support-sessions/${session.id}/zammad/ticket-context`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ externalTicketId: '2' }),
  });
  fs.writeFileSync(path.join(OUT_DIR, '07-ticket-context.json'), JSON.stringify(ticketContext, null, 2));

  // 8. Draft suggestion (AI provider registry)
  console.log('8. Draft suggestion');
  const draft = await fetchJson(`${API_BASE}/support-sessions/${session.id}/draft-suggestion`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      operatorInstructions: 'Summarize ticket safely.',
      modelSelection: { provider: 'ollama', model: 'gemma4:e4b' },
    }),
  });
  fs.writeFileSync(path.join(OUT_DIR, '08-draft-suggestion.json'), JSON.stringify(draft, null, 2));

  console.log(`Evidence saved to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
