const SERVICE_TOKEN = process.env['SUPPORTPLANE_INTERNAL_SERVICE_TOKEN'];
const WORKER_ID = process.env['SUPPORTPLANE_WORKER_ID'] ?? `local-worker-${process.pid}`;

export function createCorrelationId(): string {
  return `sp-worker-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getHeaders(tenantId?: string, correlationId?: string): Record<string, string> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  headers['x-correlation-id'] = correlationId ?? createCorrelationId();
  if (SERVICE_TOKEN && SERVICE_TOKEN.length >= 16) {
    headers['x-supportplane-service-token'] = SERVICE_TOKEN;
    headers['x-service-actor'] = WORKER_ID;
    headers['x-tenant-id'] = tenantId ?? 'dev-tenant';
  }
  return headers;
}
