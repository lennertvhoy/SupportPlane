import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MockAiProvider,
  ModelGateway,
  computeContextHash,
  type GenerateDraftRequest,
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
