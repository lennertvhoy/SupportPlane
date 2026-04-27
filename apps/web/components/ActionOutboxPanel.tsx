'use client';

import { useCallback, useEffect, useState } from 'react';
import { Check, Clock, Loader2, Send, ShieldAlert, X } from 'lucide-react';
import { Panel } from './Panel';
import {
  api,
  ApiClientError,
  type ActionOutboxAttempt,
  type ActionOutboxItem,
  type AuthIdentity,
  type SupportAction,
  type SupportSession,
  type TicketReference,
} from '@/lib/api';

function can(identity: AuthIdentity, permission: string) {
  return identity.permissions.includes('*') || identity.permissions.includes(permission);
}

export function ActionOutboxPanel({
  session,
  ticket,
  identity,
  draftBody,
  onChanged,
}: {
  session?: SupportSession;
  ticket?: TicketReference;
  identity: AuthIdentity;
  draftBody?: string;
  onChanged?: () => Promise<void>;
}) {
  const [actions, setActions] = useState<SupportAction[]>([]);
  const [outboxItems, setOutboxItems] = useState<ActionOutboxItem[]>([]);
  const [attempts, setAttempts] = useState<ActionOutboxAttempt[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [forbiddenProof, setForbiddenProof] = useState<string | null>(null);

  useEffect(() => {
    if (!draftBody || body) return;
    setBody(draftBody);
  }, [draftBody, body]);

  const refresh = useCallback(async () => {
    if (!session) {
      setActions([]);
      setOutboxItems([]);
      setAttempts([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.listSessionActions(session.id);
      const newActions = res.actions;
      const newOutboxItems = res.outboxItems;
      setActions(newActions);
      setOutboxItems(newOutboxItems);
      // Scope attempt history to the latest action's outbox item only.
      const latestAction = newActions[0];
      const matchedOutbox = latestAction
        ? newOutboxItems.find((item) => item.supportActionId === latestAction.id)
        : undefined;
      if (matchedOutbox) {
        const detail = await api.getOutboxItem(matchedOutbox.id);
        setAttempts(detail.attempts);
      } else {
        setAttempts([]);
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load action outbox');
    } finally {
      setLoading(false);
    }
  }, [session]);

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
      const message = err instanceof ApiClientError ? err.message : 'Action failed';
      if (err instanceof ApiClientError && err.status === 403) setForbiddenProof(message);
      setError(message);
    } finally {
      setBusy(null);
    }
  };

  const latest = actions[0];
  const latestOutbox = latest ? outboxItems.find((item) => item.supportActionId === latest.id) : undefined;
  const mayCreate = can(identity, 'action:create');
  const mayApprove = can(identity, 'action:approve');
  const mayDeliver = can(identity, 'outbox:mock_deliver');

  return (
    <Panel title="Action Center / Durable Outbox">
      <div className="space-y-3">
        <div className="rounded border border-amber-700/40 bg-amber-900/20 px-2 py-1.5 text-[11px] text-amber-300">
          Local/mock delivery only. Human review required. No real Zammad writeback, email, telephony, AI provider, external queue worker, raw media, or compliance-grade evidence.
        </div>

        {!session && <div className="text-xs text-cockpit-500">Select a session to prepare a support action.</div>}

        {session && (
          <>
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              disabled={!mayCreate}
              placeholder="Write a local-only ticket note action..."
              className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600"
            />

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={!mayCreate || !body.trim() || busy !== null}
                onClick={() =>
                  run('create', () =>
                    api.createSupportAction(session.id, {
                      actionType: 'ticket_note',
                      externalTicketId: ticket?.externalTicketId,
                      ticketReferenceId: ticket?.id,
                      subject: ticket?.subject,
                      body,
                    })
                  )
                }
                className="inline-flex items-center justify-center gap-1 rounded bg-accent px-2 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                {busy === 'create' ? <Loader2 size={12} className="animate-spin" /> : <Clock size={12} />}
                Create draft action
              </button>
              <button
                disabled={!latest || latest.status !== 'draft' || !can(identity, 'action:submit') || busy !== null}
                onClick={() => run('submit', () => api.submitActionForReview(latest!.id))}
                className="inline-flex items-center justify-center gap-1 rounded border border-cockpit-600 px-2 py-1.5 text-xs text-cockpit-200 disabled:opacity-50"
              >
                Submit for review
              </button>
              <button
                disabled={!latest || latest.status !== 'review_required' || !mayApprove || busy !== null}
                onClick={() => run('approve', () => api.approveAction(latest!.id, 'Approved for local mock delivery'))}
                className="inline-flex items-center justify-center gap-1 rounded border border-emerald-700/50 px-2 py-1.5 text-xs text-emerald-300 disabled:opacity-50"
              >
                <Check size={12} />
                Approve
              </button>
              <button
                disabled={!latest || latest.status !== 'review_required' || !mayApprove || busy !== null}
                onClick={() => run('reject', () => api.rejectAction(latest!.id, 'Rejected in local review'))}
                className="inline-flex items-center justify-center gap-1 rounded border border-red-700/50 px-2 py-1.5 text-xs text-red-300 disabled:opacity-50"
              >
                <X size={12} />
                Reject
              </button>
              <button
                disabled={!latest || latest.status !== 'approved' || !mayApprove || busy !== null}
                onClick={() => run('queue', () => api.queueAction(latest!.id))}
                className="inline-flex items-center justify-center gap-1 rounded border border-cockpit-600 px-2 py-1.5 text-xs text-cockpit-200 disabled:opacity-50"
              >
                Queue approved action
              </button>
              <button
                disabled={!latest || latest.status !== 'queued' || !mayDeliver || busy !== null}
                onClick={() => run('deliver', () => api.mockDeliverAction(latest!.id))}
                className="inline-flex items-center justify-center gap-1 rounded border border-cockpit-600 px-2 py-1.5 text-xs text-cockpit-200 disabled:opacity-50"
              >
                <Send size={12} />
                Mock deliver
              </button>
            </div>

            {!mayApprove && (
              <button
                disabled={!latest || latest.status !== 'review_required' || busy !== null}
                onClick={() => run('forbidden', () => api.approveAction(latest!.id, 'Viewer forbidden proof'))}
                className="inline-flex w-full items-center justify-center gap-1 rounded border border-amber-700/50 px-2 py-1.5 text-xs text-amber-300 disabled:opacity-50"
              >
                <ShieldAlert size={12} />
                Prove server-side approval denial
              </button>
            )}

            {loading && <div className="flex items-center gap-2 text-xs text-cockpit-400"><Loader2 size={12} className="animate-spin" /> Loading action state...</div>}
            {error && <div className="rounded bg-red-900/30 px-2 py-1 text-xs text-red-300">{error}</div>}
            {forbiddenProof && <div className="rounded border border-amber-700/50 bg-amber-900/20 px-2 py-1 text-xs text-amber-300">Server-side RBAC denial: {forbiddenProof}</div>}

            {latest && (
              <div className="rounded border border-cockpit-700 bg-cockpit-900/60 p-2 text-[11px] text-cockpit-300">
                <div className="font-medium text-cockpit-100">Latest action: {latest.status}</div>
                <div>Type: {latest.actionType}</div>
                <div>Idempotency: {latest.idempotencyKey}</div>
                <div>Review: {latest.reviewDecision ?? 'pending'} {latest.reviewedBy ? `by ${latest.reviewedBy}` : ''}</div>
                <div>Preview: {latest.safeBodyPreview ?? 'none'}</div>
              </div>
            )}

            {latestOutbox && (
              <div className="rounded border border-cockpit-700 bg-cockpit-900/60 p-2 text-[11px] text-cockpit-300">
                <div className="font-medium text-cockpit-100">Outbox item: {latestOutbox.status}</div>
                <div>Attempts: {latestOutbox.attemptCount}</div>
                <div>Latest attempt: {latestOutbox.latestAttemptState ?? 'none'}</div>
                <div>realNetwork: false / writebackEnabled: false / externalWriteAttempted: false</div>
              </div>
            )}

            {attempts.length > 0 && (
              <div className="space-y-1">
                <div className="text-[11px] font-medium text-cockpit-300">Attempt history</div>
                {attempts.map((attempt) => (
                  <div key={attempt.id} className="rounded border border-cockpit-700 px-2 py-1 text-[10px] text-cockpit-400">
                    #{attempt.attemptNumber} {attempt.state} at {new Date(attempt.attemptedAt).toLocaleString()} / realNetwork: false
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Panel>
  );
}
