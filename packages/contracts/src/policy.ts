import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';

export const PolicyDecisionId = EntityId.brand<'PolicyDecisionId'>();
export type PolicyDecisionId = z.infer<typeof PolicyDecisionId>;

export const PolicyDecisionOutcome = z.enum([
  'allow',
  'deny',
  'approve_required',
]);

export type PolicyDecisionOutcome = z.infer<typeof PolicyDecisionOutcome>;

export const PolicyDecision = z.object({
  id: PolicyDecisionId,
  tenantId: TenantId,
  sessionId: EntityId.optional(),
  outcome: PolicyDecisionOutcome,
  action: z.string().min(1).max(512),
  resourceType: z.string().min(1).max(128),
  resourceId: EntityId,
  actorUserId: EntityId.optional(),
  reason: z.string().min(1).max(2048),
  evidence: z.record(JsonValue).default({}),
  toolManifestSnapshotId: EntityId.optional(),
  riskLevel: z.enum(['read_only', 'low', 'medium', 'high', 'critical']).optional(),
  createdAt: Timestamp,
});

export type PolicyDecision = z.infer<typeof PolicyDecision>;
