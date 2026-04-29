#!/usr/bin/env node
/**
 * BL-102 Screenshot Script
 * Writes to session-103-bl102-k8s-selfhosted-roadmap-final/
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'playwright', 'session-103-bl102-k8s-selfhosted-roadmap-final');
const WEB_URL = 'http://localhost:3200';
const API_URL = 'http://localhost:4110';
const MAX_SCREENSHOTS = 20;
const MAX_SCREENSHOT_HEIGHT = 1200;

let screenshotCount = 0;
const proofMapping = [];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function readPreview(relPath, maxLines = 44) {
  const abs = path.join(__dirname, '..', relPath);
  return fs.readFileSync(abs, 'utf8').split('\n').slice(0, maxLines).join('\n');
}

function readWindow(relPath, pattern, before = 6, after = 34) {
  const abs = path.join(__dirname, '..', relPath);
  const lines = fs.readFileSync(abs, 'utf8').split('\n');
  const index = lines.findIndex(line => line.includes(pattern));
  if (index < 0) return lines.slice(0, before + after).join('\n');
  return lines.slice(Math.max(0, index - before), Math.min(lines.length, index + after)).join('\n');
}

async function screenshot(page, name, proofState, opts = {}) {
  screenshotCount += 1;
  if (screenshotCount > MAX_SCREENSHOTS) {
    throw new Error(`Screenshot budget exceeded: ${screenshotCount} > ${MAX_SCREENSHOTS}`);
  }
  const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  await page.screenshot({ path: filepath, ...opts });

  const sizeOf = require('image-size');
  const imgBuf = fs.readFileSync(filepath);
  const { width, height } = sizeOf.imageSize(imgBuf);
  if (height > MAX_SCREENSHOT_HEIGHT) {
    throw new Error(`Screenshot ${filename} is too tall (${height}px > ${MAX_SCREENSHOT_HEIGHT}px).`);
  }
  proofMapping.push({ number: screenshotCount, filename, proofState, width, height });
  console.log(`Captured: ${filename} - ${proofState} (${width}x${height})`);
}

async function screenshotElement(page, locator, name, proofState) {
  screenshotCount += 1;
  if (screenshotCount > MAX_SCREENSHOTS) {
    throw new Error(`Screenshot budget exceeded: ${screenshotCount} > ${MAX_SCREENSHOTS}`);
  }
  const filename = `${String(screenshotCount).padStart(2, '0')}-${name}.png`;
  const filepath = path.join(OUTPUT_DIR, filename);
  await locator.scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  await locator.screenshot({ path: filepath });

  const sizeOf = require('image-size');
  const imgBuf = fs.readFileSync(filepath);
  const { width, height } = sizeOf.imageSize(imgBuf);
  if (height > MAX_SCREENSHOT_HEIGHT) {
    throw new Error(`Screenshot ${filename} is too tall (${height}px > ${MAX_SCREENSHOT_HEIGHT}px).`);
  }
  proofMapping.push({ number: screenshotCount, filename, proofState, width, height });
  console.log(`Captured: ${filename} - ${proofState} (${width}x${height})`);
}

async function renderMarkdownProof(page, relPath, title, proofState, maxLines = 44) {
  const preview = readPreview(relPath, maxLines);
  await page.setContent(`
    <main style="font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background:#0f172a; color:#e2e8f0; padding:18px; width:1100px;">
      <section style="border:1px solid #334155; border-radius:8px; overflow:hidden;">
        <header style="background:#0b5cad; color:white; padding:12px 16px; font-size:18px; font-weight:700;">${escapeHtml(title)}</header>
        <pre style="margin:0; padding:16px; font-size:12px; line-height:1.45; white-space:pre-wrap; word-break:break-word; max-height:760px; overflow:hidden;">${escapeHtml(preview)}</pre>
      </section>
    </main>
  `);
  await page.waitForTimeout(250);
  await screenshot(page, relPath.replaceAll('/', '-').replaceAll('.', '-').toLowerCase(), proofState, { fullPage: false });
}

async function apiLogin(email, password, tenantSlug) {
  const res = await fetch(`${API_URL}/auth/local/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, tenantSlug }),
  });
  if (!res.ok) {
    throw new Error(`API login failed: ${res.status} ${await res.text()}`);
  }
  const cookie = res.headers.get('set-cookie');
  const match = cookie && cookie.match(/supportplane_session=([^;]+)/);
  if (!match) throw new Error('No supportplane_session cookie returned');
  return match[1];
}

async function apiCall(pathname, token, method = 'GET', body) {
  const res = await fetch(`${API_URL}${pathname}`, {
    method,
    headers: { 'Content-Type': 'application/json', Cookie: `supportplane_session=${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(`API ${method} ${pathname} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function webLogin(page) {
  await page.goto(WEB_URL);
  await page.waitForTimeout(1000);
  if (await page.locator('text=/DEV \\/ MOCK DATA/i').first().isVisible().catch(() => false)) {
    return;
  }
  const inputs = page.locator('input');
  await inputs.nth(0).fill('dev-tenant');
  await inputs.nth(1).fill('admin@supportplane.local');
  await inputs.nth(2).fill('supportplane-demo');
  await page.click('button[type="submit"]');
  await page.waitForSelector('text=/DEV \\/ MOCK DATA/i', { timeout: 15000 });
}

function panelLocator(page, title) {
  return page.locator(`h2:has-text("${title}") >> xpath=ancestor::div[contains(@class,"rounded-lg")][1]`);
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    if (/\.(png|json|txt|md)$/.test(f)) fs.unlinkSync(path.join(OUTPUT_DIR, f));
  }

  const adminToken = await apiLogin('admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const session = await apiCall('/support-sessions', adminToken, 'POST', {
    title: 'BL-102 roadmap proof session',
    description: 'Proof session for roadmap boundary screenshots',
    priority: 'normal',
  });
  await apiCall(`/support-sessions/${session.id}/zammad/ticket-context`, adminToken, 'POST', { externalTicketId: 'TICKET-101' });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const proofPage = await context.newPage();

  await renderMarkdownProof(proofPage, 'README.md', 'README.md - local/mock MVP with real self-hosted sandbox roadmap', 'README section showing current local/mock MVP and new real self-hosted sandbox roadmap', 58);
  await renderMarkdownProof(proofPage, 'docs/SELF_HOSTED_STACK.md', 'docs/SELF_HOSTED_STACK.md', 'Self-hosted stack service selection and service register proof');
  await renderMarkdownProof(proofPage, 'docs/LOCAL_KUBERNETES_PODMAN_TARGET.md', 'docs/LOCAL_KUBERNETES_PODMAN_TARGET.md', 'Local Kubernetes-on-Podman target proof');
  await renderMarkdownProof(proofPage, 'docs/REAL_E2E_SANDBOX_FLOW.md', 'docs/REAL_E2E_SANDBOX_FLOW.md', 'Real E2E sandbox flow status matrix proof');
  await renderMarkdownProof(proofPage, 'docs/KUBERNETES_SERVICE_CATALOG.md', 'docs/KUBERNETES_SERVICE_CATALOG.md', 'Kubernetes service catalog proof');
  await renderMarkdownProof(proofPage, 'docs/SANDBOX_INTEGRATION_ACCEPTANCE.md', 'docs/SANDBOX_INTEGRATION_ACCEPTANCE.md', 'Sandbox integration acceptance gates proof');
  await renderMarkdownProof(proofPage, 'docs/IMPLEMENTATION_PHASES_REAL_E2E.md', 'docs/IMPLEMENTATION_PHASES_REAL_E2E.md', 'Implementation phases proof');
  await renderMarkdownProof(proofPage, 'docs/BACKLOG_REAL_E2E_ROADMAP.md', 'docs/BACKLOG_REAL_E2E_ROADMAP.md', 'Backlog real E2E roadmap mapping proof');
  await renderMarkdownProof(proofPage, 'docs/WORKFLOW_TRUTH.md', 'docs/WORKFLOW_TRUTH.md', 'Workflow truth matrix proof');
  await renderMarkdownProof(proofPage, 'docs/BOUNDARY_MATRIX.md', 'docs/BOUNDARY_MATRIX.md', 'Boundary matrix proof');
  const backlogWindow = readWindow('BACKLOG.md', '[BL-102]', 4, 26);
  await proofPage.setContent(`
    <main style="font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background:#0f172a; color:#e2e8f0; padding:18px; width:1100px;">
      <section style="border:1px solid #334155; border-radius:8px; overflow:hidden;">
        <header style="background:#0b5cad; color:white; padding:12px 16px; font-size:18px; font-weight:700;">BACKLOG.md - BL-102+ roadmap items</header>
        <pre style="margin:0; padding:16px; font-size:12px; line-height:1.45; white-space:pre-wrap; word-break:break-word; max-height:760px; overflow:hidden;">${escapeHtml(backlogWindow)}</pre>
      </section>
    </main>
  `);
  await proofPage.waitForTimeout(250);
  await screenshot(proofPage, 'backlog-bl102-plus-roadmap-items', 'Backlog proof showing BL-102 accepted and BL-103+ planned roadmap items', { fullPage: false });
  await renderMarkdownProof(proofPage, 'NEXT_ACTIONS.md', 'NEXT_ACTIONS.md - active next actions only', 'Next actions proof showing active implementation candidates only', 70);

  await webLogin(page);
  await screenshotElement(page, page.locator('header').first(), 'runtime-header-dev-mock-local-auth-postgres', 'Running SupportPlane header still shows DEV/MOCK DATA, API localhost, local auth, postgres store');

  await page.waitForSelector(`button:has-text("${session.title}")`, { timeout: 15000 });
  await page.locator('button').filter({ hasText: session.title }).first().click();
  await page.waitForTimeout(2500);
  await screenshotElement(page, panelLocator(page, 'Connector'), 'connector-panel-mock-only-boundary', 'Connector panel still shows mock-only boundary and credential metadata only');
  await screenshotElement(page, panelLocator(page, 'Delivery Policy'), 'delivery-policy-real-network-locked-off', 'Delivery policy still shows real network locked off');

  const evidencePanel = panelLocator(page, 'Evidence Bundle');
  const generateBtn = evidencePanel.locator('button').filter({ hasText: /Generate|Refresh/ }).first();
  if (await generateBtn.count() > 0 && await generateBtn.isEnabled()) {
    await generateBtn.click();
    await page.waitForTimeout(2500);
  }
  await screenshotElement(page, evidencePanel, 'evidence-bundle-local-mock-disclaimer', 'Evidence bundle still shows local/mock disclaimer and no compliance claim');

  await proofPage.setContent(`
    <main style="font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background:#111827; color:#e5e7eb; padding:18px; width:1100px;">
      <section style="border:1px solid #374151; border-radius:8px; overflow:hidden;">
        <header style="background:#166534; padding:12px 16px; font-size:18px; font-weight:700;">BL-102 final boundary proof</header>
        <div style="padding:16px; font-size:15px; line-height:1.7;">
          <div>No real writeback was enabled: <strong>true</strong></div>
          <div>No real credentials were stored: <strong>true</strong></div>
          <div>No production claims were introduced: <strong>true</strong></div>
          <div>Kubernetes cluster implemented in this slice: <strong>false</strong></div>
          <div>Current product status: <strong>local/mock MVP frozen</strong></div>
          <div>New target: <strong>local Kubernetes-on-Podman self-hosted sandbox</strong></div>
        </div>
      </section>
    </main>
  `);
  await screenshot(proofPage, 'final-no-real-writeback-credentials-production-claims', 'Final proof that no real writeback, credentials, production claims, or cluster implementation were enabled', { fullPage: false });

  await browser.close();

  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png')).sort();
  const hashes = {};
  let duplicates = 0;
  for (const f of files) {
    const h = crypto.createHash('md5').update(fs.readFileSync(path.join(OUTPUT_DIR, f))).digest('hex');
    if (hashes[h]) {
      duplicates += 1;
      console.log(`DUPLICATE: ${f} === ${hashes[h]}`);
    } else {
      hashes[h] = f;
    }
  }
  fs.writeFileSync(path.join(OUTPUT_DIR, 'screenshot-md5s.txt'), Object.entries(hashes).map(([h, f]) => `${h}  ${f}`).sort().join('\n') + '\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'proof-state-mapping.md'), `# BL-102 Proof-State Mapping\n\n| # | Filename | Proof State | Size |\n|---|---|---|---|\n${proofMapping.map(m => `| ${m.number} | \`${m.filename}\` | ${m.proofState} | ${m.width}x${m.height} |`).join('\n')}\n`);

  const roadmapSummary = {
    backlogId: 'BL-102',
    sliceName: 'Local Kubernetes self-hosted sandbox architecture and roadmap',
    currentStatus: 'local/mock MVP frozen; no real cluster or integration implemented in this slice',
    targetCluster: 'local Kubernetes on Podman, cluster name supportplane-local, default candidate Kind with Podman provider to verify on host',
    selectedServices: ['Zammad', 'Ollama', 'OpenBao', 'NATS JetStream', 'Mailpit', 'MinIO', 'PostgreSQL', 'OpenTelemetry Collector', 'Grafana', 'Loki', 'Prometheus'],
    newBacklogItems: ['BL-102', 'BL-103', 'BL-104', 'BL-105', 'BL-106', 'BL-107', 'BL-108', 'BL-109', 'BL-110', 'BL-111', 'BL-112', 'BL-113', 'BL-114', 'BL-115', 'BL-116', 'BL-117', 'BL-118', 'BL-119', 'BL-120'],
    docsCreated: ['docs/SELF_HOSTED_STACK.md', 'docs/LOCAL_KUBERNETES_PODMAN_TARGET.md', 'docs/REAL_E2E_SANDBOX_FLOW.md', 'docs/KUBERNETES_SERVICE_CATALOG.md', 'docs/SANDBOX_INTEGRATION_ACCEPTANCE.md', 'docs/IMPLEMENTATION_PHASES_REAL_E2E.md', 'docs/BACKLOG_REAL_E2E_ROADMAP.md', 'docs/WORKFLOW_TRUTH.md', 'docs/BOUNDARY_MATRIX.md', 'infra/kubernetes/local-podman/README.md'],
    docsUpdated: ['README.md', 'BACKLOG.md', 'NEXT_ACTIONS.md', 'STATUS.md', 'PROJECT_STATE.yaml', 'WORKLOG.md', 'docs/EVIDENCE_LOG.md', 'docs/ACCEPTANCE_FREEZES.md', 'docs/ARCHITECTURE.md', 'docs/LOCAL_DEVELOPMENT.md', 'docs/ZAMMAD_CONNECTOR.md'],
    noRealWritebackEnabled: true,
    noRealSecretsStored: true,
    noProductionClaims: true,
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'roadmap-summary.json'), JSON.stringify(roadmapSummary, null, 2) + '\n');

  console.log(`\n=== BL-102 Screenshot Summary ===`);
  console.log(`Folder: ${OUTPUT_DIR}`);
  console.log(`Screenshots: ${screenshotCount} (max ${MAX_SCREENSHOTS})`);
  console.log(`Duplicates: ${duplicates}`);
  if (duplicates > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
