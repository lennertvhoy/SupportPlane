import { z } from 'zod';
import { JsonValue } from './base.js';

export const ConnectorRuntimeConfigSchema = z.object({
  baseUrlPlaceholder: z.string().max(512).optional(),
  timeoutMs: z.number().int().min(1000).max(60000).optional(),
  capabilities: z.array(z.string()).default([]),
  validateBeforeWrite: z.boolean().default(true),
  maxRetries: z.number().int().min(0).max(10).optional(),
  mockMode: z.boolean().default(true),
  status: z.enum(['active', 'inactive', 'error']).optional(),
  enabled: z.boolean().default(false),
  linkedCredentialReferenceIds: z.array(z.string()).default([]),
});
export type ConnectorRuntimeConfigSchema = z.infer<typeof ConnectorRuntimeConfigSchema>;

export const ConnectorRuntimeConfigValidationIssue = z.object({
  field: z.string(),
  severity: z.enum(['error', 'warning']),
  message: z.string(),
  code: z.string(),
});
export type ConnectorRuntimeConfigValidationIssue = z.infer<typeof ConnectorRuntimeConfigValidationIssue>;

export const ConnectorRuntimeConfigValidationResult = z.object({
  valid: z.boolean(),
  mockMode: z.boolean(),
  realNetwork: z.boolean(),
  writebackEnabled: z.boolean(),
  issues: z.array(ConnectorRuntimeConfigValidationIssue).default([]),
  warnings: z.array(z.string()).default([]),
  timestamp: z.string(),
});
export type ConnectorRuntimeConfigValidationResult = z.infer<typeof ConnectorRuntimeConfigValidationResult>;

export const ConnectorRuntimeReadinessResult = z.object({
  mockReady: z.boolean(),
  realReady: z.boolean(),
  realNetwork: z.boolean(),
  writebackEnabled: z.boolean(),
  externalWriteAttempted: z.boolean(),
  warnings: z.array(z.string()).default([]),
  credentialReferencesLinked: z.boolean(),
  linkedCredentialReferenceCount: z.number().int().min(0),
  timestamp: z.string(),
});
export type ConnectorRuntimeReadinessResult = z.infer<typeof ConnectorRuntimeReadinessResult>;

export const ConnectorRuntimeCredentialReferenceMetadata = z.object({
  id: z.string(),
  displayName: z.string(),
  kind: z.string(),
  status: z.string(),
  lastValidatedAt: z.string().optional(),
  secretResolutionImplemented: z.boolean(),
  resolver: z.enum(['openbao', 'disabled']).optional(),
  resolverMode: z.enum(['local-sandbox', 'disabled']).optional(),
  resolved: z.boolean().optional(),
  secretExposed: z.literal(false).optional(),
});
export type ConnectorRuntimeCredentialReferenceMetadata = z.infer<typeof ConnectorRuntimeCredentialReferenceMetadata>;

export const ConnectorRuntimeResolverResult = z.object({
  tenantId: z.string(),
  connectorType: z.string(),
  installationId: z.string(),
  installationDisplayName: z.string(),
  capabilities: z.array(z.string()).default([]),
  credentialReferences: z.array(ConnectorRuntimeCredentialReferenceMetadata).default([]),
  mode: z.enum(['mock', 'zammad']),
  realNetwork: z.boolean(),
  writebackEnabled: z.boolean(),
  externalWriteAttempted: z.boolean(),
  readiness: ConnectorRuntimeReadinessResult,
});
export type ConnectorRuntimeResolverResult = z.infer<typeof ConnectorRuntimeResolverResult>;

export const ConnectorConfigSchemaResponse = z.object({
  installationId: z.string(),
  schema: z.object({
    type: z.literal('object'),
    properties: z.record(JsonValue),
    required: z.array(z.string()).default([]),
    additionalProperties: z.boolean().default(false),
  }),
  safeFields: z.array(z.string()),
  rejectedFields: z.array(z.string()).default([]),
  mockOnly: z.boolean(),
});
export type ConnectorConfigSchemaResponse = z.infer<typeof ConnectorConfigSchemaResponse>;
