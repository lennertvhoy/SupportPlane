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
  'user_login_failed',
  'user_logout',
  'user_action',
  'rbac_access_denied',
  'tenant_boundary_denied',
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
  'call_recording_attached',
  'call_recording_playback_opened',
  'call_recording_reviewed',
  'screen_observation_captured',
  'screen_observation_reviewed',
  'screen_observation_discarded',
  'screen_observation_context_packet_created',
  // BL-047/048/049 Screen Context Hardening Wave
  'screen_observation_sharing_started',
  'screen_observation_sharing_paused',
  'screen_observation_sharing_stopped',
  'active_window_metadata_captured',
  'manual_screenshot_metadata_attached',
  'structured_screen_observation_uploaded',
  'screen_observation_redaction_applied',
  // BL-020 Ticket Context and Connector Safety Foundation
  'customer_lookup',
  'customer_created',
  'ticket_context_lookup',
  'ticket_context_lookup_failed',
  'ticket_linked_to_session',
  'ticket_unlinked_from_session',
  'ticket_linked_to_call',
  'ticket_unlinked_from_call',
  'connector_installation_created',
  'connector_installation_updated',
  'connector_config_validated',
  'connector_config_validation_failed',
  'connector_safety_blocked',
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
