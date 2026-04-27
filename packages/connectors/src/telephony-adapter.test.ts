import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MockTelephonyAdapter,
  redactTelephonySecrets,
} from './telephony-adapter.js';

describe('MockTelephonyAdapter', () => {
  it('returns deterministic mock status and capabilities', () => {
    const adapter = new MockTelephonyAdapter();
    const status = adapter.getStatus('tenant-a');
    assert.equal(status.providerType, 'mock');
    assert.equal(status.mode, 'mock');
    assert.equal(status.capabilities.inboundCalls, true);
    assert.equal(status.capabilities.answer, true);
    assert.equal(status.capabilities.transfer, false);
    assert.equal(status.webhookVerification.status, 'not_required');
  });

  it('redacts secret-like values', () => {
    const redacted = redactTelephonySecrets({
      Authorization: 'Bearer should-not-leak',
      signature: 'abc',
      nested: { apiToken: 'hidden' },
      harmless: 'visible',
    });
    const text = JSON.stringify(redacted);
    assert.ok(!text.includes('should-not-leak'));
    assert.ok(!text.includes('hidden'));
    assert.equal(redacted.harmless, 'visible');
  });

  it('maps fake provider webhook to an existing CallEvent shape', () => {
    const adapter = new MockTelephonyAdapter();
    const now = new Date().toISOString();
    const verification = adapter.verifyWebhook({
      tenantId: 'tenant-a' as never,
      body: {},
    });
    const call = adapter.mapWebhookToCallEvent({
      tenantId: 'tenant-a' as never,
      providerType: 'mock',
      adapterMode: 'mock',
      sourceEventId: 'provider-event-1',
      externalCallId: 'CALL-1',
      eventType: 'incoming_call',
      rawCallerNumber: '03 555 01 01',
      callerDisplayName: 'Mock Caller',
      occurredAt: now,
      verification,
      metadata: {},
      mockDevOnly: true,
      id: 'call-1',
      now,
    });
    assert.equal(call.provider, 'mock');
    assert.equal(call.source, 'telephony_bridge');
    assert.equal(call.status, 'ringing');
    assert.equal(call.externalCallId, 'CALL-1');
  });
});
