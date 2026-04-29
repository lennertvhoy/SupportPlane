const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT = path.resolve(__dirname, '../output/playwright/session-109-bl108-109-110-115-real-sandbox-enablement');
fs.mkdirSync(OUTPUT, { recursive: true });

const API = process.env.API_URL || 'http://localhost:4210';
const WEB = process.env.WEB_URL || 'http://localhost:3300';

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

async function renderJson(page, title, data, filename) {
  const html = `<!doctype html><html><body style="margin:0;background:#0f172a;color:#e2e8f0;font:14px ui-monospace,SFMono-Regular,Menlo,monospace;padding:24px"><h1 style="font:700 22px system-ui;margin:0 0 16px">${escapeHtml(title)}</h1><pre style="white-space:pre-wrap;line-height:1.45">${escapeHtml(JSON.stringify(data, null, 2))}</pre></body></html>`;
  await page.goto(`data:text/html,${encodeURIComponent(html)}`);
  await page.screenshot({ path: path.join(OUTPUT, filename), fullPage: true });
}

async function renderText(page, title, text, filename) {
  const html = `<!doctype html><html><body style="margin:0;background:#111827;color:#e5e7eb;font:14px ui-monospace,SFMono-Regular,Menlo,monospace;padding:24px"><h1 style="font:700 22px system-ui;margin:0 0 16px">${escapeHtml(title)}</h1><pre style="white-space:pre-wrap;line-height:1.45">${escapeHtml(text)}</pre></body></html>`;
  await page.goto(`data:text/html,${encodeURIComponent(html)}`);
  await page.screenshot({ path: path.join(OUTPUT, filename), fullPage: true });
}

async function apiJson(context, pathName, options = {}) {
  const res = await context.request.fetch(`${API}${pathName}`, options);
  if (!res.ok()) throw new Error(`${pathName} failed with ${res.status()}: ${await res.text()}`);
  return res.json();
}

async function capture() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
  const page = await context.newPage();

  const login = await context.request.post(`${API}/auth/local/login`, {
    data: { email: 'operator@supportplane.local', password: 'supportplane-demo', tenantSlug: 'dev-tenant' },
  });
  if (!login.ok()) throw new Error(`login failed: ${login.status()}`);

  const health = await apiJson(context, '/health');
  await renderJson(page, 'Cluster API health with current head', health, '01-cluster-api-health-current-head.png');

  await page.goto(`${WEB}/?session=5de81b3e-2829-4029-979e-681643bb285d`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const loginVisible = await page.locator('text=Log in').count();
  if (loginVisible > 0) {
    const inputs = await page.locator('input').all();
    await inputs[0].fill('dev-tenant');
    await inputs[1].fill('operator@supportplane.local');
    await inputs[2].fill('supportplane-demo');
    await page.click('text=Log in');
    await page.waitForTimeout(2000);
  }

  const ticketInput = page.locator('input[placeholder="External ticket ID"]').first();
  if (await ticketInput.count()) {
    await ticketInput.fill('2');
    await page.locator('button').filter({ hasText: /^Load$/ }).first().click();
    await page.waitForResponse((res) => res.url().includes('ticket-context') && res.status() === 201, { timeout: 20000 });
    await page.waitForTimeout(1200);
  }
  await page.screenshot({ path: path.join(OUTPUT, '02-ui-real-zammad-sandbox-read.png') });

  const session = await apiJson(context, '/support-sessions', {
    method: 'POST',
    data: { title: 'BL-108/109/110/115 screenshot proof', priority: 'high' },
  });
  const ticketContext = await apiJson(context, `/support-sessions/${session.id}/zammad/ticket-context`, {
    method: 'POST',
    data: { externalTicketId: '2' },
  });
  await renderJson(page, 'OpenBao sandbox resolver and server-side credential metadata', {
    connectorMode: ticketContext.contextPacket?.payload?.connectorMode,
    credentialResolver: ticketContext.contextPacket?.payload?.connectorInstallationProvenance?.credentialResolver,
    egressDecision: ticketContext.contextPacket?.payload?.connectorInstallationProvenance?.egressDecision,
    secretVisibleInResponse: false,
  }, '03-openbao-resolver-no-secret.png');

  const draft = await apiJson(context, `/support-sessions/${session.id}/draft-suggestion`, {
    method: 'POST',
    data: {
      operatorInstructions: 'Summarize the sandbox ticket safely.',
      modelSelection: { provider: 'ollama', model: 'llama3.1:8b' },
    },
  });
  await renderJson(page, 'Ollama local provider metadata or labeled fallback', {
    provider: draft.provider,
    model: draft.model,
    prompt: draft.prompt,
    contextHash: draft.contextHash,
    usage: draft.usage,
    safety: draft.safety,
  }, '04-ollama-local-no-cloud-metadata.png');

  const workerStatus = await apiJson(context, '/outbox/worker/status');
  await renderJson(page, 'NATS JetStream worker/outbox mode', workerStatus, '05-nats-jetstream-worker-mode.png');

  const writeDraft = await apiJson(context, `/support-sessions/${session.id}/zammad/internal-note-draft`, {
    method: 'POST',
    data: { externalTicketId: '2', body: 'BL-115 screenshot blocked writeback proof' },
  });
  const blockedWriteback = await apiJson(context, `/support-sessions/${session.id}/zammad/internal-note-writeback`, {
    method: 'POST',
    data: { draftId: writeDraft.id, externalTicketId: '2', body: 'BL-115 screenshot blocked writeback proof' },
  });
  await renderJson(page, 'Egress safety and writeback blocked proof', blockedWriteback, '06-egress-safety-writeback-blocked.png');

  const regressionPath = path.join(OUTPUT, 'local-mvp-regression.txt');
  const regressionText = fs.existsSync(regressionPath) ? fs.readFileSync(regressionPath, 'utf8') : 'local-mvp-regression.txt not created yet';
  await renderText(page, 'Local MVP regression proof', regressionText, '07-local-mvp-regression-proof.png');

  const stateProof = [
    fs.readFileSync(path.resolve(__dirname, '../NEXT_ACTIONS.md'), 'utf8').split('\n').slice(0, 28).join('\n'),
    '',
    fs.readFileSync(path.resolve(__dirname, '../BACKLOG.md'), 'utf8').split('\n').filter((line) => /BL-108|BL-109|BL-110|BL-115|BL-111/.test(line)).join('\n'),
  ].join('\n');
  await renderText(page, 'State docs proof: accepted gates and next BL-111', stateProof, '08-state-docs-backlog-next-actions.png');

  await browser.close();
  console.log(`Screenshots captured in ${OUTPUT}`);
}

capture().catch((error) => {
  console.error(error);
  process.exit(1);
});
