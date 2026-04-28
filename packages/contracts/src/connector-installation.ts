import { z } from 'zod';
import { EntityId, Timestamp, TenantId, JsonValue } from './base.js';

export const ConnectorInstallationId = EntityId.brand<'ConnectorInstallationId'>();
export type ConnectorInstallationId = z.infer<typeof ConnectorInstallationId>;

export const ConnectorInstallationStatus = z.enum([
  'active',
  'inactive',
  'error',
]);
export type ConnectorInstallationStatus = z.infer<typeof ConnectorInstallationStatus>;

export const ConnectorInstallation = z.object({
  id: ConnectorInstallationId,
  tenantId: TenantId,
  name: z.string().min(1).max(256),
  displayName: z.string().max(256).optional(),
  description: z.string().max(2048).optional(),
  adapterType: z.string().min(1).max(64),
  capabilities: z.array(z.string()).default([]),
  config: z.record(JsonValue).default({}),
  secretReferenceIds: z.array(z.string()).default([]),
  status: ConnectorInstallationStatus.default('inactive'),
  mockMode: z.boolean().default(true),
  enabled: z.boolean().default(false),
  safetyFlags: z.record(JsonValue).default({}),
  timeoutMs: z.number().int().min(1000).max(60000).optional(),
  lastVerifiedAt: Timestamp.optional(),
  lastError: z.string().max(2048).optional(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});

export type ConnectorInstallation = z.infer<typeof ConnectorInstallation>;

export const ConnectorInstallationCreateRequest = z.object({
  name: z.string().min(1).max(256),
  adapterType: z.string().min(1).max(64),
  config: z.record(JsonValue).default({}),
  safetyFlags: z.record(JsonValue).default({}),
});
export type ConnectorInstallationCreateRequest = z.infer<typeof ConnectorInstallationCreateRequest>;

export const ConnectorInstallationUpdateRequest = z.object({
  name: z.string().min(1).max(256).optional(),
  displayName: z.string().max(256).optional(),
  description: z.string().max(2048).optional(),
  config: z.record(JsonValue).optional(),
  status: ConnectorInstallationStatus.optional(),
  mockMode: z.boolean().optional(),
  enabled: z.boolean().optional(),
  capabilities: z.array(z.string()).optional(),
  safetyFlags: z.record(JsonValue).optional(),
  timeoutMs: z.number().int().min(1000).max(60000).optional(),
});
export type ConnectorInstallationUpdateRequest = z.infer<typeof ConnectorInstallationUpdateRequest>;
