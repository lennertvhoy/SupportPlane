const API_BASE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : 'http://localhost:4110';

export interface DevIdentity {
  tenantId: string;
  userId: string;
  userRole?: string;
}

const DEFAULT_IDENTITY: DevIdentity = {
  tenantId: 'dev-tenant',
  userId: 'dev-user',
  userRole: 'support_agent',
};

export interface SupportSession {
  id: string;
  tenantId: string;
  status: string;
  priority: string;
  title: string;
  description?: string;
  assignedUserId?: string;
  linkedTicketIds: string[];
  aiContextPacketIds: string[];
  screenObservationIds: string[];
  auditEventIds: string[];
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIContextPacket {
  id: string;
  tenantId: string;
  sessionId: string;
  provenance: string;
  sourceTicketIds: string[];
  sourceAdapterId?: string;
  payload: Record<string, unknown>;
  redactionLog: Array<{
    field: string;
    reason: string;
    method: string;
  }>;
  contextHash?: string;
  modelPolicySnapshotId?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  sessionId?: string;
  eventType: string;
  actorType: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  integrityHash?: string;
  createdAt: string;
}

export interface TicketReference {
  id: string;
  tenantId: string;
  adapterId: string;
  externalTicketId: string;
  subject: string;
  status: string;
  priority: string;
  customerEmail: string;
  customerName: string;
  rawData: Record<string, unknown>;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftSuggestionResponse {
  draft: string;
  provider: 'mock';
  model: string;
  prompt: {
    id: string;
    version: string;
    purpose: string;
  };
  contextHash: string;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costEstimateUsd?: number;
    latencyMs?: number;
    placeholder: true;
  };
  safety: {
    mockOnly: true;
    externalCallMade: false;
    policyChecks: string[];
    reviewRequired: true;
    writebackAllowed: false;
  };
  generatedAt: string;
}

export interface GreetingSuggestionResponse {
  suggestion: {
    id: string;
    tenantId: string;
    supportSessionId: string;
    callEventId?: string;
    greetingText: string;
    tone: 'professional' | 'friendly' | 'concise';
    contextSummary: {
      callerName?: string;
      normalizedPhoneNumber?: string;
      matchedTicketIds: string[];
      matchedCustomerName?: string;
      sessionTitle?: string;
    };
    metadata: {
      provider: string;
      model: string;
      promptId?: string;
      promptVersion?: string;
      contextHash?: string;
      mockDevOnly: true;
      reviewRequired: true;
      generatedAt: string;
    };
  };
  provider: 'mock';
  model: string;
  prompt: {
    id: string;
    version: string;
    purpose: string;
  };
  contextHash: string;
  usage: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costEstimateUsd?: number;
    latencyMs?: number;
    placeholder: true;
  };
  safety: {
    mockOnly: true;
    externalCallMade: false;
    policyChecks: string[];
    reviewRequired: true;
    autoSend: false;
    voiceEnabled: false;
  };
  generatedAt: string;
}

export interface ConnectorStatus {
  mode: 'mock' | 'zammad';
  health: 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
  adapterType: string;
  capabilities: string[];
  connected: boolean;
  lastError?: string;
  metadata: Record<string, unknown>;
}

export interface ConnectorTestResult {
  mode: 'mock' | 'zammad';
  success: boolean;
  latencyMs?: number;
  error?: string;
  metadata: Record<string, unknown>;
}

export interface TelephonyAdapterCapabilities {
  inboundCalls: boolean;
  answer: boolean;
  hold: boolean;
  resume: boolean;
  end: boolean;
  transfer: boolean;
  recording: boolean;
  transcription: boolean;
}

export interface TelephonyAdapterStatus {
  tenantId: string;
  providerType: string;
  mode: string;
  health: string;
  connected: boolean;
  capabilities: TelephonyAdapterCapabilities;
  webhookVerification: {
    status: string;
    checkedAt: string;
    signatureRequired: boolean;
    mockDevOnly: boolean;
    reason?: string;
  };
  lastTestedAt?: string;
  mockDevOnly: boolean;
  disclaimers: string[];
  metadata: Record<string, unknown>;
}

