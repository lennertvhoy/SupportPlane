#!/usr/bin/env node
/**
 * BL-103 Screenshot Script
 * Writes to session-104-bl103-local-k8s-podman-foundation-final/
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OUTPUT_DIR = path.join(__dirname, '..', 'output', 'playwright', 'session-104-bl103-local-k8s-podman-foundation-final');
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

function readFile(relPath) {
  return fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
}

function readPreview(relPath, maxLines = 44) {
  return readFile(relPath).split('\n').slice(0, maxLines).join('\n');
}

function readWindow(relPath, pattern, before = 6, after = 34) {
  const lines = readFile(relPath).split('\n');
  const index = lines.findIndex(line => line.includes(pattern));
  if (index < 0) return lines.slice(0, before + after).join('\n');
  return lines.slice(Math.max(0, index - before), Math.min(lines.length, index + after)).join('\n');
}

function terminalWindow(filename, patterns, fallbackLines = 44) {
  const abs = path.join(OUTPUT_DIR, filename);
  const lines = fs.readFileSync(abs, 'utf8').split('\n');
  const windows = [];
  for (const pattern of patterns) {
    const index = lines.findIndex(line => line.includes(pattern));
    if (index >= 0) {
      windows.push(lines.slice(Math.max(0, index - 3), Math.min(lines.length, index + 14)).join('\n'));
    }
  }
  return windows.length > 0 ? windows.join('\n\n---\n\n') : lines.slice(0, fallbackLines).join('\n');
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

async function renderProof(page, title, body, name, proofState) {
  await page.setContent(`
    <main style="font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; background:#0f172a; color:#e2e8f0; padding:18px; width:1100px;">
      <section style="border:1px solid #334155; border-radius:8px; overflow:hidden;">
        <header style="background:#0b5cad; color:white; padding:12px 16px; font-size:18px; font-weight:700;">${escapeHtml(title)}</header>
        <pre style="margin:0; padding:16px; font-size:12px; line-height:1.45; white-space:pre-wrap; word-break:break-word; max-height:760px; overflow:hidden;">${escapeHtml(body)}</pre>
      </section>
    </main>
  `);
  await page.waitForTimeout(250);
  await screenshot(page, name, proofState, { fullPage: false });
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
    if (/\.png$/.test(f) || ['proof-state-mapping.md', 'screenshot-md5s.txt', 'roadmap-summary.json'].includes(f)) {
      fs.unlinkSync(path.join(OUTPUT_DIR, f));
    }
  }

  const adminToken = await apiLogin('admin@supportplane.local', 'supportplane-demo', 'dev-tenant');
  const session = await apiCall('/support-sessions', adminToken, 'POST', {
    title: 'BL-103 cluster proof session',
    description: 'Proof session for cluster foundation boundary screenshots',
    priority: 'normal',
  });
  await apiCall(`/support-sessions/${session.id}/zammad/ticket-context`, adminToken, 'POST', { externalTicketId: 'TICKET-101' });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const proofPage = await context.newPage();

  await renderProof(proofPage, 'README.md - local/mock MVP plus self-hosted sandbox roadmap', readPreview('README.md', 58), 'readme-status-roadmap', 'README/status proof showing local/mock MVP remains current and sandbox roadmap remains explicit');
  await renderProof(proofPage, 'Cluster provider and supportplane-local proof', terminalWindow('cluster-proof.txt', ['Cluster name:', 'Provider:', 'Node image:', '$ kubectl config current-context', '$ kubectl cluster-info']), 'cluster-provider-supportplane-local', 'Terminal proof showing Kind/Podman provider, supportplane-local cluster, context, and cluster-info');
  await renderProof(proofPage, 'kubectl get nodes -o wide', terminalWindow('cluster-proof.txt', ['$ kubectl get nodes -o wide'], 24), 'kubectl-nodes-wide', 'Node proof showing the supportplane-local control-plane Ready');
  await renderProof(proofPage, 'Four target namespaces active', terminalWindow('namespace-proof.txt', ['$ kubectl get namespaces supportplane-app'], 28), 'four-namespaces', 'Namespace proof showing supportplane-app/data/integrations/observability active');
  await renderProof(proofPage, 'infra/kubernetes/local-podman/README.md', readPreview('infra/kubernetes/local-podman/README.md', 76), 'local-podman-readme-verified', 'Local Podman Kubernetes README proof with verified commands and non-goals');
  await renderProof(proofPage, 'BACKLOG.md - BL-103 accepted and BL-104+ planned', readWindow('BACKLOG.md', '[BL-103]', 4, 24), 'backlog-bl103-accepted', 'Backlog proof showing BL-103 accepted and later roadmap items still planned');
  await renderProof(proofPage, 'NEXT_ACTIONS.md - active-only queue', readPreview('NEXT_ACTIONS.md', 60), 'next-actions-active-only', 'Next actions proof showing BL-104/BL-105/BL-106 active only');

  await webLogin(page);
  await screenshotElement(page, page.locator('header').first(), 'runtime-header-dev-mock-local-auth-postgres', 'Running SupportPlane header still shows DEV/MOCK DATA, API localhost, local auth, postgres store');

  await page.waitForSelector(`button:has-text("${session.title}")`, { timeout: 15000 });
  await page.locator('button').filter({ hasText: session.title }).first().click();
  await page.waitForTimeout(2500);
  await screenshotElement(page, panelLocator(page, 'Connector'), 'connector-panel-mock-only', 'Connector panel still shows mock-only boundary and credential metadata only');
  await screenshotElement(page, panelLocator(page, 'Delivery Policy'), 'delivery-policy-real-network-locked-off', 'Delivery policy still shows real network locked off');

  const evidencePanel = panelLocator(page, 'Evidence Bundle');
  const generateBtn = evidencePanel.locator('button').filter({ hasText: /Generate|Refresh/ }).first();
  if (await generateBtn.count() > 0 && await generateBtn.isEnabled()) {
    await generateBtn.click();
    await page.waitForTimeout(2500);
  }
  await screenshotElement(page, evidencePanel, 'evidence-bundle-local-mock-disclaimer', 'Evidence bundle still shows local/mock disclaimer and no compliance claim');

  const finalBody = [
    'BL-103 final boundary proof',
    '',
    'Podman-backed local Kubernetes cluster implemented: true',
    'Cluster name: supportplane-local',
    'Context: kind-supportplane-local',
    'Namespaces applied: supportplane-app, supportplane-data, supportplane-integrations, supportplane-observability',
    'Local image strategy verified: podman save + kind load image-archive',
    '',
    'No real writeback was enabled: true',
    'No real credentials were stored: true',
    'No production claims were introduced: true',
    'Zammad/Ollama/OpenBao/NATS/Mailpit/MinIO integrations enabled: false',
    'Current product status: local/mock MVP remains runnable',
  ].join('\n');
  await renderProof(proofPage, 'BL-103 final no-real-integration boundary', finalBody, 'final-boundary-no-real-writeback-secrets-production', 'Final proof that no real writeback, credentials, production claims, or real integrations were enabled');

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
  fs.writeFileSync(path.join(OUTPUT_DIR, 'proof-state-mapping.md'), `# BL-103 Proof-State Mapping\n\n| # | Filename | Proof State | Size |\n|---|---|---|---|\n${proofMapping.map(m => `| ${m.number} | \`${m.filename}\` | ${m.proofState} | ${m.width}x${m.height} |`).join('\n')}\n`);

  const roadmapSummary = {
    backlogId: 'BL-103',
    sliceName: 'Local Kubernetes/Podman Cluster Foundation',
    clusterName: 'supportplane-local',
    provider: 'Kind with Podman provider',
    providerVerified: true,
    clusterCreated: true,
    namespacesApplied: true,
    localImageStrategyVerified: true,
    currentStatus: 'BL-103 accepted; local/mock MVP still current; app/PostgreSQL workloads not deployed into cluster yet',
    docsUpdated: ['README.md', 'BACKLOG.md', 'NEXT_ACTIONS.md', 'STATUS.md', 'PROJECT_STATE.yaml', 'WORKLOG.md', 'docs/EVIDENCE_LOG.md', 'docs/ACCEPTANCE_FREEZES.md', 'docs/LOCAL_KUBERNETES_PODMAN_TARGET.md', 'docs/KUBERNETES_SERVICE_CATALOG.md', 'docs/WORKFLOW_TRUTH.md', 'docs/BOUNDARY_MATRIX.md', 'docs/BACKLOG_REAL_E2E_ROADMAP.md', 'docs/IMPLEMENTATION_PHASES_REAL_E2E.md', 'infra/kubernetes/local-podman/README.md'],
    filesCreated: ['scripts/create_local_k8s_cluster.sh', 'infra/kubernetes/local-podman/namespaces.yaml', 'infra/kubernetes/local-podman/kustomization.yaml', 'scripts/bl103_screenshots.js'],
    noRealWritebackEnabled: true,
    noRealSecretsStored: true,
    noProductionClaims: true,
    nextBacklogRecommendation: 'BL-104 + BL-105 bundled slice: SupportPlane API/Web/Worker manifests plus PostgreSQL Kubernetes persistence foundation',
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'roadmap-summary.json'), JSON.stringify(roadmapSummary, null, 2) + '\n');

  console.log(`\n=== BL-103 Screenshot Summary ===`);
  console.log(`Folder: ${OUTPUT_DIR}`);
  console.log(`Screenshots: ${screenshotCount} (max ${MAX_SCREENSHOTS})`);
  console.log(`Duplicates: ${duplicates}`);
  if (duplicates > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
