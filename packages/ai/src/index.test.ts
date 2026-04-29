import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MockAiProvider,
  OllamaAiProvider,
  ModelGateway,
  computeContextHash,
  type GenerateDraftRequest,
  type GreetingSuggestionRequest,
} from './index.js';
import type {
  AIContextPacketId,
  SupportSessionId,
  TenantId,
  TicketingAdapterId,
  TicketReferenceId,
} from '@supportplane/contracts';

const baseRequest: GenerateDraftRequest = {
  tenantId: 'tenant-a',
  actorId: 'user-1',
  session: {
    id: 'session-1' as SupportSessionId,
    tenantId: 'tenant-a' as TenantId,
    status: 'open',
    priority: 'normal',
    title: 'VPN issue',
    linkedTicketIds: ['ticket-1'],
    aiContextPacketIds: ['packet-1'],
    screenObservationIds: [],
    callEventIds: [],
    auditEventIds: [],
    startedAt: '2026-04-26T18:00:00.000Z',
    createdAt: '2026-04-26T18:00:00.000Z',
    updatedAt: '2026-04-26T18:00:00.000Z',
  },
  ticketReferences: [
    {
      id: 'ticket-1' as TicketReferenceId,
      tenantId: 'tenant-a' as TenantId,
      adapterId: 'mock-adapter-001' as TicketingAdapterId,
      externalTicketId: 'TICKET-101',
      subject: 'VPN unavailable',
      status: 'open',
      priority: 'normal',
      customerEmail: 'customer@example.com',
      customerName: 'Customer Example',
      rawData: { mock: true },
      lastSyncedAt: '2026-04-26T18:00:00.000Z',
      createdAt: '2026-04-26T18:00:00.000Z',
      updatedAt: '2026-04-26T18:00:00.000Z',
    },
  ],
  contextPackets: [
    {
      id: 'packet-1' as AIContextPacketId,
      tenantId: 'tenant-a' as TenantId,
      sessionId: 'session-1',
      provenance: 'ticket',
      sourceTicketIds: ['ticket-1'],
      sourceAdapterId: 'mock-adapter-001',
      payload: { ticketSubject: 'VPN unavailable', ticketStatus: 'open' },
      redactionLog: [],
      createdAt: '2026-04-26T18:00:00.000Z',
    },
  ],
  operatorInstructions: 'Keep it concise.',
  modelSelection: { provider: 'mock', model: 'mock-support-note-v1' },
};

describe('@supportplane/ai mock gateway', () => {
  it('mock provider returns deterministic draft and context hash', async () => {
    const provider = new MockAiProvider();
    const first = await provider.generateDraft(baseRequest);
    const second = await provider.generateDraft(baseRequest);

    assert.equal(first.draft, second.draft);
    assert.equal(first.contextHash, second.contextHash);
    assert.match(first.draft, /MOCK AI DRAFT/);
    assert.equal(first.safety.externalCallMade, false);
  });

  it('model gateway includes provider, prompt version, and context hash metadata', async () => {
    const gateway = new ModelGateway([new MockAiProvider()]);
    const response = await gateway.generateDraft(baseRequest);

    assert.equal(response.provider, 'mock');
    assert.equal(response.model, 'mock-support-note-v1');
    assert.equal(response.prompt.id, 'support-note-draft');
    assert.equal(response.prompt.version, 'mock-v1');
    assert.ok(response.contextHash);
    assert.equal(response.usage.placeholder, true);
    assert.equal(response.safety.mockOnly, true);
  });

  it('context hash is stable for object key order', () => {
    assert.equal(
      computeContextHash({ b: 2, a: 1 }),
      computeContextHash({ a: 1, b: 2 })
    );
  });
});

describe('@supportplane/ai Ollama local provider', () => {
  it('returns local provider metadata with no cloud call on success', async () => {
    const provider = new OllamaAiProvider({
      baseUrl: 'http://host.containers.internal:11434',
      model: 'llama3.1:8b',
      client: {
        async generate(input) {
          assert.equal(input.model, 'llama3.1:8b');
          assert.ok(!input.prompt.includes('secret-token-value'));
          assert.match(input.prompt, /REDACTED_EMAIL/);
          return 'Customer reported VPN issues. Next step is to verify tunnel status.';
        },
      },
    });
    const response = await provider.generateDraft({
      ...baseRequest,
      ticketReferences: [{
        ...baseRequest.ticketReferences[0],
        customerEmail: 'person@example.com',
        rawData: { apiToken: 'secret-token-value' },
      }],
      modelSelection: { provider: 'ollama', model: 'llama3.1:8b' },
    });

    assert.equal(response.provider, 'ollama');
    assert.equal(response.model, 'llama3.1:8b');
    assert.equal(response.prompt.version, 'ollama-local-v1');
    assert.equal(response.usage.providerMode, 'local');
    assert.equal(response.usage.fallbackUsed, false);
    assert.equal(response.usage.noCloudCall, true);
    assert.equal(response.safety.cloudCallMade, false);
    assert.equal(response.safety.localProviderCallMade, true);
    assert.equal(response.safety.autonomousSend, false);
    assert.match(response.draft, /OLLAMA LOCAL DRAFT/);
  });

  it('uses deterministic labeled fallback when Ollama is unreachable', async () => {
    const provider = new OllamaAiProvider({
      baseUrl: 'http://host.containers.internal:11434',
      model: 'llama3.1:8b',
      client: {
        async generate() {
          throw new Error('connect ECONNREFUSED');
        },
      },
    });
    const first = await provider.generateDraft({
      ...baseRequest,
      modelSelection: { provider: 'ollama', model: 'llama3.1:8b' },
    });
    const second = await provider.generateDraft({
      ...baseRequest,
      modelSelection: { provider: 'ollama', model: 'llama3.1:8b' },
    });

    assert.equal(first.contextHash, second.contextHash);
    assert.equal(first.usage.fallbackUsed, true);
    assert.equal(first.safety.fallbackUsed, true);
    assert.equal(first.safety.localProviderCallMade, false);
    assert.match(first.draft, /OLLAMA LOCAL FALLBACK/);
  });

  it('can be selected through the model gateway', async () => {
    const gateway = new ModelGateway([
      new MockAiProvider(),
      new OllamaAiProvider({
        baseUrl: 'http://host.containers.internal:11434',
        model: 'llama3.1:8b',
        client: { async generate() { return 'Local Ollama output.'; } },
      }),
    ]);
    const response = await gateway.generateDraft({
      ...baseRequest,
      modelSelection: { provider: 'ollama', model: 'llama3.1:8b' },
    });
    assert.equal(response.provider, 'ollama');
    assert.equal(response.safety.writebackAllowed, false);
  });
});

