import { z } from 'zod';
import { EntityId, JsonValue, TenantId, Timestamp } from './base.js';

export const EndpointDeviceId = EntityId.brand<'EndpointDeviceId'>();
export type EndpointDeviceId = z.infer<typeof EndpointDeviceId>;

export const EndpointDiagnosticSnapshotId = EntityId.brand<'EndpointDiagnosticSnapshotId'>();
export type EndpointDiagnosticSnapshotId = z.infer<typeof EndpointDiagnosticSnapshotId>;

export const EndpointCommandId = EntityId.brand<'EndpointCommandId'>();
export type EndpointCommandId = z.infer<typeof EndpointCommandId>;

export const EndpointCommandResultId = EntityId.brand<'EndpointCommandResultId'>();
export type EndpointCommandResultId = z.infer<typeof EndpointCommandResultId>;

export const EndpointDeviceStatus = z.enum(['online', 'offline', 'stale', 'disabled']);
export type EndpointDeviceStatus = z.infer<typeof EndpointDeviceStatus>;

export const EndpointDiagnosticKind = z.enum([
  'inventory',
  'disk',
  'network',
  'services',
  'software',
  'status',
]);
export type EndpointDiagnosticKind = z.infer<typeof EndpointDiagnosticKind>;

export const EndpointCommandKind = z.enum([
  'collect_inventory',
  'collect_disk',
  'collect_network',
  'collect_services',
  'ping_self',
]);
export type EndpointCommandKind = z.infer<typeof EndpointCommandKind>;

export const EndpointCommandStatus = z.enum([
  'queued',
  'claimed',
  'running',
  'succeeded',
  'failed',
  'expired',
  'rejected',
]);
export type EndpointCommandStatus = z.infer<typeof EndpointCommandStatus>;

export const EndpointDevice = z.object({
  id: EndpointDeviceId,
  tenantId: TenantId,
  displayName: z.string().min(1).max(160),
  hostname: z.string().min(1).max(160),
  deviceKey: z.string().min(8).max(256),
  fingerprint: z.string().min(8).max(256),
  platform: z.string().min(1).max(80),
  agentVersion: z.string().min(1).max(80),
  status: EndpointDeviceStatus,
  lastSeenAt: Timestamp.optional(),
  enrolledAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type EndpointDevice = z.infer<typeof EndpointDevice>;

export const EndpointHeartbeat = z.object({
  id: EntityId,
  tenantId: TenantId,
  deviceId: EndpointDeviceId,
  status: EndpointDeviceStatus,
  agentVersion: z.string().min(1).max(80),
  observedAt: Timestamp,
  summary: z.record(JsonValue).default({}),
});
export type EndpointHeartbeat = z.infer<typeof EndpointHeartbeat>;

export const EndpointDiagnosticSnapshot = z.object({
  id: EndpointDiagnosticSnapshotId,
  tenantId: TenantId,
  deviceId: EndpointDeviceId,
  kind: EndpointDiagnosticKind,
  payload: z.record(JsonValue).default({}),
  collectedAt: Timestamp,
  sourceAgentVersion: z.string().min(1).max(80),
  createdAt: Timestamp,
});
export type EndpointDiagnosticSnapshot = z.infer<typeof EndpointDiagnosticSnapshot>;

export const EndpointCommand = z.object({
  id: EndpointCommandId,
  tenantId: TenantId,
  deviceId: EndpointDeviceId,
  commandKind: EndpointCommandKind,
  status: EndpointCommandStatus,
  nonce: z.string().min(16).max(128),
  idempotencyKey: z.string().min(8).max(256),
  requestedByUserId: EntityId,
  requestedAt: Timestamp,
  claimedAt: Timestamp.optional(),
  completedAt: Timestamp.optional(),
  expiresAt: Timestamp,
  policyDecision: z.record(JsonValue).default({}),
  result: z.record(JsonValue).optional(),
  errorCode: z.string().max(80).optional(),
  errorMessage: z.string().max(512).optional(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type EndpointCommand = z.infer<typeof EndpointCommand>;

export const EndpointCommandResult = z.object({
  id: EndpointCommandResultId,
  commandId: EndpointCommandId,
  tenantId: TenantId,
  deviceId: EndpointDeviceId,
  status: EndpointCommandStatus,
  payload: z.record(JsonValue).default({}),
  errorCode: z.string().max(80).optional(),
  errorMessage: z.string().max(512).optional(),
  submittedAt: Timestamp,
});
export type EndpointCommandResult = z.infer<typeof EndpointCommandResult>;
