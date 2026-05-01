'use client';

import { useState } from 'react';
import { RefreshCw, Copy, CheckCircle, FileDown, ScrollText } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import { EvidenceBundleTimeline } from './EvidenceBundleTimeline';
import type { EvidenceBundleExportResponse } from '@/lib/api';

interface EvidenceBundlePanelProps {
  sessionId?: string;
  bundle?: EvidenceBundleExportResponse;
  markdown?: string;
  loading?: boolean;
  error?: string | null;
  onGenerate?: () => void;
}

export function EvidenceBundlePanel({
  sessionId,
  bundle,
  markdown,
  loading,
  error,
  onGenerate,
}: EvidenceBundlePanelProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'json' | 'markdown' | 'timeline'>('summary');
  const [copied, setCopied] = useState(false);

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
    <Panel
      title="Evidence Bundle"
      headerRight={
        <div className="flex items-center gap-2">
          {bundle && (
            <Badge variant="success" className="text-[10px]">
              {bundle.format}
            </Badge>
          )}
          {bundle && sessionId && (
            <button
              onClick={async () => {
                try {
                  const res = await fetch(`http://localhost:4110/support-sessions/${sessionId}/evidence-bundle.pdf`, {
                    headers: {
                      'x-tenant-id': 'dev-tenant',
                      'x-user-id': 'dev-user',
                      'x-user-role': 'support_agent',
                    },
                    credentials: 'include',
                  });
                  if (!res.ok) {
                    const body = await res.json().catch(() => null);
                    alert(body?.message ?? `PDF download failed: HTTP ${res.status}`);
                    return;
                  }
                  const blob = await res.blob();
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `evidence-bundle-${sessionId}.pdf`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                } catch {
                  alert('PDF download failed');
                }
              }}
              className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] font-medium text-cockpit-300 hover:bg-cockpit-800"
            >
              <FileDown size={10} />
              PDF
            </button>
          )}
          <button
            onClick={onGenerate}
            disabled={!sessionId || loading}
            className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
            {bundle ? 'Refresh' : 'Generate'}
          </button>
        </div>
      }
    >
      {!sessionId ? (
        <div className="space-y-2">
          <div className="text-xs text-cockpit-400">
            Select a session to generate an evidence bundle.
          </div>
          <div className="rounded border border-amber-700/30 bg-amber-900/20 p-2">
            <div className="text-[10px] font-medium text-amber-300">Local / Mock Export Only</div>
            <div className="mt-0.5 text-[10px] text-amber-400/80">
              Evidence bundles are generated from local development data. No real compliance, legal evidence, cryptographic signing, or object storage is claimed.
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="text-xs text-red-400">{error}</div>
      ) : !bundle ? (
        <div className="space-y-3">
          <div className="text-xs text-cockpit-400">
            Generate an evidence bundle to export session data for review or audit.
          </div>
          <div className="rounded border border-amber-700/30 bg-amber-900/20 p-2">
            <div className="text-[10px] font-medium text-amber-300">MVP Export</div>
            <div className="mt-0.5 text-[10px] text-amber-400/80">
              This is a local/mock export. No real compliance or legal evidence is claimed.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('summary')}
              className={`rounded px-2 py-1 text-[10px] font-medium ${
                activeTab === 'summary'
                  ? 'bg-cockpit-700 text-cockpit-100'
                  : 'text-cockpit-500 hover:text-cockpit-300'
              }`}
            >
              Summary
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`rounded px-2 py-1 text-[10px] font-medium ${
                activeTab === 'json'
                  ? 'bg-cockpit-700 text-cockpit-100'
                  : 'text-cockpit-500 hover:text-cockpit-300'
              }`}
            >
              JSON
            </button>
            <button
              onClick={() => setActiveTab('markdown')}
              className={`rounded px-2 py-1 text-[10px] font-medium ${
                activeTab === 'markdown'
                  ? 'bg-cockpit-700 text-cockpit-100'
                  : 'text-cockpit-500 hover:text-cockpit-300'
              }`}
            >
              Markdown
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`rounded px-2 py-1 text-[10px] font-medium ${
                activeTab === 'timeline'
                  ? 'bg-cockpit-700 text-cockpit-100'
                  : 'text-cockpit-500 hover:text-cockpit-300'
              }`}
            >
              <ScrollText size={10} className="mr-1 inline" />
              Timeline
            </button>
          </div>

          {activeTab === 'summary' && (
            <div className="space-y-2">
              <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                <div className="text-[10px] text-cockpit-500">Bundle ID</div>
                <div className="text-xs text-cockpit-200">{bundle.bundle.bundleId}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                  <div className="text-[10px] text-cockpit-500">Tickets</div>
                  <div className="text-xs text-cockpit-200">{bundle.bundle.linkedTickets.length}</div>
                </div>
                <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                  <div className="text-[10px] text-cockpit-500">Packets</div>
                  <div className="text-xs text-cockpit-200">{bundle.bundle.contextPackets.length}</div>
                </div>
                <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                  <div className="text-[10px] text-cockpit-500">Audit Events</div>
                  <div className="text-xs text-cockpit-200">{bundle.bundle.auditTimeline.length}</div>
                </div>
                <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                  <div className="text-[10px] text-cockpit-500">AI Usage</div>
                  <div className="text-xs text-cockpit-200">{bundle.bundle.aiUsage.length}</div>
                </div>
                <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                  <div className="text-[10px] text-cockpit-500">Call Events</div>
                  <div className="text-xs text-cockpit-200">{bundle.bundle.callEvents?.length ?? 0}</div>
                </div>
                <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                  <div className="text-[10px] text-cockpit-500">Telephony Bridge</div>
                  <div className="text-xs text-cockpit-200">{bundle.bundle.telephonyBridgeEvents?.length ?? 0}</div>
                </div>
                <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                  <div className="text-[10px] text-cockpit-500">Customers</div>
                  <div className="text-xs text-cockpit-200">{bundle.bundle.customerReferences?.length ?? 0}</div>
                </div>
                <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                <div className="text-[10px] text-cockpit-500">Connectors</div>
                <div className="text-xs text-cockpit-200">{bundle.bundle.connectorInstallations?.length ?? 0}</div>
              </div>
                <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                  <div className="text-[10px] text-cockpit-500">Store</div>
                  <div className="text-xs text-cockpit-200">{bundle.bundle.sourceProvenance.storeType}</div>
                </div>
                <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                  <div className="text-[10px] text-cockpit-500">Action Outbox</div>
                  <div className="text-xs text-cockpit-200">{bundle.bundle.actionOutbox?.length ?? 0}</div>
                </div>
              </div>
              <div className="rounded border border-amber-700/30 bg-amber-900/20 p-2">
                <div className="text-[10px] font-medium text-amber-300">Mock / Dev-Only</div>
                <div className="mt-0.5 text-[10px] text-amber-400/80">
                  {bundle.bundle.mockDevOnlyDisclaimers[0]} No real telephony connected.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="relative">
              <button
                onClick={() => handleCopy(JSON.stringify(bundle.bundle, null, 2))}
                className="absolute right-1 top-1 inline-flex items-center gap-1 rounded bg-cockpit-700 px-1.5 py-0.5 text-[10px] text-cockpit-200 hover:bg-cockpit-600"
              >
                {copied ? <CheckCircle size={10} /> : <Copy size={10} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <pre className="max-h-64 overflow-auto rounded border border-cockpit-700 bg-cockpit-950 p-2 text-[10px] text-cockpit-300">
                {JSON.stringify(bundle.bundle, null, 2)}
              </pre>
            </div>
          )}

          {activeTab === 'markdown' && markdown && (
            <div className="relative">
              <button
                onClick={() => handleCopy(markdown)}
                className="absolute right-1 top-1 inline-flex items-center gap-1 rounded bg-cockpit-700 px-1.5 py-0.5 text-[10px] text-cockpit-200 hover:bg-cockpit-600"
              >
                {copied ? <CheckCircle size={10} /> : <Copy size={10} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <pre className="max-h-64 overflow-auto rounded border border-cockpit-700 bg-cockpit-950 p-2 text-[10px] text-cockpit-300">
                {markdown}
              </pre>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="max-h-80 overflow-auto">
              <EvidenceBundleTimeline bundle={bundle?.bundle} />
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}
