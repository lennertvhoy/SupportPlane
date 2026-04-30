'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle, Lock, RefreshCw, ShieldCheck, ShieldX, Loader2 } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import { api, type AuthIdentity, type ApiHealthStatus } from '@/lib/api';

type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'muted';

function ItemRow({
  label,
  value,
  tone,
  note,
}: {
  label: string;
  value: string;
  tone?: StatusTone;
  note?: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(10rem,1fr)_minmax(5rem,0.5fr)] gap-2 rounded border border-cockpit-700 px-2 py-1.5 text-[11px]">
      <div className="flex flex-col">
        <span className="font-medium text-cockpit-200">{label}</span>
        {note && <span className="text-cockpit-500">{note}</span>}
      </div>
      <div className="flex items-center justify-end gap-1.5">
        {tone === 'success' && <CheckCircle size={12} className="text-emerald-400" />}
        {tone === 'danger' && <ShieldX size={12} className="text-red-400" />}
        <Badge variant={tone ?? 'muted'}>{value}</Badge>
      </div>
    </div>
  );
}

export function SecurityReadinessPanel({ identity }: { identity: AuthIdentity }) {
  const [health, setHealth] = useState<ApiHealthStatus | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const h = await api.getHealth(identity);
      setHealth(h);
    } catch {
      setError('Health endpoint unreachable');
    } finally {
      setLoading(false);
    }
  }, [identity]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const authMode = health?.authMode ?? 'unknown';
  const oidcReady = health?.oidcReady === true;
  const mfaHook = health?.mfaHookAvailable === true;

  return (
    <Panel
      title="Security & Release Readiness"
      headerRight={
        <button onClick={refresh} disabled={loading} className="inline-flex items-center gap-1 rounded border border-cockpit-600 px-2 py-1 text-xs text-cockpit-200 disabled:opacity-50">
          {loading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
          Refresh
        </button>
      }
    >
      <div className="space-y-3" data-testid="security-readiness-panel">
        <div className="rounded border border-amber-700/40 bg-amber-900/20 px-2 py-1.5 text-[11px] text-amber-300">
          Local sandbox security only. Not production hardened.
        </div>

        {error && <div className="rounded bg-red-900/30 px-2 py-1 text-xs text-red-300">{error}</div>}

        <div className="space-y-1">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-cockpit-200">
            <Lock size={14} />
            Authentication & Identity
          </div>
          <ItemRow label="Local auth enabled" value={authMode === 'local' ? 'Yes' : 'No'} tone={authMode === 'local' ? 'success' : 'muted'} />
          <ItemRow label="OIDC ready" value={oidcReady ? 'Yes' : 'No'} tone={oidcReady ? 'success' : 'muted'} note="Keycloak local sandbox" />
          <ItemRow label="MFA hook available" value={mfaHook ? 'Yes' : 'No'} tone={mfaHook ? 'success' : 'muted'} note="Not enforced" />
          <ItemRow label="Service-auth worker path" value="Protected" tone="success" note="X-Service-Token required" />
          <ItemRow label="Short-lived service token policy" value="Conceptual" tone="warning" note="Hooks only; no persistent storage" />
        </div>

        <div className="space-y-1">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-cockpit-200">
            <ShieldCheck size={14} />
            API Gateway Hardening
          </div>
          <ItemRow label="Rate limits enabled" value="Yes" tone="success" note="In-memory per IP" />
          <ItemRow label="Body limits enabled" value="Yes" tone="success" note="Path-specific limits" />
          <ItemRow label="Request validation enabled" value="Yes" tone="success" note="URL, adapter type, tenant, telephony event" />
          <ItemRow label="Security headers" value="Yes" tone="success" note="X-Content-Type-Options, X-Frame-Options, Referrer-Policy" />
        </div>

        <div className="space-y-1">
          <div className="mb-1 flex items-center gap-2 text-xs font-medium text-cockpit-200">
            <BookOpen size={14} />
            Operations & Runbooks
          </div>
          <ItemRow label="Backup/restore runbook" value="Available" tone="success" note="docs/RUNBOOK_BACKUP_RESTORE.md" />
          <ItemRow label="Release runbook" value="Available" tone="success" note="docs/RELEASE_RUNBOOK.md" />
          <ItemRow label="Demo runbook" value="Available" tone="success" note="docs/DEMO_RUNBOOK.md" />
          <ItemRow label="Demo reset script" value="Available" tone="success" note="scripts/reset_demo_data.sh" />
        </div>

        <div className="flex items-center gap-2 rounded border border-cockpit-700 px-2 py-1.5 text-[11px] text-cockpit-400">
          <AlertTriangle size={13} className="shrink-0 text-amber-300" />
          No raw secrets in evidence. All secrets are redacted in API responses, logs, and screenshots.
        </div>
      </div>
    </Panel>
  );
}
