'use client';

import { useState, useCallback } from 'react';
import { Bot, Loader2, Sparkles } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import { aiApi, type TicketSummaryResponse } from '@/lib/ai-api';
import type { SupportSession, AuthIdentity } from '@/lib/api';
import { ApiClientError } from '@/lib/api';

export function TicketSummaryGenerator({
  session,
  identity,
}: {
  session?: SupportSession;
  identity: AuthIdentity;
}) {
  const [summary, setSummary] = useState<TicketSummaryResponse | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canGenerate =
    identity.permissions.includes('*') || identity.permissions.includes('ai:generate');

  const handleGenerate = useCallback(async () => {
    if (!session || !canGenerate) return;
    setLoading(true);
    setError(null);
    try {
      const result = await aiApi.generateTicketSummary(session.id);
      setSummary(result);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  }, [session, canGenerate]);

  const getProviderLabel = () => {
    if (!summary) return null;
    const provider = summary.provider;
    const fallback = summary.usage.fallbackUsed;
    if (provider === 'ollama') {
      return fallback ? 'Ollama local / fallback' : 'Ollama local / real host';
    }
    if (provider === 'lmstudio') {
      return fallback ? 'LM Studio local / fallback' : 'LM Studio local / real host';
    }
    return fallback ? 'Mock / fallback' : 'Mock / no real call';
  };

  return (
    <Panel
      title="Ticket Summary"
      headerRight={
        summary ? (
          <Badge variant="success">Generated</Badge>
        ) : (
          <Badge variant="default">Not generated</Badge>
        )
      }
    >
      {!session ? (
        <div className="rounded border border-cockpit-600 bg-cockpit-900/50 px-3 py-4 text-center text-sm text-cockpit-500">
          Select a session to generate a ticket summary.
        </div>
      ) : !canGenerate ? (
        <div className="rounded border border-danger/30 bg-danger/10 px-3 py-4 text-center text-sm text-danger">
          You do not have permission to generate AI summaries.
        </div>
      ) : (
        <div className="space-y-3">
          {!summary && (
            <div className="space-y-2">
              <div className="text-xs text-cockpit-500">
                Generate an AI summary for <span className="text-cockpit-200">{session.title}</span>
                .
              </div>
              <button
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Generate Summary
              </button>
            </div>
          )}

          {error && (
            <div className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </div>
          )}

          {summary && (
            <div className="space-y-3">
              <div className="rounded border border-cockpit-700 bg-cockpit-900/50 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-cockpit-300">Summary</span>
                  <Badge variant="warning">Review required</Badge>
                </div>
                <div className="whitespace-pre-wrap text-xs text-cockpit-100">
                  {summary.summary}
                </div>
              </div>

              {summary.keyPoints.length > 0 && (
                <div className="rounded border border-cockpit-700 bg-cockpit-900/50 p-3">
                  <div className="mb-1 text-xs font-medium text-cockpit-300">Key Points</div>
                  <ul className="list-inside list-disc space-y-1 text-xs text-cockpit-100">
                    {summary.keyPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              )}

              {summary.sentiment && (
                <div className="flex items-center gap-2 text-xs text-cockpit-400">
                  <span>Sentiment:</span>
                  <Badge
                    variant={
                      summary.sentiment === 'positive'
                        ? 'success'
                        : summary.sentiment === 'negative'
                          ? 'danger'
                          : 'default'
                    }
                  >
                    {summary.sentiment}
                  </Badge>
                </div>
              )}

              <div className="rounded border border-amber-700/40 bg-amber-950/30 p-3 text-xs">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-semibold text-amber-200">AI model metadata</span>
                  <Badge variant="warning">Review before use</Badge>
                </div>
                <div className="flex items-center gap-1.5 text-amber-300">
                  <Bot size={13} />
                  {getProviderLabel()}
                </div>
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-cockpit-400">
                  <dt>Provider</dt>
                  <dd className="text-cockpit-100">{summary.provider}</dd>
                  <dt>Model</dt>
                  <dd className="break-all text-cockpit-100">{summary.model}</dd>
                  <dt>Prompt version</dt>
                  <dd className="text-cockpit-100">{summary.prompt.version}</dd>
                  <dt>Latency</dt>
                  <dd className="text-cockpit-100">{summary.usage.latencyMs ?? 0}ms</dd>
                  <dt>Fallback used</dt>
                  <dd className="text-cockpit-100">
                    {String(summary.usage.fallbackUsed ?? false)}
                  </dd>
                </dl>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Regenerate Summary
              </button>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
