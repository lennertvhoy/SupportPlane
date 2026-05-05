import { randomUUID } from 'crypto';
import type {
  SupportSession,
  TicketReference,
  AIContextPacket,
  AuditEvent,
  CallEvent,
  EvidenceBundle,
  EvidenceBundleFormat,
  EvidenceBundleSessionSummary,
  EvidenceBundleTicketSummary,
  EvidenceBundleContextPacketSummary,
  EvidenceBundleConnectorOperationSummary,
  EvidenceBundleTelephonyBridgeSummary,
  EvidenceBundleAiUsageSummary,
  EvidenceBundleAuditSummary,
  EvidenceBundleCallEventSummary,
  EvidenceBundleGreetingSuggestionSummary,
  EvidenceBundleCallRecordingSummary,
  EvidenceBundleScreenObservationSummary,
  EvidenceBundleCustomerSummary,
  EvidenceBundleSupportNoteDraftSummary,
  EvidenceBundleActionOutboxSummary,
  EvidenceBundleDeliveryPolicySummary,
  EvidenceBundleCredentialReferenceSummary,
  TenantId,
  SupportSessionId,
  EvidenceBundleId,
  CallRecording,
  ScreenObservation,
  CustomerReference,
  InternalNoteDraft,
  SupportAction,
  ActionOutboxItem,
  ActionOutboxAttempt,
  DeliveryPolicy,
} from '@supportplane/contracts';
import { redactSecrets, redactString } from './redaction.js';

export interface BuildEvidenceBundleInput {
  tenantId: TenantId;
  sessionId: SupportSessionId;
  generatedBy: string;
  format: EvidenceBundleFormat;
  session: SupportSession;
  tickets: TicketReference[];
  contextPackets: AIContextPacket[];
  auditEvents: AuditEvent[];
  callEvents?: CallEvent[];
  callRecordings?: CallRecording[];
  screenObservations?: ScreenObservation[];
  customerReferences?: CustomerReference[];
  connectorInstallations?: import('@supportplane/contracts').ConnectorInstallation[];
  credentialReferences?: import('@supportplane/contracts').ConnectorCredentialReference[];
  supportNoteDrafts?: InternalNoteDraft[];
  supportActions?: SupportAction[];
  actionOutboxItems?: ActionOutboxItem[];
  actionOutboxAttempts?: ActionOutboxAttempt[];
  deliveryPolicies?: DeliveryPolicy[];
  connectorMode?: string;
  storeType?: 'memory' | 'postgres';
}

function toSessionSummary(session: SupportSession): EvidenceBundleSessionSummary {
  return {
    id: session.id,
    tenantId: session.tenantId,
    status: session.status,
    priority: session.priority,
    title: session.title,
    description: session.description,
    assignedUserId: session.assignedUserId,
    startedAt: session.startedAt,
    endedAt: session.endedAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  };
}

function toTicketSummaries(tickets: TicketReference[]): EvidenceBundleTicketSummary[] {
  return tickets.map((t) => ({
    id: t.id,
    externalTicketId: t.externalTicketId,
    subject: t.subject,
    status: t.status,
    priority: t.priority,
    customerId: t.customerId,
    customerName: t.customerName,
    customerEmail: t.customerEmail,
    adapterId: t.adapterId,
    lastSyncedAt: t.lastSyncedAt,
  }));
}

function toCustomerSummaries(
  customers: CustomerReference[] | undefined,
): EvidenceBundleCustomerSummary[] {
  if (!customers) return [];
  return customers.map((c) => ({
    id: c.id,
    externalCustomerId: c.externalCustomerId,
    name: c.name,
    email: c.email,
    phone: c.phone,
    company: c.company,
    adapterId: c.adapterId,
    lastSyncedAt: c.lastSyncedAt,
  }));
}

function toConnectorInstallationSummaries(
  installations: import('@supportplane/contracts').ConnectorInstallation[] | undefined,
  credentialRefs?: import('@supportplane/contracts').ConnectorCredentialReference[] | undefined,
): import('@supportplane/contracts').EvidenceBundleConnectorInstallationSummary[] {
  if (!installations) return [];
  const credMap = new Set((credentialRefs ?? []).map((c) => c.id as string));
  return installations.map((i) => {
    const linkedCredCount = (i.secretReferenceIds ?? []).filter((id) =>
      credMap.has(id as string),
    ).length;
    return {
      id: i.id,
      name: i.name,
      displayName: i.displayName,
      adapterType: i.adapterType,
      capabilities: i.capabilities,
      status: i.status,
      mockMode: i.mockMode,
      enabled: i.enabled,
      safetyFlags: redactSecrets((i.safetyFlags as Record<string, unknown>) ?? {}),
      timeoutMs: i.timeoutMs,
      lastVerifiedAt: i.lastVerifiedAt,
      lastError: i.lastError ? redactString(i.lastError) : undefined,
      realNetwork: false,
      writebackEnabled: false,
      externalWriteAttempted: false,
      credentialReferenceCount: linkedCredCount,
      runtimeReadinessSummary: i.mockMode ? 'mock-only — no real network or writeback' : 'unknown',
    };
  });
}

