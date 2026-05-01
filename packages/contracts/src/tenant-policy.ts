import { z } from 'zod';

export const ConnectorPolicy = z.object({
  id: z.string(),
  tenantId: z.string(),
  policyType: z.literal('connector').default('connector'),
  connectorInstallationId: z.string(),
  name: z.string().default('Connector Policy'),
  enabled: z.boolean().default(true),
  killSwitch: z.boolean().default(false),
  allowedActionTypes: z.array(z.string()).default(['ticket_note']),
  approvalRequired: z.boolean().default(true),
  minimumApproverRole: z.enum(['admin', 'owner', 'operator']).default('admin'),
  requireEvidenceBundleBeforeDelivery: z.boolean().default(false),
  requireConnectorValidationBeforeDelivery: z.boolean().default(true),
  maxRetries: z.number().int().min(0).max(10).default(3),
  backoffSeconds: z.number().int().min(1).max(300).default(5),
  safetyFlags: z.object({
    realNetworkAllowed: z.boolean().default(false),
    writebackEnabled: z.boolean().default(false),
    externalWriteAllowed: z.boolean().default(false),
    mockOnly: z.boolean().default(true),
    sandboxOnly: z.boolean().default(false),
  }).default({}),
  updatedBy: z.string().nullable().default(null),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
  version: z.number().int().min(1).default(1),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type ConnectorPolicy = z.infer<typeof ConnectorPolicy>;

export const AiPolicy = z.object({
  id: z.string(),
  tenantId: z.string(),
  policyType: z.literal('ai').default('ai'),
  name: z.string().default('AI Policy'),
  enabled: z.boolean().default(true),
  killSwitch: z.boolean().default(false),
  allowedProviders: z.array(z.enum(['mock', 'ollama', 'lmstudio', 'openai', 'anthropic'])).default(['mock', 'ollama', 'lmstudio']),
  allowedModels: z.array(z.string()).default([]),
  maxTokensPerRequest: z.number().int().min(1).max(1000000).default(4096),
  maxCostPerDayUsd: z.number().min(0).max(10000).default(100),
  requireHumanReview: z.boolean().default(true),
  allowAutonomousSend: z.boolean().default(false),
  allowDraftGeneration: z.boolean().default(true),
  allowGreetingSuggestions: z.boolean().default(true),
  allowScreenContext: z.boolean().default(false),
  redactionRequired: z.boolean().default(true),
  safetyFlags: z.object({
    cloudCallsAllowed: z.boolean().default(false),
    localProvidersOnly: z.boolean().default(true),
    mockOnly: z.boolean().default(true),
    reviewRequired: z.boolean().default(true),
  }).default({}),
  updatedBy: z.string().nullable().default(null),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
  version: z.number().int().min(1).default(1),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type AiPolicy = z.infer<typeof AiPolicy>;

export const RetentionPolicy = z.object({
  id: z.string(),
  tenantId: z.string(),
  policyType: z.literal('retention').default('retention'),
  name: z.string().default('Retention Policy'),
  enabled: z.boolean().default(true),
  sessionRetentionDays: z.number().int().min(1).max(3650).default(365),
  auditLogRetentionDays: z.number().int().min(1).max(3650).default(1095),
  callRecordingRetentionDays: z.number().int().min(1).max(3650).default(90),
  screenObservationRetentionDays: z.number().int().min(1).max(3650).default(30),
  evidenceBundleRetentionDays: z.number().int().min(1).max(3650).default(365),
  actionOutboxRetentionDays: z.number().int().min(1).max(3650).default(90),
  promptRetentionMode: z.enum(['none', 'metadata_only', 'full']).default('full'),
  outputRetentionMode: z.enum(['none', 'metadata_only', 'full']).default('full'),
  promptRetentionDays: z.number().int().min(1).max(3650).default(365),
  outputRetentionDays: z.number().int().min(1).max(3650).default(365),
  autoPurgeEnabled: z.boolean().default(false),
  purgeRequiresApproval: z.boolean().default(true),
  minimumPurgeApproverRole: z.enum(['admin', 'owner', 'operator']).default('owner'),
  updatedBy: z.string().nullable().default(null),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
  version: z.number().int().min(1).default(1),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
});

export type RetentionPolicy = z.infer<typeof RetentionPolicy>;

export const PolicySummary = z.object({
  policyType: z.enum(['delivery', 'connector', 'ai', 'retention']),
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  killSwitch: z.boolean().optional(),
  version: z.number().int(),
  updatedAt: z.string().datetime(),
  updatedBy: z.string().nullable(),
  scopeCount: z.number().int().optional(),
});

export type PolicySummary = z.infer<typeof PolicySummary>;

export const PolicyAuditPreview = z.object({
  tenantId: z.string(),
  generatedAt: z.string().datetime(),
  policies: z.array(z.object({
    policyType: z.string(),
    policyId: z.string(),
    policyName: z.string(),
    version: z.number().int(),
    enabled: z.boolean(),
    safetyFlags: z.record(z.boolean()),
  })),
  disclaimers: z.array(z.string()),
});

export type PolicyAuditPreview = z.infer<typeof PolicyAuditPreview>;

export const ConnectorPolicyUpdateRequest = z.object({
  enabled: z.boolean().optional(),
  killSwitch: z.boolean().optional(),
  allowedActionTypes: z.array(z.string()).optional(),
  approvalRequired: z.boolean().optional(),
  minimumApproverRole: z.enum(['admin', 'owner', 'operator']).optional(),
  requireEvidenceBundleBeforeDelivery: z.boolean().optional(),
  requireConnectorValidationBeforeDelivery: z.boolean().optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  backoffSeconds: z.number().int().min(1).max(300).optional(),
  safetyFlags: z.object({
    realNetworkAllowed: z.boolean().optional(),
    writebackEnabled: z.boolean().optional(),
    externalWriteAllowed: z.boolean().optional(),
    mockOnly: z.boolean().optional(),
    sandboxOnly: z.boolean().optional(),
  }).optional(),
});

export type ConnectorPolicyUpdateRequest = z.infer<typeof ConnectorPolicyUpdateRequest>;

export const AiPolicyUpdateRequest = z.object({
  enabled: z.boolean().optional(),
  killSwitch: z.boolean().optional(),
  allowedProviders: z.array(z.enum(['mock', 'ollama', 'lmstudio', 'openai', 'anthropic'])).optional(),
  allowedModels: z.array(z.string()).optional(),
  maxTokensPerRequest: z.number().int().min(1).max(1000000).optional(),
  maxCostPerDayUsd: z.number().min(0).max(10000).optional(),
  requireHumanReview: z.boolean().optional(),
  allowAutonomousSend: z.boolean().optional(),
  allowDraftGeneration: z.boolean().optional(),
  allowGreetingSuggestions: z.boolean().optional(),
  allowScreenContext: z.boolean().optional(),
  redactionRequired: z.boolean().optional(),
  safetyFlags: z.object({
    cloudCallsAllowed: z.boolean().optional(),
    localProvidersOnly: z.boolean().optional(),
    mockOnly: z.boolean().optional(),
    reviewRequired: z.boolean().optional(),
  }).optional(),
});

export type AiPolicyUpdateRequest = z.infer<typeof AiPolicyUpdateRequest>;

export const RetentionPolicyUpdateRequest = z.object({
  enabled: z.boolean().optional(),
  sessionRetentionDays: z.number().int().min(1).max(3650).optional(),
  auditLogRetentionDays: z.number().int().min(1).max(3650).optional(),
  callRecordingRetentionDays: z.number().int().min(1).max(3650).optional(),
  screenObservationRetentionDays: z.number().int().min(1).max(3650).optional(),
  evidenceBundleRetentionDays: z.number().int().min(1).max(3650).optional(),
  actionOutboxRetentionDays: z.number().int().min(1).max(3650).optional(),
  promptRetentionMode: z.enum(['none', 'metadata_only', 'full']).optional(),
  outputRetentionMode: z.enum(['none', 'metadata_only', 'full']).optional(),
  promptRetentionDays: z.number().int().min(1).max(3650).optional(),
  outputRetentionDays: z.number().int().min(1).max(3650).optional(),
  autoPurgeEnabled: z.boolean().optional(),
  purgeRequiresApproval: z.boolean().optional(),
  minimumPurgeApproverRole: z.enum(['admin', 'owner', 'operator']).optional(),
});

export type RetentionPolicyUpdateRequest = z.infer<typeof RetentionPolicyUpdateRequest>;
