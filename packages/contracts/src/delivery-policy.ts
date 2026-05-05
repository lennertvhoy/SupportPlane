import { z } from 'zod';

export const DeliveryPolicySafetyFlags = z.object({
  realNetworkAllowed: z.boolean().default(false),
  writebackEnabled: z.boolean().default(false),
  externalWriteAllowed: z.boolean().default(false),
  mockOnly: z.boolean().default(true),
  localDevOnly: z.boolean().default(true),
  sandboxOnly: z.boolean().default(false),
});

export const RetryPolicyConfig = z.object({
  maxAttempts: z.number().int().min(1).max(10).default(3),
  baseDelaySeconds: z.number().int().min(1).max(60).default(5),
  maxDelaySeconds: z.number().int().min(1).max(3600).default(300),
  backoffMultiplier: z.number().min(1).max(10).default(2),
});

export const DeliveryPolicy = z.object({
  id: z.string(),
  tenantId: z.string(),
  connectorInstallationId: z.string().nullable().default(null),
  name: z.string().default('Default Delivery Policy'),
  enabled: z.boolean().default(true),
  killSwitch: z.boolean().default(false),
  dryRunRequired: z.boolean().default(true),
  mockOnlyEnforced: z.boolean().default(true),
  allowRealNetworkCalls: z.boolean().default(false),
  allowedActionTypes: z.array(z.string()).default(['ticket_note']),
  approvalRequired: z.boolean().default(true),
  minimumApproverRole: z.enum(['admin', 'owner', 'operator']).default('admin'),
  requireHumanReview: z.boolean().default(true),
  requireEvidenceBundleBeforeDelivery: z.boolean().default(false),
  requireConnectorValidationBeforeDelivery: z.boolean().default(false),
  retryPolicy: RetryPolicyConfig.default({}),
  deadLetterPolicy: z
    .object({
      enabled: z.boolean().default(true),
      maxAttemptsBeforeDeadLetter: z.number().int().min(1).max(20).default(3),
      requireManualRetry: z.boolean().default(true),
    })
    .default({}),
  updatedBy: z.string().nullable().default(null),
  updatedAt: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  policyVersion: z.number().int().min(1).default(1),
  lastValidationStatus: z.enum(['valid', 'invalid', 'pending', 'not_run']).default('not_run'),
  safetyFlags: DeliveryPolicySafetyFlags.default({}),
  createdAt: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
});

export type DeliveryPolicy = z.infer<typeof DeliveryPolicy>;
export type DeliveryPolicySafetyFlags = z.infer<typeof DeliveryPolicySafetyFlags>;
export type RetryPolicyConfig = z.infer<typeof RetryPolicyConfig>;

export const DeliveryPolicyDecision = z.object({
  allowed: z.boolean(),
  decision: z.enum([
    'allowed',
    'blocked_by_kill_switch',
    'blocked_by_policy_disabled',
    'blocked_by_dry_run_required',
    'blocked_by_mock_only',
    'blocked_by_action_type',
    'blocked_by_approval_required',
    'blocked_by_insufficient_approver_role',
    'blocked_by_human_review_required',
    'blocked_by_evidence_required',
    'blocked_by_connector_validation_required',
    'blocked_by_connector_not_ready',
    'blocked_by_real_network_disallowed',
    'blocked_by_writeback_disabled',
    'blocked_by_external_write_disallowed',
    'mock_only_allowed',
    'sandbox_allowed',
  ]),
  reason: z.string(),
  mode: z.enum(['mock', 'dry_run', 'real', 'sandbox']).default('mock'),
  realNetworkAllowed: z.boolean().default(false),
  writebackEnabled: z.boolean().default(false),
  externalWriteAllowed: z.boolean().default(false),
  requiredApproverRole: z.string().nullable().default(null),
  policyVersion: z.number().int(),
  policyId: z.string(),
  safetyFlags: DeliveryPolicySafetyFlags,
});

export type DeliveryPolicyDecision = z.infer<typeof DeliveryPolicyDecision>;

export const DeliveryPolicyUpdateRequest = z.object({
  enabled: z.boolean().optional(),
  killSwitch: z.boolean().optional(),
  dryRunRequired: z.boolean().optional(),
  mockOnlyEnforced: z.boolean().optional(),
  allowRealNetworkCalls: z.boolean().optional(),
  allowedActionTypes: z.array(z.string()).optional(),
  approvalRequired: z.boolean().optional(),
  minimumApproverRole: z.enum(['admin', 'owner', 'operator']).optional(),
  requireHumanReview: z.boolean().optional(),
  requireEvidenceBundleBeforeDelivery: z.boolean().optional(),
  requireConnectorValidationBeforeDelivery: z.boolean().optional(),
  retryPolicy: RetryPolicyConfig.optional(),
  deadLetterPolicy: z
    .object({
      enabled: z.boolean().optional(),
      maxAttemptsBeforeDeadLetter: z.number().int().min(1).max(20).optional(),
      requireManualRetry: z.boolean().optional(),
    })
    .optional(),
});

export type DeliveryPolicyUpdateRequest = z.infer<typeof DeliveryPolicyUpdateRequest>;

export const ConnectorReadinessResult = z.object({
  mode: z.enum(['mock', 'real', 'sandbox']).default('mock'),
  readyForMockDelivery: z.boolean(),
  readyForRealWriteback: z.boolean().default(false),
  sandboxWritebackReady: z.boolean().default(false),
  productionWritebackReady: z.boolean().default(false),
  publicReplyEnabled: z.boolean().default(false),
  realNetwork: z.boolean().default(false),
  writebackEnabled: z.boolean().default(false),
  externalWriteAttempted: z.boolean().default(false),
  policyDecision: z.string(),
  connectorInstalled: z.boolean(),
  connectorActive: z.boolean(),
  connectorSupportsActionType: z.boolean(),
  connectorValidationStatus: z.string(),
  credentialsAbsentOrRedacted: z.boolean().default(true),
  policyVersion: z.number().int(),
  lastValidationResult: z.string().nullable().default(null),
  safetyFlags: DeliveryPolicySafetyFlags,
  registryPattern: z.boolean().default(false),
  adapterFactoryId: z.string().optional(),
  adapterRuntimeId: z.string().optional(),
});

export type ConnectorReadinessResult = z.infer<typeof ConnectorReadinessResult>;