function toCredentialReferenceSummaries(
  refs: import('@supportplane/contracts').ConnectorCredentialReference[] | undefined,
  installations: import('@supportplane/contracts').ConnectorInstallation[] | undefined,
): EvidenceBundleCredentialReferenceSummary[] {
  if (!refs) return [];
  const linkedIds = new Set((installations ?? []).flatMap((i) => i.secretReferenceIds ?? []));
  return refs.map((r) => ({
    id: r.id,
    displayName: r.displayName,
    connectorType: r.connectorType,
    status: r.status,
    secretKind: r.secretKind,
    linked: linkedIds.has(r.id),
    lastValidatedAt: r.lastValidatedAt,
  }));
}

function toContextPacketSummaries(
  packets: AIContextPacket[],
): EvidenceBundleContextPacketSummary[] {
  return packets.map((p) => ({
    id: p.id,
    provenance: p.provenance,
    sourceTicketIds: p.sourceTicketIds,
    sourceAdapterId: p.sourceAdapterId,
    payloadSummary: redactSecrets(p.payload as Record<string, unknown>),
    redactionLog: p.redactionLog,
    createdAt: p.createdAt,
  }));
}

function toConnectorOperationSummaries(
  auditEvents: AuditEvent[],
): EvidenceBundleConnectorOperationSummary[] {
  return auditEvents
    .filter((e) =>
      [
        'zammad_ticket_loaded',
        'internal_note_drafted',
        'internal_note_writeback_attempted',
        'internal_note_writeback_succeeded',
        'internal_note_writeback_failed',
      ].includes(e.eventType),
    )
    .map((e) => ({
      operationType: e.eventType,
      connectorType: (e.metadata.connectorType as string) ?? 'unknown',
      connectorMode: (e.metadata.connectorMode as string) ?? 'unknown',
      externalTicketId: (e.metadata.externalTicketId as string) ?? undefined,
      success:
        e.eventType === 'internal_note_writeback_succeeded'
          ? true
          : e.eventType === 'internal_note_writeback_failed'
            ? false
            : undefined,
      externalArticleId: (e.metadata.externalArticleId as string) ?? undefined,
      errorCode: (e.metadata.errorCode as string) ?? undefined,
      errorMessage: (e.metadata.errorMessage as string) ?? undefined,
      occurredAt: e.createdAt,
    }));
}

function toTelephonyBridgeSummaries(
  auditEvents: AuditEvent[],
): EvidenceBundleTelephonyBridgeSummary[] {
  return auditEvents
    .filter((e) =>
      [
        'telephony_adapter_tested',
        'telephony_webhook_received',
        'telephony_webhook_verified',
        'telephony_call_control_requested',
        'telephony_call_control_succeeded',
        'telephony_call_control_failed',
      ].includes(e.eventType),
    )
    .map((e) => ({
      operationType: e.eventType,
      providerType: (e.metadata.providerType as string) ?? 'unknown',
      adapterMode: (e.metadata.adapterMode as string) ?? 'unknown',
      externalCallId: (e.metadata.externalCallId as string) ?? undefined,
      callEventId: (e.metadata.callEventId as string) ?? undefined,
      controlIntent: (e.metadata.controlIntent as string) ?? undefined,
      verificationStatus: (e.metadata.verificationStatus as string) ?? undefined,
      success: (e.metadata.success as boolean) ?? undefined,
      errorCode:
        ((e.metadata.error as Record<string, unknown> | undefined)?.code as string) ?? undefined,
      errorMessage:
        ((e.metadata.error as Record<string, unknown> | undefined)?.message as string) ?? undefined,
      mockDevOnly: (e.metadata.mockDevOnly as boolean) ?? true,
      occurredAt: e.createdAt,
    }));
}

function toAiUsageSummaries(auditEvents: AuditEvent[]): EvidenceBundleAiUsageSummary[] {
  return auditEvents
    .filter((e) => e.eventType === 'ai_draft_generated')
    .map((e) => ({
      provider: (e.metadata.provider as string) ?? 'unknown',
      model: (e.metadata.model as string) ?? 'unknown',
      promptId: (e.metadata.promptId as string) ?? undefined,
      promptVersion: (e.metadata.promptVersion as string) ?? undefined,
      contextHash: (e.metadata.contextHash as string) ?? undefined,
      mockOnly: (e.metadata.mockOnly as boolean) ?? true,
      externalCallMade: false,
      cloudCallMade: (e.metadata.cloudCallMade as boolean) ?? false,
      providerMode: (e.metadata.providerMode as string) ?? undefined,
      fallbackUsed: (e.metadata.fallbackUsed as boolean) ?? undefined,
      noCloudCall: (e.metadata.noCloudCall as boolean) ?? true,
      latencyMs: (e.metadata.latencyMs as number) ?? undefined,
      reviewRequired: true,
      writebackAllowed: (e.metadata.writebackAllowed as boolean) ?? false,
      generatedAt: e.createdAt,
    }));
}

