const API_URL = process.env['SUPPORTPLANE_API_URL'] ?? 'http://localhost:4110';
const WORKER_ID = process.env['SUPPORTPLANE_WORKER_ID'] ?? `local-worker-${process.pid}`;
const ADMIN_EMAIL = process.env['SUPPORTPLANE_WORKER_EMAIL'] ?? 'admin@supportplane.local';
const ADMIN_PASSWORD = process.env['SUPPORTPLANE_WORKER_PASSWORD'] ?? 'supportplane-demo';

type Command = 'process-once' | 'loop' | 'status';

async function login(): Promise<string> {
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

async function apiPost<T>(path: string, cookie: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify(body ?? {}),
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${path} failed with HTTP ${response.status}: ${text}`);
  return JSON.parse(text) as T;
}

async function apiGet<T>(path: string, cookie: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, { headers: { cookie } });
  const text = await response.text();
  if (!response.ok) throw new Error(`${path} failed with HTTP ${response.status}: ${text}`);
  return JSON.parse(text) as T;
}

async function processOnce(cookie: string): Promise<Record<string, unknown>> {
  return apiPost('/outbox/process-once', cookie, { workerId: WORKER_ID });
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

  const intervalMs = Number(process.env['SUPPORTPLANE_WORKER_INTERVAL_MS'] ?? '2000');
  let shuttingDown = false;
  process.on('SIGINT', () => {
    shuttingDown = true;
  });
  process.on('SIGTERM', () => {
    shuttingDown = true;
  });
  console.log(JSON.stringify({ workerId: WORKER_ID, mode: 'local_mock_worker', queueBackend: 'postgres-local-outbox', apiUrl: API_URL }));
  while (!shuttingDown) {
    const result = await processOnce(cookie);
    console.log(JSON.stringify(result));
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
