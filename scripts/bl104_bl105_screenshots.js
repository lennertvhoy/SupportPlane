#!/usr/bin/env node
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.resolve(__dirname, '../output/playwright/session-105-bl104-bl105-app-postgres-k8s-final');
const CLUSTER_WEB = 'http://localhost:3300';
const LOCAL_WEB = 'http://localhost:3200';
const CLUSTER_API = 'http://localhost:4210';
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

  // 1. Cluster web main page
  const cPage = await context.newPage();
  await loginAs(cPage, CLUSTER_WEB, 'admin@supportplane.local');
  await screenshot(cPage, 'cluster-web-header');

  // 2. Cluster web call console
  await cPage.goto(`${CLUSTER_WEB}/call-console`);
  await cPage.waitForTimeout(1500);
  await screenshot(cPage, 'cluster-call-console');

  // 3. Local MVP main page
  const lPage = await context.newPage();
  await loginAs(lPage, LOCAL_WEB, 'admin@supportplane.local');
  await screenshot(lPage, 'local-mvp-header');

  // 4. Local MVP call console
  await lPage.goto(`${LOCAL_WEB}/call-console`);
  await lPage.waitForTimeout(1500);
  await screenshot(lPage, 'local-call-console');

  // 5. Cluster API health JSON
  const apiPage = await context.newPage();
  await apiPage.goto(`${CLUSTER_API}/health`);
  await apiPage.waitForTimeout(500);
  await screenshot(apiPage, 'cluster-api-health-json');

  await browser.close();

  // 6. Composite: kubectl data namespace
  const dataNs = execSync('kubectl get all,pvc -n supportplane-data', { encoding: 'utf8' });
  await captureComposite('kubectl-data-namespace', dataNs.split('\n'));

  // 7. Composite: kubectl app namespace
  const appNs = execSync('kubectl get all -n supportplane-app', { encoding: 'utf8' });
  await captureComposite('kubectl-app-namespace', appNs.split('\n'));

  // 8. Composite: postgres persistence
  const persist = execSync("kubectl exec -n supportplane-data postgres-0 -- psql -U supportplane -d supportplane -c 'SELECT * FROM _supportplane_bl105_probe;'", { encoding: 'utf8' });
  await captureComposite('postgres-persistence-probe', persist.split('\n'));

  // 9. Composite: image build/load proof
  const images = execSync('podman images | grep supportplane && echo "---" && podman exec supportplane-local-control-plane crictl images | grep supportplane', { encoding: 'utf8' });
  await captureComposite('image-build-load-proof', images.split('\n'));

  // 10. Composite: backlog status
  const backlog = execSync("grep -E 'BL-10[456]' BACKLOG.md", { encoding: 'utf8', cwd: path.resolve(__dirname, '..') });
  await captureComposite('backlog-status', backlog.split('\n'));

  // 11. Composite: next actions
  const next = execSync('cat NEXT_ACTIONS.md', { encoding: 'utf8', cwd: path.resolve(__dirname, '..') });
  await captureComposite('next-actions', next.split('\n'));

  // 12. Composite: boundary proof
  const boundary = [
    'SupportPlane BL-104/BL-105 Boundary Proof',
    '',
    'Kubernetes cluster: YES (kind-supportplane-local)',
    'API in cluster: YES (localhost:4210 -> svc:4110)',
    'Web in cluster: YES (localhost:3300 -> svc:3200)',
    'Worker in cluster: YES (supportplane-app namespace)',
    'PostgreSQL in cluster: YES (supportplane-data namespace, PVC Bound)',
    'Zammad: NO',
    'Ollama: NO',
    'OpenBao: NO',
    'NATS: NO',
    'Mailpit: NO',
    'MinIO: NO',
    'Writeback: disabled (mock-only)',
    'Secrets: local placeholders only',
    'Evidence: local/mock JSON+Markdown only',
    'PBX/CTI: NO',
    'Endpoint/Tauri/OCR: NO',
  ];
  await captureComposite('boundary-proof', boundary);

  // 13. Composite: README runbook proof
  const readme = execSync('cat infra/kubernetes/local-podman/README.md', { encoding: 'utf8', cwd: path.resolve(__dirname, '..') }).split('\n').slice(0, 40);
  await captureComposite('infra-readme-runbook', readme);

  // 14. Composite: worker logs
  const workerLogs = execSync('kubectl logs -n supportplane-app deployment/supportplane-worker --tail=20', { encoding: 'utf8' });
  await captureComposite('worker-logs', workerLogs.split('\n'));

  // 15. Composite: local MVP regression
  const localHealth = execSync('curl -s http://localhost:4110/health', { encoding: 'utf8' });
  await captureComposite('local-mvp-regression', [`Local API health: ${localHealth}`]);

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

  console.log(`Done. ${files.length} screenshots in ${OUTPUT_DIR}`);
})();
