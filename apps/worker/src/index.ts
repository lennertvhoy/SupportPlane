import { AckPolicy, connect, StorageType, StringCodec } from 'nats';
import { createCorrelationId, getHeaders } from './helpers.js';

const API_URL = process.env['SUPPORTPLANE_API_URL'] ?? 'http://localhost:4110';
const WORKER_ID = process.env['SUPPORTPLANE_WORKER_ID'] ?? `local-worker-${process.pid}`;
const ADMIN_EMAIL = process.env['SUPPORTPLANE_WORKER_EMAIL'] ?? 'admin@supportplane.local';
const ADMIN_PASSWORD = process.env['SUPPORTPLANE_WORKER_PASSWORD'] ?? 'supportplane-demo';
const SERVICE_TOKEN = process.env['SUPPORTPLANE_INTERNAL_SERVICE_TOKEN'];
const QUEUE_BACKEND = process.env['SUPPORTPLANE_QUEUE_BACKEND'] ?? 'postgres-local-outbox';
const NATS_STREAM = process.env['NATS_OUTBOX_STREAM'] ?? 'SUPPORTPLANE_OUTBOX';
const NATS_SUBJECT = process.env['NATS_OUTBOX_SUBJECT'] ?? 'supportplane.outbox.ready';
const NATS_CONSUMER = process.env['NATS_OUTBOX_CONSUMER'] ?? 'SUPPORTPLANE_WORKER';

type Command = 'process-once' | 'loop' | 'status';

async function login(): Promise<string> {
  // Prefer service token auth; fall back to local auth login only if no service token.
  if (SERVICE_TOKEN && SERVICE_TOKEN.length >= 16) {
    return 'service-token-auth';
  }
  const response = await fetch(`${API_URL}/auth/local/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!response.ok) {
    throw new Error(`Worker local-auth login failed with HTTP ${response.status}`);
  }
  const cookie = response.headers.get('set-cookie')?.split(';')[0];
  if (!cookie) throw new Error('Worker local-auth login did not return a session cookie');
  return cookie;
}

async function apiPost<T>(
  path: string,
  _cookie: string,
  body?: Record<string, unknown>,
  tenantId?: string,
): Promise<T> {
  const headers = getHeaders(
    tenantId,
    typeof body?.['correlationId'] === 'string' ? body['correlationId'] : undefined,
  );
  if (!_cookie.startsWith('service-token-auth')) {
    headers['cookie'] = _cookie;
  }
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body ?? {}),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${path} failed with HTTP ${response.status}: ${text}`);
  return JSON.parse(text) as T;
}

async function apiGet<T>(path: string, _cookie: string, tenantId?: string): Promise<T> {
  const headers = getHeaders(tenantId);
  if (!_cookie.startsWith('service-token-auth')) {
    headers['cookie'] = _cookie;
  }
  const response = await fetch(`${API_URL}${path}`, { headers });
  const text = await response.text();
  if (!response.ok) throw new Error(`${path} failed with HTTP ${response.status}: ${text}`);
  return JSON.parse(text) as T;
}

async function processOnce(cookie: string): Promise<Record<string, unknown>> {
  return apiPost('/outbox/process-once', cookie, {
    workerId: WORKER_ID,
    correlationId: createCorrelationId(),
  });
}

async function processSpecific(
  cookie: string,
  outboxItemId: string,
  correlationId?: string,
): Promise<Record<string, unknown>> {
  return apiPost('/outbox/process-once', cookie, {
    workerId: WORKER_ID,
    outboxItemId,
    correlationId: correlationId ?? createCorrelationId(),
  });
}

async function status(cookie: string): Promise<Record<string, unknown>> {
  return apiGet('/outbox/worker/status', cookie);
}

