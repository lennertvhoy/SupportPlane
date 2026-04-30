'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Activity, Cpu, AlertTriangle, Phone } from 'lucide-react';
import { SessionListPanel } from '@/components/SessionListPanel';
import { TicketContextPanel } from '@/components/TicketContextPanel';
import { AiContextPanel } from '@/components/AiContextPanel';
import { DraftNotePanel } from '@/components/DraftNotePanel';
import { AuditTrailPanel } from '@/components/AuditTrailPanel';
import { ConnectorPanel } from '@/components/ConnectorPanel';
import { EvidenceBundlePanel } from '@/components/EvidenceBundlePanel';
import { CallSimulatorPanel } from '@/components/CallSimulatorPanel';
import { GreetingSuggestionPanel } from '@/components/GreetingSuggestionPanel';
import { CustomerReferencePanel } from '@/components/CustomerReferencePanel';
import { TicketSummaryPanel } from '@/components/TicketSummaryPanel';
import { CaseTimelinePanel } from '@/components/CaseTimelinePanel';
import { SupportNoteDraftPanel } from '@/components/SupportNoteDraftPanel';
import { ActionOutboxPanel } from '@/components/ActionOutboxPanel';
import { OutboxMonitorPanel } from '@/components/OutboxMonitorPanel';
import { DeliveryPolicyPanel } from '@/components/DeliveryPolicyPanel';
import { ObservabilityPanel } from '@/components/ObservabilityPanel';
import { AuthGate, IdentityPill } from '@/components/AuthGate';
import { api, type SupportSession, type TicketReference, type AIContextPacket, type AuditEvent, type CallEvent, type DraftSuggestionResponse, type InternalNoteWritebackResult, type ConnectorStatus, type EvidenceBundleExportResponse, type GreetingSuggestionResponse, type AuthIdentity, ApiClientError } from '@/lib/api';

