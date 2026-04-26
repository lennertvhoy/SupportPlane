import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  CallStatus,
  CallStatusTransitionRequest,
  CallStatusTransitionResponse,
  CallTimelineItem,
  CallTimelineItemType,
  CallConsoleSummary,
  CallEvent,
  CallDirection,
  CallerIdentity,
  CallerMatch,
  AllowedCallTransition,
} from './call.js';

describe('call contracts', () => {
  it('CallStatus includes on_hold', () => {
    const parsed = CallStatus.safeParse('on_hold');
    assert.strictEqual(parsed.success, true);
    assert.ok(CallStatus.options.includes('on_hold'));
  });

  it('AllowedCallTransition validates valid transitions', () => {
    const t = AllowedCallTransition.parse({ from: 'ringing', to: 'answered' });
    assert.strictEqual(t.from, 'ringing');
    assert.strictEqual(t.to, 'answered');
  });

  it('CallStatusTransitionRequest validates with status only', () => {
    const req = CallStatusTransitionRequest.parse({ status: 'answered' });
    assert.strictEqual(req.status, 'answered');
    assert.strictEqual(req.reason, undefined);
  });

  it('CallStatusTransitionRequest validates with reason', () => {
    const req = CallStatusTransitionRequest.parse({ status: 'on_hold', reason: 'Checking details' });
    assert.strictEqual(req.status, 'on_hold');
    assert.strictEqual(req.reason, 'Checking details');
  });

  it('CallStatusTransitionResponse validates', () => {
    const now = new Date().toISOString();
    const call = CallEvent.parse({
      id: 'call-1',
      tenantId: 'tenant-a',
      provider: 'fake_webhook',
      source: 'fake_webhook',
      externalCallId: 'FAKE-1',
      direction: CallDirection.enum.inbound,
      status: CallStatus.enum.answered,
      caller: CallerIdentity.parse({ rawNumber: '03 555 01 01' }),
      callerMatch: CallerMatch.parse({ status: 'matched', confidence: 1 }),
      startedAt: now,
      mockDevOnly: true,
      createdAt: now,
      updatedAt: now,
    });

    const res = CallStatusTransitionResponse.parse({
      callEvent: call,
      previousStatus: 'ringing',
      newStatus: 'answered',
      changedAt: now,
      mockDevOnly: true,
    });
    assert.strictEqual(res.previousStatus, 'ringing');
    assert.strictEqual(res.newStatus, 'answered');
    assert.strictEqual(res.mockDevOnly, true);
  });

  it('CallTimelineItem validates all types', () => {
    const now = new Date().toISOString();
    for (const type of CallTimelineItemType.options) {
      const item = CallTimelineItem.parse({
        id: `tl-${type}`,
        callEventId: 'call-1',
        type,
        timestamp: now,
        title: `Event: ${type}`,
        metadata: { mockDevOnly: true },
      });
      assert.strictEqual(item.type, type);
    }
  });

  it('CallConsoleSummary validates', () => {
    const now = new Date().toISOString();
    const call = CallEvent.parse({
      id: 'call-1',
      tenantId: 'tenant-a',
      provider: 'fake_webhook',
      source: 'fake_webhook',
      externalCallId: 'FAKE-1',
      direction: CallDirection.enum.inbound,
      status: CallStatus.enum.ringing,
      caller: CallerIdentity.parse({ rawNumber: '03 555 01 01' }),
      startedAt: now,
      mockDevOnly: true,
      createdAt: now,
      updatedAt: now,
    });

    const summary = CallConsoleSummary.parse({
      callEvent: call,
      timelineItems: [],
      mockDevOnly: true,
    });
    assert.strictEqual(summary.callEvent.id, 'call-1');
    assert.strictEqual(summary.timelineItems.length, 0);
    assert.strictEqual(summary.mockDevOnly, true);
  });

  it('CallStatusTransitionRequest rejects invalid status', () => {
    const parsed = CallStatusTransitionRequest.safeParse({ status: 'invalid_status' });
    assert.strictEqual(parsed.success, false);
  });

  it('CallStatusTransitionRequest rejects long reason', () => {
    const parsed = CallStatusTransitionRequest.safeParse({ status: 'ended', reason: 'x'.repeat(600) });
    assert.strictEqual(parsed.success, false);
  });
});
