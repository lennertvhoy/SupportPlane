import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';
import { SupportSession } from './support-session.js';

export const CallEventId = EntityId.brand<'CallEventId'>();
export type CallEventId = z.infer<typeof CallEventId>;

export const CallDirection = z.enum(['inbound', 'outbound']);
export type CallDirection = z.infer<typeof CallDirection>;

export const CallStatus = z.enum(['ringing', 'answered', 'on_hold', 'missed', 'ended']);
export type CallStatus = z.infer<typeof CallStatus>;

export const AllowedCallTransition = z.object({
  from: CallStatus,
  to: CallStatus,
});
export type AllowedCallTransition = z.infer<typeof AllowedCallTransition>;

export const CallStatusTransitionRequest = z.object({
  status: CallStatus,
  reason: z.string().max(512).optional(),
});
export type CallStatusTransitionRequest = z.infer<typeof CallStatusTransitionRequest>;

export const CallTimelineItemType = z.enum([
  'call_received',
  'caller_matched',
  'caller_no_match',
  'session_linked',
  'session_auto_created',
  'call_answered',
  'call_held',
  'call_resumed',
  'call_ended',
  'call_missed',
  'greeting_suggested',
  'evidence_bundle_generated',
  'audit_event',
]);
export type CallTimelineItemType = z.infer<typeof CallTimelineItemType>;

export const CallTimelineItem = z.object({
  id: EntityId,
  callEventId: CallEventId,
  sessionId: EntityId.optional(),
  type: CallTimelineItemType,
  timestamp: Timestamp,
  actorId: EntityId.optional(),
  actorType: z.string().max(64).optional(),
  title: z.string().max(256),
  description: z.string().max(1024).optional(),
  metadata: z.record(JsonValue).default({}),
});
export type CallTimelineItem = z.infer<typeof CallTimelineItem>;

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

export const CallStatusTransitionResponse = z.object({
  callEvent: CallEvent,
  previousStatus: CallStatus,
  newStatus: CallStatus,
  changedAt: Timestamp,
  mockDevOnly: z.boolean(),
});
export type CallStatusTransitionResponse = z.infer<typeof CallStatusTransitionResponse>;

export const CallConsoleSummary = z.object({
  callEvent: CallEvent,
  linkedSession: SupportSession.optional(),
  timelineItems: z.array(CallTimelineItem).default([]),
  greetingSuggestion: z.record(JsonValue).optional(),
  mockDevOnly: z.boolean(),
});
export type CallConsoleSummary = z.infer<typeof CallConsoleSummary>;

export const AutoCreateSessionResult = z.enum([
  'not_requested',
  'auto_created',
  'linked_to_existing',
  'skipped_no_match',
  'skipped_invalid_phone',
]);
export type AutoCreateSessionResult = z.infer<typeof AutoCreateSessionResult>;

export const IncomingCallWebhookRequest = z.object({
  externalCallId: z.string().min(1).max(256),
  rawCallerNumber: z.string().min(1).max(64),
  callerDisplayName: z.string().max(256).optional(),
  direction: CallDirection.default('inbound'),
  status: CallStatus.default('ringing'),
  autoCreateSession: z.boolean().optional(),
  preferredSessionTitle: z.string().min(1).max(512).optional(),
  preferredPriority: z.string().min(1).max(64).optional(),
  metadata: z.record(JsonValue).default({}),
});
export type IncomingCallWebhookRequest = z.infer<
  typeof IncomingCallWebhookRequest
>;

export const IncomingCallWebhookResponse = z.object({
  callEvent: CallEvent,
  autoCreateResult: AutoCreateSessionResult,
  createdSession: SupportSession.optional(),
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

export const CallTimelineResponse = z.object({
  callEventId: CallEventId,
  timelineItems: z.array(CallTimelineItem).default([]),
  generatedAt: Timestamp,
  mockDevOnly: z.boolean(),
});
export type CallTimelineResponse = z.infer<typeof CallTimelineResponse>;
