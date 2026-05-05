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
  RadioTower,
  Mic,
  Volume2,
  Eye,
  Monitor,
  FileText,
  ThumbsUp,
  Trash2,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Camera,
} from 'lucide-react';
import { Panel } from '@/components/Panel';
import { Badge } from '@/components/Badge';
import { AuthGate, UserMenu } from '@/components/AuthGate';
import {
  api,
  type CallEvent,
  type CallTimelineItem,
  type SupportSession,
  type GreetingSuggestionResponse,
  type TelephonyAdapterStatus,
  type TelephonyCallControlResult,
  type CallRecording,
  type ScreenObservation,
  type AuthIdentity,
  ApiClientError,
} from '@/lib/api';

function CallConsoleContent({
  identity,
  logout,
}: {
  identity: AuthIdentity;
  logout: () => Promise<void>;
}) {
  const router = useRouter();
  const [calls, setCalls] = useState<CallEvent[]>([]);
  const [selectedCall, setSelectedCall] = useState<CallEvent | undefined>(undefined);
  const [timeline, setTimeline] = useState<CallTimelineItem[]>([]);
  const [linkedSession, setLinkedSession] = useState<SupportSession | undefined>(undefined);
  const [greetingSuggestion, setGreetingSuggestion] = useState<
    GreetingSuggestionResponse | undefined
  >(undefined);
  const [callsLoading, setCallsLoading] = useState(false);
  const [callsError, setCallsError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [greetingLoading, setGreetingLoading] = useState(false);
  const [greetingError, setGreetingError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [tone, setTone] = useState<'professional' | 'friendly' | 'concise'>('professional');
  const [telephonyStatus, setTelephonyStatus] = useState<TelephonyAdapterStatus | undefined>(
    undefined,
  );
  const [lastBridgeTest, setLastBridgeTest] = useState<TelephonyAdapterStatus | undefined>(
    undefined,
  );
  const [lastControlResult, setLastControlResult] = useState<
    TelephonyCallControlResult | undefined
  >(undefined);
  const [telephonyLoading, setTelephonyLoading] = useState(false);
  const [recordings, setRecordings] = useState<CallRecording[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [observations, setObservations] = useState<ScreenObservation[]>([]);
  const [observationsLoading, setObservationsLoading] = useState(false);
  const [observationKind, setObservationKind] = useState<string>('manual_note');
  const [observationNote, setObservationNote] = useState('');
  const [observationApp, setObservationApp] = useState('');
  const [observationWindow, setObservationWindow] = useState('');
  const [observationUrl, setObservationUrl] = useState('');

  // Sharing state
  const [sharingState, setSharingState] = useState<'inactive' | 'active' | 'paused'>('inactive');
  const [sharingLoading, setSharingLoading] = useState(false);

  // Active window metadata form
  const [activeWindowApp, setActiveWindowApp] = useState('');
  const [activeWindowLabel, setActiveWindowLabel] = useState('');
  const [activeWindowUrl, setActiveWindowUrl] = useState('');
  const [activeWindowNote, setActiveWindowNote] = useState('');

  // Manual screenshot metadata form
  const [screenshotFileName, setScreenshotFileName] = useState('');
  const [screenshotApp, setScreenshotApp] = useState('');
  const [screenshotWindow, setScreenshotWindow] = useState('');
  const [screenshotNote, setScreenshotNote] = useState('');

  // Structured upload form
  const [structuredKind, setStructuredKind] = useState<string>('manual_note');
  const [structuredApp, setStructuredApp] = useState('');
  const [structuredWindow, setStructuredWindow] = useState('');
  const [structuredUrl, setStructuredUrl] = useState('');
  const [structuredNote, setStructuredNote] = useState('');

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

    // Load recordings
    setRecordingsLoading(true);
    try {
      const recs = await api.listCallRecordings(call.id);
      setRecordings(recs);
    } catch {
      setRecordings([]);
    } finally {
      setRecordingsLoading(false);
    }

    // Load screen observations for linked session
    setObservationsLoading(true);
    try {
      if (call.sessionId) {
        const obs = await api.listScreenObservations(call.sessionId);
        setObservations(obs);
      } else {
        setObservations([]);
      }
    } catch {
      setObservations([]);
    } finally {
      setObservationsLoading(false);
    }

    // Load sharing state for linked session
    setSharingState('inactive');
    try {
      if (call.sessionId) {
        const ss = await api.getSharingState(call.sessionId);
        setSharingState(ss.state as 'inactive' | 'active' | 'paused');
      }
    } catch {
      setSharingState('inactive');
    }
  }, []);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
    api
      .getTelephonyStatus()
      .then(setTelephonyStatus)
      .catch(() => setTelephonyStatus(undefined));
  }, []);

  const handleSelectCall = useCallback(
    async (call: CallEvent) => {
      setSelectedCall(call);
      await fetchCallDetails(call);
    },
    [fetchCallDetails],
  );

  const handleStatusTransition = useCallback(
    async (newStatus: string) => {
      if (!selectedCall) return;
      setActionLoading(newStatus);
      try {
        const action =
          newStatus === 'answered' && selectedCall.status === 'on_hold'
            ? 'resume'
            : newStatus === 'answered'
              ? 'answer'
              : newStatus === 'on_hold'
                ? 'hold'
                : newStatus === 'ended'
                  ? 'end'
                  : 'end';
        const result = await api.controlTelephonyCall(selectedCall.id, {
          action,
          reason: 'Call Console mock control',
        });
        setLastControlResult(result);
        const updatedCall = result.callEvent ?? selectedCall;
        setSelectedCall(updatedCall);
        setCalls((prev) => prev.map((c) => (c.id === updatedCall.id ? updatedCall : c)));
        await fetchCallDetails(updatedCall);
      } catch (err) {
        setCallsError(err instanceof ApiClientError ? err.message : 'Status transition failed');
      } finally {
        setActionLoading(null);
      }
    },
    [selectedCall, fetchCallDetails],
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
      if (selectedCall) {
        await fetchCallDetails(selectedCall);
      }
      setGreetingSuggestion(response);
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

  const handleBridgeTest = useCallback(async () => {
    setTelephonyLoading(true);
    try {
      const status = await api.testTelephonyBridge();
      setTelephonyStatus(status);
      setLastBridgeTest(status);
    } catch (err) {
      setCallsError(err instanceof ApiClientError ? err.message : 'Bridge test failed');
    } finally {
      setTelephonyLoading(false);
    }
  }, []);

  const handleFakeProviderWebhook = useCallback(async () => {
    setTelephonyLoading(true);
    try {
      const response = await api.sendFakeProviderWebhook({
        externalCallId: `BL-044-${Date.now()}`,
        eventType: 'incoming_call',
        rawCallerNumber: '03 555 01 01',
        callerDisplayName: 'BL-044 Mock Caller',
        metadata: {
          bridgeProof: 'mock-only',
          Authorization: 'Bearer ui-proof-token-must-redact',
          signature: 'fake-signature-must-redact',
        },
      });
      await fetchCalls();
      setSelectedCall(response.callEvent);
      await fetchCallDetails(response.callEvent);
    } catch (err) {
      setCallsError(err instanceof ApiClientError ? err.message : 'Fake provider webhook failed');
    } finally {
      setTelephonyLoading(false);
    }
  }, [fetchCalls, fetchCallDetails]);

  const handleAttachMockRecording = useCallback(async () => {
    if (!selectedCall) return;
    setRecordingsLoading(true);
    try {
      const response = await api.attachMockRecording(selectedCall.id, {
        source: 'mock_generated',
        durationSeconds: 42,
      });
      setRecordings((prev) => [response.recording, ...prev]);
      if (selectedCall) {
        await fetchCallDetails(selectedCall);
      }
    } catch (err) {
      setCallsError(
        err instanceof ApiClientError ? err.message : 'Failed to attach mock recording',
      );
    } finally {
      setRecordingsLoading(false);
    }
  }, [selectedCall, fetchCallDetails]);

  const handleReviewRecording = useCallback(
    async (recordingId: string) => {
      if (!selectedCall) return;
      setRecordingsLoading(true);
      try {
        const response = await api.reviewCallRecording(selectedCall.id, recordingId);
        setRecordings((prev) => prev.map((r) => (r.id === recordingId ? response.recording : r)));
      } catch (err) {
        setCallsError(err instanceof ApiClientError ? err.message : 'Failed to review recording');
      } finally {
        setRecordingsLoading(false);
      }
    },
    [selectedCall],
  );

  const handlePlaybackPlaceholder = useCallback(
    async (recordingId: string) => {
      if (!selectedCall) return;
      try {
        await api.recordPlaybackOpened(selectedCall.id, recordingId);
      } catch {
        // Silently fail; playback is placeholder only
      }
    },
    [selectedCall],
  );

  const handleCaptureObservation = useCallback(async () => {
    if (!linkedSession) return;
    setObservationsLoading(true);
    try {
      const response = await api.captureMockScreenObservation(linkedSession.id, {
        kind: observationKind,
        callEventId: selectedCall?.id,
        rawInputPlaceholder: observationNote || undefined,
        appLabel: observationApp || undefined,
        windowLabel: observationWindow || undefined,
        urlLabel: observationUrl || undefined,
      });
      setObservations((prev) => [response.observation, ...prev]);
      setObservationNote('');
      setObservationApp('');
      setObservationWindow('');
      setObservationUrl('');
    } catch (err) {
      setCallsError(err instanceof ApiClientError ? err.message : 'Failed to capture observation');
    } finally {
      setObservationsLoading(false);
    }
  }, [
    linkedSession,
    selectedCall,
    observationKind,
    observationNote,
    observationApp,
    observationWindow,
    observationUrl,
  ]);

  const handleReviewObservation = useCallback(
    async (observationId: string, status: 'approved' | 'discarded') => {
      if (!linkedSession) return;
      setObservationsLoading(true);
      try {
        const response = await api.reviewScreenObservation(linkedSession.id, observationId, {
          status,
        });
        setObservations((prev) =>
          prev.map((o) => (o.id === observationId ? response.observation : o)),
        );
      } catch (err) {
        setCallsError(err instanceof ApiClientError ? err.message : 'Failed to review observation');
      } finally {
        setObservationsLoading(false);
      }
    },
    [linkedSession],
  );

  const handleCreateContextPacketFromObservation = useCallback(
    async (observationId: string) => {
      if (!linkedSession) return;
      setObservationsLoading(true);
      try {
        const response = await api.createContextPacketFromObservation(
          linkedSession.id,
          observationId,
          {
            provenance: 'screen_observation',
          },
        );
        setObservations((prev) =>
          prev.map((o) => (o.id === observationId ? response.observation : o)),
        );
      } catch (err) {
        setCallsError(
          err instanceof ApiClientError ? err.message : 'Failed to create context packet',
        );
      } finally {
        setObservationsLoading(false);
      }
    },
    [linkedSession],
  );

  const handleUpdateSharingState = useCallback(
    async (newState: 'inactive' | 'active' | 'paused') => {
      if (!linkedSession) return;
      setSharingLoading(true);
      try {
        const response = await api.updateSharingState(linkedSession.id, { state: newState });
        setSharingState(response.state as 'inactive' | 'active' | 'paused');
      } catch (err) {
        setCallsError(
          err instanceof ApiClientError ? err.message : 'Failed to update sharing state',
        );
      } finally {
        setSharingLoading(false);
      }
    },
    [linkedSession],
  );

  const handleCaptureActiveWindow = useCallback(async () => {
    if (!linkedSession) return;
    setObservationsLoading(true);
    try {
      const response = await api.captureActiveWindowMockMetadata(linkedSession.id, {
        callEventId: selectedCall?.id,
        appLabel: activeWindowApp || undefined,
        windowLabel: activeWindowLabel || undefined,
        urlLabel: activeWindowUrl || undefined,
        rawInputPlaceholder: activeWindowNote || undefined,
      });
      setObservations((prev) => [response.observation, ...prev]);
      setActiveWindowApp('');
      setActiveWindowLabel('');
      setActiveWindowUrl('');
      setActiveWindowNote('');
    } catch (err) {
      setCallsError(
        err instanceof ApiClientError ? err.message : 'Failed to capture active window metadata',
      );
    } finally {
      setObservationsLoading(false);
    }
  }, [
    linkedSession,
    selectedCall,
    activeWindowApp,
    activeWindowLabel,
    activeWindowUrl,
    activeWindowNote,
  ]);

  const handleAttachScreenshotMetadata = useCallback(async () => {
    if (!linkedSession) return;
    setObservationsLoading(true);
    try {
      const response = await api.attachManualScreenshotMetadata(linkedSession.id, {
        callEventId: selectedCall?.id,
        appLabel: screenshotApp || undefined,
        windowLabel: screenshotWindow || undefined,
        rawInputPlaceholder: screenshotNote || undefined,
        fileNameHint: screenshotFileName || undefined,
      });
      setObservations((prev) => [response.observation, ...prev]);
      setScreenshotFileName('');
      setScreenshotApp('');
      setScreenshotWindow('');
      setScreenshotNote('');
    } catch (err) {
      setCallsError(
        err instanceof ApiClientError ? err.message : 'Failed to attach screenshot metadata',
      );
    } finally {
      setObservationsLoading(false);
    }
  }, [
    linkedSession,
    selectedCall,
    screenshotFileName,
    screenshotApp,
    screenshotWindow,
    screenshotNote,
  ]);

  const handleStructuredUpload = useCallback(async () => {
    if (!linkedSession) return;
    setObservationsLoading(true);
    try {
      const response = await api.uploadStructuredScreenObservation(linkedSession.id, {
        callEventId: selectedCall?.id,
        kind: structuredKind,
        appLabel: structuredApp || undefined,
        windowLabel: structuredWindow || undefined,
        urlLabel: structuredUrl || undefined,
        rawInputPlaceholder: structuredNote || undefined,
      });
      setObservations((prev) => [response.observation, ...prev]);
      setStructuredNote('');
    } catch (err) {
      setCallsError(
        err instanceof ApiClientError ? err.message : 'Failed to upload structured observation',
      );
    } finally {
      setObservationsLoading(false);
    }
  }, [
    linkedSession,
    selectedCall,
    structuredKind,
    structuredApp,
    structuredWindow,
    structuredUrl,
    structuredNote,
  ]);

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
            <p className="text-[10px] text-cockpit-400">Mock Call Console</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 rounded border border-amber-700/40 bg-amber-900/30 px-2 py-0.5 text-[10px] font-medium text-amber-300">
            <AlertTriangle size={10} />
            No real telephony connected
          </span>
          <UserMenu identity={identity} logout={logout} />
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
            Recent incoming calls
          </div>

          {callsLoading && (
            <div className="flex items-center gap-2 py-4 text-xs text-cockpit-400">
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
                  <span className="text-[10px] text-cockpit-400">
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
              <div className="rounded border border-cockpit-700 bg-cockpit-900/30 px-3 py-4 text-center text-xs text-cockpit-400">
                No calls yet. Use the Call Simulator in the Support Cockpit to create a fake
                incoming call, or trigger an Asterisk AMI test event.
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
                <p className="mt-2 text-sm text-cockpit-400">
                  Select a call from the list to view details
                </p>
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
                        {selectedCall.source === 'asterisk-ami'
                          ? 'Asterisk AMI local event'
                          : 'Fake incoming call'}{' '}
                        — {selectedCall.externalCallId}
                      </div>
                      <div className="text-xs text-cockpit-400">
                        {selectedCall.caller.normalizedNumber ?? selectedCall.caller.rawNumber}
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant={
                      selectedCall.status === 'answered'
                        ? 'success'
                        : selectedCall.status === 'on_hold'
                          ? 'info'
                          : selectedCall.status === 'missed'
                            ? 'danger'
                            : 'warning'
                    }
                  >
                    {selectedCall.status}
                  </Badge>
                </div>
                <div className="mt-2 text-[10px] text-cockpit-400">
                  {selectedCall.source === 'asterisk-ami'
                    ? 'Asterisk AMI local sandbox • No PSTN • No recording • No transcription • Caller matched from local sandbox data'
                    : 'Mock caller matching • No real PBX connected • Not spoken or sent automatically'}
                </div>
              </div>

              {/* Grid */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Panel
                  title="Telephony Bridge"
                  headerRight={<Badge variant="warning">Telephony bridge boundary</Badge>}
                  className="lg:col-span-2"
                >
                  <div className="grid gap-3 lg:grid-cols-[1.2fr_1fr]">
                    <div className="space-y-2">
                      <div className="rounded border border-amber-700/30 bg-amber-900/20 p-2">
                        <div className="flex items-center gap-1 text-[10px] font-medium text-amber-300">
                          <RadioTower size={10} />
                          Telephony bridge boundary
                        </div>
                        <div className="mt-0.5 text-[10px] text-amber-400/80">
                          {selectedCall.source === 'asterisk-ami'
                            ? 'Asterisk local sandbox AMI event bridge. No PSTN. No recording. No transcription. No public phone network.'
                            : 'Mock mode. No real PBX connected. No media or voice connected. Controls update local mock state only.'}
                        </div>
                      </div>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <dt className="text-cockpit-400">Provider type</dt>
                        <dd className="text-cockpit-100">
                          {telephonyStatus?.providerType ?? 'mock'}
                        </dd>
                        <dt className="text-cockpit-400">Adapter mode</dt>
                        <dd className="text-cockpit-100">{telephonyStatus?.mode ?? 'mock'}</dd>
                        <dt className="text-cockpit-400">Verification</dt>
                        <dd className="text-cockpit-100">
                          {telephonyStatus?.webhookVerification.status ?? 'not_required'}
                        </dd>
                        <dt className="text-cockpit-400">Source</dt>
                        <dd className="text-cockpit-100">
                          {selectedCall.source === 'asterisk-ami'
                            ? 'asterisk-ami'
                            : (telephonyStatus?.providerType ?? 'mock')}
                        </dd>
                        <dt className="text-cockpit-400">Mock/dev-only</dt>
                        <dd className="text-cockpit-100">
                          {selectedCall.source === 'asterisk-ami'
                            ? 'No (local sandbox AMI)'
                            : telephonyStatus?.mockDevOnly === false
                              ? 'No'
                              : 'Yes'}
                        </dd>
                      </dl>
                      <div className="flex flex-wrap gap-1">
                        {telephonyStatus &&
                          Object.entries(telephonyStatus.capabilities)
                            .filter(([, enabled]) => enabled)
                            .map(([name]) => (
                              <span
                                key={name}
                                className="rounded border border-cockpit-700 bg-cockpit-900 px-2 py-0.5 text-[10px] text-cockpit-300"
                              >
                                {name}
                              </span>
                            ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleBridgeTest}
                          disabled={telephonyLoading}
                          className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                        >
                          {telephonyLoading && <Loader2 size={10} className="animate-spin" />}
                          Test bridge
                        </button>
                        <button
                          onClick={handleFakeProviderWebhook}
                          disabled={telephonyLoading}
                          className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-200 hover:bg-cockpit-800 disabled:opacity-50"
                        >
                          <PhoneIncoming size={10} />
                          Fake webhook simulator
                        </button>
                      </div>
                      {lastBridgeTest && (
                        <div className="rounded border border-emerald-700/30 bg-emerald-900/20 p-2 text-xs text-emerald-200">
                          Last test result: {lastBridgeTest.health} / {lastBridgeTest.mode} /{' '}
                          {lastBridgeTest.webhookVerification.status}
                        </div>
                      )}
                      {lastControlResult && (
                        <div className="rounded border border-blue-700/30 bg-blue-900/20 p-2 text-xs text-blue-100">
                          Call control intent/result: {lastControlResult.intent.action} →{' '}
                          {lastControlResult.resultingStatus ?? 'none'} (
                          {lastControlResult.success ? 'succeeded' : 'failed'}) · mock-only
                        </div>
                      )}
                      <div className="text-[10px] text-cockpit-400">
                        No tokens, signatures, Authorization headers, env values, provider
                        credentials, voice, recording, STT, or TTS are shown or connected.
                      </div>
                    </div>
                  </div>
                </Panel>

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
                        <span className="text-cockpit-400">Raw number</span>
                        <span className="text-cockpit-200">{selectedCall.caller.rawNumber}</span>
                      </div>
                      {selectedCall.caller.normalizedNumber && (
                        <div className="flex justify-between">
                          <span className="text-cockpit-400">Normalized</span>
                          <span className="font-medium text-cockpit-200">
                            {selectedCall.caller.normalizedNumber}
                          </span>
                        </div>
                      )}
                      {selectedCall.caller.displayName && (
                        <div className="flex justify-between">
                          <span className="text-cockpit-400">Display name</span>
                          <span className="text-cockpit-200">
                            {selectedCall.caller.displayName}
                          </span>
                        </div>
                      )}
                    </div>

                    {selectedCall.callerMatch && (
                      <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                        <div className="mb-1 text-[10px] font-medium text-cockpit-300">
                          Match result
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-cockpit-400">Status</span>
                            <Badge
                              variant={
                                selectedCall.callerMatch.status === 'matched'
                                  ? 'success'
                                  : 'default'
                              }
                              className="text-[10px]"
                            >
                              {selectedCall.callerMatch.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cockpit-400">Confidence</span>
                            <span className="text-cockpit-200">
                              {selectedCall.callerMatch.confidence}
                            </span>
                          </div>
                          {selectedCall.callerMatch.customerName && (
                            <div className="flex justify-between">
                              <span className="text-cockpit-400">Customer</span>
                              <span className="text-cockpit-200">
                                {selectedCall.callerMatch.customerName}
                              </span>
                            </div>
                          )}
                          {selectedCall.callerMatch.matchedTicketIds.length > 0 && (
                            <div className="flex justify-between">
                              <span className="text-cockpit-400">Recent tickets</span>
                              <span className="text-cockpit-200">
                                {selectedCall.callerMatch.matchedTicketIds.join(', ')}
                              </span>
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
                        These buttons update local state only. No real telephony, PBX, or call
                        control is connected.
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
                        <div className="text-xs text-cockpit-400">
                          Call is {selectedCall.status}. No further mock actions available.
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-cockpit-400">
                      Allowed transitions: ringing → answered/missed • answered → on_hold/ended •
                      on_hold → answered/ended
                    </div>
                  </div>
                </Panel>

                {/* Linked session */}
                <Panel
                  title="Linked Support Session"
                  headerRight={
                    linkedSession ? (
                      <Badge variant="success">Linked</Badge>
                    ) : (
                      <Badge variant="muted">None</Badge>
                    )
                  }
                >
                  <div className="space-y-2">
                    {!linkedSession ? (
                      <div className="text-xs text-cockpit-400">
                        No support session is linked to this call. Use the Call Simulator in the
                        Support Cockpit to auto-create or link a session.
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
                            <span className="text-cockpit-400">Title</span>
                            <span className="text-cockpit-200">{linkedSession.title}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cockpit-400">Status</span>
                            <Badge
                              variant={linkedSession.status === 'open' ? 'success' : 'default'}
                              className="text-[10px]"
                            >
                              {linkedSession.status}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cockpit-400">Priority</span>
                            <span className="text-cockpit-200">{linkedSession.priority}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-cockpit-400">Tickets</span>
                            <span className="text-cockpit-200">
                              {linkedSession.linkedTicketIds.length}
                            </span>
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
                      <div className="text-xs text-cockpit-400">
                        Link a support session to generate a greeting suggestion.
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-medium text-cockpit-400">
                            Tone
                          </label>
                          <select
                            value={tone}
                            onChange={(e) =>
                              setTone(e.target.value as 'professional' | 'friendly' | 'concise')
                            }
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
                                <span className="text-xs font-semibold text-cockpit-200">
                                  Greeting text
                                </span>
                                <button
                                  onClick={() =>
                                    handleCopy(greetingSuggestion.suggestion.greetingText)
                                  }
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
                              <div className="mb-1 text-[10px] font-semibold text-amber-200">
                                Model metadata
                              </div>
                              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-cockpit-400">
                                <dt>Provider</dt>
                                <dd className="text-cockpit-100">{greetingSuggestion.provider}</dd>
                                <dt>Model</dt>
                                <dd className="break-all text-cockpit-100">
                                  {greetingSuggestion.model}
                                </dd>
                                <dt>Prompt</dt>
                                <dd className="text-cockpit-100">
                                  {greetingSuggestion.prompt.version}
                                </dd>
                                <dt>Context hash</dt>
                                <dd className="break-all font-mono text-[10px] text-cockpit-100">
                                  {greetingSuggestion.contextHash}
                                </dd>
                                <dt>Tone</dt>
                                <dd className="text-cockpit-100">
                                  {greetingSuggestion.suggestion.tone}
                                </dd>
                                <dt>Auto-send</dt>
                                <dd className="text-cockpit-100">
                                  {greetingSuggestion.safety.autoSend ? 'Yes' : 'No'}
                                </dd>
                                <dt>Voice</dt>
                                <dd className="text-cockpit-100">
                                  {greetingSuggestion.safety.voiceEnabled ? 'Yes' : 'No'}
                                </dd>
                              </dl>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </Panel>

                {/* Operator Companion panel */}
                <Panel
                  title="Operator Companion"
                  headerRight={<Badge variant="warning">Mock screen observation</Badge>}
                  className="lg:col-span-2"
                >
                  <div className="space-y-3">
                    <div className="rounded border border-amber-700/30 bg-amber-900/20 p-2">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-amber-300">
                        <AlertTriangle size={10} />
                        Mock screen observation — no real screen capture
                      </div>
                      <div className="mt-0.5 text-[10px] text-amber-400/80">
                        No raw pixels, clipboard access, or OCR. Review before AI context. Pattern
                        redaction only.
                      </div>
                    </div>

                    {!linkedSession ? (
                      <div className="text-xs text-cockpit-400">
                        Link a support session to capture mock screen observations.
                      </div>
                    ) : (
                      <>
                        {/* Sharing indicator */}
                        <div className="flex items-center justify-between rounded border border-cockpit-700 bg-cockpit-900/40 p-2">
                          <div className="flex items-center gap-2">
                            {sharingState === 'active' ? (
                              <>
                                <ShieldCheck size={14} className="text-emerald-400" />
                                <span className="text-xs font-medium text-emerald-300">
                                  Sharing: active — Visible sharing indicator
                                </span>
                              </>
                            ) : sharingState === 'paused' ? (
                              <>
                                <ShieldAlert size={14} className="text-amber-400" />
                                <span className="text-xs font-medium text-amber-300">
                                  Sharing: paused
                                </span>
                              </>
                            ) : (
                              <>
                                <Shield size={14} className="text-cockpit-400" />
                                <span className="text-xs font-medium text-cockpit-400">
                                  Sharing: inactive
                                </span>
                              </>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {sharingState === 'inactive' && (
                              <button
                                onClick={() => handleUpdateSharingState('active')}
                                disabled={sharingLoading}
                                className="inline-flex items-center gap-1 rounded border border-emerald-600 bg-emerald-900/30 px-2 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-900/50 disabled:opacity-50"
                              >
                                {sharingLoading && <Loader2 size={10} className="animate-spin" />}
                                Start mock sharing
                              </button>
                            )}
                            {sharingState === 'active' && (
                              <>
                                <button
                                  onClick={() => handleUpdateSharingState('paused')}
                                  disabled={sharingLoading}
                                  className="inline-flex items-center gap-1 rounded border border-amber-600 bg-amber-900/30 px-2 py-0.5 text-[10px] text-amber-200 hover:bg-amber-900/50 disabled:opacity-50"
                                >
                                  Pause
                                </button>
                                <button
                                  onClick={() => handleUpdateSharingState('inactive')}
                                  disabled={sharingLoading}
                                  className="inline-flex items-center gap-1 rounded border border-red-600 bg-red-900/30 px-2 py-0.5 text-[10px] text-red-200 hover:bg-red-900/50 disabled:opacity-50"
                                >
                                  Stop
                                </button>
                              </>
                            )}
                            {sharingState === 'paused' && (
                              <>
                                <button
                                  onClick={() => handleUpdateSharingState('active')}
                                  disabled={sharingLoading}
                                  className="inline-flex items-center gap-1 rounded border border-emerald-600 bg-emerald-900/30 px-2 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-900/50 disabled:opacity-50"
                                >
                                  Resume
                                </button>
                                <button
                                  onClick={() => handleUpdateSharingState('inactive')}
                                  disabled={sharingLoading}
                                  className="inline-flex items-center gap-1 rounded border border-red-600 bg-red-900/30 px-2 py-0.5 text-[10px] text-red-200 hover:bg-red-900/50 disabled:opacity-50"
                                >
                                  Stop
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Safety labels */}
                        <div className="flex flex-wrap gap-1">
                          {[
                            'Visible sharing indicator',
                            'Mock observation only',
                            'No real screen capture',
                            'No raw pixels stored',
                            'No clipboard access',
                            'No OCR',
                            'Raw image retention disabled',
                            'Pattern/placeholder redaction only',
                            'Review before AI context',
                          ].map((label) => (
                            <span
                              key={label}
                              className="inline-flex items-center gap-1 rounded border border-cockpit-700 bg-cockpit-900/40 px-2 py-0.5 text-[10px] text-cockpit-400"
                            >
                              <Shield size={8} />
                              {label}
                            </span>
                          ))}
                        </div>

                        {/* Active Window Metadata */}
                        <div className="rounded border border-cockpit-700 bg-cockpit-900/20 p-2">
                          <div className="mb-2 text-xs font-semibold text-cockpit-200">
                            Active Window Metadata
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                App label
                              </label>
                              <input
                                type="text"
                                value={activeWindowApp}
                                onChange={(e) => setActiveWindowApp(e.target.value)}
                                placeholder="e.g. Zammad"
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                Window label
                              </label>
                              <input
                                type="text"
                                value={activeWindowLabel}
                                onChange={(e) => setActiveWindowLabel(e.target.value)}
                                placeholder="e.g. Ticket #101"
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                URL label
                              </label>
                              <input
                                type="text"
                                value={activeWindowUrl}
                                onChange={(e) => setActiveWindowUrl(e.target.value)}
                                placeholder="e.g. https://help.example.com"
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                Note
                              </label>
                              <textarea
                                value={activeWindowNote}
                                onChange={(e) => setActiveWindowNote(e.target.value)}
                                placeholder="Enter active window note..."
                                rows={2}
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <button
                              onClick={handleCaptureActiveWindow}
                              disabled={observationsLoading}
                              className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                            >
                              {observationsLoading && (
                                <Loader2 size={10} className="animate-spin" />
                              )}
                              <Monitor size={10} />
                              Capture active window metadata
                            </button>
                          </div>
                        </div>

                        {/* Manual Screenshot Metadata */}
                        <div className="rounded border border-cockpit-700 bg-cockpit-900/20 p-2">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-semibold text-cockpit-200">
                              Manual Screenshot Metadata
                            </span>
                            <Badge variant="danger" className="text-[10px]">
                              Raw image retention disabled
                            </Badge>
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                File name hint
                              </label>
                              <input
                                type="text"
                                value={screenshotFileName}
                                onChange={(e) => setScreenshotFileName(e.target.value)}
                                placeholder="e.g. screenshot-001.png"
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                App label
                              </label>
                              <input
                                type="text"
                                value={screenshotApp}
                                onChange={(e) => setScreenshotApp(e.target.value)}
                                placeholder="e.g. Zammad"
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                Window label
                              </label>
                              <input
                                type="text"
                                value={screenshotWindow}
                                onChange={(e) => setScreenshotWindow(e.target.value)}
                                placeholder="e.g. Ticket #101"
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                Note
                              </label>
                              <textarea
                                value={screenshotNote}
                                onChange={(e) => setScreenshotNote(e.target.value)}
                                placeholder="Enter screenshot metadata note..."
                                rows={2}
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <button
                              onClick={handleAttachScreenshotMetadata}
                              disabled={observationsLoading}
                              className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                            >
                              {observationsLoading && (
                                <Loader2 size={10} className="animate-spin" />
                              )}
                              <Camera size={10} />
                              Attach screenshot metadata
                            </button>
                          </div>
                        </div>

                        {/* Structured Upload */}
                        <div className="rounded border border-cockpit-700 bg-cockpit-900/20 p-2">
                          <div className="mb-2 text-xs font-semibold text-cockpit-200">
                            Structured Upload
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                Kind
                              </label>
                              <select
                                value={structuredKind}
                                onChange={(e) => setStructuredKind(e.target.value)}
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 focus:border-accent focus:outline-none"
                              >
                                <option value="active_window">Active window</option>
                                <option value="application">Application</option>
                                <option value="url">URL</option>
                                <option value="manual_note">Manual note</option>
                                <option value="screenshot_metadata">Screenshot metadata</option>
                                <option value="redacted_context">Redacted context</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                App label
                              </label>
                              <input
                                type="text"
                                value={structuredApp}
                                onChange={(e) => setStructuredApp(e.target.value)}
                                placeholder="e.g. Zammad"
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                Window label
                              </label>
                              <input
                                type="text"
                                value={structuredWindow}
                                onChange={(e) => setStructuredWindow(e.target.value)}
                                placeholder="e.g. Ticket #101"
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                URL label
                              </label>
                              <input
                                type="text"
                                value={structuredUrl}
                                onChange={(e) => setStructuredUrl(e.target.value)}
                                placeholder="e.g. https://help.example.com"
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                Note
                              </label>
                              <textarea
                                value={structuredNote}
                                onChange={(e) => setStructuredNote(e.target.value)}
                                placeholder="Enter structured observation text..."
                                rows={2}
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <button
                              onClick={handleStructuredUpload}
                              disabled={observationsLoading}
                              className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                            >
                              {observationsLoading && (
                                <Loader2 size={10} className="animate-spin" />
                              )}
                              <Upload size={10} />
                              Upload structured observation
                            </button>
                          </div>
                        </div>

                        {/* Legacy mock observation capture */}
                        <div className="rounded border border-cockpit-700 bg-cockpit-900/20 p-2">
                          <div className="mb-2 text-xs font-semibold text-cockpit-200">
                            Legacy Mock Observation
                          </div>
                          <div className="grid gap-2 sm:grid-cols-2">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                Kind
                              </label>
                              <select
                                value={observationKind}
                                onChange={(e) => setObservationKind(e.target.value)}
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 focus:border-accent focus:outline-none"
                              >
                                <option value="active_window">Active window</option>
                                <option value="application">Application</option>
                                <option value="url">URL</option>
                                <option value="manual_note">Manual note</option>
                                <option value="redacted_context">Redacted context</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                App label
                              </label>
                              <input
                                type="text"
                                value={observationApp}
                                onChange={(e) => setObservationApp(e.target.value)}
                                placeholder="e.g. Zammad"
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                Window label
                              </label>
                              <input
                                type="text"
                                value={observationWindow}
                                onChange={(e) => setObservationWindow(e.target.value)}
                                placeholder="e.g. Ticket #12345"
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                URL label
                              </label>
                              <input
                                type="text"
                                value={observationUrl}
                                onChange={(e) => setObservationUrl(e.target.value)}
                                placeholder="e.g. https://help.example.com/ticket/123"
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                            <div className="space-y-1 sm:col-span-2">
                              <label className="block text-[10px] font-medium text-cockpit-400">
                                Note / placeholder
                              </label>
                              <textarea
                                value={observationNote}
                                onChange={(e) => setObservationNote(e.target.value)}
                                placeholder="Enter mock observation text..."
                                rows={2}
                                className="w-full rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:border-accent focus:outline-none"
                              />
                            </div>
                          </div>
                          <div className="mt-2">
                            <button
                              onClick={handleCaptureObservation}
                              disabled={observationsLoading}
                              className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                            >
                              {observationsLoading && (
                                <Loader2 size={10} className="animate-spin" />
                              )}
                              <Monitor size={10} />
                              Capture mock observation
                            </button>
                          </div>
                        </div>

                        {observationsLoading && observations.length === 0 && (
                          <div className="flex items-center gap-2 text-xs text-cockpit-400">
                            <Loader2 size={12} className="animate-spin" />
                            Loading observations...
                          </div>
                        )}

                        {observations.length === 0 && !observationsLoading && (
                          <div className="text-xs text-cockpit-400">
                            No mock screen observations. Capture one above to add deterministic mock
                            metadata.
                          </div>
                        )}

                        <div className="space-y-2">
                          {observations.map((obs) => (
                            <div
                              key={obs.id}
                              className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <Monitor size={12} className="text-cockpit-400" />
                                  <span className="text-xs font-medium text-cockpit-200">
                                    {obs.kind}
                                  </span>
                                  <Badge variant="muted" className="text-[10px]">
                                    {obs.source}
                                  </Badge>
                                  <Badge
                                    variant={
                                      obs.status === 'approved'
                                        ? 'success'
                                        : obs.status === 'discarded'
                                          ? 'danger'
                                          : obs.status === 'review_required'
                                            ? 'warning'
                                            : 'default'
                                    }
                                    className="text-[10px]"
                                  >
                                    {obs.status}
                                  </Badge>
                                  {obs.redactionStatus && (
                                    <Badge variant="info" className="text-[10px]">
                                      {obs.redactionStatus}
                                    </Badge>
                                  )}
                                  {obs.contextPacketId && (
                                    <Badge variant="info" className="text-[10px]">
                                      <FileText size={8} className="mr-0.5" />
                                      Packet
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[10px] text-cockpit-400">
                                  {new Date(obs.createdAt).toLocaleTimeString()}
                                </span>
                              </div>

                              <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-cockpit-400">
                                {obs.appLabel && (
                                  <>
                                    <span>App</span>
                                    <span className="text-cockpit-200">{obs.appLabel}</span>
                                  </>
                                )}
                                {obs.windowLabel && (
                                  <>
                                    <span>Window</span>
                                    <span className="text-cockpit-200">{obs.windowLabel}</span>
                                  </>
                                )}
                                {obs.urlLabel && (
                                  <>
                                    <span>URL</span>
                                    <span className="break-all text-cockpit-200">
                                      {obs.urlLabel}
                                    </span>
                                  </>
                                )}
                                {obs.rawInputPlaceholder && (
                                  <>
                                    <span>Note</span>
                                    <span className="text-cockpit-200">
                                      {obs.rawInputPlaceholder.substring(0, 120)}
                                      {obs.rawInputPlaceholder.length > 120 ? '...' : ''}
                                    </span>
                                  </>
                                )}
                                {obs.sharingState && (
                                  <>
                                    <span>Sharing</span>
                                    <span className="text-cockpit-200">{obs.sharingState}</span>
                                  </>
                                )}
                                {obs.rawImageRetention && (
                                  <>
                                    <span>Retention</span>
                                    <span className="text-cockpit-200">
                                      {obs.rawImageRetention}
                                    </span>
                                  </>
                                )}
                              </div>

                              <div className="mt-2 flex flex-wrap gap-2">
                                {obs.status === 'review_required' && (
                                  <>
                                    <button
                                      onClick={() => handleReviewObservation(obs.id, 'approved')}
                                      disabled={observationsLoading}
                                      className="inline-flex items-center gap-1 rounded border border-emerald-600 bg-emerald-900/30 px-2 py-0.5 text-[10px] text-emerald-200 hover:bg-emerald-900/50 disabled:opacity-50"
                                    >
                                      <ThumbsUp size={10} />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleReviewObservation(obs.id, 'discarded')}
                                      disabled={observationsLoading}
                                      className="inline-flex items-center gap-1 rounded border border-red-600 bg-red-900/30 px-2 py-0.5 text-[10px] text-red-200 hover:bg-red-900/50 disabled:opacity-50"
                                    >
                                      <Trash2 size={10} />
                                      Discard
                                    </button>
                                  </>
                                )}
                                {obs.status === 'approved' && !obs.contextPacketId && (
                                  <button
                                    onClick={() => handleCreateContextPacketFromObservation(obs.id)}
                                    disabled={observationsLoading}
                                    className="inline-flex items-center gap-1 rounded border border-accent bg-accent/20 px-2 py-0.5 text-[10px] text-accent hover:bg-accent/30 disabled:opacity-50"
                                  >
                                    <Send size={10} />
                                    Create context packet
                                  </button>
                                )}
                              </div>

                              {obs.reviewedAt && (
                                <div className="mt-1 text-[10px] text-emerald-400">
                                  Reviewed at {new Date(obs.reviewedAt).toLocaleTimeString()}
                                </div>
                              )}

                              <div className="mt-1 flex flex-wrap gap-1 text-[10px] text-cockpit-400">
                                <span>Mock/dev-only</span>
                                <span>•</span>
                                <span>No real screen capture</span>
                                <span>•</span>
                                <span>No raw pixels</span>
                                <span>•</span>
                                <span>No clipboard access</span>
                                {obs.safetyFlags?.rawImageStored === false && (
                                  <>
                                    <span>•</span>
                                    <span>Raw image not stored</span>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </Panel>

                {/* Mock Recording panel */}
                <Panel
                  title="Mock Recording"
                  headerRight={<Badge variant="warning">No real audio</Badge>}
                  className="lg:col-span-2"
                >
                  <div className="space-y-3">
                    <div className="rounded border border-amber-700/30 bg-amber-900/20 p-2">
                      <div className="flex items-center gap-1 text-[10px] font-medium text-amber-300">
                        <AlertTriangle size={10} />
                        Mock recording — no real audio captured
                      </div>
                      <div className="mt-0.5 text-[10px] text-amber-400/80">
                        Playback placeholder only. Not compliance-grade. No object storage
                        connected.
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={handleAttachMockRecording}
                        disabled={recordingsLoading}
                        className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent/90 disabled:opacity-50"
                      >
                        {recordingsLoading && <Loader2 size={10} className="animate-spin" />}
                        <Mic size={10} />
                        Attach mock recording
                      </button>
                    </div>

                    {recordingsLoading && recordings.length === 0 && (
                      <div className="flex items-center gap-2 text-xs text-cockpit-400">
                        <Loader2 size={12} className="animate-spin" />
                        Loading recordings...
                      </div>
                    )}

                    {recordings.length === 0 && !recordingsLoading && (
                      <div className="text-xs text-cockpit-400">
                        No mock recordings attached. Click "Attach mock recording" to add
                        deterministic mock metadata.
                      </div>
                    )}

                    <div className="space-y-2">
                      {recordings.map((rec) => (
                        <div
                          key={rec.id}
                          className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Mic size={12} className="text-cockpit-400" />
                              <span className="text-xs font-medium text-cockpit-200">
                                {rec.placeholderReference ?? rec.id.slice(0, 8)}
                              </span>
                              <Badge
                                variant={rec.status === 'available' ? 'success' : 'default'}
                                className="text-[10px]"
                              >
                                {rec.status}
                              </Badge>
                            </div>
                            <span className="text-[10px] text-cockpit-400">
                              {rec.durationSeconds ?? 0}s
                            </span>
                          </div>

                          <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-cockpit-400">
                            <span>Source</span>
                            <span className="text-cockpit-200">{rec.source}</span>
                            <span>Storage</span>
                            <span className="text-cockpit-200">{rec.storageType}</span>
                            <span>Checksum</span>
                            <span className="break-all font-mono text-cockpit-200">
                              {rec.checksumHash}
                            </span>
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <button
                              onClick={() => handlePlaybackPlaceholder(rec.id)}
                              disabled={recordingsLoading}
                              className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-0.5 text-[10px] text-cockpit-200 hover:bg-cockpit-800 disabled:opacity-50"
                            >
                              <Volume2 size={10} />
                              Playback placeholder
                            </button>
                            <button
                              onClick={() => handleReviewRecording(rec.id)}
                              disabled={recordingsLoading || rec.status === 'mock_only'}
                              className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-0.5 text-[10px] text-cockpit-200 hover:bg-cockpit-800 disabled:opacity-50"
                            >
                              <Eye size={10} />
                              {rec.status === 'mock_only' ? 'Reviewed' : 'Mark reviewed'}
                            </button>
                          </div>

                          {rec.reviewedAt && (
                            <div className="mt-1 text-[10px] text-emerald-400">
                              Reviewed at {new Date(rec.reviewedAt).toLocaleTimeString()}
                            </div>
                          )}

                          <div className="mt-1 text-[10px] text-cockpit-400">
                            {rec.complianceDisclaimer}
                          </div>
                        </div>
                      ))}
                    </div>
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
                      <div className="text-xs text-cockpit-400">
                        No timeline events yet. Simulate a call and perform actions to build the
                        timeline.
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
                                  {item.type === 'call_received' && (
                                    <PhoneIncoming size={12} className="text-accent" />
                                  )}
                                  {item.type === 'caller_matched' && (
                                    <User size={12} className="text-emerald-400" />
                                  )}
                                  {item.type === 'caller_no_match' && (
                                    <User size={12} className="text-cockpit-400" />
                                  )}
                                  {item.type === 'session_linked' && (
                                    <Link2 size={12} className="text-emerald-400" />
                                  )}
                                  {item.type === 'session_auto_created' && (
                                    <CheckCircle size={12} className="text-emerald-400" />
                                  )}
                                  {item.type === 'call_answered' && (
                                    <PhoneIncoming size={12} className="text-emerald-400" />
                                  )}
                                  {item.type === 'call_held' && (
                                    <Pause size={12} className="text-blue-400" />
                                  )}
                                  {item.type === 'call_resumed' && (
                                    <Play size={12} className="text-emerald-400" />
                                  )}
                                  {item.type === 'call_ended' && (
                                    <PhoneOff size={12} className="text-cockpit-400" />
                                  )}
                                  {item.type === 'call_missed' && (
                                    <PhoneOff size={12} className="text-red-400" />
                                  )}
                                  {item.type === 'greeting_suggested' && (
                                    <Bot size={12} className="text-accent" />
                                  )}
                                  {item.type === 'telephony_bridge_event' && (
                                    <RadioTower size={12} className="text-blue-400" />
                                  )}
                                  {item.type === 'evidence_bundle_generated' && (
                                    <Ticket size={12} className="text-cockpit-400" />
                                  )}
                                  {item.type === 'audit_event' && (
                                    <Clock size={12} className="text-cockpit-400" />
                                  )}
                                  <span className="text-xs font-medium text-cockpit-200">
                                    {item.title}
                                  </span>
                                </div>
                                <span className="text-[10px] text-cockpit-400">
                                  {new Date(item.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                              {item.description && (
                                <div className="mt-0.5 text-[10px] text-cockpit-400">
                                  {item.description}
                                </div>
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

export default function CallConsolePage() {
  return (
    <AuthGate>
      {(identity, logout) => <CallConsoleContent identity={identity} logout={logout} />}
    </AuthGate>
  );
}