async function main() {
  const command = (process.argv[2] ?? 'status') as Command;
  if (!['process-once', 'loop', 'status'].includes(command)) {
    throw new Error(`Unknown worker command ${command}`);
  }
  const cookie = await login();
  if (command === 'status') {
    console.log(JSON.stringify(await status(cookie), null, 2));
    return;
  }
  if (command === 'process-once') {
    console.log(JSON.stringify(await processOnce(cookie), null, 2));
    return;
  }

  if (QUEUE_BACKEND === 'nats-jetstream' && process.env['NATS_URL']) {
    await loopNats(cookie);
    return;
  }

  const intervalMs = Number(process.env['SUPPORTPLANE_WORKER_INTERVAL_MS'] ?? '2000');
  let shuttingDown = false;
  process.on('SIGINT', () => {
    shuttingDown = true;
  });
  process.on('SIGTERM', () => {
    shuttingDown = true;
  });
  console.log(
    JSON.stringify({
      workerId: WORKER_ID,
      mode: 'local_mock_worker',
      queueBackend: 'postgres-local-outbox',
      apiUrl: API_URL,
    }),
  );
  while (!shuttingDown) {
    const result = await processOnce(cookie);
    console.log(JSON.stringify(result));
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

async function loopNats(cookie: string) {
  const intervalMs = Number(process.env['SUPPORTPLANE_WORKER_INTERVAL_MS'] ?? '2000');
  let shuttingDown = false;
  process.on('SIGINT', () => {
    shuttingDown = true;
  });
  process.on('SIGTERM', () => {
    shuttingDown = true;
  });
  console.log(
    JSON.stringify({
      workerId: WORKER_ID,
      mode: 'local_sandbox_worker',
      queueBackend: 'nats-jetstream',
      fallbackQueueBackend: 'postgres-local-outbox',
      stream: NATS_STREAM,
      consumer: NATS_CONSUMER,
      apiUrl: API_URL,
    }),
  );

  const nc = await connect({ servers: process.env['NATS_URL'] });
  const sc = StringCodec();
  try {
    const jsm = await nc.jetstreamManager();
    try {
      await jsm.streams.info(NATS_STREAM);
    } catch {
      await jsm.streams.add({
        name: NATS_STREAM,
        subjects: ['supportplane.outbox.*'],
        storage: StorageType.File,
      });
    }
    try {
      await jsm.consumers.info(NATS_STREAM, NATS_CONSUMER);
    } catch {
      await jsm.consumers.add(NATS_STREAM, {
        durable_name: NATS_CONSUMER,
        ack_policy: AckPolicy.Explicit,
        filter_subject: NATS_SUBJECT,
      });
    }

    const js = nc.jetstream();
    const consumer = await js.consumers.get(NATS_STREAM, NATS_CONSUMER);
    while (!shuttingDown) {
      const messages = await consumer.fetch({ max_messages: 1, expires: 1000 });
      let processedAny = false;
      for await (const message of messages) {
        processedAny = true;
        const envelope = JSON.parse(sc.decode(message.data)) as {
          outboxItemId?: string;
          idempotencyKey?: string;
          telemetry?: { correlationId?: string };
        };
        if (!envelope.outboxItemId) {
          message.ack();
          continue;
        }
        const correlationId = envelope.telemetry?.correlationId ?? createCorrelationId();
        const result = await processSpecific(cookie, envelope.outboxItemId, correlationId);
        console.log(
          JSON.stringify({
            service: 'supportplane-worker',
            event: 'nats_outbox_message_processed',
            correlationId,
            queueBackend: 'nats-jetstream',
            stream: NATS_STREAM,
            consumer: NATS_CONSUMER,
            outboxItemId: envelope.outboxItemId,
            idempotencyKey: envelope.idempotencyKey,
            result,
          }),
        );
        message.ack();
      }
      if (!processedAny) {
        const fallback = await processOnce(cookie);
        console.log(
          JSON.stringify({ queueBackend: 'fallback-postgres-local-outbox', result: fallback }),
        );
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }
    }
  } finally {
    await nc.drain().catch(() => undefined);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
