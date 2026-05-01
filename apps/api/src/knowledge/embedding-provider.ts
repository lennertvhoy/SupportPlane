import { createHash } from 'node:crypto';

export interface EmbeddingProvider {
  readonly id: string;
  readonly model: string;
  readonly dimensions: number;
  embed(text: string): Promise<number[]>;
}

export interface EmbeddingProviderStatus {
  available: boolean;
  reason: string;
  provider?: EmbeddingProvider;
}

export class DeterministicMockEmbeddingProvider implements EmbeddingProvider {
  readonly id = 'deterministic-mock';
  readonly model = 'supportplane-deterministic-test-embedding-v1';
  readonly dimensions = 8;

  async embed(text: string): Promise<number[]> {
    const hash = createHash('sha256').update(text).digest();
    const values = Array.from({ length: this.dimensions }, (_, index) => {
      const raw = hash.readUInt32BE(index * 4);
      return raw / 0xffffffff;
    });
    const magnitude = Math.sqrt(values.reduce((sum, value) => sum + value * value, 0)) || 1;
    return values.map((value) => Number((value / magnitude).toFixed(8)));
  }
}

export function resolveEmbeddingProvider(): EmbeddingProviderStatus {
  const configured = process.env['SUPPORTPLANE_KNOWLEDGE_EMBEDDING_PROVIDER'];
  if (!configured) {
    return {
      available: false,
      reason: 'SUPPORTPLANE_KNOWLEDGE_EMBEDDING_PROVIDER is not configured',
    };
  }
  if (configured === 'deterministic-mock') {
    return {
      available: true,
      reason: 'deterministic mock embedding provider configured for tests/local development',
      provider: new DeterministicMockEmbeddingProvider(),
    };
  }
  return {
    available: false,
    reason: `embedding provider '${configured}' is not implemented`,
  };
}

export function knowledgeContentHash(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}