function toCallRecordingSummaries(
  recordings: CallRecording[] | undefined,
): EvidenceBundleCallRecordingSummary[] {
  if (!recordings) return [];
  return recordings.map((r) => ({
    recordingId: r.id,
    callEventId: r.callEventId,
    supportSessionId: r.supportSessionId,
    durationSeconds: r.durationSeconds,
    status: r.status,
    source: r.source,
    storageType: r.storageType,
    reviewedAt: r.reviewedAt,
    reviewedBy: r.reviewedBy,
    mockDevOnly: r.mockDevOnly,
    noRealAudio: r.noRealAudio,
    complianceDisclaimer: r.complianceDisclaimer,
    // Intentionally excluded: mockMediaUrl, checksumHash, placeholderReference
  }));
}

function toScreenObservationSummaries(
  observations: ScreenObservation[] | undefined,
): EvidenceBundleScreenObservationSummary[] {
  if (!observations) return [];
  return observations.map((o) => {
    const parts: string[] = [];
    if (o.appLabel) parts.push(`App: ${o.appLabel}`);
    if (o.windowLabel) parts.push(`Window: ${o.windowLabel}`);
    if (o.urlLabel) parts.push(`URL: ${o.urlLabel}`);
    if (o.rawInputPlaceholder)
      parts.push(`Note: ${redactString(o.rawInputPlaceholder).substring(0, 200)}`);
    const description = parts.join(' | ') || `[${o.kind}]`;
    return {
      observationId: o.id,
      sessionId: o.sessionId,
      callEventId: o.callEventId,
      source: o.source,
      kind: o.kind,
      status: o.status,
      description,
      reviewedAt: o.reviewedAt,
      reviewedBy: o.reviewedBy,
      redactedSummary: o.redactedSummary,
      mockDevOnly: o.mockDevOnly,
      noRealScreenCapture: o.noRawPixels,
      noRawPixels: o.noRawPixels,
      noClipboardAccess: o.noClipboard,
      complianceDisclaimer:
        'Mock screen observation only. No real screen capture, raw pixels, clipboard access, or OCR was performed.',
      sharingState: o.sharingState,
      rawImageRetention: o.rawImageRetention,
      redactionStatus: o.redactionStatus,
      safetyFlags: o.safetyFlags as Record<string, unknown> | undefined,
    };
  });
}

function toSupportNoteDraftSummaries(
  drafts: InternalNoteDraft[] | undefined,
): EvidenceBundleSupportNoteDraftSummary[] {
  if (!drafts) return [];
  return drafts.map((d) => ({
    draftId: d.id,
    externalTicketId: d.externalTicketId,
    subject: d.subject,
    bodyPreview: d.body.substring(0, 200),
    reviewed: d.reviewed,
    mockDevOnly: true,
    notSentToZammad: true,
    requiresHumanReview: true,
    generatedAt: d.createdAt,
  }));
}

function toDeliveryPolicySummaries(
  policies: DeliveryPolicy[] | undefined,
): EvidenceBundleDeliveryPolicySummary[] {
  if (!policies) return [];
  return policies.map((p) => ({
    policyId: p.id,
    policyVersion: p.policyVersion,
    name: p.name,
    enabled: p.enabled,
    killSwitch: p.killSwitch,
    mockOnlyEnforced: p.mockOnlyEnforced,
    allowRealNetworkCalls: p.allowRealNetworkCalls,
    allowedActionTypes: p.allowedActionTypes,
    approvalRequired: p.approvalRequired,
    minimumApproverRole: p.minimumApproverRole,
    requireHumanReview: p.requireHumanReview,
    requireEvidenceBundleBeforeDelivery: p.requireEvidenceBundleBeforeDelivery,
    requireConnectorValidationBeforeDelivery: p.requireConnectorValidationBeforeDelivery,
    safetyFlags: p.safetyFlags as Record<string, unknown>,
    updatedAt: p.updatedAt,
  }));
}

function toActionOutboxSummaries(
  actions: SupportAction[] | undefined,
  outboxItems: ActionOutboxItem[] | undefined,
  attempts: ActionOutboxAttempt[] | undefined,
): EvidenceBundleActionOutboxSummary[] {
  if (!actions) return [];
  return actions.map((action) => {
    const item = outboxItems?.find((candidate) => candidate.supportActionId === action.id);
    return {
      actionId: action.id,
      outboxItemId: item?.id,
      actionType: action.actionType,
      status: action.status,
      idempotencyKey: action.idempotencyKey,
      reviewDecision: action.reviewDecision,
      reviewedBy: action.reviewedBy,
      queuedAt: action.queuedAt ?? item?.queuedAt,
      mockDeliveredAt: action.mockDeliveredAt ?? item?.mockDeliveredAt,
      failedAt: item?.failedAt,
      retryScheduledAt: item?.retryScheduledAt,
      nextAttemptAt: item?.nextAttemptAt,
      deadLetteredAt: item?.deadLetteredAt,
      cancelledAt: item?.cancelledAt,
      attemptCount: item?.attemptCount ?? 0,
      maxAttempts: item?.maxAttempts,
      latestAttemptState: item?.latestAttemptState,
      deliveryMode: item?.deliveryMode,
      workerLockId: item?.workerLockId,
      lastErrorCode: item?.lastErrorCode,
      lastErrorMessage: item?.lastErrorMessage,
      lastErrorRedacted: item?.lastErrorRedacted,
      deadLetterReason: item?.deadLetterReason,
      attempts: item
        ? (attempts ?? [])
            .filter((attempt) => attempt.outboxItemId === item.id)
            .map((attempt) => ({
              attemptNumber: attempt.attemptNumber,
              state: attempt.state,
              errorCode: attempt.errorCode,
              errorMessage: attempt.errorMessage ? redactString(attempt.errorMessage) : undefined,
              errorRedacted: attempt.errorRedacted,
              attemptedAt: attempt.attemptedAt,
              completedAt: attempt.completedAt,
              deliveryResult: redactSecrets(attempt.deliveryResult as Record<string, unknown>),
              realNetwork: false as const,
              externalWriteAttempted: false as const,
              writebackEnabled: false as const,
            }))
        : [],
      payloadSummary: redactSecrets(action.payloadSummary as Record<string, unknown>),
      deliveryIntent: item
        ? redactSecrets(item.deliveryIntent as Record<string, unknown>)
        : undefined,
      safetyFlags: {
        ...(item ? redactSecrets(item.safetyFlags as Record<string, unknown>) : {}),
        noSecrets: true,
        noRawMedia: true,
        localMockOnly: true,
      },
      mockDevOnly: true,
      realNetwork: false,
      externalWriteAttempted: false,
      writebackEnabled: false,
    };
  });
}

