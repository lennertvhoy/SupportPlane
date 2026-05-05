import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';

export const AIContextPacketId = EntityId.brand<'AIContextPacketId'>();
export type AIContextPacketId = z.infer<typeof AIContextPacketId>;

export const AIContextProvenance = z.enum([
  'ticket',
  'customer',
  'session',
  'screen',
  'policy',
  'manual',
  'knowledge',
  'connector',
]);

export type AIContextProvenance = z.infer<typeof AIContextProvenance>;

export const AIContextPacket = z.object({
  id: AIContextPacketId,
  tenantId: TenantId,
  sessionId: EntityId,
  provenance: AIContextProvenance,
  sourceTicketIds: z.array(EntityId).default([]),
  sourceAdapterId: EntityId.optional(),
  payload: z.record(JsonValue),
  redactionLog: z
    .array(
      z.object({
        field: z.string(),
        reason: z.enum(['pii', 'secret', 'policy', 'tenant_rule']),
        method: z.enum(['mask', 'remove', 'hash', 'tokenize']),
      }),
    )
    .default([]),
  contextHash: z.string().max(128).optional(),
  modelPolicySnapshotId: EntityId.optional(),
  createdAt: Timestamp,
});

export type AIContextPacket = z.infer<typeof AIContextPacket>;
