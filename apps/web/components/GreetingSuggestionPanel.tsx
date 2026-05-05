'use client';

import { useState } from 'react';
import { Bot, Loader2, AlertTriangle, Copy, CheckCircle, Phone } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import type { GreetingSuggestionResponse, SupportSession } from '@/lib/api';

export function GreetingSuggestionPanel({
  session,
  suggestion,
  loading,
  error,
  onGenerate,
}: {
  session?: SupportSession;
  suggestion?: GreetingSuggestionResponse;
  loading: boolean;
  error: string | null;
  onGenerate: (
    tone: 'professional' | 'friendly' | 'concise',
    callEventId?: string,
  ) => Promise<GreetingSuggestionResponse | undefined>;
}) {
  const [tone, setTone] = useState<'professional' | 'friendly' | 'concise'>('professional');
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    await onGenerate(tone);
  }

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Panel title="Greeting Suggestion" headerRight={<Badge variant="warning">Mock AI</Badge>}>
      {!session ? (
        <div className="rounded border border-cockpit-600 bg-cockpit-900/50 px-3 py-4 text-center text-sm text-cockpit-500">
          Select a session to generate a greeting suggestion.
        </div>
      ) : (
        <div className="space-y-3">
          <div className="rounded border border-amber-700/30 bg-amber-900/20 p-2">
            <div className="flex items-center gap-1 text-[10px] font-medium text-amber-300">
              <AlertTriangle size={10} />
              No real telephony connected
            </div>
            <div className="mt-0.5 text-[10px] text-amber-400/80">
              Suggested greetings are not spoken or sent automatically. Review before use.
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-xs text-cockpit-400">
              Session: <span className="text-cockpit-200">{session.title}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-medium text-cockpit-400">Tone</label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as 'professional' | 'friendly' | 'concise')}
              className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 focus:border-accent focus:outline-none"
            >
              <option value="professional">Professional</option>
              <option value="friendly">Friendly</option>
              <option value="concise">Concise</option>
            </select>
          </div>

          <div className="rounded border border-cockpit-700 bg-cockpit-900/50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-amber-300">
                <Phone size={13} />
                Mock AI only, review required
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Bot size={12} />}
                Generate suggested greeting
              </button>
            </div>
            {error && (
              <div className="mt-2 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </div>
            )}
          </div>

          {suggestion && (
            <div className="space-y-3">
              <div className="rounded border border-cockpit-700 bg-cockpit-900/50 p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-cockpit-200">Suggested greeting</span>
                  <button
                    onClick={() => handleCopy(suggestion.suggestion.greetingText)}
                    className="inline-flex items-center gap-1 rounded bg-cockpit-700 px-2 py-0.5 text-[10px] text-cockpit-200 hover:bg-cockpit-600"
                  >
                    {copied ? <CheckCircle size={10} /> : <Copy size={10} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <div className="rounded border border-cockpit-600 bg-cockpit-950 p-3 text-sm text-cockpit-100">
                  {suggestion.suggestion.greetingText}
                </div>
                <div className="mt-2 flex items-center gap-1 text-[10px] text-cockpit-500">
                  <AlertTriangle size={10} />
                  Not spoken or sent automatically
                </div>
              </div>

              <div className="rounded border border-amber-700/40 bg-amber-950/30 p-3 text-xs">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-semibold text-amber-200">Mock/dev-only model metadata</span>
                  <Badge variant="warning">Review before use</Badge>
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
                  <dt>Tone</dt>
                  <dd className="text-cockpit-100">{suggestion.suggestion.tone}</dd>
                  <dt>Auto-send</dt>
                  <dd className="text-cockpit-100">{suggestion.safety.autoSend ? 'Yes' : 'No'}</dd>
                  <dt>Voice</dt>
                  <dd className="text-cockpit-100">
                    {suggestion.safety.voiceEnabled ? 'Yes' : 'No'}
                  </dd>
                </dl>
              </div>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
