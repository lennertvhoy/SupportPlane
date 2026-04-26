'use client';

import { useEffect, useState, useCallback } from 'react';
import { Activity, Cpu, AlertTriangle } from 'lucide-react';
import { SessionListPanel } from '@/components/SessionListPanel';
import { TicketContextPanel } from '@/components/TicketContextPanel';
import { AiContextPanel } from '@/components/AiContextPanel';
import { DraftNotePanel } from '@/components/DraftNotePanel';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { api, type SupportSession, type TicketReference, type AIContextPacket, type AuditEvent, type DraftSuggestionResponse, ApiClientError } from '@/lib/api';

export default function CockpitPage() {
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SupportSession | undefined>(undefined);
  const [ticket, setTicket] = useState<TicketReference | undefined>(undefined);
  const [packets, setPackets] = useState<AIContextPacket[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [draftSuggestion, setDraftSuggestion] = useState<DraftSuggestionResponse | undefined>(undefined);

  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [packetsLoading, setPacketsLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);

  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [packetsError, setPacketsError] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const data = await api.listSessions();
      setSessions(data);
    } catch (err) {
      setSessionsError(err instanceof ApiClientError ? err.message : 'Failed to load sessions');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  const fetchSessionDetails = useCallback(async (session: SupportSession) => {
    setPacketsLoading(true);
    setAuditLoading(true);
    setPacketsError(null);
    try {
      const [p, a] = await Promise.all([
        api.listContextPackets(session.id),
        api.listAuditEvents(session.id),
      ]);
      setPackets(p);
      setAuditEvents(a);
    } catch (err) {
      setPacketsError(err instanceof ApiClientError ? err.message : 'Failed to load session details');
    } finally {
      setPacketsLoading(false);
      setAuditLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSelectSession = useCallback(
    async (session: SupportSession) => {
      setSelectedSession(session);
      setTicket(undefined);
      setPackets([]);
      setAuditEvents([]);
      setDraftSuggestion(undefined);
      setDraftError(null);
      await fetchSessionDetails(session);
    },
    [fetchSessionDetails]
  );

  const handleCreateSession = useCallback(
    async (title: string, description?: string) => {
      try {
        const created = await api.createSession({ title, description, priority: 'normal' });
        setSessions((prev) => [created, ...prev]);
        await handleSelectSession(created);
      } catch (err) {
        setSessionsError(err instanceof ApiClientError ? err.message : 'Failed to create session');
      }
    },
    [handleSelectSession]
  );

  const handleLoadTicket = useCallback(
    async (externalTicketId: string) => {
      if (!selectedSession) return;
      setTicketLoading(true);
      setTicketError(null);
      try {
        const result = await api.loadTicketContext(selectedSession.id, externalTicketId);
        setTicket(result.ticketReference);
        setSelectedSession(result.session);
        setSessions((prev) =>
          prev.map((s) => (s.id === result.session.id ? result.session : s))
        );
        // Refresh packets and audit after ticket load
        await fetchSessionDetails(result.session);
      } catch (err) {
        setTicketError(err instanceof ApiClientError ? err.message : 'Failed to load ticket context');
      } finally {
        setTicketLoading(false);
      }
    },
    [selectedSession, fetchSessionDetails]
  );

  const handleAddManual = useCallback(
    async (payload: Record<string, unknown>) => {
      if (!selectedSession) return;
      try {
        await api.createContextPacket(selectedSession.id, {
          provenance: 'manual',
          payload,
        });
        await fetchSessionDetails(selectedSession);
      } catch (err) {
        setPacketsError(err instanceof ApiClientError ? err.message : 'Failed to add context');
      }
    },
    [selectedSession, fetchSessionDetails]
  );

  const handleGenerateDraft = useCallback(
    async (operatorInstructions?: string) => {
      if (!selectedSession) return undefined;
      setDraftLoading(true);
      setDraftError(null);
      try {
        const response = await api.generateDraftSuggestion(selectedSession.id, {
          operatorInstructions,
          modelSelection: { provider: 'mock', model: 'mock-support-note-v1' },
        });
        setDraftSuggestion(response);
        await fetchSessionDetails(selectedSession);
        return response;
      } catch (err) {
        setDraftError(err instanceof ApiClientError ? err.message : 'Failed to generate mock draft');
        return undefined;
      } finally {
        setDraftLoading(false);
      }
    },
    [selectedSession, fetchSessionDetails]
  );

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-cockpit-700 bg-cockpit-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-cockpit-100">SupportPlane</h1>
            <p className="text-[10px] text-cockpit-500">Support Cockpit</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded border border-amber-700/40 bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-300">
            <AlertTriangle size={10} />
            DEV / MOCK DATA
          </span>
          <span className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-0.5 text-[10px] text-cockpit-400">
            <Cpu size={10} />
            API: localhost:4110
          </span>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar: sessions */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-cockpit-700 bg-cockpit-800/40 p-3">
          <SessionListPanel
            sessions={sessions}
            selectedId={selectedSession?.id}
            loading={sessionsLoading}
            error={sessionsError}
            onSelect={handleSelectSession}
            onCreate={handleCreateSession}
          />
        </aside>

        {/* Center + Right */}
        <main className="flex flex-1 flex-col overflow-y-auto p-4">
          {/* Selected session banner */}
          {selectedSession && (
            <div className="mb-4 rounded border border-cockpit-700 bg-cockpit-800/60 px-4 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-cockpit-100">
                    {selectedSession.title}
                  </div>
                  <div className="mt-0.5 text-xs text-cockpit-400">
                    {selectedSession.id} • {selectedSession.status} • {selectedSession.priority}
                  </div>
                </div>
                <div className="text-right text-xs text-cockpit-500">
                  <div>Tickets: {selectedSession.linkedTicketIds.length}</div>
                  <div>Packets: {selectedSession.aiContextPacketIds.length}</div>
                </div>
              </div>
            </div>
          )}

          {/* Panels grid */}
          <div className="grid flex-1 grid-cols-1 gap-4 lg:grid-cols-2">
            <TicketContextPanel
              session={selectedSession}
              ticket={ticket}
              loading={ticketLoading}
              error={ticketError}
              onLoad={handleLoadTicket}
            />
            <AiContextPanel
              session={selectedSession}
              packets={packets}
              loading={packetsLoading}
              error={packetsError}
              onAddManual={handleAddManual}
            />
            <DraftNotePanel
              session={selectedSession}
              suggestion={draftSuggestion}
              loading={draftLoading}
              error={draftError}
              onGenerate={handleGenerateDraft}
            />
            <AuditTrailPanel
              session={selectedSession}
              events={auditEvents}
              loading={auditLoading}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
