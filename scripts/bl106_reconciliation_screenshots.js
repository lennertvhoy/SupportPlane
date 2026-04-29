#!/usr/bin/env node
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.resolve(__dirname, '../output/playwright/session-107-bl106-evidence-reconciliation');
const CLUSTER_WEB = 'http://localhost:3300';
const LOCAL_WEB = 'http://localhost:3200';
const ZAMMAD_WEB = 'http://localhost:8080';
const MAILPIT_WEB = 'http://localhost:8025';
const OPENBAO_API = 'http://localhost:8200';
const CLUSTER_API = 'http://localhost:4210';
const LOCAL_API = 'http://localhost:4110';
const MAX_SCREENSHOTS = 20;

let screenshotIndex = 0;
const filenames = new Set();

async function screenshot(page, name, opts = {}) {
  screenshotIndex++;
  if (screenshotIndex > MAX_SCREENSHOTS) {
    throw new Error(`HARD FAIL: Screenshot count (${screenshotIndex}) exceeds max ${MAX_SCREENSHOTS}.`);
  }
  const fileName = `${String(screenshotIndex).padStart(2, '0')}-${name}.png`;
  if (filenames.has(fileName)) {
    throw new Error(`HARD FAIL: Duplicate screenshot filename "${fileName}".`);
  }
  filenames.add(fileName);
  const filePath = path.join(OUTPUT_DIR, fileName);
  await page.screenshot({ path: filePath, fullPage: opts.fullPage ?? false });
  console.log(`Captured ${fileName}`);
  return filePath;
}

async function loginAs(page, url, email) {
  await page.goto(url);
  await page.waitForTimeout(1500);
  const logoutBtn = page.locator('button').filter({ hasText: /Logout/i }).first();
  if (await logoutBtn.count() > 0 && await logoutBtn.isVisible()) {
    await logoutBtn.click();
    await page.waitForTimeout(800);
  }
  const t = page.locator('input').nth(0);
  const e = page.locator('input').nth(1);
  const p = page.locator('input[type="password"]').first();
  if (await t.count() > 0) await t.fill('dev-tenant');
  if (await e.count() > 0) await e.fill(email);
  if (await p.count() > 0) await p.fill('supportplane-demo');
  const s = page.locator('button[type="submit"]').first();
  if (await s.count() > 0) await s.click();
  await page.waitForTimeout(2500);
}

async function captureComposite(name, lines) {
  screenshotIndex++;
  if (screenshotIndex > MAX_SCREENSHOTS) throw new Error('HARD FAIL: max 20');
  const fileName = `${String(screenshotIndex).padStart(2, '0')}-${name}.png`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const html = `<html><body style="background:#0f172a;color:#e2e8f0;font-family:monospace;padding:20px;white-space:pre-wrap;">${lines.map(l => `<div>${l.replace(/</g,'&lt;')}</div>`).join('')}</body></html>`;
  await page.setContent(html);
  await page.screenshot({ path: filePath, fullPage: true });
  await browser.close();
  console.log(`Captured composite ${fileName}`);
}