function toGreetingSuggestionSummaries(
  auditEvents: AuditEvent[],
): EvidenceBundleGreetingSuggestionSummary[] {
  return auditEvents
    .filter((e) => e.eventType === 'greeting_suggestion_generated')
    .map((e) => ({
      greetingText: (e.metadata.greetingText as string) ?? '[not captured in audit]',
      tone: (e.metadata.tone as string) ?? 'professional',
      provider: (e.metadata.provider as string) ?? 'unknown',
      model: (e.metadata.model as string) ?? 'unknown',
      promptVersion: (e.metadata.promptVersion as string) ?? undefined,
      contextHash: (e.metadata.contextHash as string) ?? undefined,
      mockOnly: (e.metadata.mockOnly as boolean) ?? true,
      reviewRequired: true,
      autoSend: false,
      voiceEnabled: false,
      generatedAt: e.createdAt,
    }));
}

function toAuditSummaries(auditEvents: AuditEvent[]): EvidenceBundleAuditSummary[] {
  return auditEvents.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    actorType: e.actorType,
    actorId: e.actorId,
    action: e.action,
    resourceType: e.resourceType,
    resourceId: e.resourceId,
    metadataSummary: redactSecrets(e.metadata as Record<string, unknown>),
    integrityHash: e.integrityHash,
    createdAt: e.createdAt,
  }));
}

function toCallEventSummaries(
  callEvents: CallEvent[] | undefined,
): EvidenceBundleCallEventSummary[] {
  if (!callEvents) return [];
  return callEvents.map((c) => ({
    callEventId: c.id,
    provider: c.provider,
    source: c.source,
    externalCallId: c.externalCallId,
    direction: c.direction,
    status: c.status,
    rawNumber: c.caller.rawNumber,
    normalizedNumber: c.caller.normalizedNumber,
    displayName: c.caller.displayName,
    matchStatus: c.callerMatch?.status ?? 'unknown',
    matchConfidence: c.callerMatch?.confidence ?? 0,
    customerName: c.callerMatch?.customerName,
    matchedTicketIds: c.callerMatch?.matchedTicketIds ?? [],
    linkedSessionId: c.sessionId,
    mockDevOnly: c.mockDevOnly,
    startedAt: c.startedAt,
  }));
}

