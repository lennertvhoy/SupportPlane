'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AuthGate, UserMenu } from '@/components/AuthGate';
import { Badge } from '@/components/Badge';

import { api, ApiClientError, type AuthIdentity, type ToolApproval } from '@/lib/api';

function ApprovalQueueContent({
  identity,
  logout,
}: {
  identity: AuthIdentity;
  logout: () => Promise<void>;
}) {
  const router = useRouter();
  const [approvals, setApprovals] = useState<ToolApproval[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canApprove =
    identity.permissions.includes('*') ||
    identity.roles.includes('admin') ||
    identity.roles.includes('owner');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listToolApprovals();
      setApprovals(res.approvals);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load approval queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.approveTool(id, { reason: 'Approved via approval queue' });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (id: string) => {
    setActionLoading(id);
    try {
      await api.denyTool(id, { reason: 'Denied via approval queue' });
      await refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to deny');
    } finally {
      setActionLoading(null);
    }
  };

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
            <h1 className="text-lg font-semibold">Approval Queue</h1>
            <p className="text-xs text-cockpit-400">
              Remediation tool approvals. Only admin/owner can decide.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => refresh()}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-cockpit-700 bg-cockpit-900 text-cockpit-300 hover:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
            title="Refresh"
            aria-label="Refresh approval queue"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
          <UserMenu identity={identity} logout={logout} />
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-4xl space-y-4">
          {error && (
            <div className="rounded border border-red-800 bg-red-950 px-3 py-2 text-xs text-red-400">
              {error}
            </div>
          )}

          <div className="rounded border border-cockpit-700 bg-cockpit-900/50 p-4">
            <div className="mb-3 text-sm font-medium text-cockpit-100">
              Pending Approvals ({approvals.filter((a) => a.status === 'requested').length})
            </div>
            {approvals.length === 0 ? (
              <div className="text-sm text-cockpit-400">No approval requests yet.</div>
            ) : (
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <div
                    key={approval.id}
                    className="rounded border border-cockpit-700 bg-cockpit-950/50 px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-medium text-cockpit-100">
                        Invocation {approval.invocationId.slice(0, 8)}
                      </div>
                      <Badge
                        variant={
                          approval.status === 'approved'
                            ? 'success'
                            : approval.status === 'denied'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {approval.status}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-cockpit-400">
                      Requested by {approval.requestedByUserId} · Expires{' '}
                      {new Date(approval.expiresAt).toLocaleString()}
                    </div>
                    {approval.reason && (
                      <div className="mt-1 text-xs text-cockpit-400">Reason: {approval.reason}</div>
                    )}
                    {approval.status === 'requested' && (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          disabled={!canApprove || actionLoading === approval.id}
                          onClick={() => handleApprove(approval.id)}
                          className="inline-flex items-center gap-1 rounded border border-green-700 bg-green-950 px-3 py-1.5 text-xs text-green-300 hover:border-green-500 disabled:cursor-not-allowed disabled:bg-cockpit-900 disabled:text-cockpit-600 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-green-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
                        >
                          {actionLoading === approval.id ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={13} />
                          )}
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={!canApprove || actionLoading === approval.id}
                          onClick={() => handleDeny(approval.id)}
                          className="inline-flex items-center gap-1 rounded border border-red-700 bg-red-950 px-3 py-1.5 text-xs text-red-300 hover:border-red-500 disabled:cursor-not-allowed disabled:bg-cockpit-900 disabled:text-cockpit-600 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
                        >
                          <XCircle size={13} />
                          Deny
                        </button>
                        {!canApprove && (
                          <span className="ml-2 text-xs text-cockpit-400">Admin/owner only</span>
                        )}
                      </div>
                    )}
                    {approval.decidedAt && (
                      <div className="mt-1 text-xs text-cockpit-400">
                        Decided by {approval.approvedByUserId} at{' '}
                        {new Date(approval.decidedAt).toLocaleString()}
                      </div>
                    )}
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

export default function ApprovalQueuePage() {
  return (
    <AuthGate>
      {(identity, logout) => <ApprovalQueueContent identity={identity} logout={logout} />}
    </AuthGate>
  );
}
