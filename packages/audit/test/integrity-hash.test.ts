import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeIntegrityHash } from '../src/index.js';

describe('computeIntegrityHash', () => {
  it('returns a deterministic hash for the same payload', () => {
    const payload = { action: 'test', tenantId: 't1' };
    const h1 = computeIntegrityHash(payload);
    const h2 = computeIntegrityHash(payload);
    assert.strictEqual(h1, h2);
  });

  it('is key-order independent', () => {
    const h1 = computeIntegrityHash({ a: 1, b: 2 });
    const h2 = computeIntegrityHash({ b: 2, a: 1 });
    assert.strictEqual(h1, h2);
  });

  it('returns a string starting with h followed by 8 hex chars', () => {
    const hash = computeIntegrityHash({ foo: 'bar' });
    assert.match(hash, /^h[0-9a-f]{8}$/);
  });

  it('handles empty object', () => {
    const hash = computeIntegrityHash({});
    assert.match(hash, /^h[0-9a-f]{8}$/);
  });

  it('handles null and undefined values', () => {
    const hash = computeIntegrityHash({ a: null, b: undefined, c: 0 });
    assert.match(hash, /^h[0-9a-f]{8}$/);
  });

  it('produces different hashes for different payloads', () => {
    const h1 = computeIntegrityHash({ a: 1 });
    const h2 = computeIntegrityHash({ a: 2 });
    assert.notStrictEqual(h1, h2);
  });
});
