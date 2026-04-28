import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ActionOutboxAttempt,
  ActionOutboxItem,
  SupportAction,
  SupportActionCreateRequest,
  SupportActionStatus,
} from '../src/action-outbox.js';

describe('action outbox contracts', () => {
  it('validates support action lifecycle statuses', () => {
    assert.deepStrictEqual(SupportActionStatus.options, [
      'draft',
      'review_required',
      'approved',
      'queued',
      'processing',
      'mock_delivered',
      'failed',
      'retry_scheduled',
      'dead_lettered',
      'cancelled',
      'rejected',
    ]);
  });

  it('validates a safe ticket-note action and outbox attempt', () => {
    const now = new Date().toISOString();
    const action = SupportAction.parse({
      id: 'action-1',
      tenantId: 'tenant-a',
      sessionId: 'session-1',
      actionType: 'ticket_note',
      status: 'review_required',
      idempotencyKey: 'tenant-a:session-1:ticket-note',
      requestedBy: 'user-1',
      payloadSummary: { externalTicketId: 'TICKET-101', bodyLength: 42 },
      safeBodyPreview: 'Customer issue summary...',
      mockDevOnly: true,
      createdAt: now,
      updatedAt: now,
    });
    assert.equal(action.mockDevOnly, true);

    const outbox = ActionOutboxItem.parse({
      id: 'outbox-1',
      tenantId: 'tenant-a',
      supportActionId: action.id,
      sessionId: action.sessionId,
      actionType: 'ticket_note',
      status: 'queued',
      idempotencyKey: action.idempotencyKey,
      deliveryIntent: { mode: 'mock', realNetwork: false },
      safetyFlags: { writebackEnabled: false, externalWriteAttempted: false },
      queuedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    assert.equal(outbox.status, 'queued');

    const attempt = ActionOutboxAttempt.parse({
      id: 'attempt-1',
      tenantId: 'tenant-a',
      outboxItemId: outbox.id,
      supportActionId: action.id,
      attemptNumber: 1,
      state: 'mock_delivered',
      deliveryResult: { realNetwork: false, externalWriteAttempted: false },
      attemptedAt: now,
    });
    assert.equal(attempt.mockDevOnly, true);
  });

  it('rejects empty ticket note bodies', () => {
    const parsed = SupportActionCreateRequest.safeParse({ body: '' });
    assert.equal(parsed.success, false);
  });
});
