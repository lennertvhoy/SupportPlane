import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';

export const EvidenceBundleId = EntityId.brand<'EvidenceBundleId'>();
export type EvidenceBundleId = z.infer<typeof EvidenceBundleId>;

export const EvidenceBundleFormat = z.enum(['json', 'markdown']);
export type EvidenceBundleFormat = z.infer<typeof EvidenceBundleFormat>;

export const EvidenceBundleSessionSummary = z.object({
  id: EntityId,
  tenantId: TenantId,
  status: z.string(),
  priority: z.string(),
  title: z.string(),
  description: z.string().optional(),
  assignedUserId: z.string().optional(),
  startedAt: Timestamp,
  endedAt: Timestamp.optional(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type EvidenceBundleSessionSummary = z.infer<typeof EvidenceBundleSessionSummary>;

export const EvidenceBundleTicketSummary = z.object({
  id: EntityId,
  externalTicketId: z.string(),
  subject: z.string(),
  status: z.string(),
  priority: z.string(),
  customerName: z.string().optional(),
  customerEmail: z.string().optional(),
  adapterId: z.string(),
  lastSyncedAt: Timestamp.optional(),
});
export type EvidenceBundleTicketSummary = z.infer<typeof EvidenceBundleTicketSummary>;

export const EvidenceBundleContextPacketSummary = z.object({
  id: EntityId,
  provenance: z.string(),
  sourceTicketIds: z.array(z.string()),
  sourceAdapterId: z.string().optional(),
  payloadSummary: z.record(JsonValue),
  redactionLog: z.array(
    z.object({
      field: z.string(),
      reason: z.string(),
      method: z.string(),
    })
  ),
  createdAt: Timestamp,
});
export type EvidenceBundleContextPacketSummary = z.infer<typeof EvidenceBundleContextPacketSummary>;

export const EvidenceBundleConnectorOperationSummary = z.object({
  operationType: z.string(),
  connectorType: z.string(),
  connectorMode: z.string(),
  externalTicketId: z.string().optional(),
  success: z.boolean().optional(),
  externalArticleId: z.string().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  occurredAt: Timestamp,
});
export type EvidenceBundleConnectorOperationSummary = z.infer<typeof EvidenceBundleConnectorOperationSummary>;

export const EvidenceBundleTelephonyBridgeSummary = z.object({
  operationType: z.string(),
  providerType: z.string(),
  adapterMode: z.string(),
  externalCallId: z.string().optional(),
  callEventId: z.string().optional(),
  controlIntent: z.string().optional(),
  verificationStatus: z.string().optional(),
  success: z.boolean().optional(),
  errorCode: z.string().optional(),
  errorMessage: z.string().optional(),
  mockDevOnly: z.boolean(),
  occurredAt: Timestamp,
});
export type EvidenceBundleTelephonyBridgeSummary = z.infer<
  typeof EvidenceBundleTelephonyBridgeSummary
>;

export const EvidenceBundleAiUsageSummary = z.object({
  provider: z.string(),
  model: z.string(),
  promptId: z.string().optional(),
  promptVersion: z.string().optional(),
  contextHash: z.string().optional(),
  mockOnly: z.boolean(),
  externalCallMade: z.boolean(),
  reviewRequired: z.boolean(),
  writebackAllowed: z.boolean(),
  generatedAt: Timestamp.optional(),
});
export type EvidenceBundleAiUsageSummary = z.infer<typeof EvidenceBundleAiUsageSummary>;

export const EvidenceBundleCallRecordingSummary = z.object({
  recordingId: z.string(),
  callEventId: z.string(),
  supportSessionId: z.string().optional(),
  durationSeconds: z.number().optional(),
  status: z.string(),
  source: z.string(),
  storageType: z.string(),
  reviewedAt: z.string().optional(),
  reviewedBy: z.string().optional(),
  mockDevOnly: z.boolean(),
  noRealAudio: z.boolean(),
  complianceDisclaimer: z.string().optional(),
});
export type EvidenceBundleCallRecordingSummary = z.infer<typeof EvidenceBundleCallRecordingSummary>;

export const EvidenceBundleScreenObservationSummary = z.object({
  observationId: z.string(),
  sessionId: z.string(),
  callEventId: z.string().optional(),
  source: z.string(),
  kind: z.string(),
  status: z.string(),
  description: z.string(),
  reviewedAt: z.string().optional(),
  reviewedBy: z.string().optional(),
  redactedSummary: z.string().optional(),
  mockDevOnly: z.boolean(),
  noRealScreenCapture: z.boolean(),
  noRawPixels: z.boolean(),
  noClipboardAccess: z.boolean(),
  complianceDisclaimer: z.string().optional(),
  sharingState: z.string().optional(),
  rawImageRetention: z.string().optional(),
  redactionStatus: z.string().optional(),
  safetyFlags: z.record(z.unknown()).optional(),
});
export type EvidenceBundleScreenObservationSummary = z.infer<typeof EvidenceBundleScreenObservationSummary>;

export const EvidenceBundleGreetingSuggestionSummary = z.object({
  greetingText: z.string(),
  tone: z.string(),
  provider: z.string(),
  model: z.string(),
  promptVersion: z.string().optional(),
  contextHash: z.string().optional(),
  mockOnly: z.boolean(),
  reviewRequired: z.boolean(),
  autoSend: z.boolean(),
  voiceEnabled: z.boolean(),
  generatedAt: Timestamp.optional(),
});
export type EvidenceBundleGreetingSuggestionSummary = z.infer<typeof EvidenceBundleGreetingSuggestionSummary>;

export const EvidenceBundleAuditSummary = z.object({
  id: EntityId,
  eventType: z.string(),
  actorType: z.string(),
  actorId: EntityId,
  action: z.string(),
  resourceType: z.string(),
  resourceId: EntityId,
  metadataSummary: z.record(JsonValue),
  integrityHash: z.string().optional(),
  createdAt: Timestamp,
});
export type EvidenceBundleAuditSummary = z.infer<typeof EvidenceBundleAuditSummary>;

export const EvidenceBundleCallEventSummary = z.object({
  callEventId: EntityId,
  provider: z.string(),
  source: z.string(),
  externalCallId: z.string(),
  direction: z.string(),
  status: z.string(),
  rawNumber: z.string(),
  normalizedNumber: z.string().optional(),
  displayName: z.string().optional(),
  matchStatus: z.string(),
  matchConfidence: z.number(),
  customerName: z.string().optional(),
  matchedTicketIds: z.array(z.string()),
  linkedSessionId: z.string().optional(),
  mockDevOnly: z.boolean(),
  startedAt: Timestamp,
});
export type EvidenceBundleCallEventSummary = z.infer<typeof EvidenceBundleCallEventSummary>;

export const EvidenceBundleSection = z.object({
  name: z.string(),
  label: z.string(),
  content: z.union([z.record(JsonValue), z.array(z.record(JsonValue)), z.string()]),
});
export type EvidenceBundleSection = z.infer<typeof EvidenceBundleSection>;

export const EvidenceBundle = z.object({
  bundleId: EvidenceBundleId,
  tenantId: TenantId,
  sessionId: EntityId,
  generatedAt: Timestamp,
  generatedBy: EntityId,
  exportFormat: EvidenceBundleFormat,
  version: z.literal('1.0.0-mvp'),
  sessionSummary: EvidenceBundleSessionSummary,
  linkedTickets: z.array(EvidenceBundleTicketSummary),
  contextPackets: z.array(EvidenceBundleContextPacketSummary),
  aiUsage: z.array(EvidenceBundleAiUsageSummary),
  connectorOperations: z.array(EvidenceBundleConnectorOperationSummary),
  telephonyBridgeEvents: z.array(EvidenceBundleTelephonyBridgeSummary).default([]),
  callEvents: z.array(EvidenceBundleCallEventSummary),
  greetingSuggestions: z.array(EvidenceBundleGreetingSuggestionSummary).default([]),
  callRecordings: z.array(EvidenceBundleCallRecordingSummary).default([]),
  screenObservations: z.array(EvidenceBundleScreenObservationSummary).default([]),
  auditTimeline: z.array(EvidenceBundleAuditSummary),
  mockDevOnlyDisclaimers: z.array(z.string()),
  limitations: z.array(z.string()),
  sourceProvenance: z.object({
    storeType: z.literal('in-memory'),
    persistenceClaimed: z.literal(false),
    generatedByService: z.string(),
    schemaVersion: z.string(),
  }),
});
export type EvidenceBundle = z.infer<typeof EvidenceBundle>;

export const EvidenceBundleExportRequest = z.object({
  format: EvidenceBundleFormat.default('json'),
});
export type EvidenceBundleExportRequest = z.infer<typeof EvidenceBundleExportRequest>;

export const EvidenceBundleExportResponse = z.object({
  bundle: EvidenceBundle,
  format: EvidenceBundleFormat,
  markdown: z.string().optional(),
});
export type EvidenceBundleExportResponse = z.infer<typeof EvidenceBundleExportResponse>;