export function buildEvidenceBundle(input: BuildEvidenceBundleInput): EvidenceBundle {
  const now = new Date().toISOString();
  const postgresStore = input.storeType === 'postgres';

  const bundle: EvidenceBundle = {
    bundleId: randomUUID() as EvidenceBundleId,
    tenantId: input.tenantId,
    sessionId: input.sessionId,
    generatedAt: now,
    generatedBy: input.generatedBy,
    exportFormat: input.format,
    version: '1.0.0-mvp',
    sessionSummary: toSessionSummary(input.session),
    linkedTickets: toTicketSummaries(input.tickets),
    contextPackets: toContextPacketSummaries(input.contextPackets),
    aiUsage: toAiUsageSummaries(input.auditEvents),
    connectorOperations: toConnectorOperationSummaries(input.auditEvents),
    telephonyBridgeEvents: toTelephonyBridgeSummaries(input.auditEvents),
    callEvents: toCallEventSummaries(input.callEvents),
    callRecordings: toCallRecordingSummaries(input.callRecordings),
    screenObservations: toScreenObservationSummaries(input.screenObservations),
    customerReferences: toCustomerSummaries(input.customerReferences),
    connectorInstallations: toConnectorInstallationSummaries(
      input.connectorInstallations,
      input.credentialReferences,
    ),
    credentialReferences: toCredentialReferenceSummaries(
      input.credentialReferences,
      input.connectorInstallations,
    ),
    supportNoteDrafts: toSupportNoteDraftSummaries(input.supportNoteDrafts),
    actionOutbox: toActionOutboxSummaries(
      input.supportActions,
      input.actionOutboxItems,
      input.actionOutboxAttempts,
    ),
    deliveryPolicies: toDeliveryPolicySummaries(input.deliveryPolicies),
    greetingSuggestions: toGreetingSuggestionSummaries(input.auditEvents),
    auditTimeline: toAuditSummaries(input.auditEvents),
    mockDevOnlyDisclaimers: [
      postgresStore
        ? 'This evidence bundle was generated from the local PostgreSQL development store.'
        : 'This evidence bundle was generated from an in-memory mock development store.',
      postgresStore
        ? 'Local PostgreSQL persistence is enabled for workflow state; no external ticketing writeback or AI provider was used.'
        : 'No real database persistence, external ticketing system, or AI provider was used.',
      postgresStore
        ? 'Local workflow state can survive API restart, but this is not production audit-grade evidence.'
        : 'Data is lost on API restart. This is not production audit-grade evidence.',
      'Connector mode is mock unless explicitly configured otherwise.',
      'Call events are simulated via fake webhook. No real telephony is connected.',
      'Telephony bridge events are adapter-boundary mock events only. No real PBX, provider, media, or voice path is connected.',
      'Call recordings are mock metadata only. No real audio was captured, stored, or played back. Not compliance-grade.',
      'Screen observations are mock metadata only. No real screen capture, raw pixels, clipboard access, or OCR was performed. Not surveillance or compliance-grade.',
      'Caller matching uses deterministic mock fixtures, not a real customer database.',
      'Support sessions may be auto-created from fake incoming calls. These are mock sessions for development only.',
      'Action outbox deliveries are local mock records processed by the local outbox worker/process-once path only. No real external writeback, email, telephony, AI, external broker, or object storage is used.',
      'Delivery policies are tenant-scoped mock-only safety gates. Real writeback remains impossible regardless of policy settings.',
    ],
    limitations: [
      'No cryptographic hash chain integrity guarantee.',
      'No tamper-evident storage or object storage persistence.',
      'No real authentication; actor identity is from mock dev headers.',
      'No GDPR or legal compliance claims are made for this export format.',
      'Secrets and tokens have been redacted using pattern matching, not guaranteed zero-knowledge.',
      'Phone normalization is Belgian-style heuristic only, not telecom-grade validation.',
      'Auto-created sessions are generated from mock call events and do not represent real customer interactions.',
      'Telephony bridge controls update local mock state only and are not compliance-grade telephony evidence.',
      'Mock call recordings have no real audio content and do not constitute legal or compliance-grade call recording evidence.',
      'Mock screen observations have no real desktop, browser, or application content and do not constitute surveillance, monitoring, or compliance-grade evidence.',
      'Action outbox records are durable local workflow state, not a production queue or compliance-grade immutable audit ledger.',
      'Delivery policy controls enforce mock-only safety but do not implement real writeback readiness; real writeback requires future connector credential management, network path validation, and tenant admin configuration.',
    ],
    sourceProvenance: {
      storeType: input.storeType ?? 'memory',
      persistenceClaimed: input.storeType === 'postgres',
      generatedByService: 'supportplane-api-evidence-bundle-builder',
      schemaVersion: '1.0.0-mvp',
    },
  };

  return bundle;
}

