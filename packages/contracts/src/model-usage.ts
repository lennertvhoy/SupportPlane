import { z } from 'zod';

export const ModelUsageLogEntry = z.object({
  id: z.string(),
  tenantId: z.string(),
  actorId: z.string(),
  actorType: z.string().default('user'),
  sessionId: z.string().optional(),
  ticketId: z.string().optional(),
  feature: z.enum(['chat', 'summary', 'draft', 'greeting', 'retrieval', 'other']),
  provider: z.string(),
  model: z.string(),
  promptTokens: z.number().int().nonnegative().optional(),
  completionTokens: z.number().int().nonnegative().optional(),
  totalTokens: z.number().int().nonnegative().optional(),
  latencyMs: z.number().int().nonnegative(),
  estimatedCostUsd: z.number().nonnegative().optional(),
  status: z.enum(['succeeded', 'failed', 'blocked_by_policy', 'fallback_mock']),
  errorCode: z.string().optional(),
  metadata: z.record(z.unknown()).default({}),
  createdAt: z.string().datetime(),
});
export type ModelUsageLogEntry = z.infer<typeof ModelUsageLogEntry>;

export const ModelUsageQuery = z.object({
  tenantId: z.string().optional(),
  feature: z.enum(['chat', 'summary', 'draft', 'greeting', 'retrieval', 'other']).optional(),
  provider: z.string().optional(),
  status: z.enum(['succeeded', 'failed', 'blocked_by_policy', 'fallback_mock']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100),
  offset: z.coerce.number().int().min(0).default(0),
});
export type ModelUsageQuery = z.infer<typeof ModelUsageQuery>;

export const ModelUsageSummary = z.object({
  totalCalls: z.number().int(),
  totalTokens: z.number().int().optional(),
  totalCostUsd: z.number().optional(),
  avgLatencyMs: z.number().optional(),
  byFeature: z.record(z.number().int()).default({}),
  byProvider: z.record(z.number().int()).default({}),
  byStatus: z.record(z.number().int()).default({}),
});
export type ModelUsageSummary = z.infer<typeof ModelUsageSummary>;

export const AiProviderReadiness = z.object({
  id: z.string(),
  configured: z.boolean(),
  enabled: z.boolean(),
  enabledByPolicy: z.boolean(),
  reason: z.string().optional(),
  model: z.string().optional(),
  classification: z.enum(['mock', 'local', 'cloud']),
});
export type AiProviderReadiness = z.infer<typeof AiProviderReadiness>;
