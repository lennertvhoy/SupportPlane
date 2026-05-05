'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BrainCircuit,
  Database,
  Loader2,
  Mail,
  RefreshCw,
  Server,
  ShieldCheck,
  Waves,
} from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import {
  api,
  ApiClientError,
  type ApiHealthStatus,
  type AuthIdentity,
  type ObservabilityStatus,
  type OutboxWorkerStatus,
} from '@/lib/api';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

function text(value: unknown, fallback = 'not currently reported') {
  if (typeof value === 'string' && value.trim().length > 0) return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function boolText(value: unknown, fallback = 'not currently reported') {
  return typeof value === 'boolean' ? String(value) : fallback;
}

function toneFor(value: unknown): StatusTone {
  const normalized = String(value ?? '').toLowerCase();
  if (
    [
      'healthy',
      'ready',
      'running',
      'enabled',
      'ok',
      'connected',
      'active',
      'sandbox_delivered',
      'success',
    ].some((term) => normalized.includes(term))
  )
    return 'success';
  if (
    ['degraded', 'unknown', 'not currently reported', 'unavailable', 'pending'].some((term) =>
      normalized.includes(term),
    )
  )
    return 'warning';
  if (
    ['down', 'failed', 'error', 'unhealthy', 'disabled', 'blocked'].some((term) =>
      normalized.includes(term),
    )
  )
    return 'danger';
  return 'muted';
}

function MiniMetric({ label, value, tone }: { label: string; value: string; tone?: StatusTone }) {
  return (
    <div className="min-w-0 rounded border border-cockpit-700 bg-cockpit-900/40 px-2 py-1.5">
      <div className="truncate text-[10px] uppercase text-cockpit-400">{label}</div>
      <div className="mt-1 flex items-center gap-2">
        {tone && (
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone === 'success' ? 'bg-emerald-400' : tone === 'danger' ? 'bg-red-400' : tone === 'warning' ? 'bg-amber-400' : 'bg-cockpit-500'}`}
          />
        )}
        <div className="truncate text-xs text-cockpit-100" title={value}>
          {value}
        </div>
      </div>
    </div>
  );
}

function EndpointRow({
  label,
  status,
  endpoint,
}: {
  label: string;
  status?: unknown;
  endpoint?: unknown;
}) {
  const statusText = text(status);
  return (
    <div className="grid grid-cols-[minmax(7rem,0.75fr)_minmax(5rem,0.5fr)_minmax(0,1fr)] gap-2 rounded border border-cockpit-700 px-2 py-1.5 text-[11px]">
      <span className="font-medium text-cockpit-200">{label}</span>
      <Badge variant={toneFor(statusText)}>{statusText}</Badge>
      <span className="truncate text-cockpit-400" title={text(endpoint)}>
        {text(endpoint)}
      </span>
    </div>
  );
}

function deriveApiStatus(status?: ObservabilityStatus, health?: ApiHealthStatus) {
  return status?.api?.status ?? status?.api?.health ?? health?.status ?? 'not currently reported';
}

function deriveAi(status?: ObservabilityStatus) {
  return {
    provider: status?.ai?.provider ?? status?.ai?.providerMode ?? 'not currently reported',
    model: status?.ai?.model ?? 'not currently reported',
    fallback:
      typeof status?.ai?.fallbackUsed === 'boolean'
        ? String(status.ai.fallbackUsed)
        : 'not currently reported',
  };
}

export function ObservabilityPanel({ identity }: { identity: AuthIdentity }) {
  const [observability, setObservability] = useState<ObservabilityStatus | undefined>();
  const [worker, setWorker] = useState<OutboxWorkerStatus | undefined>();
  const [health, setHealth] = useState<ApiHealthStatus | undefined>();
  const [missingEndpoint, setMissingEndpoint] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMissingEndpoint(false);
    try {
      const [observabilityResult, workerResult, healthResult] = await Promise.allSettled([
        api.getObservabilityStatus(identity),
        api.getOutboxWorkerStatus(identity),
        api.getHealth(identity),
      ]);

      if (observabilityResult.status === 'fulfilled') {
        setObservability(observabilityResult.value);
      } else {
        setObservability(undefined);
        if (
          observabilityResult.reason instanceof ApiClientError &&
          observabilityResult.reason.status === 404
        ) {
          setMissingEndpoint(true);
        }
      }

      if (workerResult.status === 'fulfilled') setWorker(workerResult.value);
      if (healthResult.status === 'fulfilled') setHealth(healthResult.value);

      const failures = [observabilityResult, workerResult, healthResult].filter(
        (result) => result.status === 'rejected',
      );
      if (failures.length === 3) setError('Observability inputs are not reachable');
    } finally {
      setLoading(false);
    }
  }, [identity]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const apiStatus = deriveApiStatus(observability, health);
  const workerStatus = observability?.worker?.status ?? worker?.status ?? 'not currently reported';
  const queueBackend =
    observability?.queue?.backend ??
    observability?.worker?.queueBackend ??
    worker?.queueBackend ??
    'not currently reported';
  const nats = observability?.nats ?? worker?.nats;
  const natsStatus = observability?.nats?.status ?? workerStatus;
  const ai = useMemo(() => deriveAi(observability), [observability]);
  const writebackStatus =
    observability?.sandboxWriteback?.lastStatus ??
    observability?.sandboxWriteback?.status ??
    observability?.worker?.lastSandboxWritebackStatus ??
    'not currently reported';

  const checkedAt =
    observability?.checkedAt ??
    observability?.api?.checkedAt ??
    worker?.checkedAt ??
    health?.checkedAt ??
    'not currently reported';

  return (
    <Panel
      title="Local Observability"
      headerRight={
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded border border-cockpit-600 px-2 py-1 text-xs text-cockpit-200 disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Refresh
        </button>
      }
    >
      <div className="space-y-3" data-testid="observability-overview">
        <div className="rounded border border-amber-700/40 bg-amber-900/20 px-2 py-1.5 text-[11px] text-amber-300">
          Local observability only. No production monitoring. No secrets in telemetry.
        </div>

        {missingEndpoint && (
          <div className="rounded border border-cockpit-700 bg-cockpit-900/40 px-2 py-1.5 text-[11px] text-cockpit-400">
            /observability/status is not currently available; showing health and worker fallback
            data.
          </div>
        )}
        {error && (
          <div className="rounded bg-red-900/30 px-2 py-1 text-xs text-red-300">{error}</div>
        )}

        <div
          className="grid grid-cols-2 gap-2 md:grid-cols-4"
          data-testid="observability-correlation-summary"
        >
          <MiniMetric label="API health" value={text(apiStatus)} tone={toneFor(apiStatus)} />
          <MiniMetric
            label="Worker status"
            value={text(workerStatus)}
            tone={toneFor(workerStatus)}
          />
          <MiniMetric
            label="Queue backend"
            value={text(queueBackend)}
            tone={toneFor(queueBackend)}
          />
          <MiniMetric label="Correlation ID" value={text(observability?.correlationId)} />
        </div>

        <div
          className="grid gap-2 text-[11px] text-cockpit-300 md:grid-cols-2"
          data-testid="observability-worker-writeback"
        >
          <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
            <div className="mb-2 flex items-center gap-2 font-medium text-cockpit-100">
              <Waves size={14} className="text-blue-300" />
              NATS JetStream worker
            </div>
            <div>status: {text(natsStatus)}</div>
            <div>enabled: {boolText(nats?.enabled ?? worker?.consumerEnabled)}</div>
            <div>stream: {text(nats?.streamName)}</div>
            <div>consumer: {text(nats?.consumerName)}</div>
            <div>bridge: {text(nats?.bridgeMode)}</div>
          </div>

          <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
            <div className="mb-2 flex items-center gap-2 font-medium text-cockpit-100">
              <Activity size={14} className="text-emerald-300" />
              Sandbox writeback telemetry
            </div>
            <div>last status: {text(writebackStatus)}</div>
            <div>last completed: {text(observability?.sandboxWriteback?.lastCompletedAt)}</div>
            <div>article: {text(observability?.sandboxWriteback?.externalArticleId)}</div>
            <div>
              writeback enabled:{' '}
              {boolText(observability?.worker?.writebackEnabled ?? worker?.writebackEnabled)}
            </div>
          </div>

          <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
            <div className="mb-2 flex items-center gap-2 font-medium text-cockpit-100">
              <Database size={14} className="text-cyan-300" />
              MinIO evidence telemetry
            </div>
            <div>status: {text(observability?.telemetry?.minioEvidence?.status)}</div>
            <div>endpoint: {text(observability?.telemetry?.minioEvidence?.endpoint)}</div>
            <div>last write: {text(observability?.telemetry?.minioEvidence?.lastWriteStatus)}</div>
          </div>

          <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
            <div className="mb-2 flex items-center gap-2 font-medium text-cockpit-100">
              <Mail size={14} className="text-violet-300" />
              Mailpit notification telemetry
            </div>
            <div>status: {text(observability?.telemetry?.mailpitNotification?.status)}</div>
            <div>endpoint: {text(observability?.telemetry?.mailpitNotification?.endpoint)}</div>
            <div>
              last notification:{' '}
              {text(observability?.telemetry?.mailpitNotification?.lastNotificationStatus)}
            </div>
          </div>
        </div>

        <div
          className="grid gap-2 text-[11px] text-cockpit-300 md:grid-cols-2"
          data-testid="observability-ai-safety"
        >
          <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
            <div className="mb-2 flex items-center gap-2 font-medium text-cockpit-100">
              <BrainCircuit size={14} className="text-amber-300" />
              Local AI provider/model/fallback state
            </div>
            <div>provider: {text(ai.provider)}</div>
            <div>model: {text(ai.model)}</div>
            <div>fallback used: {text(ai.fallback)}</div>
            <div>status: {text(observability?.ai?.status)}</div>
          </div>

          <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
            <div className="mb-2 flex items-center gap-2 font-medium text-cockpit-100">
              <ShieldCheck size={14} className="text-emerald-300" />
              Telemetry safety
            </div>
            <div>No secrets in telemetry.</div>
            <div>secrets redacted: {boolText(observability?.telemetry?.secretsRedacted)}</div>
            <div>checked: {text(checkedAt)}</div>
            <div>scope: local sandbox only</div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-cockpit-200">
            <Server size={14} />
            Observability stack endpoints/status
          </div>
          <div className="space-y-1">
            <EndpointRow
              label="Prometheus"
              status={observability?.observabilityStack?.prometheus?.status}
              endpoint={observability?.observabilityStack?.prometheus?.endpoint}
            />
            <EndpointRow
              label="Grafana"
              status={observability?.observabilityStack?.grafana?.status}
              endpoint={observability?.observabilityStack?.grafana?.endpoint}
            />
            <EndpointRow
              label="OTel collector"
              status={observability?.observabilityStack?.otelCollector?.status}
              endpoint={observability?.observabilityStack?.otelCollector?.endpoint}
            />
            <EndpointRow
              label="Loki"
              status={observability?.observabilityStack?.loki?.status}
              endpoint={observability?.observabilityStack?.loki?.endpoint}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 rounded border border-cockpit-700 px-2 py-1.5 text-[11px] text-cockpit-400">
          <AlertTriangle size={13} className="shrink-0 text-amber-300" />
          This panel reports local sandbox telemetry only; it is not a production monitoring or
          alerting system.
        </div>
      </div>
    </Panel>
  );
}
