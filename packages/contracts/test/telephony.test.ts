import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  TelephonyAdapterConfig,
  TelephonyAdapterStatus,
  TelephonyCallControlIntent,
  TelephonyProviderType,
  TelephonyWebhookEvent,
  TelephonyWebhookVerification,
} from '../src/telephony.js';

describe('telephony contracts', () => {
  it('validates mock adapter config and provider types', () => {
    assert.ok(TelephonyProviderType.options.includes('twilio'));
    assert.ok(TelephonyProviderType.options.includes('asterisk'));
    const config = TelephonyAdapterConfig.parse({
      tenantId: 'tenant-a',
      providerType: 'mock',
      mode: 'mock',
      mockDevOnly: true,
    });
    assert.equal(config.providerType, 'mock');
    assert.equal(config.mode, 'mock');
  });

  it('rejects configured signature verification without secretRef', () => {
    assert.throws(() =>
      TelephonyAdapterConfig.parse({
        tenantId: 'tenant-a',
        providerType: 'webhook_bridge',
        mode: 'configured',
        signatureRequired: true,
        mockDevOnly: false,
      })
    );
  });

  it('validates adapter status and webhook verification', () => {
    const now = new Date().toISOString();
    const verification = TelephonyWebhookVerification.parse({
      status: 'not_required',
      checkedAt: now,
      signatureRequired: false,
      mockDevOnly: true,
    });
    const status = TelephonyAdapterStatus.parse({
      tenantId: 'tenant-a',
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
      webhookVerification: verification,
      mockDevOnly: true,
    });
    assert.equal(status.webhookVerification.status, 'not_required');
    assert.equal(status.capabilities.answer, true);
  });

  it('validates fake provider webhook events', () => {
    const now = new Date().toISOString();
    const event = TelephonyWebhookEvent.parse({
      tenantId: 'tenant-a',
      providerType: 'mock',
      adapterMode: 'mock',
      sourceEventId: 'source-1',
      externalCallId: 'CALL-1',
      eventType: 'incoming_call',
      rawCallerNumber: '03 555 01 01',
      occurredAt: now,
      verification: {
        status: 'not_required',
        checkedAt: now,
        signatureRequired: false,
        mockDevOnly: true,
      },
      mockDevOnly: true,
    });
    assert.equal(event.externalCallId, 'CALL-1');
    assert.equal(event.verification.status, 'not_required');
  });

  it('validates allowed call control actions', () => {
    const intent = TelephonyCallControlIntent.parse({
      tenantId: 'tenant-a',
      actorId: 'user-1',
      callEventId: 'call-1',
      externalCallId: 'CALL-1',
      action: 'hold',
      requestedAt: new Date().toISOString(),
    });
    assert.equal(intent.action, 'hold');
    assert.throws(() =>
      TelephonyCallControlIntent.parse({
        tenantId: 'tenant-a',
        actorId: 'user-1',
        callEventId: 'call-1',
        externalCallId: 'CALL-1',
        action: 'mute',
        requestedAt: new Date().toISOString(),
      })
    );
  });
});
