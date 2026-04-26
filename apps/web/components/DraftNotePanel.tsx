'use client';

import { useState } from 'react';
import { AlertCircle, Bot, Loader2, Send } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import type { DraftSuggestionResponse, SupportSession } from '@/lib/api';

export function DraftNotePanel({
  session,
  suggestion,
  loading,
  error,
  onGenerate,
}: {
  session?: SupportSession;
  suggestion?: DraftSuggestionResponse;
  loading: boolean;
  error: string | null;
  onGenerate: (operatorInstructions?: string) => Promise<DraftSuggestionResponse | undefined>;
}) {
  const [draft, setDraft] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const [operatorInstructions, setOperatorInstructions] = useState('');

  async function handleGenerate() {
    const response = await onGenerate(operatorInstructions || undefined);
    if (response) {
      setDraft(response.draft);
      setReviewed(false);
    }
  }

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
            aria-label="Draft support note"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (reviewed) setReviewed(false);
            }}
            placeholder="Write a draft support note..."
            rows={6}
            className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-3 py-2 text-sm text-cockpit-100 placeholder:text-cockpit-500 focus:border-accent focus:outline-none"
          />

          <div className="rounded border border-cockpit-700 bg-cockpit-900/50 p-3">
            <label className="mb-1 block text-xs font-medium text-cockpit-300">
              Optional operator instruction
            </label>
            <textarea
              aria-label="Optional operator instruction"
              value={operatorInstructions}
              onChange={(e) => setOperatorInstructions(e.target.value)}
              placeholder="Add guidance for the mock draft..."
              rows={2}
              className="w-full rounded border border-cockpit-600 bg-cockpit-950 px-3 py-2 text-xs text-cockpit-100 placeholder:text-cockpit-500 focus:border-accent focus:outline-none"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-amber-300">
                <Bot size={13} />
                Mock AI only, review required
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
                Generate mock draft
              </button>
            </div>
            {error && (
              <div className="mt-2 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </div>
            )}
          </div>

          {suggestion && (
            <div className="rounded border border-amber-700/40 bg-amber-950/30 p-3 text-xs">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="font-semibold text-amber-200">
                  Mock/dev-only model metadata
                </span>
                <Badge variant="warning">Review before writeback</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-cockpit-400">
                <dt>Provider</dt>
                <dd className="text-cockpit-100">{suggestion.provider}</dd>
                <dt>Model</dt>
                <dd className="break-all text-cockpit-100">{suggestion.model}</dd>
                <dt>Prompt version</dt>
                <dd className="text-cockpit-100">{suggestion.prompt.version}</dd>
                <dt>Context hash</dt>
                <dd className="break-all font-mono text-[10px] text-cockpit-100">
                  {suggestion.contextHash}
                </dd>
              </dl>
            </div>
          )}

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
