'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, Brain, Plus, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Panel } from './Panel';
import type { AIContextPacket, SupportSession } from '@/lib/api';

export function AiContextPanel({
  session,
  packets,
  loading,
  error,
  onAddManual,
}: {
  session?: SupportSession;
  packets: AIContextPacket[];
  loading: boolean;
  error: string | null;
  onAddManual: (payload: Record<string, unknown>) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [manualLabel, setManualLabel] = useState('');
  const [manualValue, setManualValue] = useState('');

  const ticketPackets = packets.filter((p) => p.provenance === 'ticket');
  const customerPackets = packets.filter((p) => p.provenance === 'customer');
  const manualPackets = packets.filter((p) => p.provenance === 'manual');
  const screenObservationPackets = packets.filter((p) => p.provenance === 'screen_observation');
  const otherPackets = packets.filter(
    (p) => !['ticket', 'customer', 'manual', 'screen_observation'].includes(p.provenance)
  );

  const hasTicketContext = ticketPackets.length > 0;

  return (
    <Panel
      title="AI Context Quality"
      headerRight={
        session ? (
          <button
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1 rounded bg-cockpit-700 px-2 py-1 text-xs text-cockpit-200 hover:bg-cockpit-600"
          >
            <Plus size={12} />
            Add manual
          </button>
        ) : null
      }
    >
      {!session ? (
        <div className="rounded border border-cockpit-600 bg-cockpit-900/50 px-3 py-4 text-center text-sm text-cockpit-500">
          Select a session to view AI context.
        </div>
      ) : (
        <div className="space-y-3">
          {!hasTicketContext && (
            <div className="flex items-center gap-2 rounded border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
              <AlertTriangle size={14} />
              Ticket context not loaded. Load a ticket to improve AI quality.
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {showForm && (
            <div className="rounded border border-cockpit-600 bg-cockpit-900 p-3">
              <div className="text-xs font-medium text-cockpit-300 mb-2">
                Add manual context packet
              </div>
              <input
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
                placeholder="Label (e.g. escalation_reason)"
                className="w-full rounded border border-cockpit-600 bg-cockpit-800 px-2 py-1 text-sm text-cockpit-100 placeholder:text-cockpit-500 focus:border-accent focus:outline-none"
              />
              <textarea
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                placeholder="Value"
                rows={2}
                className="mt-2 w-full rounded border border-cockpit-600 bg-cockpit-800 px-2 py-1 text-sm text-cockpit-100 placeholder:text-cockpit-500 focus:border-accent focus:outline-none"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!manualLabel.trim()) return;
                    onAddManual({
                      label: manualLabel.trim(),
                      value: manualValue.trim(),
                    });
                    setManualLabel('');
                    setManualValue('');
                    setShowForm(false);
                  }}
                  className="rounded bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-dark"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded bg-cockpit-700 px-3 py-1 text-xs text-cockpit-300 hover:bg-cockpit-600"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-cockpit-400">
              <Loader2 size={14} className="animate-spin" />
              Loading packets...
            </div>
          ) : packets.length === 0 ? (
            <div className="py-4 text-center text-sm text-cockpit-500">
              <Brain size={24} className="mx-auto mb-2 opacity-50" />
              No AI context packets yet.
            </div>
          ) : (
            <div className="space-y-2">
              <PacketGroup title="Ticket" packets={ticketPackets} />
              <PacketGroup title="Customer" packets={customerPackets} />
              <PacketGroup title="Manual" packets={manualPackets} />
              <PacketGroup title="Screen Observation" packets={screenObservationPackets} />
              <PacketGroup title="Other" packets={otherPackets} />
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

function PacketGroup({
  title,
  packets,
}: {
  title: string;
  packets: AIContextPacket[];
}) {
  if (packets.length === 0) return null;
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-cockpit-500">
        {title}
      </div>
      <div className="space-y-1.5">
        {packets.map((p) => (
          <div
            key={p.id}
            className="rounded border border-cockpit-700 bg-cockpit-900/40 px-2.5 py-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-cockpit-300">
                <Brain size={12} className="text-accent" />
                <span className="font-medium">{p.provenance}</span>
                {p.sourceAdapterId && (
                  <span className="text-cockpit-500">• {p.sourceAdapterId}</span>
                )}
              </div>
              <PacketState packet={p} />
            </div>
            {p.provenance === 'screen_observation' && (
              <ScreenObservationPacketDetails packet={p} />
            )}
            <div className="mt-1 text-xs text-cockpit-400">
              {Object.entries(p.payload)
                .filter(([k]) => !['mockDevOnly', 'source', 'observationId', 'redactedSummary', 'rawInputPlaceholder', 'redactionStatus', 'rawImageRetention', 'safetyFlags'].includes(k))
                .slice(0, 3)
                .map(([k, v]) => (
                <div key={k} className="truncate">
                  {k}: {String(v)}
                </div>
              ))}
              {Object.keys(p.payload).filter(([k]) => !['mockDevOnly', 'source', 'observationId', 'redactedSummary', 'rawInputPlaceholder', 'redactionStatus', 'rawImageRetention', 'safetyFlags'].includes(k)).length > 3 && (
                <div className="text-cockpit-500">
                  +{Object.keys(p.payload).length - 3} more fields
                </div>
              )}
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px] text-cockpit-500">
              <span>{p.id.slice(0, 8)}</span>
              <span>•</span>
              <span>{new Date(p.createdAt).toLocaleTimeString()}</span>
              {p.redactionLog.length > 0 && (
                <>
                  <span>•</span>
                  <span className="text-warning">
                    {p.redactionLog.length} redacted
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScreenObservationPacketDetails({ packet }: { packet: AIContextPacket }) {
  const payload = packet.payload as Record<string, unknown>;
  const redactionStatus = payload.redactionStatus as string | undefined;
  const safetyFlags = payload.safetyFlags as Record<string, boolean> | undefined;
  const rawImageRetention = payload.rawImageRetention as string | undefined;

  return (
    <div className="mt-1 space-y-1">
      <div className="flex flex-wrap gap-1">
        {!!payload.kind && (
          <span className="rounded border border-cockpit-700 bg-cockpit-900 px-1.5 py-0.5 text-[10px] text-cockpit-300">
            kind: {String(payload.kind)}
          </span>
        )}
        {redactionStatus && (
          <span className={`rounded border px-1.5 py-0.5 text-[10px] ${redactionStatus === 'placeholder_redacted' ? 'border-amber-700/40 bg-amber-900/20 text-amber-300' : 'border-cockpit-700 bg-cockpit-900 text-cockpit-300'}`}>
            redaction: {redactionStatus}
          </span>
        )}
        {rawImageRetention && (
          <span className="rounded border border-cockpit-700 bg-cockpit-900 px-1.5 py-0.5 text-[10px] text-cockpit-300">
            retention: {rawImageRetention}
          </span>
        )}
      </div>
      {safetyFlags && (
        <div className="flex flex-wrap gap-1 text-[10px]">
          {safetyFlags.noRawPixels && (
            <span className="text-cockpit-500">no raw pixels</span>
          )}
          {safetyFlags.noClipboardAccess && (
            <span className="text-cockpit-500">no clipboard</span>
          )}
          {safetyFlags.noOcr && (
            <span className="text-cockpit-500">no OCR</span>
          )}
          {safetyFlags.rawImageStored === false && (
            <span className="text-cockpit-500">raw image not stored</span>
          )}
        </div>
      )}
      {redactionStatus === 'placeholder_redacted' && (
        <div className="flex items-center gap-1 text-[10px] text-amber-400">
          <AlertTriangle size={10} />
          Warning: placeholder-only redaction
        </div>
      )}
    </div>
  );
}

function PacketState({ packet }: { packet: AIContextPacket }) {
  if (packet.redactionLog.length > 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-warning">
        <AlertTriangle size={10} />
        Warning
      </span>
    );
  }
  if (packet.contextHash) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-success">
        <CheckCircle2 size={10} />
        Verified
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-cockpit-500">
      <CheckCircle2 size={10} />
      Loaded
    </span>
  );
}
