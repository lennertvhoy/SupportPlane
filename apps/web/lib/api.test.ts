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
          callEvent: {
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
          },
          autoCreateResult: 'not_requested',
          mockDevOnly: true,
          receivedAt: '2026-04-26T18:00:00.000Z',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const response = await api.createFakeIncomingCall({
        externalCallId: 'FAKE-001',
        rawCallerNumber: '03 555 01 01',
      });
      assert.strictEqual(response.callEvent.provider, 'fake_webhook');
      assert.strictEqual(response.callEvent.caller.normalizedNumber, '+32 3 555 0101');
      assert.strictEqual(response.callEvent.callerMatch?.status, 'matched');
      assert.strictEqual(response.callEvent.callerMatch?.customerName, 'Acme BVBA');
      assert.strictEqual(response.autoCreateResult, 'not_requested');
      assert.strictEqual(response.mockDevOnly, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles fake incoming call auto-create response shape', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'http://localhost:4110/calls/fake-incoming');
      assert.equal(init?.method, 'POST');
      const body = JSON.parse((init?.body as string) ?? '{}');
      assert.strictEqual(body.autoCreateSession, true);
      return new Response(
        JSON.stringify({
          callEvent: {
            id: 'call-2',
            tenantId: 'dev-tenant',
            provider: 'fake_webhook',
            externalCallId: 'FAKE-002',
            direction: 'inbound',
            status: 'answered',
            sessionId: 'session-auto-1',
            caller: {
              rawNumber: '03 555 01 01',
              normalizedNumber: '+32 3 555 0101',
            },
            callerMatch: {
              status: 'matched',
              confidence: 1,
              customerName: 'Acme BVBA',
              matchedTicketIds: ['TICKET-101'],
            },
            startedAt: '2026-04-26T18:00:00.000Z',
            mockDevOnly: true,
            createdAt: '2026-04-26T18:00:00.000Z',
            updatedAt: '2026-04-26T18:00:00.000Z',
          },
          autoCreateResult: 'auto_created',
          createdSession: {
            id: 'session-auto-1',
            tenantId: 'dev-tenant',
            status: 'open',
            priority: 'normal',
            title: 'Incoming call from Acme BVBA',
            assignedUserId: 'dev-user',
            linkedTicketIds: ['TICKET-101'],
            aiContextPacketIds: [],
            screenObservationIds: [],
            callEventIds: ['call-2'],
            auditEventIds: [],
            startedAt: '2026-04-26T18:00:00.000Z',
            createdAt: '2026-04-26T18:00:00.000Z',
            updatedAt: '2026-04-26T18:00:00.000Z',
          },
          mockDevOnly: true,
          receivedAt: '2026-04-26T18:00:00.000Z',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const response = await api.createFakeIncomingCall({
        externalCallId: 'FAKE-002',
        rawCallerNumber: '03 555 01 01',
        autoCreateSession: true,
      });
      assert.strictEqual(response.autoCreateResult, 'auto_created');
      assert.ok(response.createdSession);
      assert.strictEqual(response.createdSession.title, 'Incoming call from Acme BVBA');
      assert.strictEqual(response.callEvent.sessionId, 'session-auto-1');
      assert.strictEqual(response.callEvent.status, 'answered');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles fake incoming call auto-create with preferredPriority response shape', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'http://localhost:4110/calls/fake-incoming');
      assert.equal(init?.method, 'POST');
      const body = JSON.parse((init?.body as string) ?? '{}');
      assert.strictEqual(body.autoCreateSession, true);
      assert.strictEqual(body.preferredPriority, 'high');
      assert.strictEqual(body.preferredSessionTitle, 'VIP Escalation');
      return new Response(
        JSON.stringify({
          callEvent: {
            id: 'call-3',
            tenantId: 'dev-tenant',
            provider: 'fake_webhook',
            externalCallId: 'FAKE-003',
            direction: 'inbound',
            status: 'answered',
            sessionId: 'session-auto-2',
            caller: {
              rawNumber: '03 555 01 01',
              normalizedNumber: '+32 3 555 0101',
            },
            callerMatch: {
              status: 'matched',
              confidence: 1,
              customerName: 'Acme BVBA',
              matchedTicketIds: ['TICKET-101'],
            },
            startedAt: '2026-04-26T18:00:00.000Z',
            mockDevOnly: true,
            createdAt: '2026-04-26T18:00:00.000Z',
            updatedAt: '2026-04-26T18:00:00.000Z',
          },
          autoCreateResult: 'auto_created',
          createdSession: {
            id: 'session-auto-2',
            tenantId: 'dev-tenant',
            status: 'open',
            priority: 'high',
            title: 'VIP Escalation',
            assignedUserId: 'dev-user',
            linkedTicketIds: ['TICKET-101'],
            aiContextPacketIds: [],
            screenObservationIds: [],
            callEventIds: ['call-3'],
            auditEventIds: [],
            startedAt: '2026-04-26T18:00:00.000Z',
            createdAt: '2026-04-26T18:00:00.000Z',
            updatedAt: '2026-04-26T18:00:00.000Z',
          },
          mockDevOnly: true,
          receivedAt: '2026-04-26T18:00:00.000Z',
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const response = await api.createFakeIncomingCall({
        externalCallId: 'FAKE-003',
        rawCallerNumber: '03 555 01 01',
        autoCreateSession: true,
        preferredPriority: 'high',
        preferredSessionTitle: 'VIP Escalation',
      });
      assert.strictEqual(response.autoCreateResult, 'auto_created');
      assert.ok(response.createdSession);
      assert.strictEqual(response.createdSession.priority, 'high');
      assert.strictEqual(response.createdSession.title, 'VIP Escalation');
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

  it('handles greeting suggestion response shape', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'http://localhost:4110/support-sessions/session-1/greeting-suggestion');
      assert.equal(init?.method, 'POST');
      return new Response(
        JSON.stringify({
          suggestion: {
            id: 'greet-1',
            tenantId: 'dev-tenant',
            supportSessionId: 'session-1',
            greetingText: 'Good day, Alice. Thank you for calling SupportPlane.',
            tone: 'professional',
            contextSummary: {
              callerName: 'Alice',
              matchedTicketIds: ['TICKET-101'],
            },
            metadata: {
              provider: 'mock',
              model: 'mock-greeting-v1',
              promptVersion: 'mock-v1',
              contextHash: 'abc123',
              mockDevOnly: true,
              reviewRequired: true,
              generatedAt: '2026-04-26T18:00:00.000Z',
            },
          },
          provider: 'mock',
          model: 'mock-greeting-v1',
          prompt: {
            id: 'greeting-suggestion',
            version: 'mock-v1',
            purpose: 'Suggest a safe greeting.',
          },
          contextHash: 'abc123',
          usage: { placeholder: true },
          safety: {
            mockOnly: true,
            externalCallMade: false,
            policyChecks: ['mock_provider_only'],
            reviewRequired: true,
            autoSend: false,
            voiceEnabled: false,
          },
          generatedAt: '2026-04-26T18:00:00.000Z',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const response = await api.generateGreetingSuggestion('session-1', {
        tone: 'professional',
      });
      assert.strictEqual(response.suggestion.greetingText, 'Good day, Alice. Thank you for calling SupportPlane.');
      assert.strictEqual(response.suggestion.tone, 'professional');
      assert.strictEqual(response.safety.autoSend, false);
      assert.strictEqual(response.safety.voiceEnabled, false);
      assert.ok(response.contextHash);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles call status update response shape', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'http://localhost:4110/calls/call-1/status');
      assert.equal(init?.method, 'POST');
      const body = JSON.parse((init?.body as string) ?? '{}');
      assert.strictEqual(body.status, 'answered');
      return new Response(
        JSON.stringify({
          callEvent: {
            id: 'call-1',
            tenantId: 'dev-tenant',
            status: 'answered',
            caller: { rawNumber: '03 555 01 01' },
            mockDevOnly: true,
            createdAt: '2026-04-26T18:00:00.000Z',
            updatedAt: '2026-04-26T18:00:00.000Z',
          },
          previousStatus: 'ringing',
          newStatus: 'answered',
          changedAt: '2026-04-26T18:00:00.000Z',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const response = await api.updateCallStatus('call-1', { status: 'answered' });
      assert.strictEqual(response.previousStatus, 'ringing');
      assert.strictEqual(response.newStatus, 'answered');
      assert.strictEqual(response.callEvent.status, 'answered');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles call timeline response shape', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'http://localhost:4110/calls/call-1/timeline');
      assert.equal(init?.method, 'GET');
      return new Response(
        JSON.stringify({
          callEventId: 'call-1',
          timelineItems: [
            {
              id: 'tl-1',
              callEventId: 'call-1',
              type: 'call_received',
              timestamp: '2026-04-26T18:00:00.000Z',
              title: 'Call received',
              metadata: { mockDevOnly: true },
            },
            {
              id: 'tl-2',
              callEventId: 'call-1',
              type: 'caller_matched',
              timestamp: '2026-04-26T18:00:01.000Z',
              title: 'Caller matched',
              metadata: { mockDevOnly: true },
            },
          ],
          generatedAt: '2026-04-26T18:00:02.000Z',
          mockDevOnly: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const response = await api.getCallTimeline('call-1');
      assert.strictEqual(response.callEventId, 'call-1');
      assert.strictEqual(response.timelineItems.length, 2);
      assert.strictEqual(response.timelineItems[0].type, 'call_received');
      assert.strictEqual(response.timelineItems[1].type, 'caller_matched');
      assert.strictEqual(response.mockDevOnly, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles telephony status response shape', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (input, init) => {
      assert.equal(input, 'http://localhost:4110/telephony/status');
      assert.equal(init?.method, 'GET');
      return new Response(
        JSON.stringify({
          tenantId: 'dev-tenant',
          providerType: 'mock',
          mode: 'mock',
          health: 'healthy',
          connected: true,
          capabilities: {
            inboundCalls: true,
            answer: true,
            hold: true,
            resume: true,
            end: true,
            transfer: false,
            recording: false,
            transcription: false,
          },
          webhookVerification: {
            status: 'not_required',
            checkedAt: '2026-04-27T08:00:00.000Z',
            signatureRequired: false,
            mockDevOnly: true,
          },
          mockDevOnly: true,
          disclaimers: ['No real PBX connected'],
          metadata: {},
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const response = await api.getTelephonyStatus();
      assert.equal(response.providerType, 'mock');
      assert.equal(response.mode, 'mock');
      assert.equal(response.capabilities.answer, true);
      assert.equal(response.webhookVerification.status, 'not_required');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles telephony bridge test and call control responses', async () => {
    const originalFetch = globalThis.fetch;
    const calls: string[] = [];
    globalThis.fetch = async (input, init) => {
      calls.push(String(input));
      if (String(input).endsWith('/telephony/test')) {
        return new Response(
          JSON.stringify({
            tenantId: 'dev-tenant',
            providerType: 'mock',
            mode: 'mock',
            health: 'healthy',
            connected: true,
            capabilities: {
              inboundCalls: true,
              answer: true,
              hold: true,
              resume: true,
              end: true,
              transfer: false,
              recording: false,
              transcription: false,
            },
            webhookVerification: {
              status: 'not_required',
              checkedAt: '2026-04-27T08:00:00.000Z',
              signatureRequired: false,
              mockDevOnly: true,
            },
            lastTestedAt: '2026-04-27T08:00:00.000Z',
            mockDevOnly: true,
            disclaimers: [],
            metadata: {},
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } }
        );
      }
      assert.equal(input, 'http://localhost:4110/telephony/calls/call-1/control');
      assert.equal(init?.method, 'POST');
      const body = JSON.parse((init?.body as string) ?? '{}');
      assert.equal(body.action, 'answer');
      return new Response(
        JSON.stringify({
          intent: {
            tenantId: 'dev-tenant',
            actorId: 'dev-user',
            callEventId: 'call-1',
            externalCallId: 'TEL-1',
            providerType: 'mock',
            adapterMode: 'mock',
            action: 'answer',
            requestedAt: '2026-04-27T08:00:00.000Z',
            mockDevOnly: true,
          },
          success: true,
          providerType: 'mock',
          adapterMode: 'mock',
          resultingStatus: 'answered',
          completedAt: '2026-04-27T08:00:01.000Z',
          mockDevOnly: true,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    };

    try {
      const status = await api.testTelephonyBridge();
      const control = await api.controlTelephonyCall('call-1', { action: 'answer' });
      assert.equal(status.lastTestedAt, '2026-04-27T08:00:00.000Z');
      assert.equal(control.success, true);
      assert.equal(control.resultingStatus, 'answered');
      assert.ok(calls.includes('http://localhost:4110/telephony/test'));
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
