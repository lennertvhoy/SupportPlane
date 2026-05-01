import { describe, it } from 'node:test';
import assert from 'node:assert';
import { ModelUsageService } from './model-usage.service.js';

describe('ModelUsageService', () => {
  it('can be instantiated', () => {
    const service = new ModelUsageService();
    assert.ok(service);
    assert.strictEqual(typeof service.logUsage, 'function');
    assert.strictEqual(typeof service.list, 'function');
    assert.strictEqual(typeof service.summary, 'function');
  });
});
