#!/usr/bin/env node
// E2E test for BL-111/112/113: Controlled sandbox writeback pipeline
// Usage: node e2e_sandbox_writeback.js

const API_BASE = process.env.API_BASE || 'http://localhost:4210';
const ZAMMAD_BASE = process.env.ZAMMAD_BASE || 'http://zammad.supportplane-integrations.svc.cluster.local:3000';
const ZAMMAD_TOKEN = process.env.ZAMMAD_TOKEN || 'yk9RJPhOfO3Qkzut8C8bskyMd2cY87pYkpkOZ2NCYj8ffdsUNxSblJgjHYSvr970';
const MINIO_BASE = process.env.MINIO_BASE || 'http://minio.supportplane-data.svc.cluster.local:9000';
const MINIO_BUCKET = process.env.MINIO_BUCKET || 'supportplane-evidence';
const MINIO_ACCESS = process.env.MINIO_ACCESS || 'minioadmin';
const MINIO_SECRET = process.env.MINIO_SECRET || 'minioadmin123';
const MAILPIT_BASE = process.env.MAILPIT_BASE || 'http://mailpit.supportplane-integrations.svc.cluster.local:8025';

const TENANT = 'dev-tenant';
const USER = 'test-agent@supportplane.local';

let sessionId, actionId, outboxItemId;
let results = [];

