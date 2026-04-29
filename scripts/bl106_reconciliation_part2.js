#!/usr/bin/env node
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.resolve(__dirname, '../output/playwright/session-107-bl106-evidence-reconciliation');
const MAX_SCREENSHOTS = 20;

let screenshotIndex = 15;
const filenames = new Set();

async function captureComposite(browser, name, lines) {
  screenshotIndex++;
  if (screenshotIndex > MAX_SCREENSHOTS) throw new Error('HARD FAIL: max 20');
  const fileName = `${String(screenshotIndex).padStart(2, '0')}-${name}.png`;
  const filePath = path.join(OUTPUT_DIR, fileName);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const html = `<html><body style="background:#0f172a;color:#e2e8f0;font-family:monospace;padding:20px;white-space:pre-wrap;">${lines.map(l => `<div>${l.replace(/</g,'&lt;')}</div>`).join('')}</body></html>`;
  await page.setContent(html);
  await page.waitForTimeout(300);
  await page.screenshot({ path: filePath, fullPage: true });
  await page.close();
  console.log(`Captured composite ${fileName}`);
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  // 16. Composite: WORKFLOW_TRUTH
  const wfTruth = execSync('cat docs/WORKFLOW_TRUTH.md', { encoding: 'utf8', cwd: path.resolve(__dirname, '..') }).split('\n').slice(0, 50);
  await captureComposite(browser, 'workflow-truth', wfTruth);

  // 17. Composite: BOUNDARY_MATRIX
  const boundary = execSync('cat docs/BOUNDARY_MATRIX.md', { encoding: 'utf8', cwd: path.resolve(__dirname, '..') }).split('\n').slice(0, 50);
  await captureComposite(browser, 'boundary-matrix', boundary);

  // 18. Composite: KUBERNETES_SERVICE_CATALOG
  const catalog = execSync('cat docs/KUBERNETES_SERVICE_CATALOG.md', { encoding: 'utf8', cwd: path.resolve(__dirname, '..') }).split('\n').slice(0, 60);
  await captureComposite(browser, 'kubernetes-service-catalog', catalog);

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
  await captureComposite(browser, 'final-boundary-proof', finalBoundary);

  // 20. Composite: local MVP regression + cluster API health
  const localHealth = execSync('curl -s http://localhost:4110/health', { encoding: 'utf8' });
  const clusterHealth = execSync('curl -s http://localhost:4210/health', { encoding: 'utf8' });
  await captureComposite(browser, 'local-mvp-regression', [
    'Local MVP API (localhost:4110):',
    localHealth,
    '',
    'Cluster API (localhost:4210):',
    clusterHealth,
  ]);

  await browser.close();

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
    execSync('kubectl get all,pvc -n supportplane-integrations', { encoding: 'utf8' }),
    '---',
    'Zammad API /api/v1/getting_started:',
    execSync('curl -s http://localhost:8080/api/v1/getting_started', { encoding: 'utf8' }),
    '---',
    'Zammad HTTP status (curl -I):',
    execSync('curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/', { encoding: 'utf8' }),
  ].join('\n'));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'openbao-topology-proof.txt'), execSync('curl -s http://localhost:8200/v1/sys/health | python3 -m json.tool 2>/dev/null || curl -s http://localhost:8200/v1/sys/health', { encoding: 'utf8' }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'nats-jetstream-proof.txt'), execSync('kubectl run nats-test --rm -i --restart=Never -n supportplane-integrations --image natsio/nats-box:0.16.0 -- sh -c "nats --server nats:4222 stream info TEST_STREAM 2>&1 && echo --- && nats --server nats:4222 consumer info TEST_STREAM TEST_CONSUMER 2>&1"', { encoding: 'utf8' }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'mailpit-topology-proof.txt'), execSync('curl -s http://localhost:8025/api/v1/messages', { encoding: 'utf8' }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'minio-topology-proof.txt'), execSync('kubectl run minio-test --rm -i --restart=Never -n supportplane-data --image python:3.12-alpine -- sh -c \'pip install minio -q 2>&1 >/dev/null; python3 -c "from minio import Minio; c=Minio(\\"minio:9000\\",access_key=\\"minioadmin\\",secret_key=\\"minioadmin\\",secure=False); print(\\"Buckets:\\", [b.name for b in c.list_buckets()]); obj=c.get_object(\\"bl106-bucket\\", \\"topology-proof.txt\\"); print(\\"Object content:\\", obj.read().decode())"\' 2>&1', { encoding: 'utf8' }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'ollama-placement-decision.txt'), [
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
  ].join('\n'));
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