describe('@supportplane/ai greeting generation', () => {
  const baseGreetingRequest: GreetingSuggestionRequest = {
    tenantId: 'tenant-a',
    actorId: 'user-1',
    supportSessionId: 'session-1',
    tone: 'professional',
    callerName: 'Alice',
    normalizedPhoneNumber: '+32 3 555 01 01',
    matchedTicketIds: ['TICKET-101'],
    matchedCustomerName: 'Acme BVBA',
    sessionTitle: 'VPN issue',
    modelSelection: { provider: 'mock', model: 'mock-greeting-v1' },
  };

  it('mock provider returns deterministic greeting and context hash', async () => {
    const provider = new MockAiProvider();
    const first = await provider.generateGreeting(baseGreetingRequest);
    const second = await provider.generateGreeting(baseGreetingRequest);

    assert.equal(first.suggestion.greetingText, second.suggestion.greetingText);
    assert.equal(first.contextHash, second.contextHash);
    assert.ok(first.suggestion.greetingText.length > 0);
    assert.equal(first.safety.externalCallMade, false);
    assert.equal(first.safety.autoSend, false);
    assert.equal(first.safety.voiceEnabled, false);
  });

  it('model gateway includes provider, prompt version, and context hash metadata for greetings', async () => {
    const gateway = new ModelGateway([new MockAiProvider()]);
    const response = await gateway.generateGreeting(baseGreetingRequest);

    assert.equal(response.provider, 'mock');
    assert.equal(response.model, 'mock-greeting-v1');
    assert.equal(response.prompt.id, 'greeting-suggestion');
    assert.equal(response.prompt.version, 'mock-v1');
    assert.ok(response.contextHash);
    assert.equal(response.usage.placeholder, true);
    assert.equal(response.safety.mockOnly, true);
    assert.equal(response.safety.reviewRequired, true);
  });

  it('friendly tone generates a friendly greeting', async () => {
    const provider = new MockAiProvider();
    const response = await provider.generateGreeting({
      ...baseGreetingRequest,
      tone: 'friendly',
    });
    assert.match(response.suggestion.greetingText, /Hi/);
  });

  it('concise tone generates a short greeting', async () => {
    const provider = new MockAiProvider();
    const response = await provider.generateGreeting({
      ...baseGreetingRequest,
      tone: 'concise',
    });
    assert.ok(response.suggestion.greetingText.length < 80);
  });

  it('safe fallback when caller context is incomplete', async () => {
    const provider = new MockAiProvider();
    const response = await provider.generateGreeting({
      tenantId: 'tenant-a',
      actorId: 'user-1',
      supportSessionId: 'session-1',
      tone: 'professional',
      matchedTicketIds: [],
    });
    assert.match(response.suggestion.greetingText, /the caller/);
    assert.equal(response.suggestion.contextSummary.matchedTicketIds.length, 0);
  });

  it('does not break existing draft suggestion behavior', async () => {
    const gateway = new ModelGateway([new MockAiProvider()]);
    const draftResponse = await gateway.generateDraft({
      tenantId: 'tenant-a',
      actorId: 'user-1',
      session: {
        id: 'session-1' as SupportSessionId,
        tenantId: 'tenant-a' as TenantId,
        status: 'open',
        priority: 'normal',
        title: 'Test',
        linkedTicketIds: [],
        aiContextPacketIds: [],
        screenObservationIds: [],
        callEventIds: [],
        auditEventIds: [],
        startedAt: '2026-04-26T18:00:00.000Z',
        createdAt: '2026-04-26T18:00:00.000Z',
        updatedAt: '2026-04-26T18:00:00.000Z',
      },
      ticketReferences: [],
      contextPackets: [],
      operatorInstructions: 'Test',
      modelSelection: { provider: 'mock', model: 'mock-support-note-v1' },
    });
    assert.match(draftResponse.draft, /MOCK AI DRAFT/);
  });
});
