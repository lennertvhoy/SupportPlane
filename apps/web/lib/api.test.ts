import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { api } from './api';

describe('web API client', () => {
  it('handles draft suggestion response shape', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(
        input,
        'http://localhost:4110/support-sessions/session-1/draft-suggestion'
      );
      assert.equal(init?.method, 'POST');
      assert.equal(
        (init?.headers as Headers).get('x-tenant-id'),
        'dev-tenant'
      );
      return new Response(
        JSON.stringify({
          draft: '[MOCK AI DRAFT - review required before any writeback]',
          provider: 'mock',
          model: 'mock-support-note-v1',
          prompt: {
            id: 'support-note-draft',
            version: 'mock-v1',
            purpose: 'Draft a reviewable internal support note.',
          },
          contextHash: 'abc123',
          usage: { placeholder: true },
          safety: {
            mockOnly: true,
            externalCallMade: false,
            policyChecks: ['mock_provider_only'],
            reviewRequired: true,
            writebackAllowed: false,
          },
          generatedAt: '2026-04-26T18:00:00.000Z',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const response = await api.generateDraftSuggestion('session-1', {
        operatorInstructions: 'Keep it short.',
      });

      assert.equal(response.provider, 'mock');
      assert.equal(response.prompt.version, 'mock-v1');
      assert.equal(response.contextHash, 'abc123');
      assert.equal(response.safety.writebackAllowed, false);
      assert.match(response.draft, /MOCK AI DRAFT/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
