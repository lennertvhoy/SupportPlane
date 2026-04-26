import { z } from 'zod';
import { EntityId, Timestamp, TenantId } from './base.js';

export const SupportSessionId = EntityId.brand<'SupportSessionId'>();
export type SupportSessionId = z.infer<typeof SupportSessionId>;

export const SupportSessionStatus = z.enum([
  'open',
  'paused',
  'resolved',
  'closed',
  'escalated',
]);

export type SupportSessionStatus = z.infer<typeof SupportSessionStatus>;

export const SupportSessionPriority = z.enum([
  'low',
  'normal',
  'high',
  'critical',
]);

export type SupportSessionPriority = z.infer<typeof SupportSessionPriority>;

export const SupportSession = z.object({
  id: SupportSessionId,
  tenantId: TenantId,
  status: SupportSessionStatus,
  priority: SupportSessionPriority.default('normal'),
  title: z.string().min(1).max(512),
  description: z.string().max(4000).optional(),
  assignedUserId: EntityId.optional(),
  linkedTicketIds: z.array(EntityId).default([]),
  aiContextPacketIds: z.array(EntityId).default([]),
  screenObservationIds: z.array(EntityId).default([]),
  callEventIds: z.array(EntityId).default([]),
  auditEventIds: z.array(EntityId).default([]),
  startedAt: Timestamp,
  endedAt: Timestamp.optional(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

export type SupportSession = z.infer<typeof SupportSession>;
