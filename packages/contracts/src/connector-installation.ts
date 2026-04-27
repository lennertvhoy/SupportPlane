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
  adapterType: z.string().min(1).max(64),
  config: z.record(JsonValue).default({}),
  secretReferenceIds: z.array(z.string()).default([]),
  status: ConnectorInstallationStatus.default('inactive'),
  safetyFlags: z.record(JsonValue).default({}),
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
  config: z.record(JsonValue).optional(),
  status: ConnectorInstallationStatus.optional(),
  safetyFlags: z.record(JsonValue).optional(),
});
export type ConnectorInstallationUpdateRequest = z.infer<typeof ConnectorInstallationUpdateRequest>;
