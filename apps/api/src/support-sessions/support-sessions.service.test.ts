import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { SupportSessionsService } from './support-sessions.service.js';
import { InMemoryStore } from './in-memory.store.js';
import { ConnectorsService } from '../connectors/connectors.service.js';
import { CredentialResolverService } from '../credential-references/credential-resolver.service.js';
import { ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { DevIdentity } from '../auth/auth.types.js';

describe('SupportSessionsService — AI vertical', () => {
  let store: InMemoryStore;
  let service: SupportSessionsService;
  let identity: DevIdentity;

  beforeEach(() => {
    store = new InMemoryStore();
    const connectorsService = new ConnectorsService();
    const credentialResolver = new CredentialResolverService(store);
    service = new SupportSessionsService(connectorsService, credentialResolver, store);
    identity = {
      tenantId: 'test-tenant',
      userId: 'test-user',
      roles: ['operator'],
      permissions: ['*'],
      authMode: 'dev',
    };
  });

  async function createSession(title: string): Promise<string> {
    const session = await service.createSession(identity, { title });
    return session.id;
  }

  describe('generateDraftSuggestion', () => {
    it('returns a mock markdown draft with mock-only label on success', async () => {
      const sessionId = await createSession('VPN issue');
      const response = await service.generateDraftSuggestion(identity, sessionId, {
        operatorInstructions: 'Be concise',
        modelSelection: { provider: 'mock', model: 'mock-support-note-v1' },
      });
      assert.match(response.draft, /MOCK AI DRAFT/);
      assert.strictEqual(response.provider, 'mock');
      assert.strictEqual(response.safety.mockOnly, true);
      assert.strictEqual(response.safety.writebackAllowed, false);
    });

    it('throws BadRequestException for invalid provider selection', async () => {
      const sessionId = await createSession('VPN issue');
      await assert.rejects(
        async () =>
          service.generateDraftSuggestion(identity, sessionId, {
            modelSelection: { provider: 'openai', model: 'gpt-4' },
          }),
        (err: unknown) => err instanceof BadRequestException,
      );
    });

    it('throws NotFoundException for unknown session', async () => {
      await assert.rejects(
        async () => service.generateDraftSuggestion(identity, 'nonexistent-session', {}),
        (err: unknown) => err instanceof NotFoundException,
      );
    });

    it('throws ForbiddenException with blocked_by_policy when policy blocks draft generation', async () => {
      const sessionId = await createSession('VPN issue');
      store.saveTenantPolicy(
        {
          id: randomUUID(),
          tenantId: identity.tenantId,
          policyType: 'ai',
          name: 'Block Draft Policy',
          enabled: true,
          allowedProviders: ['mock'],
          allowDraftGeneration: false,
        } as never,
        'ai',
      );

      await assert.rejects(
        async () =>
          service.generateDraftSuggestion(identity, sessionId, {
            modelSelection: { provider: 'mock', model: 'mock-support-note-v1' },
          }),
        (err: unknown) => {
          if (!(err instanceof ForbiddenException)) return false;
          const response = (err as unknown as { response: Record<string, unknown> }).response;
          return response?.code === 'blocked_by_policy';
        },
      );
    });

    it('succeeds with mock provider when mock-only is locked ON in policy', async () => {
      const sessionId = await createSession('VPN issue');
      store.saveTenantPolicy(
        {
          id: randomUUID(),
          tenantId: identity.tenantId,
          policyType: 'ai',
          name: 'Mock Only Policy',
          enabled: true,
          allowedProviders: ['mock'],
          allowDraftGeneration: true,
          safetyFlags: { mockOnly: true },
        } as never,
        'ai',
      );

      const response = await service.generateDraftSuggestion(identity, sessionId, {
        modelSelection: { provider: 'mock', model: 'mock-support-note-v1' },
      });
      assert.match(response.draft, /MOCK AI DRAFT/);
      assert.strictEqual(response.safety.mockOnly, true);
    });

    it('does NOT automatically write back (no writeback audit events)', async () => {
      const sessionId = await createSession('VPN issue');
      await service.generateDraftSuggestion(identity, sessionId, {
        operatorInstructions: 'Be concise',
        modelSelection: { provider: 'mock', model: 'mock-support-note-v1' },
      });

      const auditEvents = store.getAuditEvents(identity.tenantId, sessionId);
      const writebackEvents = auditEvents.filter((e) =>
        ['internal_note_writeback_attempted', 'internal_note_writeback_succeeded'].includes(
          e.eventType,
        ),
      );
      assert.strictEqual(writebackEvents.length, 0);

      const drafts = store.listInternalNoteDrafts(identity.tenantId, sessionId);
      assert.strictEqual(drafts.length, 0);
    });
  });

  describe('generateTicketSummary', () => {
    it('returns a mock summary with metadata on success', async () => {
      const sessionId = await createSession('Printer issue');
      const response = await service.generateTicketSummary(identity, sessionId, {
        modelSelection: { provider: 'mock', model: 'mock-support-note-v1' },
      });
      assert.match(response.summary, /MOCK AI SUMMARY/);
      assert.strictEqual(response.provider, 'mock');
      assert.strictEqual(response.safety.mockOnly, true);
      assert.ok(Array.isArray(response.keyPoints));
    });

    it('writes audit event ai_summary_generated on success', async () => {
      const sessionId = await createSession('Printer issue');
      await service.generateTicketSummary(identity, sessionId, {
        modelSelection: { provider: 'mock', model: 'mock-support-note-v1' },
      });

      const auditEvents = store.getAuditEvents(identity.tenantId, sessionId);
      const summaryEvent = auditEvents.find((e) => e.eventType === 'ai_summary_generated');
      assert.ok(summaryEvent, 'expected ai_summary_generated audit event');
      assert.strictEqual(summaryEvent?.metadata?.provider, 'mock');
    });

    it('throws ForbiddenException with blocked_by_policy when policy blocks summary', async () => {
      const sessionId = await createSession('Printer issue');
      store.saveTenantPolicy(
        {
          id: randomUUID(),
          tenantId: identity.tenantId,
          policyType: 'ai',
          name: 'Block Summary Policy',
          enabled: true,
          allowedProviders: ['mock'],
          allowSummaryGeneration: false,
        } as never,
        'ai',
      );

      await assert.rejects(
        async () =>
          service.generateTicketSummary(identity, sessionId, {
            modelSelection: { provider: 'mock', model: 'mock-support-note-v1' },
          }),
        (err: unknown) => {
          if (!(err instanceof ForbiddenException)) return false;
          const response = (err as unknown as { response: Record<string, unknown> }).response;
          return response?.code === 'blocked_by_policy';
        },
      );
    });
  });

  describe('generateGreetingSuggestion', () => {
    it('returns a mock greeting suggestion on success', async () => {
      const sessionId = await createSession('Call support');
      const response = await service.generateGreetingSuggestion(identity, sessionId, {
        tone: 'professional',
        modelSelection: { provider: 'mock', model: 'mock-greeting-v1' },
      });
      assert.ok(response.suggestion.greetingText.length > 0);
      assert.strictEqual(response.provider, 'mock');
      assert.strictEqual(response.safety.mockOnly, true);
    });

    it('writes audit event greeting_suggestion_generated on success', async () => {
      const sessionId = await createSession('Call support');
      await service.generateGreetingSuggestion(identity, sessionId, {
        tone: 'professional',
        modelSelection: { provider: 'mock', model: 'mock-greeting-v1' },
      });

      const auditEvents = store.getAuditEvents(identity.tenantId, sessionId);
      const greetingEvent = auditEvents.find(
        (e) => e.eventType === 'greeting_suggestion_generated',
      );
      assert.ok(greetingEvent, 'expected greeting_suggestion_generated audit event');
    });
  });
});
