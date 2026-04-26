'use client';

import { useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import type { SupportSession } from '@/lib/api';

export function DraftNotePanel({
  session,
}: {
  session?: SupportSession;
}) {
  const [draft, setDraft] = useState('');
  const [reviewed, setReviewed] = useState(false);

  return (
    <Panel
      title="Draft Note"
      headerRight={
        <Badge variant="warning">Mock only — no writeback</Badge>
      }
    >
      {!session ? (
        <div className="rounded border border-cockpit-600 bg-cockpit-900/50 px-3 py-4 text-center text-sm text-cockpit-500">
          Select a session to draft a note.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-cockpit-400">
              Session: <span className="text-cockpit-200">{session.title}</span>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-cockpit-300">
              <input
                type="checkbox"
                checked={reviewed}
                onChange={(e) => setReviewed(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-cockpit-600 bg-cockpit-900 text-accent focus:ring-accent"
              />
              Reviewed
            </label>
          </div>

          <textarea
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (reviewed) setReviewed(false);
            }}
            placeholder="Write a draft support note..."
            rows={6}
            className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-3 py-2 text-sm text-cockpit-100 placeholder:text-cockpit-500 focus:border-accent focus:outline-none"
          />

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-cockpit-500">
              <AlertCircle size={12} />
              {draft.length} chars
            </div>
            <button
              disabled={!reviewed || !draft.trim()}
              className="inline-flex items-center gap-1.5 rounded bg-cockpit-700 px-3 py-1.5 text-xs font-medium text-cockpit-300 opacity-50 cursor-not-allowed"
              title="Writeback is not implemented yet"
            >
              <Send size={12} />
              Writeback (disabled)
            </button>
          </div>

          {!reviewed && draft.trim().length > 0 && (
            <div className="flex items-center gap-2 rounded border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              <AlertCircle size={14} />
              Mark as reviewed before writeback.
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