export interface TelephonyCallControlResult {
  intent: {
    tenantId: string;
    actorId: string;
    callEventId: string;
    externalCallId: string;
    providerType: string;
    adapterMode: string;
    action: string;
    reason?: string;
    requestedAt: string;
    mockDevOnly: boolean;
  };
  success: boolean;
  providerType: string;
  adapterMode: string;
  callEvent?: CallEvent;
  resultingStatus?: string;
  error?: { code: string; message: string; safeToDisplay: boolean };
  completedAt: string;
  mockDevOnly: boolean;
}

export interface TelephonyWebhookResponse {
  event: {
    tenantId: string;
    providerType: string;
    adapterMode: string;
    sourceEventId: string;
    externalCallId: string;
    eventType: string;
    rawCallerNumber?: string;
    normalizedPhoneNumber?: string;
    callerDisplayName?: string;
    occurredAt: string;
    verification: { status: string; checkedAt: string; signatureRequired: boolean; mockDevOnly: boolean };
    mockDevOnly: boolean;
  };
  callEvent: CallEvent;
  mockDevOnly: boolean;
  receivedAt: string;
}

export interface InternalNoteDraft {
  id: string;
  tenantId: string;
  sessionId: string;
  externalTicketId: string;
  subject?: string;
  body: string;
  reviewed: boolean;
  reviewerId?: string;
  createdAt: string;
}

export interface InternalNoteWritebackResult {
  success: boolean;
  externalArticleId?: string;
  error?: {
    code: string;
    message: string;
    safeToDisplay: boolean;
  };
  metadata: Record<string, unknown>;
}

export interface EvidenceBundleExportResponse {
  bundle: EvidenceBundle;
  format: 'json' | 'markdown';
  markdown?: string;
}

