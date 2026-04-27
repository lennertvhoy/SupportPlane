import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';

export const ScreenObservationId = EntityId.brand<'ScreenObservationId'>();
export type ScreenObservationId = z.infer<typeof ScreenObservationId>;

export const ScreenObservationSessionId = EntityId.brand<'ScreenObservationSessionId'>();
export type ScreenObservationSessionId = z.infer<typeof ScreenObservationSessionId>;

export const ScreenObservationSource = z.enum([
  'mock_operator_companion',
]);
export type ScreenObservationSource = z.infer<typeof ScreenObservationSource>;

export const ScreenObservationKind = z.enum([
  'active_window',
  'application',
  'url',
  'manual_note',
  'redacted_context',
]);
export type ScreenObservationKind = z.infer<typeof ScreenObservationKind>;

export const ScreenObservationStatus = z.enum([
  'captured',
  'review_required',
  'approved',
  'discarded',
  'redacted',
]);
export type ScreenObservationStatus = z.infer<typeof ScreenObservationStatus>;

export const ScreenObservation = z.object({
  id: ScreenObservationId,
  tenantId: TenantId,
  sessionId: EntityId,
  callEventId: EntityId.optional(),
  observationSessionId: ScreenObservationSessionId.optional(),
  source: ScreenObservationSource,
  kind: ScreenObservationKind,
  status: ScreenObservationStatus,
  rawInputPlaceholder: z.string().max(4096).optional(),
  redactedSummary: z.string().max(4096).optional(),
  appLabel: z.string().max(512).optional(),
  windowLabel: z.string().max(512).optional(),
  urlLabel: z.string().max(2048).optional(),
  noRawPixels: z.boolean().default(true),
  noClipboard: z.boolean().default(true),
  noOcr: z.boolean().default(true),
  noCredentialCapture: z.boolean().default(true),
  mockDevOnly: z.boolean().default(true),
  createdAt: Timestamp,
  reviewedAt: Timestamp.optional(),
  reviewedBy: EntityId.optional(),
  contextPacketId: EntityId.optional(),
});

export type ScreenObservation = z.infer<typeof ScreenObservation>;

export const ScreenObservationSession = z.object({
  id: ScreenObservationSessionId,
  tenantId: TenantId,
  sessionId: EntityId,
  callEventId: EntityId.optional(),
  source: ScreenObservationSource,
  status: z.enum(['active', 'paused', 'stopped']),
  mockDevOnly: z.boolean().default(true),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

export type ScreenObservationSession = z.infer<typeof ScreenObservationSession>;

export const ScreenObservationCaptureRequest = z.object({
  kind: ScreenObservationKind,
  callEventId: EntityId.optional(),
  rawInputPlaceholder: z.string().max(4096).optional(),
  appLabel: z.string().max(512).optional(),
  windowLabel: z.string().max(512).optional(),
  urlLabel: z.string().max(2048).optional(),
});

export type ScreenObservationCaptureRequest = z.infer<typeof ScreenObservationCaptureRequest>;

export const ScreenObservationCaptureResponse = z.object({
  observation: ScreenObservation,
  redactedSummary: z.string(),
  mockDevOnly: z.boolean(),
});

export type ScreenObservationCaptureResponse = z.infer<typeof ScreenObservationCaptureResponse>;

export const ScreenObservationReviewRequest = z.object({
  status: z.enum(['approved', 'discarded']),
});

export type ScreenObservationReviewRequest = z.infer<typeof ScreenObservationReviewRequest>;

export const ScreenObservationReviewResponse = z.object({
  observation: ScreenObservation,
  previousStatus: ScreenObservationStatus,
  newStatus: ScreenObservationStatus,
});

export type ScreenObservationReviewResponse = z.infer<typeof ScreenObservationReviewResponse>;

export const ScreenObservationContextPacketRequest = z.object({
  provenance: z.string().min(1).max(128).optional(),
});

export type ScreenObservationContextPacketRequest = z.infer<typeof ScreenObservationContextPacketRequest>;

export const ScreenObservationContextPacketResponse = z.object({
  observation: ScreenObservation,
  contextPacketId: EntityId,
  mockDevOnly: z.boolean(),
});

export type ScreenObservationContextPacketResponse = z.infer<typeof ScreenObservationContextPacketResponse>;

export const ScreenObservationEvidenceSummary = z.object({
  observationId: ScreenObservationId,
  sessionId: EntityId,
  callEventId: EntityId.optional(),
  kind: ScreenObservationKind,
  status: ScreenObservationStatus,
  source: ScreenObservationSource,
  redactedSummary: z.string().optional(),
  reviewStatus: z.string().optional(),
  contextPacketId: EntityId.optional(),
  mockDevOnly: z.boolean(),
  noRawPixels: z.boolean(),
  noClipboard: z.boolean(),
  noOcr: z.boolean(),
  noCredentialCapture: z.boolean(),
});

export type ScreenObservationEvidenceSummary = z.infer<typeof ScreenObservationEvidenceSummary>;

export const ScreenObservationRedactionResult = z.object({
  originalLength: z.number().int(),
  redactedLength: z.number().int(),
  redactedPatterns: z.array(z.string()),
  safeToInclude: z.boolean(),
});

export type ScreenObservationRedactionResult = z.infer<typeof ScreenObservationRedactionResult>;