function CockpitContent({ identity, logout }: { identity: AuthIdentity; logout: () => Promise<void> }) {
  const [sessions, setSessions] = useState<SupportSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<SupportSession | undefined>(undefined);
  const [ticket, setTicket] = useState<TicketReference | undefined>(undefined);
  const [packets, setPackets] = useState<AIContextPacket[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [draftSuggestion, setDraftSuggestion] = useState<DraftSuggestionResponse | undefined>(undefined);
  const [greetingSuggestion, setGreetingSuggestion] = useState<GreetingSuggestionResponse | undefined>(undefined);
  const [writebackResult, setWritebackResult] = useState<InternalNoteWritebackResult | undefined>(undefined);
  const [connectorStatus, setConnectorStatus] = useState<ConnectorStatus | undefined>(undefined);
  const [connectorInstallations, setConnectorInstallations] = useState<import('@/lib/api').ConnectorInstallation[]>([]);
  const [healthInfo, setHealthInfo] = useState<{ storeMode?: string; authMode?: string } | undefined>(undefined);
  const [evidenceBundle, setEvidenceBundle] = useState<EvidenceBundleExportResponse | undefined>(undefined);
  const [, setRecentCalls] = useState<CallEvent[]>([]);
  const [evidenceBundleMarkdown, setEvidenceBundleMarkdown] = useState<string | undefined>(undefined);
  const [evidenceBundleLoading, setEvidenceBundleLoading] = useState(false);
  const [evidenceBundleError, setEvidenceBundleError] = useState<string | null>(null);

  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [ticketLoading, setTicketLoading] = useState(false);
  const [packetsLoading, setPacketsLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(false);
  const [greetingLoading, setGreetingLoading] = useState(false);
  const [writebackLoading, setWritebackLoading] = useState(false);

  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [packetsError, setPacketsError] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [greetingError, setGreetingError] = useState<string | null>(null);

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

  const fetchConnectorStatus = useCallback(async () => {
    try {
      const s = await api.getConnectorStatus();
      setConnectorStatus(s);
    } catch {
      // Non-fatal: connector status is decorative
    }
  }, []);

  const fetchConnectorInstallations = useCallback(async () => {
    try {
      const insts = await api.listConnectorInstallations();
      setConnectorInstallations(insts);
    } catch {
      // Non-fatal
    }
  }, []);

  const fetchRecentCalls = useCallback(async () => {
    try {
      const calls = await api.listRecentCalls();
      setRecentCalls(calls);
    } catch {
      // Non-fatal: call list is decorative
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await api.getHealth();
      setHealthInfo({ storeMode: data.storeMode, authMode: data.authMode });
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    fetchSessions();
    fetchConnectorStatus();
    fetchConnectorInstallations();
    fetchRecentCalls();
    fetchHealth();
  }, [fetchSessions, fetchConnectorStatus, fetchConnectorInstallations, fetchRecentCalls, fetchHealth]);

  const handleSelectSession = useCallback(
    async (session: SupportSession) => {
      setSelectedSession(session);
      setTicket(undefined);
      setPackets([]);
      setAuditEvents([]);
      setDraftSuggestion(undefined);
      setGreetingSuggestion(undefined);
      setWritebackResult(undefined);
      setDraftError(null);
      setGreetingError(null);
      setEvidenceBundle(undefined);
      setEvidenceBundleMarkdown(undefined);
      setEvidenceBundleError(null);
      await fetchSessionDetails(session);
    },
    [fetchSessionDetails]
  );

  // Auto-select session from URL query param (e.g. coming from Call Console)
  const hasAutoSelectedRef = useRef(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (hasAutoSelectedRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session');
    if (sessionId && sessions.length > 0) {
      const found = sessions.find((s) => s.id === sessionId);
      if (found) {
        hasAutoSelectedRef.current = true;
        handleSelectSession(found);
      }
    }
  }, [sessions, handleSelectSession]);

  const handleGenerateEvidenceBundle = useCallback(async () => {
    if (!selectedSession) return;
    setEvidenceBundleLoading(true);
    setEvidenceBundleError(null);
    try {
      const [jsonResult, mdResult] = await Promise.all([
        api.getEvidenceBundleJson(selectedSession.id),
        api.getEvidenceBundleMarkdown(selectedSession.id),
      ]);
      setEvidenceBundle(jsonResult);
      setEvidenceBundleMarkdown(mdResult);
      await fetchSessionDetails(selectedSession);
    } catch (err) {
      setEvidenceBundleError(err instanceof ApiClientError ? err.message : 'Failed to generate evidence bundle');
    } finally {
      setEvidenceBundleLoading(false);
    }
  }, [selectedSession, fetchSessionDetails]);

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
        const result = await api.loadZammadTicketContext(selectedSession.id, externalTicketId);
        setTicket(result.ticketReference);
        setSelectedSession(result.session);
        setSessions((prev) =>
          prev.map((s) => (s.id === result.session.id ? result.session : s))
        );
        await fetchSessionDetails(result.session);
        await fetchConnectorStatus();
      } catch (err) {
        setTicketError(err instanceof ApiClientError ? err.message : 'Failed to load ticket context');
      } finally {
        setTicketLoading(false);
      }
    },
    [selectedSession, fetchSessionDetails, fetchConnectorStatus]
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
          modelSelection: { provider: 'ollama', model: 'llama3.1:8b' },
        });
        setDraftSuggestion(response);
        await fetchSessionDetails(selectedSession);
        return response;
      } catch (err) {
        setDraftError(err instanceof ApiClientError ? err.message : 'Failed to generate local AI draft');
        return undefined;
      } finally {
        setDraftLoading(false);
      }
    },
    [selectedSession, fetchSessionDetails]
  );

  const handleGenerateGreeting = useCallback(
    async (tone: 'professional' | 'friendly' | 'concise', callEventId?: string) => {
      if (!selectedSession) return undefined;
      setGreetingLoading(true);
      setGreetingError(null);
      try {
        const response = await api.generateGreetingSuggestion(selectedSession.id, {
          tone,
          callEventId,
          modelSelection: { provider: 'mock', model: 'mock-greeting-v1' },
        });
        setGreetingSuggestion(response);
        await fetchSessionDetails(selectedSession);
        return response;
      } catch (err) {
        setGreetingError(err instanceof ApiClientError ? err.message : 'Failed to generate greeting suggestion');
        return undefined;
      } finally {
        setGreetingLoading(false);
      }
    },
    [selectedSession, fetchSessionDetails]
  );

  const handleWriteback = useCallback(
    async (externalTicketId: string, body: string) => {
      if (!selectedSession) return undefined;
      setWritebackLoading(true);
      try {
        const draft = await api.createInternalNoteDraft(selectedSession.id, {
          externalTicketId,
          body,
          subject: 'Internal note from SupportPlane',
        });
        const result = await api.writebackInternalNote(selectedSession.id, {
          draftId: draft.id,
          externalTicketId,
          body,
        });
        setWritebackResult(result);
        await fetchSessionDetails(selectedSession);
        return result;
      } catch (err) {
        const message = err instanceof ApiClientError ? err.message : 'Writeback failed';
        setWritebackResult({
          success: false,
          error: { code: 'UNKNOWN', message, safeToDisplay: true },
          metadata: {},
        });
        return undefined;
      } finally {
        setWritebackLoading(false);
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
          {healthInfo && (
            <span className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-0.5 text-[10px] text-cockpit-400">
              Auth: {healthInfo.authMode} · Store: {healthInfo.storeMode}
            </span>
          )}
          {connectorStatus && (
            <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium ${
              connectorStatus.mode === 'mock'
                ? 'border-amber-700/40 bg-amber-900/30 text-amber-300'
                : 'border-emerald-700/40 bg-emerald-900/30 text-emerald-300'
            }`}>
              {connectorStatus.mode === 'mock' ? 'Mock' : 'Zammad'} mode
            </span>
          )}
          <IdentityPill identity={identity} logout={logout} />
          <button
            onClick={() => window.location.href = '/call-console'}
            className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-0.5 text-[10px] text-cockpit-300 hover:bg-cockpit-800"
          >
            <Phone size={10} />
            Call Console
          </button>
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
            canCreate={identity.permissions.includes('*') || identity.permissions.includes('support_session:create')}
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
            <CallSimulatorPanel
              sessions={sessions}
              selectedSession={selectedSession}
              onSelectSession={handleSelectSession}
              auditEvents={auditEvents}
            />
            <ConnectorPanel identity={identity} />
            <CustomerReferencePanel />
            <EvidenceBundlePanel
              sessionId={selectedSession?.id}
              bundle={evidenceBundle}
              markdown={evidenceBundleMarkdown}
              loading={evidenceBundleLoading}
              error={evidenceBundleError}
              onGenerate={handleGenerateEvidenceBundle}
            />
            <TicketSummaryPanel identity={identity} selectedTicket={ticket} />
            <TicketContextPanel
              session={selectedSession}
              ticket={ticket}
              loading={ticketLoading}
              error={ticketError}
              onLoad={handleLoadTicket}
              connectorMode={connectorStatus?.mode}
              connectorInstallation={connectorInstallations.find((i) => i.adapterType === 'zammad') ?? connectorInstallations[0]}
            />
            <CaseTimelinePanel session={selectedSession} />
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
              onWriteback={handleWriteback}
              writebackResult={writebackResult}
              writebackLoading={writebackLoading}
            />
            <GreetingSuggestionPanel
              session={selectedSession}
              suggestion={greetingSuggestion}
              loading={greetingLoading}
              error={greetingError}
              onGenerate={handleGenerateGreeting}
            />
            <SupportNoteDraftPanel
              session={selectedSession}
              identity={identity}
              externalTicketId={ticket?.externalTicketId}
            />
            <ActionOutboxPanel
              session={selectedSession}
              ticket={ticket}
              identity={identity}
              draftBody={draftSuggestion?.draft}
              onChanged={selectedSession ? () => fetchSessionDetails(selectedSession) : undefined}
            />
            <OutboxMonitorPanel
              identity={identity}
              onChanged={selectedSession ? () => fetchSessionDetails(selectedSession) : undefined}
            />
            <ObservabilityPanel identity={identity} />
            <DeliveryPolicyPanel identity={identity} />
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

export default function CockpitPage() {
  return <AuthGate>{(identity, logout) => <CockpitContent identity={identity} logout={logout} />}</AuthGate>;
}
