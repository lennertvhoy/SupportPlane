import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';

export const AuditEventId = EntityId.brand<'AuditEventId'>();
export type AuditEventId = z.infer<typeof AuditEventId>;

export const AuditActorType = z.enum([
  'user',
  'system',
  'connector',
  'ai',
  'policy_engine',
]);

export type AuditActorType = z.infer<typeof AuditActorType>;

export const AuditEventType = z.enum([
  'session_created',
  'session_updated',
  'ticket_linked',
  'ticket_unlinked',
  'ai_context_loaded',
  'ai_context_redacted',
  'ai_draft_generated',
  'policy_decision',
  'screen_observed',
  'note_drafted',
  'note_written',
  'adapter_sync',
  'adapter_error',
  'connector_status_checked',
  'connector_tested',
  'zammad_ticket_loaded',
  'internal_note_drafted',
  'internal_note_writeback_attempted',
  'internal_note_writeback_succeeded',
  'internal_note_writeback_failed',
  'user_login',
  'user_logout',
  'user_action',
  'approval_requested',
  'approval_granted',
  'approval_denied',
  'evidence_bundle_generated',
  'evidence_bundle_exported',
  'call_event_received',
  'caller_matched',
  'call_linked_to_session',
  'support_session_auto_created',
  'call_auto_linked_to_session',
  'call_status_changed',
  'greeting_suggestion_generated',
  'telephony_adapter_tested',
  'telephony_webhook_received',
  'telephony_webhook_verified',
  'telephony_call_control_requested',
  'telephony_call_control_succeeded',
  'telephony_call_control_failed',
]);

export type AuditEventType = z.infer<typeof AuditEventType>;

export const AuditEvent = z.object({
  id: AuditEventId,
  tenantId: TenantId,
  sessionId: EntityId.optional(),
  eventType: AuditEventType,
  actorType: AuditActorType,
  actorId: EntityId,
  action: z.string().min(1).max(512),
  resourceType: z.string().min(1).max(128),
  resourceId: EntityId,
  metadata: z.record(JsonValue).default({}),
  hashChainPrevious: z.string().max(256).optional(),
  integrityHash: z.string().max(256).optional(),
  createdAt: Timestamp,
});

export type AuditEvent = z.infer<typeof AuditEvent>;
