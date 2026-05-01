import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';

export const ToolInvocationId = EntityId.brand<'ToolInvocationId'>();
export type ToolInvocationId = z.infer<typeof ToolInvocationId>;

export const ToolApprovalId = EntityId.brand<'ToolApprovalId'>();
export type ToolApprovalId = z.infer<typeof ToolApprovalId>;

export const ToolResultNoteDraftId = EntityId.brand<'ToolResultNoteDraftId'>();
export type ToolResultNoteDraftId = z.infer<typeof ToolResultNoteDraftId>;

export const ToolInvocationStatus = z.enum([
  'requested',
  'policy_denied',
  'approval_required',
  'approved',
  'queued',
  'claimed',
  'running',
  'succeeded',
  'failed',
  'expired',
  'cancelled',
]);
export type ToolInvocationStatus = z.infer<typeof ToolInvocationStatus>;

export const ToolApprovalStatus = z.enum([
  'requested',
  'approved',
  'denied',
  'expired',
  'cancelled',
  'consumed',
]);
export type ToolApprovalStatus = z.infer<typeof ToolApprovalStatus>;

export const ToolResultNoteDraftStatus = z.enum(['draft', 'queued', 'discarded']);
export type ToolResultNoteDraftStatus = z.infer<typeof ToolResultNoteDraftStatus>;

export const ToolPolicyDecision = z.object({
  allowed: z.boolean(),
  decision: z.string(),
  reason: z.string().optional(),
  riskLevel: z.string(),
  toolKey: z.string(),
  deviceId: z.string(),
  tenantId: z.string(),
  arbitraryShellAllowed: z.boolean().default(false),
  remediationAllowed: z.boolean().default(false),
  fixedImplementationOnly: z.boolean().default(true),
  approvalRequired: z.boolean().default(false),
});
export type ToolPolicyDecision = z.infer<typeof ToolPolicyDecision>;

export const ToolInvocation = z.object({
  id: ToolInvocationId,
  tenantId: TenantId,
  deviceId: EntityId,
  toolDefinitionId: EntityId,
  toolKey: z.string().min(1).max(128),
  requestedByUserId: EntityId,
  status: ToolInvocationStatus,
  policyDecision: z.record(JsonValue).default({}),
  approvalId: EntityId.optional(),
  endpointCommandId: EntityId.optional(),
  requestedInput: z.record(JsonValue).default({}),
  normalizedResult: z.record(JsonValue).default({}),
  createdAt: Timestamp,
  updatedAt: Timestamp,
  completedAt: Timestamp.optional(),
});
export type ToolInvocation = z.infer<typeof ToolInvocation>;

export const ToolApproval = z.object({
  id: ToolApprovalId,
  tenantId: TenantId,
  invocationId: ToolInvocationId,
  requestedByUserId: EntityId,
  approvedByUserId: EntityId.optional(),
  status: ToolApprovalStatus,
  reason: z.string().max(512).optional(),
  comment: z.string().max(512).optional(),
  expiresAt: Timestamp,
  decidedAt: Timestamp.optional(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type ToolApproval = z.infer<typeof ToolApproval>;

export const ToolResultNoteDraft = z.object({
  id: ToolResultNoteDraftId,
  tenantId: TenantId,
  invocationId: ToolInvocationId,
  ticketId: EntityId.optional(),
  title: z.string().max(256).optional(),
  body: z.string().min(1).max(8192),
  status: ToolResultNoteDraftStatus,
  createdByUserId: EntityId,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type ToolResultNoteDraft = z.infer<typeof ToolResultNoteDraft>;

// Request/response schemas
export const InvokeToolRequest = z.object({
  toolKey: z.string().min(1).max(128),
  requestedInput: z.record(JsonValue).default({}),
  idempotencyKey: z.string().min(8).max(256).optional(),
});
export type InvokeToolRequest = z.infer<typeof InvokeToolRequest>;

export const ApproveToolRequest = z.object({
  decision: z.enum(['approve', 'deny']),
  reason: z.string().max(512).optional(),
});
export type ApproveToolRequest = z.infer<typeof ApproveToolRequest>;

export const CreateToolNoteDraftRequest = z.object({
  ticketId: z.string().optional(),
  title: z.string().max(256).optional(),
});
export type CreateToolNoteDraftRequest = z.infer<typeof CreateToolNoteDraftRequest>;
