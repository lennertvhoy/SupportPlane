import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateEgressPolicy } from './index.js';

describe('@supportplane/policy egress policy', () => {
  it('allows local Zammad sandbox read', () => {
    const decision = evaluateEgressPolicy({
      tenantId: 'dev-tenant',
      connectorType: 'zammad',
      operation: 'read',
      url: 'http://zammad.supportplane-integrations.svc.cluster.local:3000',
    });
    assert.equal(decision.allowed, true);
    assert.equal(decision.decision, 'allowed_local_zammad_sandbox_read');
    assert.equal(decision.secretExposed, false);
  });

  it('blocks uncontrolled external URLs', () => {
    const decision = evaluateEgressPolicy({
      tenantId: 'dev-tenant',
      connectorType: 'zammad',
      operation: 'read',
      url: 'https://example.com',
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.decision, 'blocked_external_url');
  });

  it('blocks production-looking URLs', () => {
    const decision = evaluateEgressPolicy({
      tenantId: 'dev-tenant',
      connectorType: 'zammad',
      operation: 'read',
      url: 'https://tenant.production.zammad.com',
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.decision, 'blocked_production_like_url');
  });

  it('blocks writeback when writebackEnabled is false', () => {
    const decision = evaluateEgressPolicy({
      tenantId: 'dev-tenant',
      connectorType: 'zammad',
      operation: 'writeback',
      url: 'http://zammad.supportplane-integrations.svc.cluster.local:3000',
      writebackEnabled: false,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.decision, 'blocked_writeback_disabled');
  });

  it('allows sandbox writeback to an allowlisted URL when writebackEnabled is true', () => {
    const decision = evaluateEgressPolicy({
      tenantId: 'dev-tenant',
      connectorType: 'zammad',
      operation: 'writeback',
      url: 'http://zammad.supportplane-integrations.svc.cluster.local:3000',
      writebackEnabled: true,
    });
    assert.equal(decision.allowed, true);
    assert.equal(decision.decision, 'allowed_local_zammad_sandbox_writeback');
    assert.equal(decision.secretExposed, false);
  });

  it('kill switch denies writeback before allowlist', () => {
    const decision = evaluateEgressPolicy({
      tenantId: 'dev-tenant',
      connectorType: 'zammad',
      operation: 'writeback',
      url: 'http://zammad.supportplane-integrations.svc.cluster.local:3000',
      writebackEnabled: true,
      killSwitchEnabled: true,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.decision, 'blocked_by_kill_switch');
  });

  it('kill switch denies read before allowlist', () => {
    const decision = evaluateEgressPolicy({
      tenantId: 'dev-tenant',
      connectorType: 'zammad',
      operation: 'read',
      url: 'http://zammad.supportplane-integrations.svc.cluster.local:3000',
      killSwitchEnabled: true,
    });
    assert.equal(decision.allowed, false);
    assert.equal(decision.decision, 'blocked_by_kill_switch');
  });
});