export function bundleToMarkdown(bundle: EvidenceBundle): string {
  const lines: string[] = [];

  lines.push(`# SupportPlane Evidence Bundle`);
  lines.push(``);
  lines.push(`> **Bundle ID:** ${bundle.bundleId}`);
  lines.push(`> **Tenant:** ${bundle.tenantId}`);
  lines.push(`> **Session:** ${bundle.sessionId}`);
  lines.push(`> **Generated:** ${bundle.generatedAt}`);
  lines.push(`> **Generated By:** ${bundle.generatedBy}`);
  lines.push(`> **Format:** ${bundle.exportFormat}`);
  lines.push(`> **Version:** ${bundle.version}`);
  lines.push(``);

  lines.push(`---`);
  lines.push(``);
  lines.push(`## Session Summary`);
  lines.push(``);
  lines.push(`- **Title:** ${bundle.sessionSummary.title}`);
  lines.push(`- **Status:** ${bundle.sessionSummary.status}`);
  lines.push(`- **Priority:** ${bundle.sessionSummary.priority}`);
  if (bundle.sessionSummary.description) {
    lines.push(`- **Description:** ${bundle.sessionSummary.description}`);
  }
  if (bundle.sessionSummary.assignedUserId) {
    lines.push(`- **Assigned User:** ${bundle.sessionSummary.assignedUserId}`);
  }
  lines.push(`- **Started:** ${bundle.sessionSummary.startedAt}`);
  lines.push(`- **Updated:** ${bundle.sessionSummary.updatedAt}`);
  lines.push(``);

  lines.push(`## Linked Tickets`);
  lines.push(``);
  if (bundle.linkedTickets.length === 0) {
    lines.push(`*No linked tickets.*`);
  } else {
    for (const t of bundle.linkedTickets) {
      lines.push(`### ${t.externalTicketId}`);
      lines.push(`- **Subject:** ${t.subject}`);
      lines.push(`- **Status:** ${t.status}`);
      lines.push(`- **Priority:** ${t.priority}`);
      if (t.customerName) lines.push(`- **Customer:** ${t.customerName}`);
      if (t.customerEmail) lines.push(`- **Email:** ${t.customerEmail}`);
      lines.push(`- **Adapter:** ${t.adapterId}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## AI Context Packets`);
  lines.push(``);
  if (bundle.contextPackets.length === 0) {
    lines.push(`*No context packets.*`);
  } else {
    for (const p of bundle.contextPackets) {
      lines.push(`### ${p.provenance} (${p.id})`);
      lines.push(`- **Source Tickets:** ${p.sourceTicketIds.join(', ') || 'none'}`);
      if (p.sourceAdapterId) lines.push(`- **Adapter:** ${p.sourceAdapterId}`);
      lines.push(`- **Created:** ${p.createdAt}`);
      lines.push(`- **Payload Summary:**`);
      lines.push(`\`\`\`json`);
      lines.push(JSON.stringify(p.payloadSummary, null, 2));
      lines.push(`\`\`\``);
      if (p.redactionLog.length > 0) {
        lines.push(`- **Redactions:**`);
        for (const r of p.redactionLog) {
          lines.push(`  - \`${r.field}\` — ${r.reason} (${r.method})`);
        }
      }
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## AI Usage`);
  lines.push(``);
  if (bundle.aiUsage.length === 0) {
    lines.push(`*No AI usage recorded.*`);
  } else {
    for (const u of bundle.aiUsage) {
      lines.push(`- **Provider:** ${u.provider}`);
      lines.push(`- **Model:** ${u.model}`);
      if (u.promptVersion) lines.push(`- **Prompt Version:** ${u.promptVersion}`);
      if (u.contextHash) lines.push(`- **Context Hash:** ${u.contextHash}`);
      lines.push(`- **Mock Only:** ${u.mockOnly}`);
      lines.push(`- **Review Required:** ${u.reviewRequired}`);
      lines.push(`- **Writeback Allowed:** ${u.writebackAllowed}`);
      if (u.generatedAt) lines.push(`- **Generated At:** ${u.generatedAt}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Connector Operations`);
  lines.push(``);
  if (bundle.connectorOperations.length === 0) {
    lines.push(`*No connector operations recorded.*`);
  } else {
    for (const op of bundle.connectorOperations) {
      lines.push(`- **${op.operationType}** (${op.connectorType} / ${op.connectorMode})`);
      if (op.externalTicketId) lines.push(`  - Ticket: ${op.externalTicketId}`);
      if (op.success !== undefined) lines.push(`  - Success: ${op.success}`);
      if (op.externalArticleId) lines.push(`  - Article ID: ${op.externalArticleId}`);
      if (op.errorCode) lines.push(`  - Error: ${op.errorCode} — ${op.errorMessage ?? ''}`);
      lines.push(`  - At: ${op.occurredAt}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Call Events`);
  lines.push(``);
  if (bundle.callEvents.length === 0) {
    lines.push(`*No call events recorded.*`);
  } else {
    for (const c of bundle.callEvents) {
      lines.push(`### ${c.externalCallId} (${c.callEventId})`);
      lines.push(`- **Provider:** ${c.provider}`);
      lines.push(`- **Direction:** ${c.direction}`);
      lines.push(`- **Status:** ${c.status}`);
      lines.push(`- **Raw Number:** ${c.rawNumber}`);
      if (c.normalizedNumber) lines.push(`- **Normalized Number:** ${c.normalizedNumber}`);
      if (c.displayName) lines.push(`- **Display Name:** ${c.displayName}`);
      lines.push(`- **Match Status:** ${c.matchStatus} (confidence: ${c.matchConfidence})`);
      if (c.customerName) lines.push(`- **Matched Customer:** ${c.customerName}`);
      if (c.matchedTicketIds.length > 0)
        lines.push(`- **Matched Tickets:** ${c.matchedTicketIds.join(', ')}`);
      if (c.linkedSessionId) lines.push(`- **Linked Session:** ${c.linkedSessionId}`);
      lines.push(`- **Mock/Dev-Only:** ${c.mockDevOnly}`);
      lines.push(`- **Started:** ${c.startedAt}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Telephony Bridge Events`);
  lines.push(``);
  if (bundle.telephonyBridgeEvents.length === 0) {
    lines.push(`*No telephony bridge events recorded.*`);
  } else {
    for (const event of bundle.telephonyBridgeEvents) {
      lines.push(`- **${event.operationType}** (${event.providerType} / ${event.adapterMode})`);
      if (event.externalCallId) lines.push(`  - External Call ID: ${event.externalCallId}`);
      if (event.callEventId) lines.push(`  - Call Event ID: ${event.callEventId}`);
      if (event.controlIntent) lines.push(`  - Control Intent: ${event.controlIntent}`);
      if (event.verificationStatus) lines.push(`  - Verification: ${event.verificationStatus}`);
      if (event.success !== undefined) lines.push(`  - Success: ${event.success}`);
      if (event.errorCode)
        lines.push(`  - Error: ${event.errorCode} — ${event.errorMessage ?? ''}`);
      lines.push(`  - Mock/Dev-Only: ${event.mockDevOnly}`);
      lines.push(`  - At: ${event.occurredAt}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Screen Observations`);
  lines.push(``);
  if (bundle.screenObservations.length === 0) {
    lines.push(`*No screen observations recorded.*`);
  } else {
    for (const o of bundle.screenObservations) {
      lines.push(`### ${o.observationId} (${o.kind})`);
      lines.push(`- **Source:** ${o.source}`);
      lines.push(`- **Status:** ${o.status}`);
      lines.push(`- **Description:** ${o.description}`);
      if (o.reviewedAt)
        lines.push(`- **Reviewed At:** ${o.reviewedAt} by ${o.reviewedBy ?? 'unknown'}`);
      if (o.redactedSummary) lines.push(`- **Redacted Summary:** ${o.redactedSummary}`);
      lines.push(`- **Mock/Dev-Only:** ${o.mockDevOnly}`);
      lines.push(`- **No Real Screen Capture:** ${o.noRealScreenCapture}`);
      lines.push(`- **No Raw Pixels:** ${o.noRawPixels}`);
      lines.push(`- **No Clipboard Access:** ${o.noClipboardAccess}`);
      if (o.complianceDisclaimer) lines.push(`- **Disclaimer:** ${o.complianceDisclaimer}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Support Note Drafts`);
  lines.push(``);
  if (bundle.supportNoteDrafts.length === 0) {
    lines.push(`*No support note drafts recorded.*`);
  } else {
    for (const d of bundle.supportNoteDrafts) {
      lines.push(`### ${d.draftId}`);
      lines.push(`- **Ticket:** ${d.externalTicketId}`);
      if (d.subject) lines.push(`- **Subject:** ${d.subject}`);
      lines.push(`- **Preview:** ${d.bodyPreview}`);
      lines.push(`- **Reviewed:** ${d.reviewed}`);
      lines.push(`- **Mock Only:** ${d.mockDevOnly}`);
      lines.push(`- **Not Sent to Zammad:** ${d.notSentToZammad}`);
      lines.push(`- **Requires Human Review:** ${d.requiresHumanReview}`);
      if (d.generatedAt) lines.push(`- **Generated At:** ${d.generatedAt}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Connector Installations`);
  lines.push(``);
  if (bundle.connectorInstallations.length === 0) {
    lines.push(`*No connector installations recorded.*`);
  } else {
    for (const inst of bundle.connectorInstallations) {
      lines.push(`### ${inst.displayName ?? inst.name} (${inst.id})`);
      lines.push(`- **Adapter Type:** ${inst.adapterType}`);
      lines.push(`- **Status:** ${inst.status}`);
      lines.push(`- **Enabled:** ${inst.enabled}`);
      lines.push(`- **Mock Mode:** ${inst.mockMode}`);
      lines.push(`- **Capabilities:** ${inst.capabilities.join(', ')}`);
      if (inst.timeoutMs) lines.push(`- **Timeout:** ${inst.timeoutMs}ms`);
      if (inst.lastVerifiedAt) lines.push(`- **Last Verified:** ${inst.lastVerifiedAt}`);
      if (inst.lastError) lines.push(`- **Last Error:** ${inst.lastError}`);
      lines.push(`- **Real Network:** ${inst.realNetwork ?? false}`);
      lines.push(`- **Writeback Enabled:** ${inst.writebackEnabled ?? false}`);
      lines.push(`- **External Write Attempted:** ${inst.externalWriteAttempted ?? false}`);
      lines.push(`- **Linked Credentials:** ${inst.credentialReferenceCount ?? 0}`);
      if (inst.runtimeReadinessSummary)
        lines.push(`- **Runtime Readiness:** ${inst.runtimeReadinessSummary}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Credential References`);
  lines.push(``);
  if (bundle.credentialReferences.length === 0) {
    lines.push(`*No credential references recorded.*`);
  } else {
    for (const cred of bundle.credentialReferences) {
      lines.push(`### ${cred.displayName} (${cred.id})`);
      lines.push(`- **Connector Type:** ${cred.connectorType}`);
      lines.push(`- **Status:** ${cred.status}`);
      lines.push(`- **Secret Kind:** ${cred.secretKind}`);
      lines.push(`- **Linked:** ${cred.linked ? 'Yes' : 'No'}`);
      if (cred.lastValidatedAt) lines.push(`- **Last Validated:** ${cred.lastValidatedAt}`);
      lines.push(`- **Secret Value:** [REDACTED — never included in evidence bundles]`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Delivery Policies`);
  lines.push(``);
  if (bundle.deliveryPolicies.length === 0) {
    lines.push(`*No delivery policies recorded.*`);
  } else {
    for (const p of bundle.deliveryPolicies) {
      lines.push(`### ${p.name} (v${p.policyVersion})`);
      lines.push(`- **Policy ID:** ${p.policyId}`);
      lines.push(`- **Enabled:** ${p.enabled}`);
      lines.push(`- **Kill Switch:** ${p.killSwitch}`);
      lines.push(`- **Mock Only:** ${p.mockOnlyEnforced}`);
      lines.push(`- **Real Network Calls:** ${p.allowRealNetworkCalls}`);
      lines.push(`- **Allowed Actions:** ${p.allowedActionTypes.join(', ')}`);
      lines.push(`- **Approval Required:** ${p.approvalRequired}`);
      lines.push(`- **Min Approver Role:** ${p.minimumApproverRole}`);
      lines.push(`- **Require Human Review:** ${p.requireHumanReview}`);
      lines.push(`- **Require Evidence Bundle:** ${p.requireEvidenceBundleBeforeDelivery}`);
      lines.push(
        `- **Require Connector Validation:** ${p.requireConnectorValidationBeforeDelivery}`,
      );
      lines.push(`- **Updated At:** ${p.updatedAt ?? 'never'}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Action Outbox`);
  lines.push(``);
  if (bundle.actionOutbox.length === 0) {
    lines.push(`*No action/outbox records.*`);
  } else {
    for (const action of bundle.actionOutbox) {
      lines.push(`### ${action.actionId}`);
      lines.push(`- **Type:** ${action.actionType}`);
      lines.push(`- **Status:** ${action.status}`);
      if (action.outboxItemId) lines.push(`- **Outbox Item:** ${action.outboxItemId}`);
      lines.push(`- **Attempts:** ${action.attemptCount}/${action.maxAttempts ?? 'unknown'}`);
      if (action.latestAttemptState)
        lines.push(`- **Latest Attempt:** ${action.latestAttemptState}`);
      if (action.nextAttemptAt) lines.push(`- **Next Attempt At:** ${action.nextAttemptAt}`);
      if (action.deadLetteredAt) lines.push(`- **Dead-Lettered At:** ${action.deadLetteredAt}`);
      if (action.deadLetterReason)
        lines.push(`- **Dead-Letter Reason:** ${action.deadLetterReason}`);
      if (action.lastErrorCode) lines.push(`- **Last Error Code:** ${action.lastErrorCode}`);
      if (action.lastErrorMessage)
        lines.push(`- **Last Error Message:** ${action.lastErrorMessage}`);
      for (const attempt of action.attempts) {
        lines.push(
          `  - Attempt #${attempt.attemptNumber}: ${attempt.state}, code ${attempt.errorCode ?? 'none'}, realNetwork ${attempt.realNetwork}, writebackEnabled ${attempt.writebackEnabled}`,
        );
      }
      lines.push(`- **Real Network:** ${action.realNetwork}`);
      lines.push(`- **External Write Attempted:** ${action.externalWriteAttempted}`);
      lines.push(`- **Writeback Enabled:** ${action.writebackEnabled}`);
      lines.push(`- **Mock/Dev-Only:** ${action.mockDevOnly}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Greeting Suggestions`);
  lines.push(``);
  if (bundle.greetingSuggestions.length === 0) {
    lines.push(`*No greeting suggestions recorded.*`);
  } else {
    for (const g of bundle.greetingSuggestions) {
      lines.push(`- **Tone:** ${g.tone}`);
      lines.push(`- **Greeting:** ${g.greetingText}`);
      lines.push(`- **Provider:** ${g.provider}`);
      lines.push(`- **Model:** ${g.model}`);
      if (g.promptVersion) lines.push(`- **Prompt Version:** ${g.promptVersion}`);
      if (g.contextHash) lines.push(`- **Context Hash:** ${g.contextHash}`);
      lines.push(`- **Mock Only:** ${g.mockOnly}`);
      lines.push(`- **Review Required:** ${g.reviewRequired}`);
      lines.push(`- **Auto Send:** ${g.autoSend}`);
      lines.push(`- **Voice Enabled:** ${g.voiceEnabled}`);
      if (g.generatedAt) lines.push(`- **Generated At:** ${g.generatedAt}`);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Audit Timeline`);
  lines.push(``);
  if (bundle.auditTimeline.length === 0) {
    lines.push(`*No audit events.*`);
  } else {
    for (const e of bundle.auditTimeline) {
      lines.push(`### ${e.eventType} — ${e.createdAt}`);
      lines.push(`- **Actor:** ${e.actorType} / ${e.actorId}`);
      lines.push(`- **Action:** ${e.action}`);
      lines.push(`- **Resource:** ${e.resourceType} / ${e.resourceId}`);
      if (e.integrityHash) lines.push(`- **Integrity Hash:** ${e.integrityHash}`);
      lines.push(`- **Metadata:**`);
      lines.push(`\`\`\`json`);
      lines.push(JSON.stringify(e.metadataSummary, null, 2));
      lines.push(`\`\`\``);
      lines.push(``);
    }
  }
  lines.push(``);

  lines.push(`## Mock / Dev-Only Disclaimers`);
  lines.push(``);
  for (const d of bundle.mockDevOnlyDisclaimers) {
    lines.push(`> ${d}`);
  }
  lines.push(``);

  lines.push(`## Limitations`);
  lines.push(``);
  for (const l of bundle.limitations) {
    lines.push(`- ${l}`);
  }
  lines.push(``);

  lines.push(`## Source Provenance`);
  lines.push(``);
  lines.push(`- **Store Type:** ${bundle.sourceProvenance.storeType}`);
  lines.push(`- **Persistence Claimed:** ${bundle.sourceProvenance.persistenceClaimed}`);
  lines.push(`- **Generated By:** ${bundle.sourceProvenance.generatedByService}`);
  lines.push(`- **Schema Version:** ${bundle.sourceProvenance.schemaVersion}`);
  lines.push(``);

  lines.push(`---`);
  lines.push(`*End of evidence bundle.*`);
  lines.push(``);

  return redactString(lines.join('\n'));
}
