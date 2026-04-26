import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { redactSecrets, redactString } from '../src/evidence-bundle/redaction.js';

describe('redaction', () => {
  it('redacts secret keys in objects', () => {
    const input = {
      apiToken: 'super-secret-token-123',
      publicField: 'visible',
      nested: {
        apiKey: 'another-secret',
        safeValue: 42,
      },
    };
    const result = redactSecrets(input);
    assert.strictEqual(result.apiToken, '[REDACTED]');
    assert.strictEqual(result.publicField, 'visible');
    assert.strictEqual((result.nested as Record<string, unknown>).apiKey, '[REDACTED]');
    assert.strictEqual((result.nested as Record<string, unknown>).safeValue, 42);
  });

  it('redacts env-like values', () => {
    const input = {
      ZAMMAD_API_TOKEN: 'zammad-token-abc',
      DATABASE_URL: 'postgres://user:pass@host/db',
      NORMAL_FIELD: 'ok',
    };
    const result = redactSecrets(input);
    assert.strictEqual(result.ZAMMAD_API_TOKEN, '[REDACTED]');
    assert.strictEqual(result.DATABASE_URL, '[REDACTED]');
    assert.strictEqual(result.NORMAL_FIELD, 'ok');
  });

  it('redacts bearer tokens in strings', () => {
    const input = 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
    const result = redactString(input);
    assert.ok(result.includes('[REDACTED]'));
    assert.ok(!result.includes('eyJhbGci'));
  });

  it('redacts Zammad token assignments', () => {
    const input = 'ZAMMAD_API_TOKEN=my-token-value';
    const result = redactString(input);
    assert.ok(result.includes('[REDACTED]'));
    assert.ok(!result.includes('my-token-value'));
  });

  it('leaves safe strings unchanged', () => {
    const input = 'This is a normal description without secrets.';
    const result = redactString(input);
    assert.strictEqual(result, input);
  });
});
