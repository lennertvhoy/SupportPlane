import { z } from 'zod';
import { EntityId, Timestamp, TenantId } from './base.js';

export const ConnectorCredentialReferenceId = EntityId.brand<'ConnectorCredentialReferenceId'>();
export type ConnectorCredentialReferenceId = z.infer<typeof ConnectorCredentialReferenceId>;

export const ConnectorCredentialReferenceStatus = z.enum(['active', 'inactive', 'error']);
export type ConnectorCredentialReferenceStatus = z.infer<typeof ConnectorCredentialReferenceStatus>;

export const ConnectorCredentialReferenceSecretKind = z.enum([
  'api_token_placeholder',
  'basic_auth_placeholder',
  'oauth_placeholder',
  'api_key_placeholder',
  'client_certificate_placeholder',
  'other_placeholder',
]);
export type ConnectorCredentialReferenceSecretKind = z.infer<
  typeof ConnectorCredentialReferenceSecretKind
>;

export const ConnectorCredentialReference = z.object({
  id: ConnectorCredentialReferenceId,
  tenantId: TenantId,
  connectorType: z.string().min(1).max(64),
  displayName: z.string().min(1).max(256),
  description: z.string().max(2048).optional(),
  status: ConnectorCredentialReferenceStatus.default('active'),
  secretKind: ConnectorCredentialReferenceSecretKind.default('api_token_placeholder'),
  secretRef: z.string().max(512).default('local-dev-placeholder'),
  lastValidatedAt: Timestamp.optional(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
  createdByUserId: z.string().optional(),
  updatedByUserId: z.string().optional(),
});

export type ConnectorCredentialReference = z.infer<typeof ConnectorCredentialReference>;

export const ConnectorCredentialReferenceCreateRequest = z.object({
  connectorType: z.string().min(1).max(64),
  displayName: z.string().min(1).max(256),
  description: z.string().max(2048).optional(),
  status: ConnectorCredentialReferenceStatus.optional(),
  secretKind: ConnectorCredentialReferenceSecretKind.optional(),
});
export type ConnectorCredentialReferenceCreateRequest = z.infer<
  typeof ConnectorCredentialReferenceCreateRequest
>;

export const ConnectorCredentialReferenceUpdateRequest = z.object({
  displayName: z.string().min(1).max(256).optional(),
  description: z.string().max(2048).optional(),
  status: ConnectorCredentialReferenceStatus.optional(),
  secretKind: ConnectorCredentialReferenceSecretKind.optional(),
});
export type ConnectorCredentialReferenceUpdateRequest = z.infer<
  typeof ConnectorCredentialReferenceUpdateRequest
>;

export const EvidenceBundleCredentialReferenceSummary = z.object({
  id: z.string(),
  displayName: z.string(),
  connectorType: z.string(),
  status: z.string(),
  secretKind: z.string(),
  linked: z.boolean().optional(),
  lastValidatedAt: z.string().optional(),
});
export type EvidenceBundleCredentialReferenceSummary = z.infer<
  typeof EvidenceBundleCredentialReferenceSummary
>;
