import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { KnowledgeService } from '../src/knowledge/knowledge.service.js';
import { InMemoryStore } from '../src/support-sessions/in-memory.store.js';
import type { Store } from '../src/store/store.interface.js';
import type { KnowledgeArticle, KnowledgeSource } from '@supportplane/contracts';

const tenantId = 'tenant-knowledge';
const userId = 'user-knowledge';

function now() {
  return new Date('2026-05-01T12:00:00.000Z').toISOString();
}

function source(id = 'kb-source-test'): KnowledgeSource {
  return {
    id: id as KnowledgeSource['id'],
    tenantId: tenantId as KnowledgeSource['tenantId'],
    name: 'Runbook Source',
    description: 'Source used by retrieval tests',
    adapterType: 'manual',
    status: 'active',
    config: {},
    createdAt: now(),
    updatedAt: now(),
  };
}

function article(input?: Partial<KnowledgeArticle>): KnowledgeArticle {
  return {
    id: 'kb-article-test' as KnowledgeArticle['id'],
    tenantId: tenantId as KnowledgeArticle['tenantId'],
    sourceId: 'kb-source-test' as KnowledgeArticle['sourceId'],
    title: 'VPN reset runbook',
    content: 'Reset the VPN client profile and rotate the local cached tunnel credentials.',
    tags: ['vpn'],
    metadata: { importedFrom: 'fixture' },
    status: 'published',
    createdAt: now(),
    updatedAt: now(),
    ...input,
  };
}

describe('Knowledge retrieval hardening', () => {
  const originalProvider = process.env['SUPPORTPLANE_KNOWLEDGE_EMBEDDING_PROVIDER'];

  beforeEach(() => {
    delete process.env['SUPPORTPLANE_KNOWLEDGE_EMBEDDING_PROVIDER'];
  });

  afterEach(() => {
    if (originalProvider === undefined) {
      delete process.env['SUPPORTPLANE_KNOWLEDGE_EMBEDDING_PROVIDER'];
    } else {
      process.env['SUPPORTPLANE_KNOWLEDGE_EMBEDDING_PROVIDER'] = originalProvider;
    }
  });

  it('uses lexical fallback with explicit pgvector reason and source provenance', async () => {
    const store = new InMemoryStore();
    store.saveKnowledgeSource(source());
    store.saveKnowledgeArticle(article());
    const service = new KnowledgeService(store);

    const response = await service.retrieve(tenantId, userId, { query: 'VPN', mode: 'auto', limit: 5 });

    assert.equal(response.retrievalMethod, 'lexical');
    assert.equal(response.pgvectorEnabled, false);
    assert.match(response.pgvectorReason, /in-memory store/);
    assert.equal(response.semanticEligible, false);
    assert.equal(response.embeddingProviderAvailable, false);
    assert.match(response.fallbackReason ?? '', /in-memory store/);
    assert.equal(response.results.length, 1);
    assert.equal(response.results[0].provenance.sourceName, 'Runbook Source');
    assert.equal(response.results[0].provenance.retrievalMethod, 'lexical');
    assert.equal(response.results[0].provenance.scoreKind, 'lexical_rank');
  });

  it('does not fabricate retrieval confidence', async () => {
    const store = new InMemoryStore();
    store.saveKnowledgeSource(source());
    store.saveKnowledgeArticle(article());
    const service = new KnowledgeService(store);

    const response = await service.retrieve(tenantId, userId, { query: 'VPN', mode: 'auto', limit: 1 });

    assert.equal(response.results[0].provenance.confidence, null);
    assert.equal(Object.hasOwn(response.results[0], 'confidence'), false);
  });

  it('keeps semantic requests lexical when pgvector is ready but provider is unavailable', async () => {
    const auditEvents: unknown[] = [];
    const fakeStore = {
      listKnowledgeArticles: () => [article({
        embeddingProvider: 'deterministic-mock',
        embeddingModel: 'supportplane-deterministic-test-embedding-v1',
        embeddingDimensions: 8,
        embeddingContentHash: 'hash',
        embeddedAt: now(),
      })],
      searchKnowledgeArticles: () => [article()],
      getKnowledgeSource: () => source(),
      saveAuditEvent: (event: unknown) => auditEvents.push(event),
      getKnowledgeRetrievalReadiness: () => ({
        pgvectorEnabled: true,
        pgvectorReason: 'pgvector extension installed (0.8.0)',
        vectorColumnAvailable: true,
        vectorColumnReason: 'knowledge article vector column is available',
      }),
      searchSemanticKnowledgeArticles: () => {
        throw new Error('semantic search should not run without provider');
      },
    } as unknown as Store;
    const service = new KnowledgeService(fakeStore);

    const response = await service.retrieve(tenantId, userId, { query: 'VPN', mode: 'semantic', limit: 1 });

    assert.equal(response.retrievalMethod, 'lexical');
    assert.equal(response.pgvectorEnabled, true);
    assert.equal(response.embeddingProviderAvailable, false);
    assert.match(response.fallbackReason ?? '', /EMBEDDING_PROVIDER is not configured/);
    assert.equal(auditEvents.length, 1);
  });

  it('selects hybrid semantic path only when pgvector, vector column, embeddings, and provider are available', async () => {
    process.env['SUPPORTPLANE_KNOWLEDGE_EMBEDDING_PROVIDER'] = 'deterministic-mock';
    const embeddedArticle = article({
      embeddingProvider: 'deterministic-mock',
      embeddingModel: 'supportplane-deterministic-test-embedding-v1',
      embeddingDimensions: 8,
      embeddingContentHash: 'hash',
      embeddedAt: now(),
    });
    let semanticCalls = 0;
    const fakeStore = {
      listKnowledgeArticles: () => [embeddedArticle],
      searchKnowledgeArticles: () => {
        throw new Error('lexical search should not run when semantic prerequisites are proven');
      },
      searchSemanticKnowledgeArticles: (_tenantId: string, queryEmbedding: number[]) => {
        semanticCalls += 1;
        assert.equal(queryEmbedding.length, 8);
        return [embeddedArticle];
      },
      getKnowledgeSource: () => source(),
      saveAuditEvent: () => undefined,
      getKnowledgeRetrievalReadiness: () => ({
        pgvectorEnabled: true,
        pgvectorReason: 'pgvector extension installed (0.8.0)',
        vectorColumnAvailable: true,
        vectorColumnReason: 'knowledge article vector column is available',
      }),
    } as unknown as Store;
    const service = new KnowledgeService(fakeStore);

    const response = await service.retrieve(tenantId, userId, { query: 'VPN', mode: 'auto', limit: 1 });

    assert.equal(response.semanticEligible, true);
    assert.equal(response.retrievalMethod, 'hybrid');
    assert.equal(response.pgvectorEnabled, true);
    assert.equal(response.embeddingProvider, 'deterministic-mock');
    assert.equal(response.fallbackReason, undefined);
    assert.equal(response.results[0].provenance.retrievalMethod, 'hybrid');
    assert.equal(response.results[0].provenance.scoreKind, 'hybrid_rank');
    assert.equal(semanticCalls, 1);
  });
});
