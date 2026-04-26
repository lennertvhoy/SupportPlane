import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { api } from './api';

describe('web API client', () => {
  it('handles connector status response shape', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'http://localhost:4110/connectors/zammad/status');
      assert.equal(init?.method, 'GET');
      return new Response(
        JSON.stringify({
          mode: 'mock',
          health: 'healthy',
          adapterType: 'zammad',
          capabilities: ['read_tickets', 'read_customers', 'write_notes'],
          connected: true,
          metadata: {},
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const response = await api.getConnectorStatus();
      assert.equal(response.mode, 'mock');
      assert.equal(response.health, 'healthy');
      assert.ok(response.capabilities.includes('write_notes'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles connector test response shape', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'http://localhost:4110/connectors/zammad/test');
      assert.equal(init?.method, 'POST');
      return new Response(
        JSON.stringify({
          mode: 'mock',
          success: true,
          latencyMs: 12,
          metadata: { note: 'Mock mode' },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const response = await api.testConnector();
      assert.equal(response.mode, 'mock');
      assert.equal(response.success, true);
      assert.equal(response.latencyMs, 12);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

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

  it('handles evidence bundle JSON response shape', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'http://localhost:4110/support-sessions/session-1/evidence-bundle');
      assert.equal(init?.method, 'GET');
      return new Response(
        JSON.stringify({
          bundle: {
            bundleId: 'bundle-1',
            tenantId: 'dev-tenant',
            sessionId: 'session-1',
            generatedAt: '2026-04-26T18:00:00.000Z',
            generatedBy: 'dev-user',
            exportFormat: 'json',
            version: '1.0.0-mvp',
            sessionSummary: {
              id: 'session-1',
              tenantId: 'dev-tenant',
              status: 'open',
              priority: 'normal',
              title: 'Test',
              startedAt: '2026-04-26T18:00:00.000Z',
              createdAt: '2026-04-26T18:00:00.000Z',
              updatedAt: '2026-04-26T18:00:00.000Z',
            },
            linkedTickets: [],
            contextPackets: [],
            aiUsage: [],
            connectorOperations: [],
            auditTimeline: [],
            mockDevOnlyDisclaimers: ['Mock disclaimer'],
            limitations: ['Limitation 1'],
            sourceProvenance: {
              storeType: 'in-memory',
              persistenceClaimed: false,
              generatedByService: 'supportplane-api',
              schemaVersion: '1.0.0-mvp',
            },
          },
          format: 'json',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const response = await api.getEvidenceBundle('session-1');
      assert.equal(response.bundle.version, '1.0.0-mvp');
      assert.equal(response.bundle.exportFormat, 'json');
      assert.equal(response.bundle.sourceProvenance.storeType, 'in-memory');
      assert.equal(response.format, 'json');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles evidence bundle Markdown response as text', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'http://localhost:4110/support-sessions/session-1/evidence-bundle.md');
      assert.equal(init?.method, 'GET');
      return new Response('# SupportPlane Evidence Bundle\n\nTest markdown', {
        status: 200,
        headers: { 'Content-Type': 'text/markdown' },
      });
    };

    try {
      const text = await api.getEvidenceBundleMarkdown('session-1');
      assert.match(text, /SupportPlane Evidence Bundle/);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles fake incoming call response shape', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'http://localhost:4110/calls/fake-incoming');
      assert.equal(init?.method, 'POST');
      return new Response(
        JSON.stringify({
          id: 'call-1',
          tenantId: 'dev-tenant',
          provider: 'fake_webhook',
          source: 'fake_webhook',
          externalCallId: 'FAKE-001',
          direction: 'inbound',
          status: 'ringing',
          caller: {
            rawNumber: '03 555 01 01',
            normalizedNumber: '+32 3 555 0101',
            displayName: 'Mock Caller',
          },
          callerMatch: {
            status: 'matched',
            confidence: 1.0,
            customerName: 'Acme BVBA',
            matchedTicketIds: ['TICKET-101'],
          },
          startedAt: '2026-04-26T18:00:00.000Z',
          mockDevOnly: true,
          createdAt: '2026-04-26T18:00:00.000Z',
          updatedAt: '2026-04-26T18:00:00.000Z',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const response = await api.createFakeIncomingCall({
        externalCallId: 'FAKE-001',
        rawCallerNumber: '03 555 01 01',
      });
      assert.strictEqual(response.provider, 'fake_webhook');
      assert.strictEqual(response.caller.normalizedNumber, '+32 3 555 0101');
      assert.strictEqual(response.callerMatch?.status, 'matched');
      assert.strictEqual(response.callerMatch?.customerName, 'Acme BVBA');
      assert.strictEqual(response.mockDevOnly, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles call link response shape', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'http://localhost:4110/calls/call-1/link-session');
      assert.equal(init?.method, 'POST');
      return new Response(
        JSON.stringify({
          callEvent: {
            id: 'call-1',
            tenantId: 'dev-tenant',
            sessionId: 'session-1',
            provider: 'fake_webhook',
            externalCallId: 'FAKE-001',
            direction: 'inbound',
            status: 'answered',
            caller: {
              rawNumber: '03 555 01 01',
              normalizedNumber: '+32 3 555 0101',
            },
            mockDevOnly: true,
            startedAt: '2026-04-26T18:00:00.000Z',
            createdAt: '2026-04-26T18:00:00.000Z',
            updatedAt: '2026-04-26T18:00:00.000Z',
          },
          linkedAt: '2026-04-26T18:00:00.000Z',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const response = await api.linkCallToSession('call-1', { sessionId: 'session-1' });
      assert.strictEqual(response.callEvent.sessionId, 'session-1');
      assert.strictEqual(response.callEvent.status, 'answered');
      assert.ok(response.linkedAt);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
