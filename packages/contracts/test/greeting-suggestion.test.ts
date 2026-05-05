import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GreetingSuggestionTone,
  GreetingSuggestionRequest,
  GreetingSuggestionResponse,
  GreetingSuggestion,
} from '../src/index.js';

describe('greeting suggestion contracts', () => {
  it('GreetingSuggestionTone validates allowed values', () => {
    assert.strictEqual(GreetingSuggestionTone.enum.professional, 'professional');
    assert.strictEqual(GreetingSuggestionTone.enum.friendly, 'friendly');
    assert.strictEqual(GreetingSuggestionTone.enum.concise, 'concise');
  });

  it('GreetingSuggestionRequest validates minimal request', () => {
    const req = GreetingSuggestionRequest.parse({
      tenantId: 'tenant-a',
      actorId: 'user-1',
      supportSessionId: 'session-1',
    });
    assert.strictEqual(req.tone, 'professional');
    assert.deepStrictEqual(req.matchedTicketIds, []);
  });

  it('GreetingSuggestionRequest validates full request', () => {
    const req = GreetingSuggestionRequest.parse({
      tenantId: 'tenant-a',
      actorId: 'user-1',
      supportSessionId: 'session-1',
      callEventId: 'call-1',
      tone: 'friendly',
      callerName: 'Alice',
      normalizedPhoneNumber: '+32 3 555 01 01',
      matchedTicketIds: ['TICKET-101'],
      matchedCustomerName: 'Acme BVBA',
      sessionTitle: 'VPN issue',
      modelSelection: { provider: 'mock', model: 'mock-greeting-v1' },
    });
    assert.strictEqual(req.tone, 'friendly');
    assert.strictEqual(req.callerName, 'Alice');
    assert.strictEqual(req.modelSelection?.model, 'mock-greeting-v1');
  });

  it('GreetingSuggestionResponse validates', () => {
    const now = new Date().toISOString();
    const res = GreetingSuggestionResponse.parse({
      suggestion: {
        id: 'greet-1',
        tenantId: 'tenant-a',
        supportSessionId: 'session-1',
        callEventId: 'call-1',
        greetingText: 'Good day, Alice. Thank you for calling SupportPlane.',
        tone: 'professional',
        contextSummary: {
          callerName: 'Alice',
          matchedTicketIds: ['TICKET-101'],
        },
        metadata: {
          provider: 'mock',
          model: 'mock-greeting-v1',
          promptId: 'greeting-suggestion',
          promptVersion: 'mock-v1',
          contextHash: 'abc123',
          mockDevOnly: true,
          reviewRequired: true,
          generatedAt: now,
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
      generatedAt: now,
    });
    assert.strictEqual(
      res.suggestion.greetingText,
      'Good day, Alice. Thank you for calling SupportPlane.',
    );
    assert.strictEqual(res.safety.autoSend, false);
    assert.strictEqual(res.safety.voiceEnabled, false);
  });

  it('GreetingSuggestion validates', () => {
    const now = new Date().toISOString();
    const gs = GreetingSuggestion.parse({
      id: 'greet-2',
      tenantId: 'tenant-a',
      supportSessionId: 'session-1',
      greetingText: 'Hi there!',
      tone: 'friendly',
      contextSummary: {
        matchedTicketIds: [],
      },
      metadata: {
        provider: 'mock',
        model: 'mock-greeting-v1',
        mockDevOnly: true,
        reviewRequired: true,
        generatedAt: now,
      },
    });
    assert.strictEqual(gs.tone, 'friendly');
    assert.strictEqual(gs.metadata.mockDevOnly, true);
  });
});
