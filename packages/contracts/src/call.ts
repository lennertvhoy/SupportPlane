import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';

export const CallEventId = EntityId.brand<'CallEventId'>();
export type CallEventId = z.infer<typeof CallEventId>;

export const CallDirection = z.enum(['inbound', 'outbound']);
export type CallDirection = z.infer<typeof CallDirection>;

export const CallStatus = z.enum(['ringing', 'answered', 'missed', 'ended']);
export type CallStatus = z.infer<typeof CallStatus>;

export const CallEventType = z.enum([
  'incoming_call',
  'outgoing_call',
  'call_answered',
  'call_ended',
  'call_missed',
]);
export type CallEventType = z.infer<typeof CallEventType>;

export const CallerMatchStatus = z.enum([
  'matched',
  'no_match',
  'ambiguous',
  'invalid_number',
]);
export type CallerMatchStatus = z.infer<typeof CallerMatchStatus>;

export const CallerIdentity = z.object({
  rawNumber: z.string().min(1).max(64),
  normalizedNumber: z.string().min(1).max(64).optional(),
  displayName: z.string().max(256).optional(),
  countryCodeHint: z.string().max(8).optional(),
});
export type CallerIdentity = z.infer<typeof CallerIdentity>;

export const CallerMatch = z.object({
  status: CallerMatchStatus,
  confidence: z.number().min(0).max(1).default(0),
  customerId: EntityId.optional(),
  customerName: z.string().max(512).optional(),
  customerEmail: z.string().email().max(512).optional(),
  matchedTicketIds: z.array(EntityId).default([]),
  matchedSessionIds: z.array(EntityId).default([]),
  matchSource: z.string().max(128).optional(),
  reason: z.string().max(512).optional(),
});
export type CallerMatch = z.infer<typeof CallerMatch>;

export const PhoneNumberNormalizationResult = z.object({
  rawInput: z.string().min(1).max(64),
  normalized: z.string().min(1).max(64).optional(),
  valid: z.boolean(),
  countryCode: z.string().max(8).optional(),
  error: z.string().max(512).optional(),
});
export type PhoneNumberNormalizationResult = z.infer<
  typeof PhoneNumberNormalizationResult
>;

export const CallEvent = z.object({
  id: CallEventId,
  tenantId: TenantId,
  sessionId: EntityId.optional(),
  provider: z.string().min(1).max(128),
  source: z.string().min(1).max(128),
  externalCallId: z.string().min(1).max(256),
  direction: CallDirection,
  status: CallStatus,
  caller: CallerIdentity,
  callerMatch: CallerMatch.optional(),
  startedAt: Timestamp,
  endedAt: Timestamp.optional(),
  answeredAt: Timestamp.optional(),
  metadata: z.record(JsonValue).default({}),
  mockDevOnly: z.boolean().default(true),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type CallEvent = z.infer<typeof CallEvent>;

export const IncomingCallWebhookRequest = z.object({
  externalCallId: z.string().min(1).max(256),
  rawCallerNumber: z.string().min(1).max(64),
  callerDisplayName: z.string().max(256).optional(),
  direction: CallDirection.default('inbound'),
  status: CallStatus.default('ringing'),
  metadata: z.record(JsonValue).default({}),
});
export type IncomingCallWebhookRequest = z.infer<
  typeof IncomingCallWebhookRequest
>;

export const IncomingCallWebhookResponse = z.object({
  callEventId: CallEventId,
  tenantId: TenantId,
  externalCallId: z.string(),
  normalizedNumber: z.string().optional(),
  callerMatch: CallerMatch.optional(),
  mockDevOnly: z.boolean(),
  receivedAt: Timestamp,
});
export type IncomingCallWebhookResponse = z.infer<
  typeof IncomingCallWebhookResponse
>;

export const CallSessionLinkRequest = z.object({
  sessionId: EntityId,
});
export type CallSessionLinkRequest = z.infer<typeof CallSessionLinkRequest>;

export const CallSessionLinkResponse = z.object({
  callEventId: CallEventId,
  sessionId: EntityId,
  linkedAt: Timestamp,
  mockDevOnly: z.boolean(),
});
export type CallSessionLinkResponse = z.infer<typeof CallSessionLinkResponse>;
