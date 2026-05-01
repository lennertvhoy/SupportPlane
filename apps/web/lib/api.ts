const API_BASE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : 'http://localhost:4110';

export interface DevIdentity {
  tenantId: string;
  userId: string;
  userRole?: string;
}

export interface AuthIdentity {
  tenantId: string;
  tenantName?: string;
  tenantSlug?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  userRole?: string;
  roles: string[];
  permissions: string[];
  authMode: 'dev' | 'local' | 'oidc' | 'service';
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

export interface EndpointDevice {
  id: string;
  tenantId: string;
  displayName: string;
  hostname: string;
  deviceKey: string;
  fingerprint: string;
  platform: string;
  agentVersion: string;
  status: 'online' | 'offline' | 'stale' | 'disabled';
  lastSeenAt?: string;
  enrolledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface EndpointHeartbeat {
  id: string;
  tenantId: string;
  deviceId: string;
  status: string;
  agentVersion: string;
  observedAt: string;
  summary: Record<string, unknown>;
}

export interface EndpointDiagnosticSnapshot {
  id: string;
  tenantId: string;
  deviceId: string;
  kind: string;
  payload: Record<string, unknown>;
  collectedAt: string;
  sourceAgentVersion: string;
  createdAt: string;
}

export interface EndpointCommand {
  id: string;
  tenantId: string;
  deviceId: string;
  commandKind: string;
  status: string;
  nonce: string;
  idempotencyKey: string;
  requestedByUserId: string;
  requestedAt: string;
  claimedAt?: string;
  completedAt?: string;
  expiresAt: string;
  policyDecision: Record<string, unknown>;
  result?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EndpointDeviceDetail {
  device: EndpointDevice;
  heartbeats: EndpointHeartbeat[];
  snapshots: EndpointDiagnosticSnapshot[];
  commands: EndpointCommand[];
}

export interface ToolDefinition {
  id: string;
  manifestId: string;
  toolKey: string;
  displayName: string;
  description?: string;
  category: string;
  riskLevel: string;
  implementationId: string;
  readOnly: boolean;
  remediation: boolean;
  approvalRequired: boolean;
  requiredPermission: string;
  requiredPrivilege: 'user' | 'local_admin' | 'system';
  dryRunCapable: boolean;
  commandTemplateId?: string;
  supportedPlatforms: string[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ToolInvocation {
  id: string;
  tenantId: string;
  deviceId: string;
  toolDefinitionId: string;
  toolKey: string;
  requestedByUserId: string;
  status: string;
  policyDecision: Record<string, unknown>;
  approvalId?: string;
  endpointCommandId?: string;
  requestedInput: Record<string, unknown>;
  normalizedResult: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface ToolApproval {
  id: string;
  tenantId: string;
  invocationId: string;
  requestedByUserId: string;
  approvedByUserId?: string;
  status: string;
  reason?: string;
  comment?: string;
  expiresAt: string;
  decidedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ToolResultNoteDraft {
  id: string;
  tenantId: string;
  invocationId: string;
  ticketId?: string;
  title?: string;
  body: string;
  status: string;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeSource {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  adapterType: string;
  status: string;
  config: Record<string, unknown>;
  lastSyncAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeArticle {
  id: string;
  tenantId: string;
  sourceId: string;
  title: string;
  content: string;
  tags: string[];
  metadata: Record<string, unknown>;
  embeddingProvider?: string;
  embeddingModel?: string;
  embeddingDimensions?: number;
  embeddingContentHash?: string;
  embeddedAt?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeRetrievalResult {
  articleId: string;
  sourceId: string;
  title: string;
  snippet: string;
  score: number;
  provenance: {
    sourceName: string;
    articleStatus: string;
    retrievedAt: string;
    retrievalMethod: string;
    scoreKind: string;
    confidence: null;
    embeddingProvider?: string;
    embeddingModel?: string;
    pgvectorEnabled: boolean;
    fallbackReason?: string;
  };
}

export interface KnowledgeRetrievalResponse {
  query: string;
  results: KnowledgeRetrievalResult[];
  totalAvailable: number;
  retrievalMethod: string;
  pgvectorEnabled: boolean;
  pgvectorReason: string;
  embeddingProvider?: string;
  embeddingProviderAvailable: boolean;
  embeddingProviderReason: string;
  semanticEligible: boolean;
  fallbackReason?: string;
  mockDevOnly: boolean;
}

export interface TicketReference {
  id: string;
  tenantId: string;
  adapterId: string;
  externalTicketId: string;
  subject: string;
  status: string;
  priority: string;
  customerId?: string;
  customerEmail?: string;
  customerName?: string;
  rawData: Record<string, unknown>;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface DraftSuggestionResponse {
  draft: string;
  provider: 'mock' | 'ollama' | 'lmstudio';
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
    placeholder: boolean;
    providerMode?: 'mock' | 'local';
    runtime?: 'mock' | 'ollama' | 'lmstudio';
    runtimeBaseUrlRedacted?: string;
    fallbackUsed?: boolean;
    noCloudCall?: true;
  };
  safety: {
    mockOnly: boolean;
    externalCallMade: false;
    cloudCallMade?: false;
    localProviderCallMade?: boolean;
    fallbackUsed?: boolean;
    policyChecks: string[];
    reviewRequired: true;
    writebackAllowed: false;
    autonomousSend?: false;
    redactionApplied?: boolean;
    runtime?: 'mock' | 'ollama' | 'lmstudio';
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
  provider: 'mock' | 'ollama' | 'lmstudio';
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

export interface CustomerReference {
  id: string;
  tenantId: string;
  adapterId: string;
  externalCustomerId: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  rawData?: Record<string, unknown>;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorInstallation {
  id: string;
  tenantId: string;
  name: string;
  displayName?: string;
  description?: string;
  adapterType: string;
  capabilities: string[];
  config: Record<string, unknown>;
  secretReferenceIds: string[];
  status: 'active' | 'inactive' | 'error';
  mockMode: boolean;
  enabled: boolean;
  safetyFlags: Record<string, unknown>;
  timeoutMs?: number;
  lastVerifiedAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorCredentialReference {
  id: string;
  tenantId: string;
  connectorType: string;
  displayName: string;
  description?: string;
  status: 'active' | 'inactive' | 'error';
  secretKind: string;
  secretRef: string;
  lastValidatedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdByUserId?: string;
  updatedByUserId?: string;
}

export interface ConnectorTestResult {
  mode: 'mock' | 'zammad';
  success: boolean;
  latencyMs?: number;
  error?: string;
  metadata: Record<string, unknown>;
}

export type ConnectorReadinessMode = 'fixture' | 'mock' | 'configured' | 'live' | 'error' | 'unconfigured';
export type ConnectorCredentialSource = 'none' | 'env' | 'vault' | 'local_dev_secret' | 'redacted';
export type ConnectorStatusErrorCode = 'CONFIG_MISSING' | 'AUTH_FAILED' | 'NETWORK_FAILED' | 'UNSUPPORTED' | 'OK';

export interface BrowserConnectorStatus {
  id: string;
  key: string;
  displayName: string;
  name: string;
  adapterType: string;
  mode: ConnectorReadinessMode;
  status: ConnectorReadinessMode;
  transport: 'real' | 'mock' | 'fixture' | 'unconfigured';
  capabilities: string[];
  credentialSource: ConnectorCredentialSource;
  health: string;
  lastCheck: {
    status: 'ok' | 'warning' | 'error' | 'not_run';
    timestamp: string;
  };
  lastChecked: string;
  errorCode: ConnectorStatusErrorCode;
  fixtureWarning?: string;
  lastError?: string;
  tenantScoped: boolean;
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

export interface SupportAction {
  id: string;
  tenantId: string;
  sessionId: string;
  callEventId?: string;
  customerReferenceId?: string;
  ticketReferenceId?: string;
  connectorInstallationId?: string;
  actionType: 'ticket_note';
  status: string;
  idempotencyKey: string;
  requestedBy: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewDecision?: 'approved' | 'rejected';
  reviewReason?: string;
  reviewedAt?: string;
  queuedAt?: string;
  mockDeliveredAt?: string;
  failureReason?: string;
  payloadSummary: Record<string, unknown>;
  safeBodyPreview?: string;
  mockDevOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPolicy {
  id: string;
  tenantId: string;
  connectorInstallationId: string | null;
  name: string;
  enabled: boolean;
  killSwitch: boolean;
  dryRunRequired: boolean;
  mockOnlyEnforced: boolean;
  allowRealNetworkCalls: boolean;
  allowedActionTypes: string[];
  approvalRequired: boolean;
  minimumApproverRole: 'admin' | 'owner' | 'operator';
  requireHumanReview: boolean;
  requireEvidenceBundleBeforeDelivery: boolean;
  requireConnectorValidationBeforeDelivery: boolean;
  retryPolicy: { maxAttempts: number; baseDelaySeconds: number; maxDelaySeconds: number; backoffMultiplier: number };
  deadLetterPolicy: { enabled: boolean; maxAttemptsBeforeDeadLetter: number; requireManualRetry: boolean };
  updatedBy: string | null;
  updatedAt: string;
  policyVersion: number;
  lastValidationStatus: 'valid' | 'invalid' | 'pending' | 'not_run';
  safetyFlags: { realNetworkAllowed: boolean; writebackEnabled: boolean; externalWriteAllowed: boolean; mockOnly: boolean; localDevOnly: boolean };
  createdAt: string;
}

export interface DeliveryPolicyUpdate {
  enabled?: boolean;
  killSwitch?: boolean;
  dryRunRequired?: boolean;
  mockOnlyEnforced?: boolean;
  allowedActionTypes?: string[];
  approvalRequired?: boolean;
  minimumApproverRole?: 'admin' | 'owner' | 'operator';
  requireHumanReview?: boolean;
  requireEvidenceBundleBeforeDelivery?: boolean;
  requireConnectorValidationBeforeDelivery?: boolean;
  retryPolicy?: Partial<DeliveryPolicy['retryPolicy']>;
  deadLetterPolicy?: Partial<DeliveryPolicy['deadLetterPolicy']>;
}

export interface DeliveryPolicyDecision {
  allowed: boolean;
  decision: string;
  reason: string;
  mode: 'mock' | 'dry_run' | 'real';
  realNetworkAllowed: boolean;
  writebackEnabled: boolean;
  externalWriteAllowed: boolean;
  requiredApproverRole: string | null;
  policyVersion: number;
  policyId: string;
  safetyFlags: DeliveryPolicy['safetyFlags'];
}

export interface ConnectorReadinessResult {
  mode: 'mock' | 'real' | 'sandbox';
  readyForMockDelivery: boolean;
  readyForRealWriteback: boolean;
  sandboxWritebackReady: boolean;
  productionWritebackReady: boolean;
  publicReplyEnabled: boolean;
  realNetwork: boolean;
  writebackEnabled: boolean;
  externalWriteAttempted: boolean;
  policyDecision: string;
  connectorInstalled: boolean;
  connectorActive: boolean;
  connectorSupportsActionType: boolean;
  connectorValidationStatus: string;
  credentialsAbsentOrRedacted: boolean;
  policyVersion: number;
  lastValidationResult: string | null;
  safetyFlags: DeliveryPolicy['safetyFlags'];
  registryPattern?: boolean;
  adapterFactoryId?: string;
  adapterRuntimeId?: string;
}

export interface ConnectorPolicy {
  id: string;
  tenantId: string;
  policyType: 'connector';
  connectorInstallationId: string;
  name: string;
  enabled: boolean;
  killSwitch: boolean;
  allowedActionTypes: string[];
  approvalRequired: boolean;
  minimumApproverRole: 'admin' | 'owner' | 'operator';
  requireEvidenceBundleBeforeDelivery: boolean;
  requireConnectorValidationBeforeDelivery: boolean;
  maxRetries: number;
  backoffSeconds: number;
  safetyFlags: {
    realNetworkAllowed: boolean;
    writebackEnabled: boolean;
    externalWriteAllowed: boolean;
    mockOnly: boolean;
    sandboxOnly: boolean;
  };
  updatedBy: string | null;
  updatedAt: string;
  version: number;
  createdAt: string;
}

export interface AiPolicy {
  id: string;
  tenantId: string;
  policyType: 'ai';
  name: string;
  enabled: boolean;
  killSwitch: boolean;
  allowedProviders: ('mock' | 'ollama' | 'lmstudio' | 'openai' | 'anthropic')[];
  allowedModels: string[];
  maxTokensPerRequest: number;
  maxCostPerDayUsd: number;
  requireHumanReview: boolean;
  allowAutonomousSend: boolean;
  allowDraftGeneration: boolean;
  allowGreetingSuggestions: boolean;
  allowScreenContext: boolean;
  redactionRequired: boolean;
  safetyFlags: {
    cloudCallsAllowed: boolean;
    localProvidersOnly: boolean;
    mockOnly: boolean;
    reviewRequired: boolean;
  };
  updatedBy: string | null;
  updatedAt: string;
  version: number;
  createdAt: string;
}

export interface RetentionPolicy {
  id: string;
  tenantId: string;
  policyType: 'retention';
  name: string;
  enabled: boolean;
  sessionRetentionDays: number;
  auditLogRetentionDays: number;
  callRecordingRetentionDays: number;
  screenObservationRetentionDays: number;
  evidenceBundleRetentionDays: number;
  actionOutboxRetentionDays: number;
  autoPurgeEnabled: boolean;
  purgeRequiresApproval: boolean;
  minimumPurgeApproverRole: 'admin' | 'owner' | 'operator';
  updatedBy: string | null;
  updatedAt: string;
  version: number;
  createdAt: string;
}

export interface PolicySummary {
  policyType: 'delivery' | 'connector' | 'ai' | 'retention';
  id: string;
  name: string;
  enabled: boolean;
  killSwitch?: boolean;
  version: number;
  updatedAt: string;
  updatedBy: string | null;
  scopeCount?: number;
}

export interface PolicyAuditPreview {
  tenantId: string;
  generatedAt: string;
  policies: Array<{
    policyType: string;
    policyId: string;
    policyName: string;
    version: number;
    enabled: boolean;
    safetyFlags: Record<string, boolean>;
  }>;
  disclaimers: string[];
}

export interface WorkerStatus {
  mode: string;
  status: string;
  consumerEnabled: boolean;
  queueBackend: string;
  storeMode: string;
  deliveryMode: string;
  realNetwork: boolean;
  writebackEnabled: boolean;
  externalWriteAttempted: boolean;
  summary: Record<string, number>;
  warnings: string[];
  checkedAt: string;
  mockDevOnly: boolean;
}

export interface ActionOutboxItem {
  id: string;
  tenantId: string;
  supportActionId: string;
  sessionId: string;
  connectorInstallationId?: string;
  actionType: 'ticket_note';
  status: string;
  idempotencyKey: string;
  deliveryMode?: 'mock' | 'sandbox';
  deliveryIntent: Record<string, unknown>;
  attemptCount: number;
  maxAttempts: number;
  latestAttemptState?: string;
  queuedAt: string;
  nextAttemptAt?: string;
  processingStartedAt?: string;
  workerLockId?: string;
  workerLockedAt?: string;
  workerLockExpiresAt?: string;
  mockDeliveredAt?: string;
  failedAt?: string;
  retryScheduledAt?: string;
  deadLetteredAt?: string;
  cancelledAt?: string;
  lastError?: string;
  lastErrorCode?: string;
  lastErrorMessage?: string;
  lastErrorRedacted?: boolean;
  deadLetterReason?: string;
  safetyFlags: Record<string, unknown>;
  mockDevOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActionOutboxAttempt {
  id: string;
  tenantId: string;
  outboxItemId: string;
  supportActionId: string;
  attemptNumber: number;
  state: string;
  deliveryResult: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  errorRedacted?: boolean;
  attemptedAt: string;
  completedAt?: string;
  mockDevOnly: boolean;
}

export interface OutboxWorkerStatus {
  mode: string;
  status: string;
  consumerEnabled: boolean;
  queueBackend: string;
  fallbackQueueBackend?: string;
  storeMode: string;
  deliveryMode: 'mock' | 'sandbox_available';
  realNetwork: boolean;
  writebackEnabled: boolean;
  externalWriteAttempted: boolean;
  summary: Record<string, number>;
  warnings: string[];
  checkedAt: string;
  mockDevOnly: boolean;
  nats?: {
    enabled: boolean;
    urlConfigured: boolean;
    streamName: string;
    subject: string;
    consumerName: string;
    bridgeMode: string;
  };
}

export interface ApiHealthStatus {
  status?: string;
  storeMode?: string;
  authMode?: string;
  oidcReady?: boolean;
  mfaHookAvailable?: boolean;
  checkedAt?: string;
}

export interface ObservabilityStatus {
  api?: {
    status?: string;
    health?: string;
    storeMode?: string;
    authMode?: string;
    checkedAt?: string;
  };
  worker?: Partial<OutboxWorkerStatus> & {
    lastSandboxWriteback?: string;
    lastSandboxWritebackStatus?: string;
  };
  queue?: {
    backend?: string;
    status?: string;
    fallbackBackend?: string;
  };
  nats?: {
    enabled?: boolean;
    status?: string;
    streamName?: string;
    subject?: string;
    consumerName?: string;
    bridgeMode?: string;
  };
  sandboxWriteback?: {
    status?: string;
    lastStatus?: string;
    lastCompletedAt?: string;
    externalArticleId?: string;
  };
  ai?: {
    provider?: string;
    model?: string;
    providerMode?: string;
    fallbackUsed?: boolean;
    fallbackProvider?: string;
    status?: string;
  };
  observabilityStack?: {
    prometheus?: { status?: string; endpoint?: string };
    grafana?: { status?: string; endpoint?: string };
    otelCollector?: { status?: string; endpoint?: string };
    loki?: { status?: string; endpoint?: string };
  };
  telemetry?: {
    minioEvidence?: { status?: string; endpoint?: string; lastWriteStatus?: string };
    mailpitNotification?: { status?: string; endpoint?: string; lastNotificationStatus?: string };
    sandboxWriteback?: { status?: string; lastStatus?: string };
    secretsRedacted?: boolean;
  };
  correlationId?: string;
  disclaimers?: string[];
  checkedAt?: string;
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

export interface EvidenceBundleCustomerReferenceSummary {
  id: string;
  externalCustomerId: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  adapterId: string;
  lastSyncedAt?: string;
}

export interface EvidenceBundleConnectorInstallationSummary {
  id: string;
  name: string;
  adapterType: string;
  status: string;
  safetyFlags: Record<string, unknown>;
  lastVerifiedAt?: string;
  lastError?: string;
}

export interface EvidenceBundleActionOutboxSummary {
  actionId: string;
  outboxItemId?: string;
  actionType: string;
  status: string;
  idempotencyKey: string;
  reviewDecision?: string;
  reviewedBy?: string;
  queuedAt?: string;
  mockDeliveredAt?: string;
  attemptCount: number;
  latestAttemptState?: string;
  payloadSummary: Record<string, unknown>;
  deliveryIntent?: Record<string, unknown>;
  safetyFlags: Record<string, unknown>;
  mockDevOnly: boolean;
  realNetwork: false;
  externalWriteAttempted: false;
  writebackEnabled: false;
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
  customerReferences: EvidenceBundleCustomerReferenceSummary[];
  connectorInstallations: EvidenceBundleConnectorInstallationSummary[];
  actionOutbox: EvidenceBundleActionOutboxSummary[];
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
    credentials: 'include',
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
  login: (body: { email: string; password: string; tenantSlug?: string }) =>
    apiFetch<{ identity: AuthIdentity; expiresAt: string; authMode: 'local' }>(
      '/auth/local/login',
      { method: 'POST', body: JSON.stringify(body) }
    ),

  logout: () =>
    apiFetch<{ loggedOut: boolean }>('/auth/logout', { method: 'POST' }),

  me: () =>
    apiFetch<{ identity: AuthIdentity; authMode: 'dev' | 'local' | 'oidc' }>('/auth/me', { method: 'GET' }),

  getHealth: (identity?: DevIdentity) =>
    apiFetch<ApiHealthStatus>('/health', { method: 'GET' }, identity),

  getObservabilityStatus: (identity?: DevIdentity) =>
    apiFetch<ObservabilityStatus>('/observability/status', { method: 'GET' }, identity),

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
      modelSelection?: { provider?: 'mock' | 'ollama' | 'lmstudio'; model?: string };
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
      modelSelection?: { provider?: 'mock' | 'ollama' | 'lmstudio'; model?: string };
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

  // Customers
  listCustomers: (identity?: DevIdentity) =>
    apiFetch<{ customers: CustomerReference[] }>('/customers', { method: 'GET' }, identity).then(r => r.customers),

  getCustomer: (id: string, identity?: DevIdentity) =>
    apiFetch<{ customer: CustomerReference }>(`/customers/${id}`, { method: 'GET' }, identity).then(r => r.customer),

  // Tickets
  listTickets: (params?: { customerId?: string; email?: string; status?: string; priority?: string }, identity?: DevIdentity) =>
    apiFetch<{ tickets: TicketReference[] }>(`/tickets?${new URLSearchParams(params ?? {}).toString()}`, { method: 'GET' }, identity).then(r => r.tickets),

  getTicket: (id: string, identity?: DevIdentity) =>
    apiFetch<{ ticket: TicketReference }>(`/tickets/${id}`, { method: 'GET' }, identity).then(r => r.ticket),

  // Case timeline
  getCaseTimeline: (sessionId: string, identity?: DevIdentity) =>
    apiFetch<{ timeline: Array<{ id: string; type: string; timestamp: string; title: string; description?: string; metadata: Record<string, unknown> }>; generatedAt: string }>(
      `/support-sessions/${sessionId}/case-timeline`,
      { method: 'GET' },
      identity
    ),

  // Support note drafts
  createSupportNoteDraft: (
    sessionId: string,
    body: { externalTicketId: string; operatorNotes?: string },
    identity?: DevIdentity
  ) =>
    apiFetch<{ draft: string; mockDevOnly: true; notSentToZammad: true; requiresHumanReview: true; generatedAt: string }>(
      `/support-sessions/${sessionId}/support-note-drafts`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  // Durable actions and local outbox
  listSessionActions: (sessionId: string, identity?: DevIdentity) =>
    apiFetch<{ actions: SupportAction[]; outboxItems: ActionOutboxItem[] }>(
      `/support-sessions/${sessionId}/actions`,
      { method: 'GET' },
      identity
    ),

  createSupportAction: (
    sessionId: string,
    body: { actionType?: 'ticket_note'; externalTicketId?: string; ticketReferenceId?: string; body: string; subject?: string; idempotencyKey?: string; mockDeliveryScenario?: string },
    identity?: DevIdentity
  ) =>
    apiFetch<{ action: SupportAction; idempotentReplay: boolean }>(
      `/support-sessions/${sessionId}/actions`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  submitActionForReview: (actionId: string, identity?: DevIdentity) =>
    apiFetch<{ action: SupportAction }>(`/actions/${actionId}/submit-for-review`, { method: 'POST' }, identity),

  approveAction: (actionId: string, reason?: string, identity?: DevIdentity) =>
    apiFetch<{ action: SupportAction }>(`/actions/${actionId}/approve`, { method: 'POST', body: JSON.stringify({ reason }) }, identity),

  rejectAction: (actionId: string, reason?: string, identity?: DevIdentity) =>
    apiFetch<{ action: SupportAction }>(`/actions/${actionId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }, identity),

  queueAction: (actionId: string, identity?: DevIdentity) =>
    apiFetch<{ action: SupportAction; outboxItem: ActionOutboxItem; idempotentReplay: boolean }>(`/actions/${actionId}/queue`, { method: 'POST' }, identity),

  mockDeliverAction: (actionId: string, identity?: DevIdentity) =>
    apiFetch<{ action: SupportAction; outboxItem: ActionOutboxItem; attempt: ActionOutboxAttempt; delivery: Record<string, unknown> }>(`/actions/${actionId}/mock-deliver`, { method: 'POST' }, identity),

  getOutboxItem: (outboxId: string, identity?: DevIdentity) =>
    apiFetch<{ outboxItem: ActionOutboxItem; attempts: ActionOutboxAttempt[] }>(`/outbox/${outboxId}`, { method: 'GET' }, identity),

  listOutbox: (identity?: DevIdentity) =>
    apiFetch<{ outboxItems: ActionOutboxItem[]; summary: Record<string, number> }>('/outbox', { method: 'GET' }, identity),

  retryOutboxItem: (outboxId: string, identity?: DevIdentity) =>
    apiFetch<{ outboxItem: ActionOutboxItem }>(`/outbox/${outboxId}/retry`, { method: 'POST' }, identity),

  cancelOutboxItem: (outboxId: string, reason?: string, identity?: DevIdentity) =>
    apiFetch<{ action: SupportAction; outboxItem: ActionOutboxItem }>(
      `/outbox/${outboxId}/cancel`,
      { method: 'POST', body: JSON.stringify({ reason }) },
      identity
    ),

  deadLetterOutboxItem: (outboxId: string, reason?: string, identity?: DevIdentity) =>
    apiFetch<{ action: SupportAction; outboxItem: ActionOutboxItem }>(
      `/outbox/${outboxId}/dead-letter`,
      { method: 'POST', body: JSON.stringify({ reason }) },
      identity
    ),

  processOutboxOnce: (outboxItemId?: string, identity?: DevIdentity) =>
    apiFetch<Record<string, unknown>>(
      '/outbox/process-once',
      { method: 'POST', body: JSON.stringify({ outboxItemId }) },
      identity
    ),

  getOutboxWorkerStatus: (identity?: DevIdentity) =>
    apiFetch<OutboxWorkerStatus>('/outbox/worker/status', { method: 'GET' }, identity),

  // Connector installations
  listConnectorInstallations: (identity?: DevIdentity) =>
    apiFetch<{ installations: ConnectorInstallation[] }>('/connector-installations', { method: 'GET' }, identity).then(r => r.installations),

  getConnectorInstallation: (id: string, identity?: DevIdentity) =>
    apiFetch<{ installation: ConnectorInstallation }>(`/connector-installations/${id}`, { method: 'GET' }, identity).then(r => r.installation),

  updateConnectorInstallation: (
    id: string,
    body: {
      name?: string;
      displayName?: string;
      description?: string;
      config?: Record<string, unknown>;
      status?: string;
      mockMode?: boolean;
      enabled?: boolean;
      capabilities?: string[];
      safetyFlags?: Record<string, unknown>;
      timeoutMs?: number;
    },
    identity?: DevIdentity
  ) =>
    apiFetch<{ installation: ConnectorInstallation }>(`/connector-installations/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, identity).then(r => r.installation),

  validateConnectorInstallation: (id: string, identity?: DevIdentity) =>
    apiFetch<{ installationId: string; result: { valid: boolean; mode: string; realNetwork: boolean; writebackEnabled: boolean; errors: string[]; warnings: string[]; timestamp: string } }>(
      `/connector-installations/${id}/validate`,
      { method: 'POST' },
      identity
    ),

  testConnectorInstallation: (id: string, identity?: DevIdentity) =>
    apiFetch<{ installationId: string; result: { success: boolean; mode: string; realNetwork: boolean; writebackEnabled: boolean; latencyMs: number; responseSummary: string; timestamp: string } }>(
      `/connector-installations/${id}/test`,
      { method: 'POST' },
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
    const res = await fetch(url, { method: 'GET', headers, credentials: 'include' });
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

  // Delivery Policy
  listDeliveryPolicies: (identity?: DevIdentity) =>
    apiFetch<{ policies: DeliveryPolicy[] }>(`/delivery-policies`, { method: 'GET' }, identity),

  getDeliveryPolicy: (id: string, identity?: DevIdentity) =>
    apiFetch<{ policy: DeliveryPolicy }>(`/delivery-policies/${id}`, { method: 'GET' }, identity),

  updateDeliveryPolicy: (id: string, body: Partial<DeliveryPolicyUpdate>, identity?: DevIdentity) =>
    apiFetch<{ policy: DeliveryPolicy }>(`/delivery-policies/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, identity),

  validateDeliveryPolicy: (id: string, identity?: DevIdentity) =>
    apiFetch<{ policy: DeliveryPolicy; decision: DeliveryPolicyDecision }>(`/delivery-policies/${id}/validate`, { method: 'POST' }, identity),

  // Admin Policies (BL-076)
  listAdminPolicies: (identity?: DevIdentity) =>
    apiFetch<{ policies: PolicySummary[] }>('/admin/policies', { method: 'GET' }, identity),

  getAdminPolicyAuditPreview: (identity?: DevIdentity) =>
    apiFetch<PolicyAuditPreview>('/admin/policies/audit-preview', { method: 'GET' }, identity),

  updateAdminDeliveryPolicy: (id: string, body: Partial<DeliveryPolicyUpdate>, identity?: DevIdentity) =>
    apiFetch<{ policy: DeliveryPolicy }>(`/admin/policies/delivery/${id}`, { method: 'PUT', body: JSON.stringify(body) }, identity),

  getAdminConnectorPolicy: (installationId: string, identity?: DevIdentity) =>
    apiFetch<{ policy: ConnectorPolicy }>(`/admin/policies/connectors/${installationId}`, { method: 'GET' }, identity),

  updateAdminConnectorPolicy: (installationId: string, body: Partial<ConnectorPolicy>, identity?: DevIdentity) =>
    apiFetch<{ policy: ConnectorPolicy }>(`/admin/policies/connectors/${installationId}`, { method: 'PUT', body: JSON.stringify(body) }, identity),

  getAdminAiPolicy: (identity?: DevIdentity) =>
    apiFetch<{ policy: AiPolicy }>('/admin/policies/ai', { method: 'GET' }, identity),

  updateAdminAiPolicy: (body: Partial<AiPolicy>, identity?: DevIdentity) =>
    apiFetch<{ policy: AiPolicy }>('/admin/policies/ai', { method: 'PUT', body: JSON.stringify(body) }, identity),

  getAdminRetentionPolicy: (identity?: DevIdentity) =>
    apiFetch<{ policy: RetentionPolicy }>('/admin/policies/retention', { method: 'GET' }, identity),

  updateAdminRetentionPolicy: (body: Partial<RetentionPolicy>, identity?: DevIdentity) =>
    apiFetch<{ policy: RetentionPolicy }>('/admin/policies/retention', { method: 'PUT', body: JSON.stringify(body) }, identity),

  // Endpoint devices / read-only diagnostics
  listEndpointDevices: (identity?: DevIdentity) =>
    apiFetch<{ devices: EndpointDevice[] }>('/endpoint-devices', { method: 'GET' }, identity),

  getEndpointDevice: (id: string, identity?: DevIdentity) =>
    apiFetch<EndpointDeviceDetail>(`/endpoint-devices/${id}`, { method: 'GET' }, identity),

  requestEndpointDiagnostic: (id: string, commandKind: string, identity?: DevIdentity) =>
    apiFetch<{ command: EndpointCommand; idempotentReplay: boolean }>(
      `/endpoint-devices/${id}/commands`,
      { method: 'POST', body: JSON.stringify({ commandKind }) },
      identity
    ),

  checkConnectorReadiness: (installationId: string, identity?: DevIdentity) =>
    apiFetch<ConnectorReadinessResult>(`/connector-installations/${installationId}/readiness`, { method: 'POST' }, identity),

  getConnectorConfigSchema: (installationId: string, identity?: DevIdentity) =>
    apiFetch<{ installationId: string; schema: Record<string, unknown>; safeFields: string[]; rejectedFields: string[]; mockOnly: true }>(`/connector-installations/${installationId}/config-schema`, { method: 'GET' }, identity),

  validateConnectorConfig: (installationId: string, config: Record<string, unknown>, identity?: DevIdentity) =>
    apiFetch<{ installationId: string; result: { valid: boolean; mockMode: true; realNetwork: false; writebackEnabled: false; issues: Array<{ field: string; severity: string; message: string; code: string }>; warnings: string[]; timestamp: string } }>(`/connector-installations/${installationId}/validate-config`, { method: 'POST', body: JSON.stringify({ config }) }, identity),

  checkConnectorRuntimeReadiness: (installationId: string, identity?: DevIdentity) =>
    apiFetch<{ installationId: string; result: { mockReady: boolean; realReady: false; realNetwork: false; writebackEnabled: false; externalWriteAttempted: false; warnings: string[]; credentialReferencesLinked: boolean; linkedCredentialReferenceCount: number; timestamp: string } }>(`/connector-installations/${installationId}/runtime-readiness`, { method: 'POST' }, identity),

  resolveConnectorRuntime: (connectorType: string, identity?: DevIdentity) =>
    apiFetch<{ tenantId: string; connectorType: string; installationId: string; installationDisplayName: string; capabilities: string[]; credentialReferences: Array<{ id: string; displayName: string; kind: string; status: string; lastValidatedAt?: string; secretResolutionImplemented: false }>; mode: 'mock'; realNetwork: false; writebackEnabled: false; externalWriteAttempted: false; readiness: { mockReady: boolean; realReady: false; realNetwork: false; writebackEnabled: false; externalWriteAttempted: false; warnings: string[]; credentialReferencesLinked: boolean; linkedCredentialReferenceCount: number; timestamp: string } }>(`/connector-installations/runtime/resolve?connectorType=${encodeURIComponent(connectorType)}`, { method: 'GET' }, identity),

  // Credential references
  listCredentialReferences: (identity?: DevIdentity) =>
    apiFetch<{ credentialReferences: ConnectorCredentialReference[] }>('/credential-references', { method: 'GET' }, identity).then(r => r.credentialReferences),

  getCredentialReference: (id: string, identity?: DevIdentity) =>
    apiFetch<{ credentialReference: ConnectorCredentialReference }>(`/credential-references/${id}`, { method: 'GET' }, identity).then(r => r.credentialReference),

  createCredentialReference: (
    body: { connectorType: string; displayName: string; description?: string; status?: string; secretKind?: string },
    identity?: DevIdentity
  ) =>
    apiFetch<{ credentialReference: ConnectorCredentialReference }>('/credential-references', { method: 'POST', body: JSON.stringify(body) }, identity).then(r => r.credentialReference),

  updateCredentialReference: (
    id: string,
    body: { displayName?: string; description?: string; status?: string; secretKind?: string },
    identity?: DevIdentity
  ) =>
    apiFetch<{ credentialReference: ConnectorCredentialReference }>(`/credential-references/${id}`, { method: 'PATCH', body: JSON.stringify(body) }, identity).then(r => r.credentialReference),

  linkCredentialReference: (installationId: string, credentialReferenceId: string, identity?: DevIdentity) =>
    apiFetch<{ installation: ConnectorInstallation; credentialReference: { id: string; displayName: string } }>(
      `/connector-installations/${installationId}/link-credential`,
      { method: 'POST', body: JSON.stringify({ credentialReferenceId }) },
      identity
    ),

  unlinkCredentialReference: (installationId: string, credentialReferenceId: string, identity?: DevIdentity) =>
    apiFetch<{ installation: ConnectorInstallation; credentialReference: { id: string; displayName: string } }>(
      `/connector-installations/${installationId}/unlink-credential`,
      { method: 'POST', body: JSON.stringify({ credentialReferenceId }) },
      identity
    ),

  // Worker status
  getWorkerStatus: (identity?: DevIdentity) =>
    apiFetch<WorkerStatus>(`/outbox/worker/status`, { method: 'GET' }, identity),

  // Tool registry / execution
  listTools: (identity?: DevIdentity) =>
    apiFetch<{ tools: ToolDefinition[] }>('/admin/tools', { method: 'GET' }, identity),

  getTool: (id: string, identity?: DevIdentity) =>
    apiFetch<{ tool: ToolDefinition | null }>(`/admin/tools/${id}`, { method: 'GET' }, identity),

  invokeTool: (deviceId: string, toolKey: string, body: { requestedInput?: Record<string, unknown>; idempotencyKey?: string }, identity?: DevIdentity) =>
    apiFetch<{ invocation: ToolInvocation; policyDecision: Record<string, unknown> }>(`/admin/devices/${deviceId}/tools/${toolKey}/invoke`, { method: 'POST', body: JSON.stringify(body) }, identity),

  listToolInvocations: (identity?: DevIdentity) =>
    apiFetch<{ invocations: ToolInvocation[] }>('/admin/tool-invocations', { method: 'GET' }, identity),

  getToolInvocation: (id: string, identity?: DevIdentity) =>
    apiFetch<{ invocation: ToolInvocation | null }>(`/admin/tool-invocations/${id}`, { method: 'GET' }, identity),

  createToolNoteDraft: (invocationId: string, body: { ticketId?: string; title?: string }, identity?: DevIdentity) =>
    apiFetch<{ draft: ToolResultNoteDraft }>(`/admin/tool-invocations/${invocationId}/note-draft`, { method: 'POST', body: JSON.stringify(body) }, identity),

  listToolApprovals: (identity?: DevIdentity) =>
    apiFetch<{ approvals: ToolApproval[] }>('/admin/tool-approvals', { method: 'GET' }, identity),

  approveTool: (id: string, body: { reason?: string }, identity?: DevIdentity) =>
    apiFetch<{ approval: ToolApproval }>(`/admin/tool-approvals/${id}/approve`, { method: 'POST', body: JSON.stringify(body) }, identity),

  denyTool: (id: string, body: { reason?: string }, identity?: DevIdentity) =>
    apiFetch<{ approval: ToolApproval }>(`/admin/tool-approvals/${id}/deny`, { method: 'POST', body: JSON.stringify(body) }, identity),

  // All connector statuses
  getAllConnectorStatus: (identity?: DevIdentity) =>
    apiFetch<{ connectors: BrowserConnectorStatus[] }>('/connectors/status', { method: 'GET' }, identity).then(r => r.connectors),

  // Knowledge (BL-073/074)
  listKnowledgeSources: (identity?: DevIdentity) =>
    apiFetch<{ sources: KnowledgeSource[] }>('/knowledge/sources', { method: 'GET' }, identity).then(r => r.sources),

  listKnowledgeArticles: (params?: { sourceId?: string; status?: string }, identity?: DevIdentity) =>
    apiFetch<{ articles: KnowledgeArticle[] }>(`/knowledge/articles?${new URLSearchParams(params ?? {}).toString()}`, { method: 'GET' }, identity).then(r => r.articles),

  retrieveKnowledge: (body: { query: string; sourceIds?: string[]; limit?: number; mode?: 'auto' | 'lexical' | 'semantic' | 'hybrid' }, identity?: DevIdentity) =>
    apiFetch<KnowledgeRetrievalResponse>('/knowledge/retrieve', { method: 'POST', body: JSON.stringify(body) }, identity),
};

export { ApiClientError };
