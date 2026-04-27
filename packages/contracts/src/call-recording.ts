import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';

export const CallRecordingId = EntityId.brand<'CallRecordingId'>();
export type CallRecordingId = z.infer<typeof CallRecordingId>;

export const CallRecordingStatus = z.enum([
  'available',
  'unavailable',
  'redacted',
  'deleted',
  'mock_only',
]);
export type CallRecordingStatus = z.infer<typeof CallRecordingStatus>;

export const CallRecordingSource = z.enum([
  'mock_generated',
  'provider_placeholder',
]);
export type CallRecordingSource = z.infer<typeof CallRecordingSource>;

export const CallRecordingStorageType = z.enum([
  'none',
  'mock_inline',
  'future_object_storage',
]);
export type CallRecordingStorageType = z.infer<typeof CallRecordingStorageType>;

export const CallRecording = z.object({
  id: CallRecordingId,
  tenantId: TenantId,
  callEventId: EntityId,
  supportSessionId: EntityId.optional(),
  source: CallRecordingSource,
  status: CallRecordingStatus,
  durationSeconds: z.number().min(0).max(86400).optional(),
  mockMediaUrl: z.string().max(1024).optional(),
  placeholderReference: z.string().max(512).optional(),
  storageType: CallRecordingStorageType,
  checksumHash: z.string().max(256).optional(),
  createdAt: Timestamp,
  reviewedAt: Timestamp.optional(),
  reviewedBy: EntityId.optional(),
  updatedAt: Timestamp.optional(),
  mockDevOnly: z.boolean().default(true),
  complianceDisclaimer: z.string().max(1024).optional(),
  noRealAudio: z.boolean().default(true),
});
export type CallRecording = z.infer<typeof CallRecording>;

export const CallRecordingAttachmentRequest = z.object({
  source: CallRecordingSource.default('mock_generated'),
  durationSeconds: z.number().min(0).max(86400).optional(),
  metadata: z.record(JsonValue).default({}),
});
export type CallRecordingAttachmentRequest = z.infer<typeof CallRecordingAttachmentRequest>;

export const CallRecordingAttachmentResponse = z.object({
  recording: CallRecording,
  mockDevOnly: z.boolean(),
  attachedAt: Timestamp,
});
export type CallRecordingAttachmentResponse = z.infer<typeof CallRecordingAttachmentResponse>;

export const CallRecordingPlaybackState = z.object({
  recordingId: CallRecordingId,
  callEventId: EntityId,
  openedAt: Timestamp,
  openedBy: EntityId,
  mockDevOnly: z.boolean(),
  noRealAudio: z.boolean(),
  placeholderOnly: z.boolean(),
});
export type CallRecordingPlaybackState = z.infer<typeof CallRecordingPlaybackState>;

export const CallRecordingReviewEvent = z.object({
  recordingId: CallRecordingId,
  callEventId: EntityId,
  supportSessionId: EntityId.optional(),
  reviewedAt: Timestamp,
  reviewedBy: EntityId,
  previousStatus: CallRecordingStatus,
  newStatus: CallRecordingStatus,
  mockDevOnly: z.boolean(),
});
export type CallRecordingReviewEvent = z.infer<typeof CallRecordingReviewEvent>;

export const CallRecordingEvidenceSummary = z.object({
  recordingId: EntityId,
  callEventId: EntityId,
  supportSessionId: EntityId.optional(),
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
export type CallRecordingEvidenceSummary = z.infer<typeof CallRecordingEvidenceSummary>;

export const CallRecordingListResponse = z.object({
  callEventId: EntityId,
  recordings: z.array(CallRecording),
  mockDevOnly: z.boolean(),
});
export type CallRecordingListResponse = z.infer<typeof CallRecordingListResponse>;
