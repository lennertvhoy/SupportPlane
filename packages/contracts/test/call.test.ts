import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CallEvent,
  IncomingCallWebhookRequest,
  IncomingCallWebhookResponse,
  CallSessionLinkRequest,
  CallSessionLinkResponse,
  normalizePhoneNumber,
  matchCallerByPhone,
} from '../src/index.js';

describe('call contracts', () => {
  it('CallEvent validates a well-formed fake incoming call', () => {
    const now = new Date().toISOString();
    const event = CallEvent.parse({
      id: 'call-1',
      tenantId: 'tenant-a',
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
      startedAt: now,
      mockDevOnly: true,
      createdAt: now,
      updatedAt: now,
    });
    assert.strictEqual(event.provider, 'fake_webhook');
    assert.strictEqual(event.mockDevOnly, true);
  });

  it('IncomingCallWebhookRequest validates minimal request', () => {
    const req = IncomingCallWebhookRequest.parse({
      externalCallId: 'FAKE-002',
      rawCallerNumber: '02 555 0202',
    });
    assert.strictEqual(req.direction, 'inbound');
    assert.strictEqual(req.status, 'ringing');
  });

  it('IncomingCallWebhookResponse validates', () => {
    const now = new Date().toISOString();
    const res = IncomingCallWebhookResponse.parse({
      callEventId: 'call-2',
      tenantId: 'tenant-a',
      externalCallId: 'FAKE-003',
      normalizedNumber: '+32 2 555 0202',
      mockDevOnly: true,
      receivedAt: now,
    });
    assert.strictEqual(res.mockDevOnly, true);
  });

  it('CallSessionLinkRequest validates', () => {
    const req = CallSessionLinkRequest.parse({ sessionId: 'session-1' });
    assert.strictEqual(req.sessionId, 'session-1');
  });

  it('CallSessionLinkResponse validates', () => {
    const now = new Date().toISOString();
    const res = CallSessionLinkResponse.parse({
      callEventId: 'call-3',
      sessionId: 'session-1',
      linkedAt: now,
      mockDevOnly: true,
    });
    assert.strictEqual(res.mockDevOnly, true);
  });
});

describe('phone normalization', () => {
  it('normalizes +32 3 555 01 01 to canonical form', () => {
    const result = normalizePhoneNumber('+32 3 555 01 01');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.normalized, '+32 3 555 01 01');
    assert.strictEqual(result.countryCode, '+32');
  });

  it('normalizes 03 555 01 01 to canonical form', () => {
    const result = normalizePhoneNumber('03 555 01 01');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.normalized, '+32 3 555 01 01');
  });

  it('normalizes 0032 3 555 01 01 to canonical form', () => {
    const result = normalizePhoneNumber('0032 3 555 01 01');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.normalized, '+32 3 555 01 01');
  });

  it('returns invalid for empty string', () => {
    const result = normalizePhoneNumber('');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error);
  });

  it('returns invalid for non-Belgish number', () => {
    const result = normalizePhoneNumber('+1 555 123 4567');
    assert.strictEqual(result.valid, false);
    assert.ok(result.error);
  });
});

describe('caller matching', () => {
  it('matches known fixture number', () => {
    const norm = normalizePhoneNumber('+32 3 555 01 01');
    const match = matchCallerByPhone(norm);
    assert.strictEqual(match.status, 'matched');
    assert.strictEqual(match.confidence, 1.0);
    assert.strictEqual(match.customerName, 'Acme BVBA');
    assert.deepStrictEqual(match.matchedTicketIds, ['TICKET-101', 'TICKET-102']);
  });

  it('returns no_match for unknown number', () => {
    const norm = normalizePhoneNumber('+32 9 999 9999');
    const match = matchCallerByPhone(norm);
    assert.strictEqual(match.status, 'no_match');
    assert.strictEqual(match.confidence, 0);
  });

  it('returns invalid_number for invalid input', () => {
    const norm = normalizePhoneNumber('not-a-number');
    const match = matchCallerByPhone(norm);
    assert.strictEqual(match.status, 'invalid_number');
    assert.strictEqual(match.confidence, 0);
  });
});
