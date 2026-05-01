import { z } from 'zod';
import { EntityId, TenantId, Timestamp } from './base.js';

export const KnowledgeSourceId = EntityId.brand<'KnowledgeSourceId'>();
export type KnowledgeSourceId = z.infer<typeof KnowledgeSourceId>;

export const KnowledgeArticleId = EntityId.brand<'KnowledgeArticleId'>();
export type KnowledgeArticleId = z.infer<typeof KnowledgeArticleId>;

export const KnowledgeSourceStatus = z.enum(['active', 'inactive', 'error']);
export type KnowledgeSourceStatus = z.infer<typeof KnowledgeSourceStatus>;

export const KnowledgeArticleStatus = z.enum(['draft', 'published', 'archived']);
export type KnowledgeArticleStatus = z.infer<typeof KnowledgeArticleStatus>;

export const KnowledgeSource = z.object({
  id: KnowledgeSourceId,
  tenantId: TenantId,
  name: z.string().min(1).max(256),
  description: z.string().max(2048).optional(),
  adapterType: z.string().min(1).max(64).default('manual'),
  status: KnowledgeSourceStatus,
  config: z.record(z.unknown()).default({}),
  lastSyncAt: Timestamp.optional(),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type KnowledgeSource = z.infer<typeof KnowledgeSource>;

export const KnowledgeArticle = z.object({
  id: KnowledgeArticleId,
  tenantId: TenantId,
  sourceId: KnowledgeSourceId,
  title: z.string().min(1).max(512),
  content: z.string().min(1).max(50000),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  status: KnowledgeArticleStatus.default('published'),
  createdAt: Timestamp,
  updatedAt: Timestamp,
});
export type KnowledgeArticle = z.infer<typeof KnowledgeArticle>;

export const CreateKnowledgeSourceRequest = z.object({
  name: z.string().min(1).max(256),
  description: z.string().max(2048).optional(),
  adapterType: z.string().min(1).max(64).default('manual'),
  config: z.record(z.unknown()).default({}),
});
export type CreateKnowledgeSourceRequest = z.infer<typeof CreateKnowledgeSourceRequest>;

export const CreateKnowledgeArticleRequest = z.object({
  sourceId: KnowledgeSourceId,
  title: z.string().min(1).max(512),
  content: z.string().min(1).max(50000),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
  status: KnowledgeArticleStatus.default('published'),
});
export type CreateKnowledgeArticleRequest = z.infer<typeof CreateKnowledgeArticleRequest>;

export const KnowledgeRetrievalRequest = z.object({
  query: z.string().min(1).max(2048),
  sourceIds: z.array(z.string()).optional(),
  limit: z.number().int().min(1).max(50).default(10),
});
export type KnowledgeRetrievalRequest = z.infer<typeof KnowledgeRetrievalRequest>;

export const KnowledgeRetrievalResult = z.object({
  articleId: KnowledgeArticleId,
  sourceId: KnowledgeSourceId,
  title: z.string(),
  snippet: z.string(),
  score: z.number().min(0).max(1),
  provenance: z.object({
    sourceName: z.string(),
    articleStatus: KnowledgeArticleStatus,
    retrievedAt: z.string().datetime({ offset: true }),
    retrievalMethod: z.enum(['lexical', 'semantic', 'hybrid']),
  }),
});
export type KnowledgeRetrievalResult = z.infer<typeof KnowledgeRetrievalResult>;

export const KnowledgeRetrievalResponse = z.object({
  query: z.string(),
  results: z.array(KnowledgeRetrievalResult),
  totalAvailable: z.number().int().min(0),
  retrievalMethod: z.enum(['lexical', 'semantic', 'hybrid']),
  pgvectorEnabled: z.boolean().default(false),
  mockDevOnly: z.boolean().default(true),
});
export type KnowledgeRetrievalResponse = z.infer<typeof KnowledgeRetrievalResponse>;
