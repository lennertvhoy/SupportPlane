import { Injectable, NotFoundException } from '@nestjs/common';
import { Store } from '../store/store.interface.js';
import { InMemoryStore } from '../support-sessions/in-memory.store.js';
import { Inject } from '@nestjs/common';
import {
  type KnowledgeSource as KnowledgeSourceShape,
  type KnowledgeArticle as KnowledgeArticleShape,
  type CreateKnowledgeSourceRequest,
  type CreateKnowledgeArticleRequest,
  type KnowledgeRetrievalRequest,
  type KnowledgeRetrievalResponse,
  KnowledgeRetrievalResult,
  KnowledgeSourceId,
  KnowledgeArticleId,
  TenantId,
  AuditEventId,
} from '@supportplane/contracts';
import { computeIntegrityHash } from '@supportplane/audit';
import { knowledgeContentHash, resolveEmbeddingProvider } from './embedding-provider.js';

@Injectable()
export class KnowledgeService {
  constructor(
    @Inject(InMemoryStore) private readonly store: Store,
  ) {}

  async createSource(
    tenantId: string,
    userId: string,
    request: CreateKnowledgeSourceRequest,
  ): Promise<KnowledgeSourceShape> {
    const source: KnowledgeSourceShape = {
      id: `kb-source-${Date.now()}` as KnowledgeSourceId,
      tenantId: tenantId as TenantId,
      name: request.name,
      description: request.description,
      adapterType: request.adapterType,
      status: 'active',
      config: request.config,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await this.store.saveKnowledgeSource(source);
    await this.store.saveAuditEvent({
      id: `audit-${Date.now()}` as AuditEventId,
      tenantId: tenantId as TenantId,
      eventType: 'knowledge_source_created',
      actorType: 'user',
      actorId: userId,
      action: 'create',
      resourceType: 'knowledge_source',
      resourceId: source.id,
      metadata: { name: request.name, adapterType: request.adapterType },
      hashChainPrevious: undefined,
      integrityHash: computeIntegrityHash({ tenantId, eventType: 'knowledge_source_created', resourceId: source.id }),
      createdAt: new Date().toISOString(),
    });
    return source;
  }

  async listSources(tenantId: string): Promise<KnowledgeSourceShape[]> {
    return this.store.listKnowledgeSources(tenantId);
  }

  async getSource(tenantId: string, id: string): Promise<KnowledgeSourceShape> {
    const source = await this.store.getKnowledgeSource(tenantId, id);
    if (!source) throw new NotFoundException('Knowledge source not found');
    return source;
  }

  async createArticle(
    tenantId: string,
    userId: string,
    request: CreateKnowledgeArticleRequest,
  ): Promise<KnowledgeArticleShape> {
    // Verify source exists and belongs to tenant
    const source = await this.store.getKnowledgeSource(tenantId, request.sourceId);
    if (!source) throw new NotFoundException('Knowledge source not found');

    const embeddingStatus = resolveEmbeddingProvider();
    const now = new Date().toISOString();
    let embeddingMetadata: Pick<KnowledgeArticleShape, 'embeddingProvider' | 'embeddingModel' | 'embeddingDimensions' | 'embeddingContentHash' | 'embeddedAt'> = {};
    if (embeddingStatus.available && embeddingStatus.provider) {
      await embeddingStatus.provider.embed(`${request.title}\n\n${request.content}`);
      embeddingMetadata = {
        embeddingProvider: embeddingStatus.provider.id,
        embeddingModel: embeddingStatus.provider.model,
        embeddingDimensions: embeddingStatus.provider.dimensions,
        embeddingContentHash: knowledgeContentHash(`${request.title}\n\n${request.content}`),
        embeddedAt: now,
      };
    }

    const article: KnowledgeArticleShape = {
      id: `kb-article-${Date.now()}` as KnowledgeArticleId,
      tenantId: tenantId as TenantId,
      sourceId: request.sourceId,
      title: request.title,
      content: request.content,
      tags: request.tags,
      metadata: request.metadata,
      ...embeddingMetadata,
      status: request.status,
      createdAt: now,
      updatedAt: now,
    };
    await this.store.saveKnowledgeArticle(article);
    await this.store.saveAuditEvent({
      id: `audit-${Date.now()}` as AuditEventId,
      tenantId: tenantId as TenantId,
      eventType: 'knowledge_article_created',
      actorType: 'user',
      actorId: userId,
      action: 'create',
      resourceType: 'knowledge_article',
      resourceId: article.id,
      metadata: { sourceId: request.sourceId, title: request.title },
      hashChainPrevious: undefined,
      integrityHash: computeIntegrityHash({ tenantId, eventType: 'knowledge_article_created', resourceId: article.id }),
      createdAt: new Date().toISOString(),
    });
    return article;
  }

  async listArticles(
    tenantId: string,
    options?: { sourceId?: string; status?: string },
  ): Promise<KnowledgeArticleShape[]> {
    return this.store.listKnowledgeArticles(tenantId, options);
  }

  async getArticle(tenantId: string, id: string): Promise<KnowledgeArticleShape> {
    const article = await this.store.getKnowledgeArticle(tenantId, id);
    if (!article) throw new NotFoundException('Knowledge article not found');
    return article;
  }

  async retrieve(
    tenantId: string,
    userId: string,
    request: KnowledgeRetrievalRequest,
  ): Promise<KnowledgeRetrievalResponse> {
    const readiness = await this.getReadiness();
    const embeddingStatus = resolveEmbeddingProvider();
    const requestedMode = request.mode ?? 'auto';
    const candidates = await this.store.listKnowledgeArticles(tenantId, {
      status: 'published',
    });
    const scopedCandidates = candidates.filter((article) => {
      if (!request.sourceIds || request.sourceIds.length === 0) return true;
      return request.sourceIds.includes(article.sourceId);
    });
    const embeddedCandidates = scopedCandidates.filter((article) => Boolean(article.embeddingProvider && article.embeddingModel && article.embeddingDimensions && article.embeddedAt));
    const hasEmbeddedArticles = embeddedCandidates.length > 0;
    const semanticEligible = Boolean(
      readiness.pgvectorEnabled &&
      readiness.vectorColumnAvailable &&
      embeddingStatus.available &&
      hasEmbeddedArticles &&
      this.store.searchSemanticKnowledgeArticles,
    );
    const fallbackReason = this.fallbackReason({
      requestedMode,
      readiness,
      embeddingProviderAvailable: embeddingStatus.available,
      embeddingProviderReason: embeddingStatus.reason,
      hasEmbeddedArticles,
      semanticSearchAvailable: Boolean(this.store.searchSemanticKnowledgeArticles),
    });

    const retrievalMethod = this.chooseRetrievalMethod(requestedMode, semanticEligible);
    const articles = await this.searchArticles(tenantId, request.query, retrievalMethod, embeddingStatus.provider, {
      sourceIds: request.sourceIds,
      limit: request.limit,
    });

    const results: KnowledgeRetrievalResult[] = [];
    for (const [index, article] of articles.entries()) {
      const source = await this.store.getKnowledgeSource(tenantId, article.sourceId);
      // Simple lexical scoring: higher score for title matches
      const titleMatch = article.title.toLowerCase().includes(request.query.toLowerCase());
      const baseScore = retrievalMethod === 'lexical'
        ? (titleMatch ? 0.9 - index * 0.02 : 0.7 - index * 0.02)
        : (0.85 - index * 0.02);
      results.push({
        articleId: article.id,
        sourceId: article.sourceId,
        title: article.title,
        snippet: article.content.slice(0, 200) + (article.content.length > 200 ? '...' : ''),
        score: Math.max(0.1, baseScore),
        provenance: {
          sourceName: source?.name ?? article.sourceId,
          articleStatus: article.status,
          retrievedAt: new Date().toISOString(),
          retrievalMethod,
          scoreKind: retrievalMethod === 'semantic' ? 'vector_distance' : retrievalMethod === 'hybrid' ? 'hybrid_rank' : 'lexical_rank',
          confidence: null,
          embeddingProvider: article.embeddingProvider,
          embeddingModel: article.embeddingModel,
          pgvectorEnabled: readiness.pgvectorEnabled,
          fallbackReason: retrievalMethod === 'lexical' ? fallbackReason : undefined,
        },
      });
    }

    await this.store.saveAuditEvent({
      id: `audit-${Date.now()}` as AuditEventId,
      tenantId: tenantId as TenantId,
      eventType: 'knowledge_retrieval_query',
      actorType: 'user',
      actorId: userId,
      action: 'search',
      resourceType: 'knowledge_article',
      resourceId: 'query',
      metadata: {
        query: request.query,
        resultCount: results.length,
        requestedMode,
        method: retrievalMethod,
        pgvectorEnabled: readiness.pgvectorEnabled,
        pgvectorReason: readiness.pgvectorReason,
        embeddingProviderAvailable: embeddingStatus.available,
        fallbackReason,
      },
      hashChainPrevious: undefined,
      integrityHash: computeIntegrityHash({ tenantId, eventType: 'knowledge_retrieval_query', resourceId: request.query }),
      createdAt: new Date().toISOString(),
    });

    return {
      query: request.query,
      results,
      totalAvailable: results.length,
      retrievalMethod,
      pgvectorEnabled: readiness.pgvectorEnabled,
      pgvectorReason: readiness.pgvectorReason,
      embeddingProvider: embeddingStatus.provider?.id,
      embeddingProviderAvailable: embeddingStatus.available,
      embeddingProviderReason: embeddingStatus.reason,
      semanticEligible,
      fallbackReason: retrievalMethod === 'lexical' ? fallbackReason : undefined,
      mockDevOnly: true,
    };
  }

  private async getReadiness() {
    if (this.store.getKnowledgeRetrievalReadiness) {
      return this.store.getKnowledgeRetrievalReadiness();
    }
    return {
      pgvectorEnabled: false,
      pgvectorReason: 'store does not expose pgvector readiness',
      vectorColumnAvailable: false,
      vectorColumnReason: 'store does not expose vector column readiness',
    };
  }

  private chooseRetrievalMethod(
    requestedMode: KnowledgeRetrievalRequest['mode'] | undefined,
    semanticEligible: boolean,
  ): KnowledgeRetrievalResponse['retrievalMethod'] {
    if (!semanticEligible) return 'lexical';
    if (requestedMode === 'semantic') return 'semantic';
    if (requestedMode === 'hybrid' || requestedMode === 'auto' || !requestedMode) return 'hybrid';
    return 'lexical';
  }

  private fallbackReason(input: {
    requestedMode: KnowledgeRetrievalRequest['mode'] | undefined;
    readiness: Awaited<ReturnType<KnowledgeService['getReadiness']>>;
    embeddingProviderAvailable: boolean;
    embeddingProviderReason: string;
    hasEmbeddedArticles: boolean;
    semanticSearchAvailable: boolean;
  }): string | undefined {
    if (input.requestedMode === 'lexical') return 'lexical mode was explicitly requested';
    if (!input.readiness.pgvectorEnabled) return input.readiness.pgvectorReason;
    if (!input.readiness.vectorColumnAvailable) return input.readiness.vectorColumnReason;
    if (!input.embeddingProviderAvailable) return input.embeddingProviderReason;
    if (!input.hasEmbeddedArticles) return 'no published knowledge articles have embedding provenance';
    if (!input.semanticSearchAvailable) return 'store does not expose semantic knowledge search';
    return undefined;
  }

  private async searchArticles(
    tenantId: string,
    query: string,
    retrievalMethod: KnowledgeRetrievalResponse['retrievalMethod'],
    provider: ReturnType<typeof resolveEmbeddingProvider>['provider'],
    options?: { sourceIds?: string[]; limit?: number },
  ): Promise<KnowledgeArticleShape[]> {
    if (retrievalMethod !== 'lexical' && provider && this.store.searchSemanticKnowledgeArticles) {
      const embedding = await provider.embed(query);
      return this.store.searchSemanticKnowledgeArticles(tenantId, embedding, options);
    }
    return this.store.searchKnowledgeArticles(tenantId, query, options);
  }
}
