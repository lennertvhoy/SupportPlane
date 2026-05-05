import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCorrelationId, getHeaders } from '../src/helpers.js';

describe('createCorrelationId', () => {
  it('starts with sp-worker-', () => {
    const id = createCorrelationId();
    assert.ok(id.startsWith('sp-worker-'));
  });

  it('contains a timestamp and random suffix separated by dashes', () => {
    const id = createCorrelationId();
    const parts = id.split('-');
    assert.strictEqual(parts.length, 4);
    assert.strictEqual(parts[0], 'sp');
    assert.strictEqual(parts[1], 'worker');
    const timestamp = Number(parts[2]);
    assert.ok(Number.isFinite(timestamp));
    assert.ok(timestamp > 0);
    assert.ok(parts[3].length > 0);
  });

  it('produces unique ids across calls', () => {
    const ids = new Set(Array.from({ length: 20 }, createCorrelationId));
    assert.strictEqual(ids.size, 20);
  });
});

describe('getHeaders', () => {
  it('always includes content-type and x-correlation-id', () => {
    const headers = getHeaders();
    assert.strictEqual(headers['content-type'], 'application/json');
    assert.ok(headers['x-correlation-id']);
    assert.ok(headers['x-correlation-id'].startsWith('sp-worker-'));
  });

  it('uses provided correlation id when given', () => {
    const headers = getHeaders('tenant-a', 'custom-id-123');
    assert.strictEqual(headers['x-correlation-id'], 'custom-id-123');
  });

  it('uses provided tenant id when given (without service token)', () => {
    const headers = getHeaders('tenant-a');
    assert.strictEqual(headers['x-correlation-id']?.startsWith('sp-worker-'), true);
    assert.strictEqual(headers['x-supportplane-service-token'], undefined);
  });

  it('generates a new correlation id when none is provided', () => {
    const h1 = getHeaders();
    const h2 = getHeaders();
    assert.notStrictEqual(h1['x-correlation-id'], h2['x-correlation-id']);
  });
});
