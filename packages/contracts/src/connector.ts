import { z } from 'zod';
import { EntityId, TenantId, JsonValue } from './base.js';

export const ConnectorMode = z.enum(['mock', 'zammad']);
export type ConnectorMode = z.infer<typeof ConnectorMode>;

export const ConnectorHealthStatus = z.enum([
  'healthy',
  'degraded',
  'unhealthy',
  'unknown',
]);
export type ConnectorHealthStatus = z.infer<typeof ConnectorHealthStatus>;

export const ZammadConfig = z.object({
  baseUrl: z.string().url().max(2048),
  apiToken: z.string().min(1).max(2048),
  timeoutMs: z.number().int().min(1000).max(60000).default(10000),
});
export type ZammadConfig = z.infer<typeof ZammadConfig>;

export const ConnectorConfig = z.object({
  mode: ConnectorMode.default('mock'),
  zammad: ZammadConfig.optional(),
});
export type ConnectorConfig = z.infer<typeof ConnectorConfig>;

export const ConnectorStatus = z.object({
  mode: ConnectorMode,
  health: ConnectorHealthStatus,
  adapterType: z.string().min(1).max(64),
  capabilities: z.array(z.string()).default([]),
  connected: z.boolean().default(false),
  lastError: z.string().max(2048).optional(),
  metadata: z.record(JsonValue).default({}),
});
export type ConnectorStatus = z.infer<typeof ConnectorStatus>;

export const ConnectorTestResult = z.object({
  mode: ConnectorMode,
  success: z.boolean(),
  latencyMs: z.number().int().min(0).optional(),
  error: z.string().max(2048).optional(),
  metadata: z.record(JsonValue).default({}),
});
export type ConnectorTestResult = z.infer<typeof ConnectorTestResult>;

export const ConnectorErrorCode = z.enum([
  'CONFIG_INVALID',
  'CONFIG_MISSING',
  'AUTH_FAILED',
  'TICKET_NOT_FOUND',
  'TICKET_READ_FAILED',
  'CUSTOMER_READ_FAILED',
  'NOTEBACK_WRITE_FAILED',
  'NETWORK_ERROR',
  'TIMEOUT',
  'UNKNOWN',
]);
export type ConnectorErrorCode = z.infer<typeof ConnectorErrorCode>;

export const ConnectorError = z.object({
  code: ConnectorErrorCode,
  message: z.string().max(2048),
  safeToDisplay: z.boolean().default(false),
  metadata: z.record(JsonValue).default({}),
});
export type ConnectorError = z.infer<typeof ConnectorError>;

export const InternalNoteDraft = z.object({
  id: EntityId,
  tenantId: TenantId,
  sessionId: EntityId,
  externalTicketId: z.string().min(1).max(256),
  subject: z.string().max(1024).optional(),
  body: z.string().min(1).max(65535),
  reviewed: z.boolean().default(false),
  reviewerId: EntityId.optional(),
  createdAt: z.string().datetime({ offset: true }),
});
export type InternalNoteDraft = z.infer<typeof InternalNoteDraft>;

export const InternalNoteWritebackRequest = z.object({
  draftId: EntityId,
  externalTicketId: z.string().min(1).max(256),
  body: z.string().min(1).max(65535),
  internal: z.boolean().default(true),
});
export type InternalNoteWritebackRequest = z.infer<typeof InternalNoteWritebackRequest>;

export const InternalNoteWritebackResult = z.object({
  success: z.boolean(),
  externalArticleId: z.string().max(256).optional(),
  error: ConnectorError.optional(),
  metadata: z.record(JsonValue).optional(),
});
export type InternalNoteWritebackResult = z.infer<typeof InternalNoteWritebackResult>;

export const ConnectorAuditMetadata = z.object({
  tenantId: TenantId,
  actorId: EntityId,
  connectorType: z.string().min(1).max(64),
  mode: ConnectorMode,
  sessionId: EntityId.optional(),
  externalTicketId: z.string().max(256).optional(),
  operation: z.string().min(1).max(128),
  success: z.boolean(),
  errorCode: ConnectorErrorCode.optional(),
  errorMessage: z.string().max(2048).optional(),
});
export type ConnectorAuditMetadata = z.infer<typeof ConnectorAuditMetadata>;
