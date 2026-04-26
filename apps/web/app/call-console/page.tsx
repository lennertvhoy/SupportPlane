'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  Phone,
  PhoneOff,
  PhoneIncoming,
  Pause,
  Play,
  CheckCircle,
  Loader2,
  Copy,
  ArrowLeft,
  Bot,
  Clock,
  User,
  Ticket,
  Link2,
} from 'lucide-react';
import { Panel } from '@/components/Panel';
import { Badge } from '@/components/Badge';
import {
  api,
  type CallEvent,
  type CallTimelineItem,
  type SupportSession,
  type GreetingSuggestionResponse,
  ApiClientError,
} from '@/lib/api';

export default function CallConsolePage() {
  const router = useRouter();
  const [calls, setCalls] = useState<CallEvent[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallEvent | undefined>(undefined);
  const [timeline, setTimeline] = useState<CallTimelineItem[]>([]);
  const [linkedSession, setLinkedSession] = useState<SupportSession | undefined>(undefined);
  const [greetingSuggestion, setGreetingSuggestion] = useState<GreetingSuggestionResponse | undefined>(undefined);
  const [callsLoading, setCallsLoading] = useState(false);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [greetingLoading, setGreetingLoading] = useState(false);
  const [greetingError, setGreetingError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<'professional' | 'friendly' | 'concise'>('professional');

  const fetchCalls = useCallback(async () => {
    setCallsLoading(true);
    setCallsError(null);
    try {
      const data = await api.listRecentCalls();
      setCalls(data);
    } catch (err) {
      setCallsError(err instanceof ApiClientError ? err.message : 'Failed to load calls');
    } finally {
      setCallsLoading(false);
    }
  }, []);

  const fetchCallDetails = useCallback(async (call: CallEvent) => {
    try {
      const tl = await api.getCallTimeline(call.id);
      setTimeline(tl.timelineItems);
    } catch {
      setTimeline([]);
    }

    if (call.sessionId) {
      try {
        const session = await api.getSession(call.sessionId);
        setLinkedSession(session);
      } catch {
        setLinkedSession(undefined);
      }
    } else {
      setLinkedSession(undefined);
    }

    setGreetingSuggestion(undefined);
    setGreetingError(null);
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  const handleSelectCall = useCallback(
    async (call: CallEvent) => {
      setSelectedCall(call);
      await fetchCallDetails(call);
    },
    [fetchCallDetails]
  );

  const handleStatusTransition = useCallback(
    async (newStatus: string) => {
      if (!selectedCall) return;
      setActionLoading(newStatus);
      try {
        const result = await api.updateCallStatus(selectedCall.id, { status: newStatus });
        setSelectedCall(result.callEvent);
        setCalls((prev) =>
          prev.map((c) => (c.id === result.callEvent.id ? result.callEvent : c))
        );
        await fetchCallDetails(result.callEvent);
      } catch (err) {
        setCallsError(err instanceof ApiClientError ? err.message : 'Status transition failed');
      } finally {
        setActionLoading(null);
      }
    },
    [selectedCall, fetchCallDetails]
  );

  const handleGenerateGreeting = useCallback(async () => {
    if (!linkedSession) return;
    setGreetingLoading(true);
    setGreetingError(null);
    try {
      const response = await api.generateGreetingSuggestion(linkedSession.id, {
        tone,
        callEventId: selectedCall?.id,
        modelSelection: { provider: 'mock', model: 'mock-greeting-v1' },
      });
      setGreetingSuggestion(response);
      if (selectedCall) {
        await fetchCallDetails(selectedCall);
      }
    } catch (err) {
      setGreetingError(err instanceof ApiClientError ? err.message : 'Failed to generate greeting');
    } finally {
      setGreetingLoading(false);
    }
  }, [linkedSession, selectedCall, tone, fetchCallDetails]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'ringing':
        return 'text-amber-300';
      case 'answered':
        return 'text-emerald-300';
      case 'on_hold':
        return 'text-blue-300';
      case 'ended':
        return 'text-cockpit-400';
      case 'missed':
        return 'text-red-300';
      default:
        return 'text-cockpit-400';
    }
  };

  const statusBg = (status: string) => {
    switch (status) {
      case 'ringing':
        return 'bg-amber-900/30 border-amber-700/40';
      case 'answered':
        return 'bg-emerald-900/30 border-emerald-700/40';
      case 'on_hold':
        return 'bg-blue-900/30 border-blue-700/40';
      case 'ended':
        return 'bg-cockpit-800 border-cockpit-700';
      case 'missed':
        return 'bg-red-900/30 border-red-700/40';
      default:
        return 'bg-cockpit-800 border-cockpit-700';
    }
  };

  const allowedActions = (status: string) => {
    switch (status) {
      case 'ringing':
        return [
          { key: 'answered', label: 'Answer', icon: PhoneIncoming, variant: 'success' as const },
          { key: 'missed', label: 'Mark missed', icon: PhoneOff, variant: 'danger' as const },
        ];
      case 'answered':
        return [
          { key: 'on_hold', label: 'Hold', icon: Pause, variant: 'info' as const },
          { key: 'ended', label: 'End', icon: PhoneOff, variant: 'danger' as const },
        ];
      case 'on_hold':
        return [
          { key: 'answered', label: 'Resume', icon: Play, variant: 'success' as const },
          { key: 'ended', label: 'End', icon: PhoneOff, variant: 'danger' as const },
        ];
      default:
        return [];
    }
  };

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
            <p className="text-[10px] text-cockpit-500">Mock Call Console</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded border border-amber-700/40 bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-300">
            <AlertTriangle size={10} />
            No real telephony connected
          </span>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-0.5 text-[10px] text-cockpit-300 hover:bg-cockpit-800"
          >
            <ArrowLeft size={10} />
            Support Cockpit
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Recent calls */}
        <aside className="w-80 shrink-0 overflow-y-auto border-r border-cockpit-700 bg-cockpit-800/40 p-3">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-cockpit-400">
            Recent fake incoming calls
          </div>

          {callsLoading && (
            <div className="flex items-center gap-2 py-4 text-xs text-cockpit-500">
              <Loader2 size={12} className="animate-spin" />
              Loading calls...
            </div>
          )}

          {callsError && (
            <div className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {callsError}
            </div>
          )}

          <div className="space-y-2">
            {calls.map((call) => (
              <button
                key={call.id}
                onClick={() => handleSelectCall(call)}
                className={`w-full rounded border p-2 text-left transition-colors ${
                  selectedCall?.id === call.id
                    ? 'border-accent bg-accent/10'
                    : 'border-cockpit-700 bg-cockpit-900/40 hover:bg-cockpit-900/60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className={statusColor(call.status)} />
                    <span className={`text-xs font-medium ${statusColor(call.status)}`}>
                      {call.status}
                    </span>
                  </div>
                  <span className="text-[10px] text-cockpit-500">
                    {new Date(call.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="mt-1 text-xs text-cockpit-200">
                  {call.caller.normalizedNumber ?? call.caller.rawNumber}
                </div>
                {call.callerMatch?.customerName && (
                  <div className="mt-0.5 text-[10px] text-cockpit-400">
                    {call.callerMatch.customerName}
                  </div>
                )}
                {call.sessionId && (
                  <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-emerald-400">
                    <Link2 size={10} />
                    Linked to session
                  </div>
                )}
              </button>
            ))}

            {calls.length === 0 && !callsLoading && (
              <div className="rounded border border-cockpit-700 bg-cockpit-900/30 px-3 py-4 text-center text-xs text-cockpit-500">
                No calls yet. Use the Call Simulator in the Support Cockpit to create a fake incoming call.
              </div>
            )}
          </div>
        </aside>

        {/* Center + Right */}
        <main className="flex flex-1 flex-col overflow-y-auto p-4">
          {!selectedCall ? (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <Phone size={32} className="mx-auto text-cockpit-600" />
                <p className="mt-2 text-sm text-cockpit-400">Select a call from the list to view details</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Call banner */}
              <div className={`rounded border px-4 py-3 ${statusBg(selectedCall.status)}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className={statusColor(selectedCall.status)} />
                    <div>
                      <div className="text-sm font-semibold text-cockpit-100">
                        Fake incoming call — {selectedCall.externalCallId}
                      </div>
                      <div className="text-xs text-cockpit-400">
                        {selectedCall.caller.normalizedNumber ?? selectedCall.caller.rawNumber}
                      </div>
                    </div>
                  </div>
                  <Badge variant={selectedCall.status === 'answered' ? 'success' : selectedCall.status === 'on_hold' ? 'info' : selectedCall.status === 'missed' ? 'danger' : 'warning'}>
                    {selectedCall.status}
                  </Badge>
                </div>
                <div className="mt-2 text-[10px] text-cockpit-500">
                  Mock caller matching • No real PBX connected • Not spoken or sent automatically
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Caller match panel */}
                <Panel
                  title="Caller Identity"
                  headerRight={<Badge variant="warning">Mock matching</Badge>}
                >
                  <div className="space-y-2">
                    <div className="rounded border border-amber-700/30 bg-amber-900/20 p-2">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-amber-300">
                        <AlertTriangle size={10} />
                        Fake incoming call
                      </div>
                      <div className="mt-0.5 text-[10px] text-amber-400/80">
                        Caller matching uses deterministic fixture data only.
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-cockpit-500">Raw number</span>
                        <span className="text-cockpit-200">{selectedCall.caller.rawNumber}</span>
                      </div>
                      {selectedCall.caller.normalizedNumber && (
                        <div className="flex justify-between">
                          <span className="text-cockpit-500">Normalized</span>
                          <span className="font-medium text-cockpit-200">{selectedCall.caller.normalizedNumber}</span>
                        </div>
                      )}
                      {selectedCall.caller.displayName && (
                        <div className="flex justify-between">
                          <span className="text-cockpit-500">Display name</span>
                          <span className="text-cockpit-200">{selectedCall.caller.displayName}</span>
                        </div>
                      )}
                    </div>

                    {selectedCall.callerMatch && (
                      <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                        <div className="mb-1 text-[10px] font-medium text-cockpit-300">Match result</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-cockpit-500">Status</span>
                            <Badge variant={selectedCall.callerMatch.status === 'matched' ? 'success' : 'default'} className="text-[10px]">
                              {selectedCall.callerMatch.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cockpit-500">Confidence</span>
                            <span className="text-cockpit-200">{selectedCall.callerMatch.confidence}</span>
                          </div>
                          {selectedCall.callerMatch.customerName && (
                            <div className="flex justify-between">
                              <span className="text-cockpit-500">Customer</span>
                              <span className="text-cockpit-200">{selectedCall.callerMatch.customerName}</span>
                            </div>
                          )}
                          {selectedCall.callerMatch.matchedTicketIds.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-cockpit-500">Recent tickets</span>
                              <span className="text-cockpit-200">{selectedCall.callerMatch.matchedTicketIds.join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>

                {/* Mock call controls */}
                <Panel
                  title="Mock Call Controls"
                  headerRight={<Badge variant="warning">No real phone</Badge>}
                >
                  <div className="space-y-3">
                    <div className="rounded border border-amber-700/30 bg-amber-900/20 p-2">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-amber-300">
                        <AlertTriangle size={10} />
                        Mock controls only
                      </div>
                      <div className="mt-0.5 text-[10px] text-amber-400/80">
                        These buttons update local state only. No real telephony, PBX, or call control is connected.
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {allowedActions(selectedCall.status).map((action) => (
                        <button
                          key={action.key}
                          onClick={() => handleStatusTransition(action.key)}
                          disabled={!!actionLoading}
                          className={`inline-flex items-center gap-1 rounded border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
                            action.variant === 'success'
                              ? 'border-emerald-700/40 bg-emerald-900/30 text-emerald-300 hover:bg-emerald-900/50'
                              : action.variant === 'danger'
                              ? 'border-red-700/40 bg-red-900/30 text-red-300 hover:bg-red-900/50'
                              : action.variant === 'info'
                              ? 'border-blue-700/40 bg-blue-900/30 text-blue-300 hover:bg-blue-900/50'
                              : 'border-cockpit-600 bg-cockpit-800 text-cockpit-200 hover:bg-cockpit-700'
                          }`}
                        >
                          {actionLoading === action.key ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <action.icon size={12} />
                          )}
                          {action.label}
                        </button>
                      ))}

                      {allowedActions(selectedCall.status).length === 0 && (
                        <div className="text-xs text-cockpit-500">
                          Call is {selectedCall.status}. No further mock actions available.
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-cockpit-500">
                      Allowed transitions: ringing → answered/missed • answered → on_hold/ended • on_hold → answered/ended
                    </div>
                  </div>
                </Panel>

                {/* Linked session */}
                <Panel
                  title="Linked Support Session"
                  headerRight={linkedSession ? <Badge variant="success">Linked</Badge> : <Badge variant="muted">None</Badge>}
                >
                  <div className="space-y-2">
                    {!linkedSession ? (
                      <div className="text-xs text-cockpit-500">
                        No support session is linked to this call. Use the Call Simulator in the Support Cockpit to auto-create or link a session.
                      </div>
                    ) : (
                      <>
                        <div className="rounded border border-emerald-700/30 bg-emerald-900/20 p-2">
                          <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-300">
                            <CheckCircle size={10} />
                            Session linked
                          </div>
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-cockpit-500">Title</span>
                            <span className="text-cockpit-200">{linkedSession.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cockpit-500">Status</span>
                            <Badge variant={linkedSession.status === 'open' ? 'success' : 'default'} className="text-[10px]">
                              {linkedSession.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cockpit-500">Priority</span>
                            <span className="text-cockpit-200">{linkedSession.priority}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cockpit-500">Tickets</span>
                            <span className="text-cockpit-200">{linkedSession.linkedTicketIds.length}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => router.push(`/?session=${linkedSession.id}`)}
                          className="inline-flex items-center gap-1 rounded border border-emerald-600 bg-emerald-800 px-2 py-0.5 text-[10px] font-medium text-emerald-100 hover:bg-emerald-700"
                        >
                          <ArrowLeft size={10} />
                          Open in cockpit
                        </button>
                      </>
                    )}
                  </div>
                </Panel>

                {/* Greeting suggestion */}
                <Panel
                  title="Suggested Greeting"
                  headerRight={<Badge variant="warning">Mock AI</Badge>}
                >
                  <div className="space-y-3">
                    <div className="rounded border border-amber-700/30 bg-amber-900/20 p-2">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-amber-300">
                        <AlertTriangle size={10} />
                        Suggested greeting — review before use
                      </div>
                      <div className="mt-0.5 text-[10px] text-amber-400/80">
                        Not spoken or sent automatically. This is a mock-AI suggestion only.
                      </div>
                    </div>

                    {!linkedSession ? (
                      <div className="text-xs text-cockpit-500">
                        Link a support session to generate a greeting suggestion.
                      </div>
                    ) : (
                      <>
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

                        <button
                          onClick={handleGenerateGreeting}
                          disabled={greetingLoading}
                          className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                        >
                          {greetingLoading && <Loader2 size={10} className="animate-spin" />}
                          <Bot size={10} />
                          Generate suggested greeting
                        </button>

                        {greetingError && (
                          <div className="text-xs text-danger">{greetingError}</div>
                        )}

                        {greetingSuggestion && (
                          <div className="space-y-2">
                            <div className="rounded border border-cockpit-700 bg-cockpit-900/50 p-3">
                              <div className="mb-2 flex items-center justify-between">
                                <span className="text-xs font-semibold text-cockpit-200">Greeting text</span>
                                <button
                                  onClick={() => handleCopy(greetingSuggestion.suggestion.greetingText)}
                                  className="inline-flex items-center gap-1 rounded bg-cockpit-700 px-2 py-0.5 text-[10px] text-cockpit-200 hover:bg-cockpit-600"
                                >
                                  {copied ? <CheckCircle size={10} /> : <Copy size={10} />}
                                  {copied ? 'Copied' : 'Copy'}
                                </button>
                              </div>
                              <div className="rounded border border-cockpit-600 bg-cockpit-950 p-2 text-sm text-cockpit-100">
                                {greetingSuggestion.suggestion.greetingText}
                              </div>
                            </div>

                            <div className="rounded border border-amber-700/40 bg-amber-950/30 p-2 text-xs">
                              <div className="mb-1 text-[10px] font-semibold text-amber-200">Model metadata</div>
                              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-cockpit-400">
                                <dt>Provider</dt>
                                <dd className="text-cockpit-100">{greetingSuggestion.provider}</dd>
                                <dt>Model</dt>
                                <dd className="break-all text-cockpit-100">{greetingSuggestion.model}</dd>
                                <dt>Prompt</dt>
                                <dd className="text-cockpit-100">{greetingSuggestion.prompt.version}</dd>
                                <dt>Context hash</dt>
                                <dd className="break-all font-mono text-[10px] text-cockpit-100">{greetingSuggestion.contextHash}</dd>
                                <dt>Tone</dt>
                                <dd className="text-cockpit-100">{greetingSuggestion.suggestion.tone}</dd>
                                <dt>Auto-send</dt>
                                <dd className="text-cockpit-100">{greetingSuggestion.safety.autoSend ? 'Yes' : 'No'}</dd>
                                <dt>Voice</dt>
                                <dd className="text-cockpit-100">{greetingSuggestion.safety.voiceEnabled ? 'Yes' : 'No'}</dd>
                              </dl>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Panel>

                {/* Timeline */}
                <Panel
                  title="Call Timeline"
                  headerRight={<Badge variant="muted">In-memory</Badge>}
                  className="lg:col-span-2"
                >
                  <div className="space-y-2">
                    {timeline.length === 0 ? (
                      <div className="text-xs text-cockpit-500">
                        No timeline events yet. Simulate a call and perform actions to build the timeline.
                      </div>
                    ) : (
                      <div className="relative space-y-3 pl-4">
                        <div className="absolute left-1.5 top-0 bottom-0 w-px bg-cockpit-700" />
                        {timeline.map((item) => (
                          <div key={item.id} className="relative">
                            <div className="absolute -left-2.5 top-1 h-2 w-2 rounded-full bg-accent" />
                            <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  {item.type === 'call_received' && <PhoneIncoming size={12} className="text-accent" />}
                                  {item.type === 'caller_matched' && <User size={12} className="text-emerald-400" />}
                                  {item.type === 'caller_no_match' && <User size={12} className="text-cockpit-500" />}
                                  {item.type === 'session_linked' && <Link2 size={12} className="text-emerald-400" />}
                                  {item.type === 'session_auto_created' && <CheckCircle size={12} className="text-emerald-400" />}
                                  {item.type === 'call_answered' && <PhoneIncoming size={12} className="text-emerald-400" />}
                                  {item.type === 'call_held' && <Pause size={12} className="text-blue-400" />}
                                  {item.type === 'call_resumed' && <Play size={12} className="text-emerald-400" />}
                                  {item.type === 'call_ended' && <PhoneOff size={12} className="text-cockpit-400" />}
                                  {item.type === 'call_missed' && <PhoneOff size={12} className="text-red-400" />}
                                  {item.type === 'greeting_suggested' && <Bot size={12} className="text-accent" />}
                                  {item.type === 'evidence_bundle_generated' && <Ticket size={12} className="text-cockpit-400" />}
                                  {item.type === 'audit_event' && <Clock size={12} className="text-cockpit-500" />}
                                  <span className="text-xs font-medium text-cockpit-200">{item.title}</span>
                                </div>
                                <span className="text-[10px] text-cockpit-500">
                                  {new Date(item.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              {item.description && (
                                <div className="mt-0.5 text-[10px] text-cockpit-400">{item.description}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Panel>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