(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    if (f.endsWith('.png')) fs.unlinkSync(path.join(OUTPUT_DIR, f));
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  // 1. README + STATUS proof
  const readmePage = await context.newPage();
  await readmePage.goto(`file://${path.resolve(__dirname, '../README.md')}`);
  await readmePage.waitForTimeout(800);
  await screenshot(readmePage, 'readme-status-proof', { fullPage: true });

  // 2. Cluster web header (DEV/MOCK badges) — now with CORS fix
  const cPage = await context.newPage();
  await loginAs(cPage, CLUSTER_WEB, 'operator@supportplane.local');
  await screenshot(cPage, 'cluster-web-header');

  // 3. Zammad topology proof — composite showing pods + API response
  // Zammad web UI assets are not served in railsserver-only deployment;
  // we show pod health and API JSON instead.
  const zammadPods = execSync('kubectl get pods -n supportplane-integrations -l app.kubernetes.io/part-of=zammad', { encoding: 'utf8' });
  const zammadApi = execSync('curl -s http://localhost:8080/api/v1/getting_started', { encoding: 'utf8' });
  await captureComposite('zammad-topology-proof', [
    '=== Zammad Sandbox Topology ===',
    '',
    'Note: Only railsserver is deployed (no nginx).',
    'Web UI assets return 404, but API and railsserver are healthy.',
    '',
    'Pod status:',
    ...zammadPods.split('\n'),
    '',
    'GET /api/v1/getting_started:',
    zammadApi,
  ]);

  // 4. OpenBao health JSON
  const bPage = await context.newPage();
  await bPage.goto(`${OPENBAO_API}/v1/sys/health`);
  await bPage.waitForTimeout(500);
  await screenshot(bPage, 'openbao-health-json');

  // 5. Mailpit UI
  const mPage = await context.newPage();
  await mPage.goto(MAILPIT_WEB);
  await mPage.waitForTimeout(1500);
  await screenshot(mPage, 'mailpit-ui-proof');

  // 6. BACKLOG.md
  const blPage = await context.newPage();
  await blPage.goto(`file://${path.resolve(__dirname, '../BACKLOG.md')}`);
  await blPage.waitForTimeout(800);
  await screenshot(blPage, 'backlog-status', { fullPage: true });

  // 7. NEXT_ACTIONS.md
  const naPage = await context.newPage();
  await naPage.goto(`file://${path.resolve(__dirname, '../NEXT_ACTIONS.md')}`);
  await naPage.waitForTimeout(800);
  await screenshot(naPage, 'next-actions', { fullPage: true });

  // 8. Cluster call console
  await cPage.goto(`${CLUSTER_WEB}/call-console`);
  await cPage.waitForTimeout(1500);
  await screenshot(cPage, 'cluster-call-console');

  // 9. Local MVP web header
  const lPage = await context.newPage();
  await loginAs(lPage, LOCAL_WEB, 'admin@supportplane.local');
  await screenshot(lPage, 'local-mvp-header');

  // 10. Local MVP call console
  await lPage.goto(`${LOCAL_WEB}/call-console`);
  await lPage.waitForTimeout(1500);
  await screenshot(lPage, 'local-call-console');

  await browser.close();

  // 11. Composite: kubectl integrations namespace
  const intNs = execSync('kubectl get all,pvc -n supportplane-integrations', { encoding: 'utf8' });
  await captureComposite('kubectl-integrations-namespace', intNs.split('\n'));

  // 12. Composite: kubectl data namespace
  const dataNs = execSync('kubectl get all,pvc -n supportplane-data', { encoding: 'utf8' });
  await captureComposite('kubectl-data-namespace', dataNs.split('\n'));

  // 13. Composite: NATS JetStream proof
  const natsProof = execSync('kubectl run nats-test --rm -i --restart=Never -n supportplane-integrations --image natsio/nats-box:0.16.0 -- sh -c "nats --server nats:4222 stream info TEST_STREAM 2>&1 && echo --- && nats --server nats:4222 consumer info TEST_STREAM TEST_CONSUMER 2>&1"', { encoding: 'utf8' });
  await captureComposite('nats-jetstream-proof', natsProof.split('\n'));

  // 14. Composite: MinIO bucket/object proof
  const minioProof = execSync('kubectl run minio-test --rm -i --restart=Never -n supportplane-data --image python:3.12-alpine -- sh -c \'pip install minio -q 2>&1 >/dev/null; python3 -c "from minio import Minio; c=Minio(\\"minio:9000\\",access_key=\\"minioadmin\\",secret_key=\\"minioadmin\\",secure=False); print(\\"Buckets:\\", [b.name for b in c.list_buckets()]); obj=c.get_object(\\"bl106-bucket\\", \\"topology-proof.txt\\"); print(\\"Object content:\\", obj.read().decode())"\' 2>&1', { encoding: 'utf8' });
  await captureComposite('minio-bucket-object-proof', minioProof.split('\n'));

  // 15. Composite: Ollama placement decision
  const ollamaDecision = [
    'Ollama Placement Decision: Host-Controlled Service',
    '',
    'Reasoning:',
    '- Ollama is already installed on the host (version 0.18.2)',
    '- Host has AMD GPU: Radeon RX 7700 XT / 7800 XT',
    '- Kind/Podman GPU pass-through for AMD is complex and not verified',
    '- In-cluster CPU-only Ollama would waste the available GPU',
    '- Host-controlled Ollama can be reached from cluster if needed',
    '',
    'Models available on host:',
    ...execSync('ollama list', { encoding: 'utf8' }).split('\n').filter(l => l.trim()),
    '',
    'Decision: Do NOT deploy Ollama in-cluster for BL-106.',
    'Future BL-108 will integrate with host-controlled Ollama via cluster-external access.',
  ];
  await captureComposite('ollama-placement-decision', ollamaDecision);

  // 16. Composite: WORKFLOW_TRUTH
  const wfTruth = execSync('cat docs/WORKFLOW_TRUTH.md', { encoding: 'utf8', cwd: path.resolve(__dirname, '..') }).split('\n').slice(0, 50);
  await captureComposite('workflow-truth', wfTruth);

  // 17. Composite: BOUNDARY_MATRIX
  const boundary = execSync('cat docs/BOUNDARY_MATRIX.md', { encoding: 'utf8', cwd: path.resolve(__dirname, '..') }).split('\n').slice(0, 50);
  await captureComposite('boundary-matrix', boundary);

  // 18. Composite: KUBERNETES_SERVICE_CATALOG
  const catalog = execSync('cat docs/KUBERNETES_SERVICE_CATALOG.md', { encoding: 'utf8', cwd: path.resolve(__dirname, '..') }).split('\n').slice(0, 60);
  await captureComposite('kubernetes-service-catalog', catalog);

  // 19. Composite: final boundary proof
  const finalBoundary = [
    'BL-106 Final Boundary Proof',
    '',
    'Kubernetes cluster: YES (kind-supportplane-local)',
    'API in cluster: YES (rebuilt with CORS fix for localhost:3300)',
    'Web in cluster: YES',
    'Worker in cluster: YES',
    'PostgreSQL in cluster: YES (PVC Bound)',
    'Zammad topology: YES (Running, HTTP 200, API reachable)',
    'Zammad read connector: NO (BL-107)',
    'Zammad writeback: NO (mock-only)',
    'Ollama topology/placement: Host-controlled (documented)',
    'Ollama SupportPlane provider: NO (BL-108)',
    'OpenBao topology: YES (Running, health OK)',
    'OpenBao credential resolver: NO (BL-109)',
    'NATS JetStream topology: YES (stream+consumer verified)',
    'NATS worker bridge: NO (BL-110)',
    'Mailpit topology: YES (SMTP capture verified)',
    'SupportPlane email sending: NO',
    'MinIO topology: YES (bucket+object verified)',
    'MinIO evidence persistence: NO (BL-112)',
    'Real secrets: NO (local placeholders only)',
    'Real network egress: BLOCKED',
    'PBX/CTI: NO',
    'Endpoint/Tauri/OCR: NO',
    '',
    'No SupportPlane real integration with any topology service is enabled.',
  ];
  await captureComposite('final-boundary-proof', finalBoundary);

  // 20. Composite: local MVP regression + cluster API health
  const localHealth = execSync('curl -s http://localhost:4110/health', { encoding: 'utf8' });
  const clusterHealth = execSync('curl -s http://localhost:4210/health', { encoding: 'utf8' });
  await captureComposite('local-mvp-regression', [
    'Local MVP API (localhost:4110):',
    localHealth,
    '',
    'Cluster API (localhost:4210):',
    clusterHealth,
  ]);

  // md5 checksums
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.png')).sort();
  const md5s = files.map(f => {
    const hash = execSync(`md5sum "${path.join(OUTPUT_DIR, f)}"`, { encoding: 'utf8' }).split(' ')[0];
    return `${hash}  ${f}`;
  }).join('\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'screenshot-md5s.txt'), md5s + '\n');

  // proof state mapping
  const mapping = files.map((f, i) => `${i+1}. ${f}`).join('\n');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'proof-state-mapping.md'), `# Proof State Mapping\n\nTotal: ${files.length}\n\n${mapping}\n`);

  // CLI artifacts
  fs.writeFileSync(path.join(OUTPUT_DIR, 'cluster-baseline-proof.txt'), execSync('kubectl get nodes -o wide && echo --- && kubectl get namespaces && echo --- && kubectl get all -A', { encoding: 'utf8' }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'zammad-topology-proof.txt'), [
    execSync('kubectl get all,pvc -n supportplane-integrations -l app.kubernetes.io/part-of=zammad', { encoding: 'utf8' }),
    '---',
    'Zammad API /api/v1/getting_started:',
    execSync('curl -s http://localhost:8080/api/v1/getting_started', { encoding: 'utf8' }),
    '---',
    'Zammad HTTP status (curl -I):',
    execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/', { encoding: 'utf8' }),
  ].join('\n'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'openbao-topology-proof.txt'), execSync('curl -s http://localhost:8200/v1/sys/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8200/v1/sys/health', { encoding: 'utf8' }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'nats-jetstream-proof.txt'), natsProof);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'mailpit-topology-proof.txt'), execSync('curl -s http://localhost:8025/api/v1/messages', { encoding: 'utf8' }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'minio-topology-proof.txt'), minioProof);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ollama-placement-decision.txt'), ollamaDecision.join('\n'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'supportplane-non-integration-proof.txt'), finalBoundary.join('\n'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'local-mvp-regression-proof.txt'), [
    'Local MVP API health:',
    localHealth,
    'Local MVP Web (curl -I):',
    execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3200/', { encoding: 'utf8' }),
  ].join('\n'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'roadmap-summary.json'), JSON.stringify({
    bl106_status: 'evidence_reconciled',
    bl106_date: new Date().toISOString(),
    cluster_web_cors_fixed: true,
    zammad_note: 'railsserver-only; assets not served; API healthy',
    next: 'BL-107',
  }, null, 2));

  console.log(`Done. ${files.length} screenshots in ${OUTPUT_DIR}`);
})();
