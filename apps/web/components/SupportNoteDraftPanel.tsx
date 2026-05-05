'use client';

import { useState } from 'react';
import { FileText, Loader2, AlertTriangle } from 'lucide-react';
import { Panel } from './Panel';
import { api, type SupportSession, type AuthIdentity, ApiClientError } from '@/lib/api';

export function SupportNoteDraftPanel({
  session,
  identity,
  externalTicketId,
}: {
  session?: SupportSession;
  identity: AuthIdentity;
  externalTicketId?: string;
}) {
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operatorNotes, setOperatorNotes] = useState('');

  const canWrite =
    identity.permissions.includes('*') || identity.permissions.includes('ticket:write');

  const handleGenerate = async () => {
    if (!session || !externalTicketId) return;
    if (!canWrite) {
      setError('Viewer role cannot generate support note drafts');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.createSupportNoteDraft(session.id, {
        externalTicketId,
        operatorNotes: operatorNotes || undefined,
      });
      setDraft(res.draft);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to generate draft');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Panel title="Support Note Draft">
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded border border-amber-700/40 bg-amber-900/20 px-2 py-1.5 text-[11px] text-amber-300">
          <AlertTriangle size={12} />
          <span>Local mock only — not sent to Zammad — requires human review</span>
        </div>

        <textarea
          value={operatorNotes}
          onChange={(e) => setOperatorNotes(e.target.value)}
          placeholder="Optional operator notes..."
          className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600"
          rows={2}
          disabled={!canWrite}
        />

        <button
          onClick={handleGenerate}
          disabled={loading || !session || !externalTicketId || !canWrite}
          className="inline-flex w-full items-center justify-center gap-1 rounded bg-accent px-2 py-1.5 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
          Generate local-only draft
        </button>

        {error && (
          <div className="rounded bg-red-900/30 px-2 py-1 text-xs text-red-300">{error}</div>
        )}

        {draft && (
          <div className="space-y-2">
            <div className="rounded border border-cockpit-700 bg-cockpit-900/60 p-2">
              <pre className="whitespace-pre-wrap text-[11px] text-cockpit-200">{draft}</pre>
            </div>
            <div className="text-[10px] text-cockpit-500">
              This draft is deterministic mock output. Do not treat it as a real AI-generated note.
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