function log(label, data) {
  const entry = { label, data, time: new Date().toISOString() };
  results.push(entry);
  console.log(`\n=== ${label} ===`);
  if (data !== undefined) console.log(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
}

async function api(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: {
      'content-type': 'application/json',
      'x-tenant-id': TENANT,
      'x-user-id': USER,
      ...(opts.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, body };
}

async function zammad(path) {
  const res = await fetch(`${ZAMMAD_BASE}${path}`, {
    headers: { 'Authorization': `Token token=${ZAMMAD_TOKEN}` },
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function minioList(prefix) {
  const res = await fetch(`${MINIO_BASE}/${MINIO_BUCKET}?prefix=${encodeURIComponent(prefix)}&list-type=2`, {
    headers: { 'Authorization': 'Basic ' + Buffer.from(`${MINIO_ACCESS}:${MINIO_SECRET}`).toString('base64') },
  });
  const xml = await res.text();
  return { status: res.status, xml };
}

async function mailpitMessages() {
  const res = await fetch(`${MAILPIT_BASE}/api/v1/messages`);
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

async function run() {
  console.log('=== BL-111/112/113 E2E Sandbox Writeback Test ===');
  console.log(`API: ${API_BASE}`);
  console.log(`Started: ${new Date().toISOString()}`);

  // Step 1: Health check
  const health = await api('/health');
  log('Step 1: API Health', health.body);
  if (health.status !== 200) throw new Error(`API health failed: ${health.status}`);

  // Step 2: Create support session
  const sessionRes = await api('/support-sessions', {
    method: 'POST',
    body: JSON.stringify({
      title: 'BL-111 E2E Sandbox Writeback Test',
      description: 'End-to-end test of controlled sandbox writeback pipeline',
      priority: 'high',
      linkedTicketIds: ['2'],
    }),
  });
  sessionId = sessionRes.body.id;
  log('Step 2: Created Session', { id: sessionId, status: sessionRes.status });
  if (sessionRes.status !== 201) throw new Error(`Session create failed: ${sessionRes.status}`);

  // Step 3: Create action with externalTicketId
  const actionRes = await api('/actions', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      actionType: 'internal_note',
      requestedBy: USER,
      body: 'This is a sandbox internal note writeback test. No production impact.',
      payloadSummary: { externalTicketId: '2', ticketNumber: '68002', noteType: 'internal' },
      connectorInstallationId: 'conn-inst-dev-001',
    }),
  });
  actionId = actionRes.body.id;
  log('Step 3: Created Action', { id: actionId, status: actionRes.status, ...actionRes.body });
  if (actionRes.status !== 201) throw new Error(`Action create failed: ${actionRes.status}`);

  // Step 4: Submit for review
  const submitRes = await api(`/actions/${actionId}/submit`, { method: 'POST', body: JSON.stringify({}) });
  log('Step 4: Submitted for Review', { status: submitRes.status, ...submitRes.body });
  if (submitRes.status !== 200) throw new Error(`Submit failed: ${submitRes.status}`);

  // Step 5: Review (approve)
  const reviewRes = await api(`/actions/${actionId}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'approve', reason: 'E2E test approval' }),
  });
  log('Step 5: Reviewed', { status: reviewRes.status, ...reviewRes.body });
  if (reviewRes.status !== 200) throw new Error(`Review failed: ${reviewRes.status}`);

  // Step 6: Queue
  const queueRes = await api(`/actions/${actionId}/queue`, { method: 'POST', body: JSON.stringify({}) });
  log('Step 6: Queued', { status: queueRes.status, ...queueRes.body });
  if (queueRes.status !== 200) throw new Error(`Queue failed: ${queueRes.status}`);
  outboxItemId = queueRes.body.outboxItemId;

  // Step 7: Check delivery policy decision
  const policyRes = await api(`/actions/${actionId}/policy-check`, { method: 'POST', body: JSON.stringify({}) });
  log('Step 7: Policy Check', { status: policyRes.status, ...policyRes.body });

  // Step 8: Process outbox once (with valid service token)
  const serviceToken = process.env.SERVICE_TOKEN;
  const processRes = await api('/outbox/process-once', {
    method: 'POST',
    headers: {
      'x-supportplane-service-token': serviceToken,
      'x-service-actor': 'e2e-test-worker',
    },
    body: JSON.stringify({}),
  });
  log('Step 8: Process Outbox', { status: processRes.status, ...processRes.body });

  // Step 9: Verify outbox item status
  const outboxRes = await api(`/outbox/${outboxItemId}`);
  log('Step 9: Outbox Item Status', { status: outboxRes.status, ...outboxRes.body });

  // Step 10: Verify Zammad ticket has new internal note
  const ticketRes = await zammad(`/api/v1/tickets/2?expand=true`);
  log('Step 10: Zammad Ticket', { status: ticketRes.status, id: ticketRes.body?.id, title: ticketRes.body?.title });

  // Step 11: Get ticket articles to find our note
  const articlesRes = await zammad(`/api/v1/ticket_articles/by_ticket/2`);
  const ourArticle = articlesRes.body?.find?.(a => a.body?.includes('sandbox internal note'));
  log('Step 11: Zammad Articles', {
    status: articlesRes.status,
    totalArticles: articlesRes.body?.length,
    ourArticleFound: !!ourArticle,
    ourArticleId: ourArticle?.id,
    ourArticleSubject: ourArticle?.subject,
    ourArticleBodyPreview: ourArticle?.body?.substring(0, 200),
  });

  // Step 12: Check MinIO evidence
  const minioRes = await minioList(`supportplane-evidence/${TENANT}/writebacks/${sessionId}/`);
  log('Step 12: MinIO Evidence', { status: minioRes.status, prefix: `supportplane-evidence/${TENANT}/writebacks/${sessionId}/` });

  // Step 13: Check Mailpit messages
  const mailRes = await mailpitMessages();
  log('Step 13: Mailpit Messages', { status: mailRes.status, totalMessages: mailRes.body?.messages?.length });

  // Summary
  const summary = {
    passed: !!ourArticle,
    sessionId,
    actionId,
    outboxItemId,
    zammadArticleId: ourArticle?.id,
    zammadArticleFound: !!ourArticle,
    minioStatus: minioRes.status,
    mailpitStatus: mailRes.status,
    outboxDeliveryMode: outboxRes.body?.deliveryMode,
    outboxStatus: outboxRes.body?.status,
    processResult: processRes.body?.processed ? 'processed' : 'not_processed',
    processReason: processRes.body?.reason,
  };
  log('SUMMARY', summary);

  // Write full results
  if (process.argv.includes('--json')) {
    console.log('\n=== FULL JSON ===');
    console.log(JSON.stringify({ summary, results }, null, 2));
  }

  return summary;
}

run()
  .then(s => {
    console.log(`\n=== E2E TEST ${s.passed ? 'PASSED' : 'FAILED'} ===`);
    process.exit(s.passed ? 0 : 1);
  })
  .catch(e => {
    console.error('\n=== E2E TEST ERROR ===', e.message);
    console.error(e.stack);
    process.exit(1);
  });
