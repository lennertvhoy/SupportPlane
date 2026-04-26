'use client';

import { useState } from 'react';
import { Phone, Link2, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import { api, type CallEvent, type SupportSession, ApiClientError } from '@/lib/api';

interface CallSimulatorPanelProps {
  sessions: SupportSession[];
  selectedSession?: SupportSession;
  onSelectSession: (session: SupportSession) => void;
  auditEvents: Array<{ eventType: string; metadata: Record<string, unknown>; createdAt: string }>;
}

export function CallSimulatorPanel({
  sessions: _sessions,
  selectedSession,
  onSelectSession: _onSelectSession,
  auditEvents,
}: CallSimulatorPanelProps) {
  const [rawNumber, setRawNumber] = useState('03 555 01 01');
  const [callEvent, setCallEvent] = useState<CallEvent | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [linkLoading, setLinkLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [linked, setLinked] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    setError(null);
    setCallEvent(undefined);
    setLinked(false);
    try {
      const event = await api.createFakeIncomingCall({
        externalCallId: `FAKE-${Date.now()}`,
        rawCallerNumber: rawNumber,
        callerDisplayName: 'Mock Caller',
      });
      setCallEvent(event);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to simulate incoming call');
    } finally {
      setLoading(false);
    }
  };

  const handleLink = async () => {
    if (!callEvent || !selectedSession) return;
    setLinkLoading(true);
    setLinkError(null);
    try {
      await api.linkCallToSession(callEvent.id, { sessionId: selectedSession.id });
      setLinked(true);
      // Refresh call event state
      const refreshed = await api.getCall(callEvent.id);
      setCallEvent(refreshed);
    } catch (err) {
      setLinkError(err instanceof ApiClientError ? err.message : 'Failed to link call');
    } finally {
      setLinkLoading(false);
    }
  };

  const callAuditEvents = auditEvents.filter(
    (e) =>
      e.eventType === 'call_event_received' ||
      e.eventType === 'caller_matched' ||
      e.eventType === 'call_linked_to_session'
  );

  return (
    <Panel
      title="Call Simulator"
      headerRight={
        <Badge variant="warning" className="text-[10px]">
          Fake webhook
        </Badge>
      }
    >
      <div className="space-y-3">
        <div className="rounded border border-amber-700/30 bg-amber-900/20 p-2">
          <div className="flex items-center gap-1 text-[10px] font-medium text-amber-300">
            <AlertTriangle size={10} />
            No real telephony connected
          </div>
          <div className="mt-0.5 text-[10px] text-amber-400/80">
            Caller matching uses deterministic fixture data. This is mock-only.
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-[10px] font-medium text-cockpit-400">
            Raw caller number (Belgian fixture)
          </label>
          <input
            type="text"
            value={rawNumber}
            onChange={(e) => setRawNumber(e.target.value)}
            className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 focus:border-accent focus:outline-none"
            placeholder="e.g. +32 3 555 0101"
          />
          <div className="text-[10px] text-cockpit-500">
            Try: +32 3 555 0101, 03 555 01 01, or 0032 3 555 0101
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent/90 disabled:opacity-50"
        >
          {loading && <Loader2 size={10} className="animate-spin" />}
          <Phone size={10} />
          Simulate incoming call
        </button>

        {error && (
          <div className="flex items-center gap-2 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            <AlertTriangle size={14} />
            {error}
          </div>
        )}

        {callEvent && (
          <div className="space-y-2 rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-cockpit-300">Fake Incoming Call</span>
              <Badge variant={callEvent.callerMatch?.status === 'matched' ? 'success' : 'default'} className="text-[10px]">
                {callEvent.status}
              </Badge>
            </div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-cockpit-500">Raw number</span>
                <span className="text-cockpit-200">{callEvent.caller.rawNumber}</span>
              </div>
              {callEvent.caller.normalizedNumber && (
                <div className="flex justify-between">
                  <span className="text-cockpit-500">Normalized</span>
                  <span className="font-medium text-cockpit-200">{callEvent.caller.normalizedNumber}</span>
                </div>
              )}
              {callEvent.callerMatch && (
                <>
                  <div className="flex justify-between">
                    <span className="text-cockpit-500">Match status</span>
                    <span className="text-cockpit-200">{callEvent.callerMatch.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-cockpit-500">Confidence</span>
                    <span className="text-cockpit-200">{callEvent.callerMatch.confidence}</span>
                  </div>
                  {callEvent.callerMatch.customerName && (
                    <div className="flex justify-between">
                      <span className="text-cockpit-500">Customer</span>
                      <span className="text-cockpit-200">{callEvent.callerMatch.customerName}</span>
                    </div>
                  )}
                  {callEvent.callerMatch.matchedTicketIds && callEvent.callerMatch.matchedTicketIds.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-cockpit-500">Recent tickets</span>
                      <span className="text-cockpit-200">{callEvent.callerMatch.matchedTicketIds.join(', ')}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {selectedSession ? (
              <div className="space-y-2 pt-1">
                {!linked && !callEvent.sessionId && (
                  <button
                    onClick={handleLink}
                    disabled={linkLoading}
                    className="inline-flex w-full items-center justify-center gap-1 rounded border border-cockpit-600 bg-cockpit-800 px-2 py-1 text-[10px] font-medium text-cockpit-200 hover:bg-cockpit-700 disabled:opacity-50"
                  >
                    {linkLoading && <Loader2 size={10} className="animate-spin" />}
                    <Link2 size={10} />
                    Link to selected session
                  </button>
                )}
                {(linked || callEvent.sessionId) && (
                  <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <CheckCircle size={10} />
                    Linked to session {selectedSession.id.slice(0, 8)}...
                  </div>
                )}
                {linkError && (
                  <div className="text-[10px] text-danger">{linkError}</div>
                )}
              </div>
            ) : (
              <div className="text-[10px] text-cockpit-500">
                Select or create a session to link this call.
              </div>
            )}
          </div>
        )}

        {callAuditEvents.length > 0 && (
          <div className="space-y-1">
            <div className="text-[10px] font-medium text-cockpit-400">Call audit trail</div>
            {callAuditEvents.map((e, i) => (
              <div key={i} className="rounded border border-cockpit-700/50 bg-cockpit-900/30 px-2 py-1 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="text-cockpit-300">{e.eventType}</span>
                  <span className="text-cockpit-500">{new Date(e.createdAt).toLocaleTimeString()}</span>
                </div>
                {typeof e.metadata.normalizedNumber === 'string' && (
                  <div className="text-cockpit-500">{e.metadata.normalizedNumber}</div>
                )}
                {typeof e.metadata.matchStatus === 'string' && (
                  <div className="text-cockpit-500">match: {e.metadata.matchStatus}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Panel>
  );
}
