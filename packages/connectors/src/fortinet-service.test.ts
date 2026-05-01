import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createFortinetService } from './index.js';
import type { ConnectorInstallation } from '@supportplane/contracts';

function mockInstallation(overrides: Partial<ConnectorInstallation> = {}): ConnectorInstallation {
  return {
    id: 'inst-001' as never,
    tenantId: 'tenant-001' as never,
    name: 'Fortinet Test',
    adapterType: 'fortinet',
    capabilities: [],
    config: {},
    secretReferenceIds: [],
    status: 'inactive',
    mockMode: true,
    enabled: false,
    safetyFlags: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('FortinetConnectorService', () => {
  it('returns fixture firewall status in mock mode', async () => {
    const service = createFortinetService(mockInstallation());
    const status = await service.getFirewallStatus();
    assert.strictEqual(status.deviceName, 'FGT-ACME-01');
    assert.strictEqual(status.firmware, '7.4.2');
    assert.strictEqual(status.policies, 42);
    assert.strictEqual(status.interfaces.length, 1);
    assert.strictEqual(status.interfaces[0].name, 'port1');
    assert.strictEqual(status.interfaces[0].status, 'up');
    assert.strictEqual(status.interfaces[0].ip, '192.168.1.1');
  });

  it('returns fixture interface summary in mock mode', async () => {
    const service = createFortinetService(mockInstallation());
    const interfaces = await service.getInterfaceSummary();
    assert.strictEqual(interfaces.length, 1);
    assert.strictEqual(interfaces[0].name, 'port1');
  });

  it('reports healthy in mock mode', async () => {
    const service = createFortinetService(mockInstallation());
    const health = await service.health();
    assert.strictEqual(health.status, 'healthy');
    assert.strictEqual(health.connected, true);
  });

  it('reports unconfigured when mockMode is false and credentials missing', async () => {
    const service = createFortinetService(mockInstallation({ mockMode: false }));
    const health = await service.health();
    assert.strictEqual(health.status, 'unconfigured');
    assert.strictEqual(health.connected, false);
  });

  it('throws on status access when unconfigured', async () => {
    const service = createFortinetService(mockInstallation({ mockMode: false }));
    await assert.rejects(
      async () => service.getFirewallStatus(),
      (err: unknown) => {
        const e = err as Error;
        return e.message.includes('unconfigured');
      }
    );
  });
});