export interface CallEvent {
  id: string;
  tenantId: string;
  sessionId?: string;
  provider: string;
  source: string;
  externalCallId: string;
  direction: string;
  status: string;
  caller: {
    rawNumber: string;
    normalizedNumber?: string;
    displayName?: string;
    countryCodeHint?: string;
  };
  callerMatch?: {
    status: string;
    confidence: number;
    customerId?: string;
    customerName?: string;
    customerEmail?: string;
    matchedTicketIds: string[];
    matchedSessionIds: string[];
    matchSource?: string;
    reason?: string;
  };
  startedAt: string;
  endedAt?: string;
  answeredAt?: string;
  metadata: Record<string, unknown>;
  mockDevOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CallTimelineItem {
  id: string;
  callEventId: string;
  sessionId?: string;
  type: string;
  timestamp: string;
  actorId?: string;
  actorType?: string;
  title: string;
  description?: string;
  metadata: Record<string, unknown>;
}

export interface CallRecording {
  id: string;
  tenantId: string;
  callEventId: string;
  supportSessionId?: string;
  source: string;
  status: string;
  durationSeconds?: number;
  mockMediaUrl?: string;
  placeholderReference?: string;
  storageType: string;
  checksumHash?: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  mockDevOnly: boolean;
  complianceDisclaimer?: string;
  noRealAudio: boolean;
}

export interface CallRecordingAttachmentResponse {
  recording: CallRecording;
  mockDevOnly: boolean;
  attachedAt: string;
}

export interface CallRecordingReviewResponse {
  recording: CallRecording;
  reviewedAt: string;
}

export interface CallRecordingPlaybackResponse {
  playbackState: {
    recordingId: string;
    callEventId: string;
    openedAt: string;
    openedBy: string;
    mockDevOnly: boolean;
    noRealAudio: boolean;
    placeholderOnly: boolean;
  };
  recordedAt: string;
}

export interface ScreenObservation {
  id: string;
  tenantId: string;
  sessionId: string;
  callEventId?: string;
  observationSessionId?: string;
  source: string;
  kind: string;
  status: string;
  rawInputPlaceholder?: string;
  redactedSummary?: string;
  appLabel?: string;
  windowLabel?: string;
  urlLabel?: string;
  sharingState?: string;
  rawImageRetention?: string;
  redactionStatus?: string;
  safetyFlags?: {
    mockDevOnly: boolean;
    noRealScreenCapture: boolean;
    noRawPixels: boolean;
    noClipboardAccess: boolean;
    noOcr: boolean;
    noCredentialCapture: boolean;
    rawImageStored: boolean;
  };
  noRawPixels: boolean;
  noClipboard: boolean;
  noOcr: boolean;
  noCredentialCapture: boolean;
  mockDevOnly: boolean;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  contextPacketId?: string;
}

export interface ScreenObservationCaptureResponse {
  observation: ScreenObservation;
  redactedSummary: string;
  mockDevOnly: boolean;
}

export interface ScreenObservationReviewResponse {
  observation: ScreenObservation;
  previousStatus: string;
  newStatus: string;
}

export interface ScreenObservationContextPacketResponse {
  observation: ScreenObservation;
  contextPacketId: string;
  mockDevOnly: boolean;
}

export interface CallTimelineResponse {
  callEventId: string;
  timelineItems: CallTimelineItem[];
  generatedAt: string;
  mockDevOnly: boolean;
}

export type AutoCreateSessionResult =
  | 'not_requested'
  | 'auto_created'
  | 'linked_to_existing'
  | 'skipped_no_match'
  | 'skipped_invalid_phone';

export interface IncomingCallResponse {
  callEvent: CallEvent;
  autoCreateResult: AutoCreateSessionResult;
  createdSession?: SupportSession;
  mockDevOnly: boolean;
  receivedAt: string;
}

export interface EvidenceBundleSessionSummary {
  id: string;
  tenantId: string;
  status: string;
  priority: string;
  title: string;
  description?: string;
  assignedUserId?: string;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceBundleTicketSummary {
  id: string;
  externalTicketId: string;
  subject: string;
  status: string;
  priority: string;
  customerName?: string;
  customerEmail?: string;
  adapterId: string;
  lastSyncedAt?: string;
}

export interface EvidenceBundleContextPacketSummary {
  id: string;
  provenance: string;
  sourceTicketIds: string[];
  sourceAdapterId?: string;
  payloadSummary: Record<string, unknown>;
  redactionLog: Array<{ field: string; reason: string; method: string }>;
  createdAt: string;
}

export interface EvidenceBundleAiUsageSummary {
  provider: string;
  model: string;
  promptId?: string;
  promptVersion?: string;
  contextHash?: string;
  mockOnly: boolean;
  externalCallMade: boolean;
  reviewRequired: boolean;
  writebackAllowed: boolean;
  generatedAt?: string;
}

export interface EvidenceBundleConnectorOperationSummary {
  operationType: string;
  connectorType: string;
  connectorMode: string;
  externalTicketId?: string;
  success?: boolean;
  externalArticleId?: string;
  errorCode?: string;
  errorMessage?: string;
  occurredAt: string;
}

export interface EvidenceBundleAuditSummary {
  id: string;
  eventType: string;
  actorType: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadataSummary: Record<string, unknown>;
  integrityHash?: string;
  createdAt: string;
}

export interface EvidenceBundle {
  bundleId: string;
  tenantId: string;
  sessionId: string;
  generatedAt: string;
  generatedBy: string;
  exportFormat: 'json' | 'markdown';
  version: string;
  sessionSummary: EvidenceBundleSessionSummary;
  linkedTickets: EvidenceBundleTicketSummary[];
  contextPackets: EvidenceBundleContextPacketSummary[];
  aiUsage: EvidenceBundleAiUsageSummary[];
  connectorOperations: EvidenceBundleConnectorOperationSummary[];
  telephonyBridgeEvents: Array<{
    operationType: string;
    providerType: string;
    adapterMode: string;
    externalCallId?: string;
    callEventId?: string;
    controlIntent?: string;
    verificationStatus?: string;
    success?: boolean;
    errorCode?: string;
    errorMessage?: string;
    mockDevOnly: boolean;
    occurredAt: string;
  }>;
  auditTimeline: EvidenceBundleAuditSummary[];
  mockDevOnlyDisclaimers: string[];
  limitations: string[];
  callEvents: Array<{
    callEventId: string;
    provider: string;
    source: string;
    externalCallId: string;
    direction: string;
    status: string;
    rawNumber: string;
    normalizedNumber?: string;
    displayName?: string;
    matchStatus: string;
    matchConfidence: number;
    customerName?: string;
    matchedTicketIds: string[];
    linkedSessionId?: string;
    mockDevOnly: boolean;
    startedAt: string;
  }>;
  sourceProvenance: {
    storeType: string;
    persistenceClaimed: boolean;
    generatedByService: string;
    schemaVersion: string;
  };
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: ApiError | null
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  identity: DevIdentity = DEFAULT_IDENTITY
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('x-tenant-id', identity.tenantId);
  headers.set('x-user-id', identity.userId);
  if (identity.userRole) {
    headers.set('x-user-role', identity.userRole);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let body: ApiError | null = null;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      // ignore parse failure
    }
    throw new ApiClientError(
      body?.message ?? `HTTP ${res.status}`,
      res.status,
      body
    );
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const api = {
  // Sessions
  listSessions: (identity?: DevIdentity) =>
    apiFetch<SupportSession[]>('/support-sessions', { method: 'GET' }, identity),

  createSession: (
    body: { title: string; description?: string; priority?: string },
    identity?: DevIdentity
  ) =>
    apiFetch<SupportSession>('/support-sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    }, identity),

  getSession: (id: string, identity?: DevIdentity) =>
    apiFetch<SupportSession>(`/support-sessions/${id}`, { method: 'GET' }, identity),

  // Ticket context
  loadTicketContext: (
    sessionId: string,
    externalTicketId: string,
    identity?: DevIdentity
  ) =>
    apiFetch<{
      ticketReference: TicketReference;
      contextPacket: AIContextPacket;
      session: SupportSession;
    }>(`/support-sessions/${sessionId}/ticket-context`, {
      method: 'POST',
      body: JSON.stringify({ externalTicketId }),
    }, identity),

  // Context packets
  listContextPackets: (sessionId: string, identity?: DevIdentity) =>
    apiFetch<AIContextPacket[]>(
      `/support-sessions/${sessionId}/context-packets`,
      { method: 'GET' },
      identity
    ),

  createContextPacket: (
    sessionId: string,
    body: { provenance: string; payload: Record<string, unknown> },
    identity?: DevIdentity
  ) =>
    apiFetch<AIContextPacket>(
      `/support-sessions/${sessionId}/context-packets`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  // Audit events
  listAuditEvents: (sessionId: string, identity?: DevIdentity) =>
    apiFetch<AuditEvent[]>(
      `/support-sessions/${sessionId}/audit-events`,
      { method: 'GET' },
      identity
    ),

  generateDraftSuggestion: (
    sessionId: string,
    body: {
      operatorInstructions?: string;
      modelSelection?: { provider?: 'mock'; model?: string };
    } = {},
    identity?: DevIdentity
  ) =>
    apiFetch<DraftSuggestionResponse>(
      `/support-sessions/${sessionId}/draft-suggestion`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  generateGreetingSuggestion: (
    sessionId: string,
    body: {
      callEventId?: string;
      tone?: 'professional' | 'friendly' | 'concise';
      modelSelection?: { provider?: 'mock'; model?: string };
    } = {},
    identity?: DevIdentity
  ) =>
    apiFetch<GreetingSuggestionResponse>(
      `/support-sessions/${sessionId}/greeting-suggestion`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  // Connector endpoints
  getConnectorStatus: (identity?: DevIdentity) =>
    apiFetch<ConnectorStatus>(
      '/connectors/zammad/status',
      { method: 'GET' },
      identity
    ),

  testConnector: (identity?: DevIdentity) =>
    apiFetch<ConnectorTestResult>(
      '/connectors/zammad/test',
      { method: 'POST' },
      identity
    ),

  getTelephonyStatus: (identity?: DevIdentity) =>
    apiFetch<TelephonyAdapterStatus>(
      '/telephony/status',
      { method: 'GET' },
      identity
    ),

  testTelephonyBridge: (identity?: DevIdentity) =>
    apiFetch<TelephonyAdapterStatus>(
      '/telephony/test',
      { method: 'POST' },
      identity
    ),

  sendFakeProviderWebhook: (
    body: {
      sourceEventId?: string;
      externalCallId: string;
      eventType?: string;
      rawCallerNumber?: string;
      callerDisplayName?: string;
      autoCreateSession?: boolean;
      metadata?: Record<string, unknown>;
    },
    identity?: DevIdentity
  ) =>
    apiFetch<TelephonyWebhookResponse>(
      '/telephony/webhooks/fake-provider',
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  controlTelephonyCall: (
    callId: string,
    body: { action: string; reason?: string; target?: string },
    identity?: DevIdentity
  ) =>
    apiFetch<TelephonyCallControlResult>(
      `/telephony/calls/${callId}/control`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  loadZammadTicketContext: (
    sessionId: string,
    externalTicketId: string,
    identity?: DevIdentity
  ) =>
    apiFetch<{
      ticketReference: TicketReference;
      contextPacket: AIContextPacket;
      session: SupportSession;
    }>(`/support-sessions/${sessionId}/zammad/ticket-context`, {
      method: 'POST',
      body: JSON.stringify({ externalTicketId }),
    }, identity),

  createInternalNoteDraft: (
    sessionId: string,
    body: { externalTicketId: string; body: string; subject?: string },
    identity?: DevIdentity
  ) =>
    apiFetch<InternalNoteDraft>(
      `/support-sessions/${sessionId}/zammad/internal-note-draft`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  writebackInternalNote: (
    sessionId: string,
    body: { draftId: string; externalTicketId: string; body: string },
    identity?: DevIdentity
  ) =>
    apiFetch<InternalNoteWritebackResult>(
      `/support-sessions/${sessionId}/zammad/internal-note-writeback`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  // Evidence bundle
  getEvidenceBundle: (sessionId: string, identity?: DevIdentity) =>
    apiFetch<EvidenceBundleExportResponse>(
      `/support-sessions/${sessionId}/evidence-bundle`,
      { method: 'GET' },
      identity
    ),

  getEvidenceBundleJson: (sessionId: string, identity?: DevIdentity) =>
    apiFetch<EvidenceBundleExportResponse>(
      `/support-sessions/${sessionId}/evidence-bundle.json`,
      { method: 'GET' },
      identity
    ),

  // Calls
  createFakeIncomingCall: (
    body: {
      externalCallId: string;
      rawCallerNumber: string;
      callerDisplayName?: string;
      autoCreateSession?: boolean;
      preferredSessionTitle?: string;
      preferredPriority?: string;
    },
    identity?: DevIdentity
  ) =>
    apiFetch<IncomingCallResponse>('/calls/fake-incoming', {
      method: 'POST',
      body: JSON.stringify(body),
    }, identity),

  listRecentCalls: (identity?: DevIdentity) =>
    apiFetch<CallEvent[]>('/calls/recent', { method: 'GET' }, identity),

  getCall: (id: string, identity?: DevIdentity) =>
    apiFetch<CallEvent>(`/calls/${id}`, { method: 'GET' }, identity),

  linkCallToSession: (
    callId: string,
    body: { sessionId: string },
    identity?: DevIdentity
  ) =>
    apiFetch<{ callEvent: CallEvent; linkedAt: string }>(
      `/calls/${callId}/link-session`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  updateCallStatus: (
    callId: string,
    body: { status: string; reason?: string },
    identity?: DevIdentity
  ) =>
    apiFetch<{ callEvent: CallEvent; previousStatus: string; newStatus: string; changedAt: string }>(
      `/calls/${callId}/status`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  getCallTimeline: (callId: string, identity?: DevIdentity) =>
    apiFetch<CallTimelineResponse>(`/calls/${callId}/timeline`, { method: 'GET' }, identity),

  attachMockRecording: (
    callId: string,
    body: { source?: string; durationSeconds?: number },
    identity?: DevIdentity
  ) =>
    apiFetch<CallRecordingAttachmentResponse>(`/calls/${callId}/recordings/mock`, {
      method: 'POST',
      body: JSON.stringify(body),
    }, identity),

  listCallRecordings: (callId: string, identity?: DevIdentity) =>
    apiFetch<CallRecording[]>(`/calls/${callId}/recordings`, { method: 'GET' }, identity),

  reviewCallRecording: (
    callId: string,
    recordingId: string,
    identity?: DevIdentity
  ) =>
    apiFetch<CallRecordingReviewResponse>(
      `/calls/${callId}/recordings/${recordingId}/review`,
      { method: 'POST' },
      identity
    ),

  recordPlaybackOpened: (
    callId: string,
    recordingId: string,
    identity?: DevIdentity
  ) =>
    apiFetch<CallRecordingPlaybackResponse>(
      `/calls/${callId}/recordings/${recordingId}/playback`,
      { method: 'POST' },
      identity
    ),

  // Screen observations
  captureMockScreenObservation: (
    sessionId: string,
    body: {
      kind: string;
      callEventId?: string;
      rawInputPlaceholder?: string;
      appLabel?: string;
      windowLabel?: string;
      urlLabel?: string;
    },
    identity?: DevIdentity
  ) =>
    apiFetch<ScreenObservationCaptureResponse>(
      `/support-sessions/${sessionId}/screen-observations/mock`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  captureActiveWindowMockMetadata: (
    sessionId: string,
    body: {
      callEventId?: string;
      appLabel?: string;
      windowLabel?: string;
      urlLabel?: string;
      rawInputPlaceholder?: string;
    },
    identity?: DevIdentity
  ) =>
    apiFetch<ScreenObservationCaptureResponse>(
      `/support-sessions/${sessionId}/screen-observations/active-window/mock`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  attachManualScreenshotMetadata: (
    sessionId: string,
    body: {
      callEventId?: string;
      appLabel?: string;
      windowLabel?: string;
      urlLabel?: string;
      rawInputPlaceholder?: string;
      fileNameHint?: string;
    },
    identity?: DevIdentity
  ) =>
    apiFetch<ScreenObservationCaptureResponse & { rawImageRetention: 'disabled' }>(
      `/support-sessions/${sessionId}/screen-observations/manual-screenshot`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  uploadStructuredScreenObservation: (
    sessionId: string,
    body: {
      callEventId?: string;
      kind: string;
      appLabel?: string;
      windowLabel?: string;
      urlLabel?: string;
      rawInputPlaceholder?: string;
    },
    identity?: DevIdentity
  ) =>
    apiFetch<ScreenObservationCaptureResponse & { redactionStatus: string }>(
      `/support-sessions/${sessionId}/screen-observations/structured-upload`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  getSharingState: (sessionId: string, identity?: DevIdentity) =>
    apiFetch<{ sessionId: string; state: string; mockDevOnly: boolean }>(
      `/support-sessions/${sessionId}/screen-observations/sharing-state`,
      { method: 'GET' },
      identity
    ),

  updateSharingState: (sessionId: string, body: { state: string }, identity?: DevIdentity) =>
    apiFetch<{ sessionId: string; state: string; previousState?: string; mockDevOnly: boolean }>(
      `/support-sessions/${sessionId}/screen-observations/sharing-state`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  listScreenObservations: (sessionId: string, identity?: DevIdentity) =>
    apiFetch<ScreenObservation[]>(
      `/support-sessions/${sessionId}/screen-observations`,
      { method: 'GET' },
      identity
    ),

  reviewScreenObservation: (
    sessionId: string,
    observationId: string,
    body: { status: 'approved' | 'discarded' },
    identity?: DevIdentity
  ) =>
    apiFetch<ScreenObservationReviewResponse>(
      `/support-sessions/${sessionId}/screen-observations/${observationId}/review`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  createContextPacketFromObservation: (
    sessionId: string,
    observationId: string,
    body?: { provenance?: string },
    identity?: DevIdentity
  ) =>
    apiFetch<ScreenObservationContextPacketResponse>(
      `/support-sessions/${sessionId}/screen-observations/${observationId}/context-packet`,
      { method: 'POST', body: JSON.stringify(body ?? {}) },
      identity
    ),

  getEvidenceBundleMarkdown: async (sessionId: string, identity?: DevIdentity): Promise<string> => {
    const url = `${API_BASE}/support-sessions/${sessionId}/evidence-bundle.md`;
    const headers = new Headers();
    headers.set('x-tenant-id', (identity ?? DEFAULT_IDENTITY).tenantId);
    headers.set('x-user-id', (identity ?? DEFAULT_IDENTITY).userId);
    if ((identity ?? DEFAULT_IDENTITY).userRole) {
      headers.set('x-user-role', (identity ?? DEFAULT_IDENTITY).userRole!);
    }
    const res = await fetch(url, { method: 'GET', headers });
    if (!res.ok) {
      let body: ApiError | null = null;
      try {
        body = (await res.json()) as ApiError;
      } catch {
        // ignore
      }
      throw new ApiClientError(
        body?.message ?? `HTTP ${res.status}`,
        res.status,
        body
      );
    }
    return res.text();
  },
};

export { ApiClientError };
