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

    const article: KnowledgeArticleShape = {
      id: `kb-article-${Date.now()}` as KnowledgeArticleId,
      tenantId: tenantId as TenantId,
      sourceId: request.sourceId,
      title: request.title,
      content: request.content,
      tags: request.tags,
      metadata: request.metadata,
      status: request.status,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
    const articles = await this.store.searchKnowledgeArticles(tenantId, request.query, {
      sourceIds: request.sourceIds,
      limit: request.limit,
    });

    const results: KnowledgeRetrievalResult[] = articles.map((article, index) => {
      // Simple lexical scoring: higher score for title matches
      const titleMatch = article.title.toLowerCase().includes(request.query.toLowerCase());
      const score = titleMatch ? 0.9 - index * 0.02 : 0.7 - index * 0.02;
      return {
        articleId: article.id,
        sourceId: article.sourceId,
        title: article.title,
        snippet: article.content.slice(0, 200) + (article.content.length > 200 ? '...' : ''),
        score: Math.max(0.1, score),
        provenance: {
          sourceName: article.sourceId,
          articleStatus: article.status,
          retrievedAt: new Date().toISOString(),
          retrievalMethod: 'lexical',
        },
      };
    });

    await this.store.saveAuditEvent({
      id: `audit-${Date.now()}` as AuditEventId,
      tenantId: tenantId as TenantId,
      eventType: 'knowledge_retrieval_query',
      actorType: 'user',
      actorId: userId,
      action: 'search',
      resourceType: 'knowledge_article',
      resourceId: 'query',
      metadata: { query: request.query, resultCount: results.length, method: 'lexical' },
      hashChainPrevious: undefined,
      integrityHash: computeIntegrityHash({ tenantId, eventType: 'knowledge_retrieval_query', resourceId: request.query }),
      createdAt: new Date().toISOString(),
    });

    return {
      query: request.query,
      results,
      totalAvailable: results.length,
      retrievalMethod: 'lexical',
      pgvectorEnabled: false,
      mockDevOnly: true,
    };
  }
}
