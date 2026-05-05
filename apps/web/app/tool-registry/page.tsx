'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Loader2, RefreshCw, ShieldCheck, Wrench } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AuthGate, IdentityPill } from '@/components/AuthGate';
import { Badge } from '@/components/Badge';

import { api, ApiClientError, type AuthIdentity, type ToolDefinition } from '@/lib/api';

function riskBadge(riskLevel: string) {
  if (riskLevel === 'read_only') return <Badge variant="success">Read-only</Badge>;
  if (riskLevel === 'low_risk_remediation')
    return <Badge variant="warning">Low-risk remediation</Badge>;
  if (riskLevel === 'elevated_remediation')
    return <Badge variant="danger">Elevated remediation</Badge>;
  return <Badge variant="muted">{riskLevel}</Badge>;
}

function platformBadge(platform: string) {
  if (platform === 'linux') return <Badge variant="info">Linux</Badge>;
  if (platform === 'win32') return <Badge variant="info">Windows</Badge>;
  if (platform === 'darwin') return <Badge variant="info">macOS</Badge>;
  return <Badge variant="muted">{platform}</Badge>;
}

function ToolRegistryContent({
  identity,
  logout,
}: {
  identity: AuthIdentity;
  logout: () => Promise<void>;
}) {
  const router = useRouter();
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listTools();
      setTools(res.tools);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load tool registry');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <div className="flex h-screen flex-col bg-cockpit-950 text-cockpit-100">
      <header className="flex items-center justify-between border-b border-cockpit-800 px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-cockpit-700 bg-cockpit-900 text-cockpit-300 hover:border-accent-500"
            title="Back to cockpit"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">Tool Registry</h1>
            <p className="text-xs text-cockpit-500">
              Signed/local-verified fixed implementation tools only.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IdentityPill identity={identity} logout={logout} />
          <button
            type="button"
            onClick={() => refresh()}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-cockpit-700 bg-cockpit-900 text-cockpit-300 hover:border-accent-500"
            title="Refresh"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
          <button
            type="button"
            onClick={logout}
            className="rounded border border-cockpit-700 px-3 py-2 text-xs text-cockpit-300 hover:border-cockpit-500"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="rounded border border-cockpit-700 bg-cockpit-900/50 px-4 py-3 text-sm text-cockpit-300">
            <div className="flex items-center gap-2 font-medium text-cockpit-100">
              <ShieldCheck size={16} className="text-accent-400" />
              Manifests declare fixed implementation IDs only. They do not contain executable
              scripts.
            </div>
            <div className="mt-1 text-xs text-cockpit-500">
              No arbitrary shell · No argv injection · No user-provided command body · Fixed
              implementations verified by integrity hash
            </div>
          </div>

          {error && (
            <div className="rounded border border-red-800 bg-red-950/30 px-3 py-2 text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="rounded border border-cockpit-700 bg-cockpit-900/50 p-4">
            <div className="mb-3 text-sm font-medium text-cockpit-100">Tools ({tools.length})</div>
            {tools.length === 0 ? (
              <div className="text-sm text-cockpit-500">
                No tools loaded. The local manifest may still be loading.
              </div>
            ) : (
              <div className="space-y-3">
                {tools.map((tool) => (
                  <div
                    key={tool.id}
                    className={`rounded border px-4 py-3 ${tool.enabled ? 'border-cockpit-700 bg-cockpit-950/50' : 'border-cockpit-800 bg-cockpit-950/30 opacity-60'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Wrench size={15} className="text-cockpit-400" />
                        <span className="text-sm font-medium text-cockpit-100">
                          {tool.displayName}
                        </span>
                        <span className="text-xs text-cockpit-500">{tool.toolKey}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {riskBadge(tool.riskLevel)}
                        {tool.approvalRequired && (
                          <Badge variant="warning">Approval required</Badge>
                        )}
                        {tool.enabled ? (
                          <Badge variant="success">Enabled</Badge>
                        ) : (
                          <Badge variant="muted">Disabled</Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-cockpit-400">{tool.description}</div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-cockpit-500">
                      <span>Category: {tool.category}</span>
                      <span>
                        Implementation:{' '}
                        <span className="font-mono text-cockpit-400">{tool.implementationId}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        Platforms:{' '}
                        {tool.supportedPlatforms.length > 0 ? (
                          tool.supportedPlatforms.map((p) => (
                            <span key={p}>{platformBadge(p)}</span>
                          ))
                        ) : (
                          <Badge variant="muted">any</Badge>
                        )}
                      </span>
                      <span>Permission: {tool.requiredPermission}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ToolRegistryPage() {
  return (
    <AuthGate>
      {(identity, logout) => <ToolRegistryContent identity={identity} logout={logout} />}
    </AuthGate>
  );
}
