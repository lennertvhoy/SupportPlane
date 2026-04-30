'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw, RotateCcw, Skull, XCircle, Play } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import { api, ApiClientError, type ActionOutboxAttempt, type ActionOutboxItem, type AuthIdentity, type OutboxWorkerStatus } from '@/lib/api';

function can(identity: AuthIdentity, permission: string) {
  return identity.permissions.includes('*') || identity.permissions.includes(permission);
}

function short(value?: string) {
  return value ? value.slice(0, 8) : 'none';
}

function latestDeliveryFlag(
  attempts: ActionOutboxAttempt[],
  item: ActionOutboxItem,
  key: 'realNetwork' | 'writebackEnabled' | 'externalWriteAttempted'
) {
  const latestAttempt = [...attempts].sort((a, b) => b.attemptNumber - a.attemptNumber)[0];
  const attemptValue = latestAttempt?.deliveryResult?.[key];
  if (typeof attemptValue === 'boolean') return attemptValue;
  return Boolean(item.safetyFlags?.[key]);
}

export function OutboxMonitorPanel({ identity, onChanged }: { identity: AuthIdentity; onChanged?: () => Promise<void> }) {
  const [items, setItems] = useState<ActionOutboxItem[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [worker, setWorker] = useState<OutboxWorkerStatus | undefined>();
  const [selected, setSelected] = useState<ActionOutboxItem | undefined>();
  const selectedRef = useRef<ActionOutboxItem | undefined>(undefined);
  const [attempts, setAttempts] = useState<ActionOutboxAttempt[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbiddenProof, setForbiddenProof] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [outbox, status] = await Promise.all([api.listOutbox(), api.getOutboxWorkerStatus()]);
      setItems(outbox.outboxItems);
      setSummary(outbox.summary);
      setWorker(status);
      const selectedStillExists = selectedRef.current ? outbox.outboxItems.find((item) => item.id === selectedRef.current?.id) : undefined;
      const nextSelected = selectedStillExists ?? outbox.outboxItems[0];
      selectedRef.current = nextSelected;
      setSelected(nextSelected);
      if (nextSelected) {
        const detail = await api.getOutboxItem(nextSelected.id);
        setAttempts(detail.attempts);
      } else {
        setAttempts([]);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load outbox monitor');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    setError(null);
    setForbiddenProof(null);
    try {
      await fn();
      await refresh();
      await onChanged?.();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Outbox operation failed';
      if (err instanceof ApiClientError && err.status === 403) setForbiddenProof(message);
      setError(message);
    } finally {
      setBusy(null);
    }
  };

  const mayMutate = can(identity, 'outbox:process_once') || can(identity, 'outbox:retry') || can(identity, 'outbox:dead_letter') || can(identity, 'outbox:cancel');

  return (
    <Panel
      title="Delivery Operations"
      headerRight={
        <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-1 rounded border border-cockpit-600 px-2 py-1 text-xs text-cockpit-200 disabled:opacity-50">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Refresh
        </button>
      }
    >
      <div className="space-y-3">
        <div className="rounded border border-amber-700/40 bg-amber-900/20 px-2 py-1.5 text-[11px] text-amber-300">
          {worker?.writebackEnabled
            ? 'NATS JetStream local sandbox bridge. Sandbox-only Zammad internal note writeback is enabled. MinIO local evidence. Mailpit local notification. No public reply. No production data.'
            : 'NATS JetStream local sandbox bridge with durable local worker. PostgreSQL remains canonical outbox truth. No real writeback, email, telephony, cloud AI, object storage, raw media, or production queue semantics.'}
        </div>

        {worker && (
          <div className="grid grid-cols-2 gap-2 text-[11px] text-cockpit-300 md:grid-cols-6">
            <div><span className="text-cockpit-500">Worker</span><div>{worker.status}</div></div>
            <div><span className="text-cockpit-500">Mode</span><div>{worker.mode}</div></div>
            <div><span className="text-cockpit-500">Queue</span><div>{worker.queueBackend}</div></div>
            <div><span className="text-cockpit-500">Store</span><div>{worker.storeMode}</div></div>
            <div><span className="text-cockpit-500">Auth</span><div>{identity.authMode}</div></div>
            <div><span className="text-cockpit-500">Safety</span><div>realNetwork: {String(worker?.realNetwork ?? false)} / writeback: {String(worker?.writebackEnabled ?? false)}</div></div>
          </div>
        )}
        {worker && (
          <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2 text-[11px] text-cockpit-300">
            <div className="font-medium text-cockpit-100">NATS JetStream</div>
            <div>Durable local worker · fallback: {worker?.fallbackQueueBackend ?? 'postgres-local-outbox'} · {worker?.writebackEnabled ? 'sandbox writeback enabled' : 'writeback blocked'}</div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 text-[11px]">
          {['queued', 'processing', 'retry_scheduled', 'dead_lettered', 'failed', 'mock_delivered', 'sandbox_delivered', 'cancelled', 'total'].map((key) => (
            <div key={key} className="rounded border border-cockpit-700 px-2 py-1">
              <div className="text-cockpit-500">{key}</div>
              <div className="text-cockpit-100">{summary[key] ?? 0}</div>
            </div>
          ))}
        </div>

        {!mayMutate && <div className="rounded border border-cockpit-700 px-2 py-1 text-[11px] text-cockpit-400">Read-only role. Inspecting is allowed; retry, process, cancel, and dead-letter controls are server-restricted.</div>}
        {error && <div className="rounded bg-red-900/30 px-2 py-1 text-xs text-red-300">{error}</div>}
        {forbiddenProof && <div className="rounded border border-amber-700/50 bg-amber-900/20 px-2 py-1 text-xs text-amber-300">Server-side RBAC denial: {forbiddenProof}</div>}

        <div className="space-y-1">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={async () => {
                selectedRef.current = item;
                setSelected(item);
                const detail = await api.getOutboxItem(item.id);
                setAttempts(detail.attempts);
              }}
              className="grid w-full grid-cols-5 gap-2 rounded border border-cockpit-700 px-2 py-1 text-left text-[11px] text-cockpit-300 hover:border-cockpit-500"
            >
              <Badge variant={item.status === 'mock_delivered' || item.status === 'sandbox_delivered' ? 'success' : item.status === 'dead_lettered' ? 'danger' : item.status === 'retry_scheduled' ? 'warning' : 'muted'}>{item.status}</Badge>
              <span>item {short(item.id)}</span>
              <span>session {short(item.sessionId)}</span>
              <span>attempts {item.attemptCount}/{item.maxAttempts}</span>
              <span>{item.lastErrorMessage ?? item.lastError ?? 'no error'}</span>
            </button>
          ))}
          {items.length === 0 && <div className="text-xs text-cockpit-500">No outbox items for this tenant.</div>}
        </div>

        {selected && (
          <div className="rounded border border-cockpit-700 bg-cockpit-900/60 p-2 text-[11px] text-cockpit-300">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <div className="font-medium text-cockpit-100">Selected outbox {short(selected.id)} / {selected.status}</div>
                <div>Action {short(selected.supportActionId)} / idempotency {selected.idempotencyKey}</div>
                <div>nextAttemptAt {selected.nextAttemptAt ?? 'not scheduled'} / deadLetterReason {selected.deadLetterReason ?? 'none'}</div>
                <div>mode: {selected.deliveryMode ?? 'mock'} / realNetwork: {String(latestDeliveryFlag(attempts, selected, 'realNetwork'))} / writebackEnabled: {String(latestDeliveryFlag(attempts, selected, 'writebackEnabled'))} / externalWriteAttempted: {String(latestDeliveryFlag(attempts, selected, 'externalWriteAttempted'))}</div>
              </div>
            </div>
            <div className="mb-2 flex flex-wrap gap-2">
              <button disabled={!can(identity, 'outbox:process_once') || busy !== null || !['queued', 'retry_scheduled'].includes(selected.status)} onClick={() => run('process', () => api.processOutboxOnce(selected.id))} className="inline-flex items-center gap-1 rounded border border-cockpit-600 px-2 py-1 text-xs text-cockpit-200 disabled:opacity-50"><Play size={12} /> Process once</button>
              <button disabled={!can(identity, 'outbox:retry') || busy !== null || !['failed', 'retry_scheduled', 'dead_lettered'].includes(selected.status)} onClick={() => run('retry', () => api.retryOutboxItem(selected.id))} className="inline-flex items-center gap-1 rounded border border-cockpit-600 px-2 py-1 text-xs text-cockpit-200 disabled:opacity-50"><RotateCcw size={12} /> Retry</button>
              <button disabled={!can(identity, 'outbox:dead_letter') || busy !== null || !['failed', 'retry_scheduled', 'processing'].includes(selected.status)} onClick={() => run('dead-letter', () => api.deadLetterOutboxItem(selected.id, 'Admin forced local mock dead-letter'))} className="inline-flex items-center gap-1 rounded border border-red-700/50 px-2 py-1 text-xs text-red-300 disabled:opacity-50"><Skull size={12} /> Dead-letter</button>
              <button disabled={!can(identity, 'outbox:cancel') || busy !== null || !['queued', 'processing', 'failed', 'retry_scheduled'].includes(selected.status)} onClick={() => run('cancel', () => api.cancelOutboxItem(selected.id, 'Admin cancelled local mock outbox item'))} className="inline-flex items-center gap-1 rounded border border-amber-700/50 px-2 py-1 text-xs text-amber-300 disabled:opacity-50"><XCircle size={12} /> Cancel</button>
            </div>
            <div className="space-y-1">
              <div className="text-cockpit-500">Attempt history for selected item</div>
              {attempts.map((attempt) => (
                <div key={attempt.id} className="rounded border border-cockpit-700 px-2 py-1">
                  #{attempt.attemptNumber} {attempt.state} code {attempt.errorCode ?? 'none'} / {attempt.errorMessage ?? 'no error'} / realNetwork: {String((attempt.deliveryResult as Record<string, unknown>)?.realNetwork ?? false)} / writeback: {String((attempt.deliveryResult as Record<string, unknown>)?.writebackEnabled ?? false)} / externalWriteAttempted: {String((attempt.deliveryResult as Record<string, unknown>)?.externalWriteAttempted ?? false)}
                </div>
              ))}
              {attempts.length === 0 && <div>No attempts yet.</div>}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
