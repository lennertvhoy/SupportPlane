import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CallEvent,
  IncomingCallWebhookRequest,
  IncomingCallWebhookResponse,
  CallSessionLinkRequest,
  CallSessionLinkResponse,
  AutoCreateSessionResult,
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
      callEvent: {
        id: 'call-2',
        tenantId: 'tenant-a',
        provider: 'fake_webhook',
        source: 'fake_webhook',
        externalCallId: 'FAKE-003',
        direction: 'inbound',
        status: 'ringing',
        caller: {
          rawNumber: '02 555 0202',
          normalizedNumber: '+32 2 555 0202',
        },
        startedAt: now,
        mockDevOnly: true,
        createdAt: now,
        updatedAt: now,
      },
      autoCreateResult: 'not_requested',
      mockDevOnly: true,
      receivedAt: now,
    });
    assert.strictEqual(res.mockDevOnly, true);
    assert.strictEqual(res.autoCreateResult, 'not_requested');
    assert.strictEqual(res.callEvent.externalCallId, 'FAKE-003');
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

  it('AutoCreateSessionResult validates allowed values', () => {
    assert.strictEqual(AutoCreateSessionResult.enum.auto_created, 'auto_created');
    assert.strictEqual(AutoCreateSessionResult.enum.not_requested, 'not_requested');
    assert.strictEqual(AutoCreateSessionResult.enum.skipped_no_match, 'skipped_no_match');
    assert.strictEqual(AutoCreateSessionResult.enum.skipped_invalid_phone, 'skipped_invalid_phone');
  });

  it('IncomingCallWebhookRequest validates with autoCreateSession options', () => {
    const req = IncomingCallWebhookRequest.parse({
      externalCallId: 'FAKE-003',
      rawCallerNumber: '03 555 01 01',
      autoCreateSession: true,
      preferredSessionTitle: 'Custom title',
      preferredPriority: 'high',
    });
    assert.strictEqual(req.autoCreateSession, true);
    assert.strictEqual(req.preferredSessionTitle, 'Custom title');
    assert.strictEqual(req.preferredPriority, 'high');
  });

  it('IncomingCallWebhookResponse validates with auto-created session', () => {
    const now = new Date().toISOString();
    const res = IncomingCallWebhookResponse.parse({
      callEvent: {
        id: 'call-auto',
        tenantId: 'tenant-a',
        provider: 'fake_webhook',
        source: 'fake_webhook',
        externalCallId: 'FAKE-AUTO',
        direction: 'inbound',
        status: 'answered',
        sessionId: 'session-auto',
        caller: {
          rawNumber: '03 555 01 01',
          normalizedNumber: '+32 3 555 01 01',
        },
        startedAt: now,
        mockDevOnly: true,
        createdAt: now,
        updatedAt: now,
      },
      autoCreateResult: 'auto_created',
      createdSession: {
        id: 'session-auto',
        tenantId: 'tenant-a',
        status: 'open',
        priority: 'normal',
        title: 'Incoming call from Acme BVBA',
        linkedTicketIds: ['TICKET-101'],
        aiContextPacketIds: [],
        screenObservationIds: [],
        callEventIds: ['call-auto'],
        auditEventIds: [],
        startedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      mockDevOnly: true,
      receivedAt: now,
    });
    assert.strictEqual(res.autoCreateResult, 'auto_created');
    assert.ok(res.createdSession);
    assert.strictEqual(res.createdSession.title, 'Incoming call from Acme BVBA');
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
