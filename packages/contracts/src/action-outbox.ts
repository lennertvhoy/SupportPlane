import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';

export const SupportActionStatus = z.enum([
  'draft',
  'review_required',
  'approved',
  'queued',
  'processing',
  'mock_delivered',
  'sandbox_delivered',
  'failed',
  'retry_scheduled',
  'dead_lettered',
  'cancelled',
  'rejected',
]);
export type SupportActionStatus = z.infer<typeof SupportActionStatus>;

export const SupportActionType = z.enum(['ticket_note']);
export type SupportActionType = z.infer<typeof SupportActionType>;

export const ActionOutboxStatus = z.enum([
  'queued',
  'processing',
  'mock_delivered',
  'sandbox_delivered',
  'failed',
  'retry_scheduled',
  'dead_lettered',
  'cancelled',
]);
export type ActionOutboxStatus = z.infer<typeof ActionOutboxStatus>;

export const ActionOutboxAttemptState = z.enum([
  'processing',
  'mock_delivered',
  'sandbox_delivered',
  'failed',
  'retry_scheduled',
  'retry_requested',
  'dead_lettered',
  'cancelled',
  'policy_blocked',
]);
export type ActionOutboxAttemptState = z.infer<typeof ActionOutboxAttemptState>;

export const ActionOutboxDeliveryMode = z.enum(['mock', 'sandbox']);
export type ActionOutboxDeliveryMode = z.infer<typeof ActionOutboxDeliveryMode>;

export const ActionOutboxSafetyFlags = z.object({
  mode: z.enum(['mock', 'sandbox']).default('mock'),
  realNetwork: z.boolean().default(false),
  writebackEnabled: z.boolean().default(false),
  externalWriteAttempted: z.boolean().default(false),
  noSecrets: z.boolean().default(true),
  noRawMedia: z.boolean().default(true),
  localMockOnly: z.boolean().default(true),
  sandboxOnly: z.boolean().default(false),
});
export type ActionOutboxSafetyFlags = z.infer<typeof ActionOutboxSafetyFlags>;

export const SupportAction = z.object({
  id: EntityId,
  tenantId: TenantId,
  sessionId: EntityId,
  callEventId: EntityId.optional(),
  customerReferenceId: EntityId.optional(),
  ticketReferenceId: EntityId.optional(),
  connectorInstallationId: EntityId.optional(),
  actionType: SupportActionType,
  status: SupportActionStatus,
  idempotencyKey: z.string().min(8).max(160),
  requestedBy: EntityId,
  submittedAt: Timestamp.optional(),
  reviewedBy: EntityId.optional(),
  reviewDecision: z.enum(['approved', 'rejected']).optional(),
  reviewReason: z.string().max(1000).optional(),
  reviewedAt: Timestamp.optional(),
  queuedAt: Timestamp.optional(),
  mockDeliveredAt: Timestamp.optional(),
  failureReason: z.string().max(1000).optional(),
  payloadSummary: z.record(JsonValue).default({}),
  safeBodyPreview: z.string().max(800).optional(),
  mockDevOnly: z.boolean().default(true),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type SupportAction = z.infer<typeof SupportAction>;

export const ActionOutboxItem = z.object({
  id: EntityId,
  tenantId: TenantId,
  supportActionId: EntityId,
  sessionId: EntityId,
  connectorInstallationId: EntityId.optional(),
  actionType: SupportActionType,
  status: ActionOutboxStatus,
  idempotencyKey: z.string().min(8).max(160),
  deliveryMode: ActionOutboxDeliveryMode.default('mock'),
  deliveryIntent: z.record(JsonValue).default({}),
  attemptCount: z.number().int().min(0).default(0),
  maxAttempts: z.number().int().min(1).max(20).default(3),
  latestAttemptState: ActionOutboxAttemptState.optional(),
  queuedAt: Timestamp,
  nextAttemptAt: Timestamp.optional(),
  processingStartedAt: Timestamp.optional(),
  workerLockId: z.string().max(160).optional(),
  workerLockedAt: Timestamp.optional(),
  workerLockExpiresAt: Timestamp.optional(),
  mockDeliveredAt: Timestamp.optional(),
  failedAt: Timestamp.optional(),
  retryScheduledAt: Timestamp.optional(),
  deadLetteredAt: Timestamp.optional(),
  cancelledAt: Timestamp.optional(),
  lastError: z.string().max(1000).optional(),
  lastErrorCode: z.string().max(128).optional(),
  lastErrorMessage: z.string().max(1000).optional(),
  lastErrorRedacted: z.boolean().default(true),
  deadLetterReason: z.string().max(1000).optional(),
  safetyFlags: ActionOutboxSafetyFlags.default({
    mode: 'mock',
    realNetwork: false,
    writebackEnabled: false,
    externalWriteAttempted: false,
    noSecrets: true,
    noRawMedia: true,
    localMockOnly: true,
  }),
  mockDevOnly: z.boolean().default(true),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type ActionOutboxItem = z.infer<typeof ActionOutboxItem>;

export const ActionOutboxAttempt = z.object({
  id: EntityId,
  tenantId: TenantId,
  outboxItemId: EntityId,
  supportActionId: EntityId,
  attemptNumber: z.number().int().min(1),
  state: ActionOutboxAttemptState,
  deliveryResult: z.record(JsonValue).default({}),
  errorCode: z.string().max(128).optional(),
  errorMessage: z.string().max(1000).optional(),
  errorRedacted: z.boolean().default(true),
  attemptedAt: Timestamp,
  completedAt: Timestamp.optional(),
  mockDevOnly: z.boolean().default(true),
});
export type ActionOutboxAttempt = z.infer<typeof ActionOutboxAttempt>;

export const SupportActionCreateRequest = z.object({
  actionType: SupportActionType.default('ticket_note'),
  externalTicketId: z.string().max(128).optional(),
  ticketReferenceId: EntityId.optional(),
  customerReferenceId: EntityId.optional(),
  callEventId: EntityId.optional(),
  connectorInstallationId: EntityId.optional(),
  body: z.string().min(1).max(8000),
  subject: z.string().max(240).optional(),
  idempotencyKey: z.string().min(8).max(160).optional(),
  mockDeliveryScenario: z.enum(['success', 'retryable_failure_once', 'retryable_failure', 'non_retryable_failure', 'connector_unavailable', 'validation_failure']).optional(),
});
export type SupportActionCreateRequest = z.infer<typeof SupportActionCreateRequest>;

export const SupportActionDecisionRequest = z.object({
  reason: z.string().max(1000).optional(),
});
export type SupportActionDecisionRequest = z.infer<typeof SupportActionDecisionRequest>;
