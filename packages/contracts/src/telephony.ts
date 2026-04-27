import { z } from 'zod';
import { EntityId, JsonValue, TenantId, Timestamp } from './base.js';
import { CallEvent, CallStatus } from './call.js';

export const TelephonyProviderType = z.enum([
  'mock',
  'webhook_bridge',
  'sip_bridge',
  'webrtc_bridge',
  'teams_phone',
  'twilio',
  'threecx',
  'asterisk',
]);
export type TelephonyProviderType = z.infer<typeof TelephonyProviderType>;

export const TelephonyAdapterMode = z.enum(['mock', 'configured', 'disabled']);
export type TelephonyAdapterMode = z.infer<typeof TelephonyAdapterMode>;

export const TelephonyAdapterCapabilities = z.object({
  inboundCalls: z.boolean(),
  answer: z.boolean(),
  hold: z.boolean(),
  resume: z.boolean(),
  end: z.boolean(),
  transfer: z.boolean(),
  recording: z.boolean(),
  transcription: z.boolean(),
});
export type TelephonyAdapterCapabilities = z.infer<
  typeof TelephonyAdapterCapabilities
>;

export const TelephonyWebhookVerificationStatus = z.enum([
  'not_required',
  'verified',
  'failed',
  'not_configured',
]);
export type TelephonyWebhookVerificationStatus = z.infer<
  typeof TelephonyWebhookVerificationStatus
>;

export const TelephonyWebhookVerification = z.object({
  status: TelephonyWebhookVerificationStatus,
  checkedAt: Timestamp,
  signatureRequired: z.boolean(),
  mockDevOnly: z.boolean().default(true),
  reason: z.string().max(512).optional(),
});
export type TelephonyWebhookVerification = z.infer<
  typeof TelephonyWebhookVerification
>;

export const TelephonyProviderError = z.object({
  code: z.string().min(1).max(128),
  message: z.string().min(1).max(512),
  safeToDisplay: z.boolean().default(true),
  providerType: TelephonyProviderType.optional(),
});
export type TelephonyProviderError = z.infer<typeof TelephonyProviderError>;

export const TelephonyAdapterConfig = z.object({
  tenantId: TenantId,
  providerType: TelephonyProviderType,
  mode: TelephonyAdapterMode,
  displayName: z.string().min(1).max(128).default('Mock telephony bridge'),
  webhookPath: z.string().min(1).max(256).optional(),
  signatureRequired: z.boolean().default(false),
  secretRef: z.string().min(1).max(256).optional(),
  capabilities: TelephonyAdapterCapabilities.optional(),
  mockDevOnly: z.boolean().default(true),
  metadata: z.record(JsonValue).default({}),
}).superRefine((value, ctx) => {
  if (value.mode === 'configured' && !value.secretRef && value.signatureRequired) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['secretRef'],
      message: 'signatureRequired configured adapters must reference a server-side secretRef',
    });
  }
  if (value.mode !== 'mock' && value.mockDevOnly) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['mockDevOnly'],
      message: 'mockDevOnly can only be true in mock mode',
    });
  }
});
export type TelephonyAdapterConfig = z.infer<typeof TelephonyAdapterConfig>;

export const TelephonyAdapterStatus = z.object({
  tenantId: TenantId,
  providerType: TelephonyProviderType,
  mode: TelephonyAdapterMode,
  health: z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']),
  connected: z.boolean(),
  capabilities: TelephonyAdapterCapabilities,
  webhookVerification: TelephonyWebhookVerification,
  lastTestedAt: Timestamp.optional(),
  lastError: TelephonyProviderError.optional(),
  mockDevOnly: z.boolean(),
  disclaimers: z.array(z.string()).default([]),
  metadata: z.record(JsonValue).default({}),
});
export type TelephonyAdapterStatus = z.infer<typeof TelephonyAdapterStatus>;

export const TelephonyWebhookLifecycleEventType = z.enum([
  'incoming_call',
  'call_answered',
  'call_held',
  'call_resumed',
  'call_ended',
  'call_missed',
]);
export type TelephonyWebhookLifecycleEventType = z.infer<
  typeof TelephonyWebhookLifecycleEventType
>;

export const TelephonyWebhookEvent = z.object({
  tenantId: TenantId,
  providerType: TelephonyProviderType.default('mock'),
  adapterMode: TelephonyAdapterMode.default('mock'),
  sourceEventId: z.string().min(1).max(256),
  externalCallId: z.string().min(1).max(256),
  eventType: TelephonyWebhookLifecycleEventType,
  rawCallerNumber: z.string().min(1).max(64).optional(),
  normalizedPhoneNumber: z.string().min(1).max(64).optional(),
  callerDisplayName: z.string().max(256).optional(),
  occurredAt: Timestamp,
  verification: TelephonyWebhookVerification,
  autoCreateSession: z.boolean().optional(),
  metadata: z.record(JsonValue).default({}),
  mockDevOnly: z.boolean().default(true),
});
export type TelephonyWebhookEvent = z.infer<typeof TelephonyWebhookEvent>;

export const TelephonyCallControlAction = z.enum([
  'answer',
  'hold',
  'resume',
  'end',
  'transfer',
]);
export type TelephonyCallControlAction = z.infer<
  typeof TelephonyCallControlAction
>;

export const TelephonyCallControlIntent = z.object({
  tenantId: TenantId,
  actorId: EntityId,
  callEventId: EntityId,
  externalCallId: z.string().min(1).max(256),
  providerType: TelephonyProviderType.default('mock'),
  adapterMode: TelephonyAdapterMode.default('mock'),
  action: TelephonyCallControlAction,
  target: z.string().min(1).max(256).optional(),
  reason: z.string().max(512).optional(),
  requestedAt: Timestamp,
  mockDevOnly: z.boolean().default(true),
});
export type TelephonyCallControlIntent = z.infer<
  typeof TelephonyCallControlIntent
>;

export const TelephonyCallControlResult = z.object({
  intent: TelephonyCallControlIntent,
  success: z.boolean(),
  providerType: TelephonyProviderType,
  adapterMode: TelephonyAdapterMode,
  callEvent: CallEvent.optional(),
  resultingStatus: CallStatus.optional(),
  error: TelephonyProviderError.optional(),
  completedAt: Timestamp,
  mockDevOnly: z.boolean().default(true),
});
export type TelephonyCallControlResult = z.infer<
  typeof TelephonyCallControlResult
>;

export const TelephonyAuditMetadata = z.object({
  tenantId: TenantId,
  actorId: EntityId.optional(),
  providerType: TelephonyProviderType,
  adapterMode: TelephonyAdapterMode,
  externalCallId: z.string().max(256).optional(),
  callEventId: EntityId.optional(),
  controlIntent: TelephonyCallControlAction.optional(),
  verificationStatus: TelephonyWebhookVerificationStatus.optional(),
  success: z.boolean().optional(),
  error: TelephonyProviderError.optional(),
  mockDevOnly: z.boolean().default(true),
});
export type TelephonyAuditMetadata = z.infer<typeof TelephonyAuditMetadata>;
