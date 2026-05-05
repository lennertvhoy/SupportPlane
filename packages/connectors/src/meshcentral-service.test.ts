import { describe, it } from 'node:test';
import assert from 'node:assert';
import { createMeshCentralService } from './index.js';
import type { ConnectorInstallation } from '@supportplane/contracts';

function mockInstallation(overrides: Partial<ConnectorInstallation> = {}): ConnectorInstallation {
  return {
    id: 'inst-001' as never,
    tenantId: 'tenant-001' as never,
    name: 'MeshCentral Test',
    adapterType: 'meshcentral',
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

describe('MeshCentralConnectorService', () => {
  it('returns fixture device by name in mock mode', async () => {
    const service = createMeshCentralService(mockInstallation());
    const device = await service.getDeviceByName('ACME-WIN-001');
    assert.ok(device);
    assert.strictEqual(device.id, 'mesh-device-001');
    assert.strictEqual(device.name, 'ACME-WIN-001');
    assert.strictEqual(device.platform, 'win32');
    assert.strictEqual(device.online, true);
    assert.strictEqual(device.group, 'acme-workstations');
  });

  it('returns undefined for unknown device name', async () => {
    const service = createMeshCentralService(mockInstallation());
    const device = await service.getDeviceByName('UNKNOWN');
    assert.strictEqual(device, undefined);
  });

  it('returns fixture device by id in mock mode', async () => {
    const service = createMeshCentralService(mockInstallation());
    const device = await service.getDeviceById('mesh-device-001');
    assert.ok(device);
    assert.strictEqual(device.name, 'ACME-WIN-001');
  });

  it('returns fixture device list in mock mode', async () => {
    const service = createMeshCentralService(mockInstallation());
    const devices = await service.listDevices();
    assert.strictEqual(devices.length, 1);
    assert.strictEqual(devices[0].id, 'mesh-device-001');
  });

  it('reports healthy in mock mode', async () => {
    const service = createMeshCentralService(mockInstallation());
    const health = await service.health();
    assert.strictEqual(health.status, 'healthy');
    assert.strictEqual(health.connected, true);
  });

  it('reports unconfigured when mockMode is false and credentials missing', async () => {
    const service = createMeshCentralService(mockInstallation({ mockMode: false }));
    const health = await service.health();
    assert.strictEqual(health.status, 'unconfigured');
    assert.strictEqual(health.connected, false);
  });

  it('throws on device access when unconfigured', async () => {
    const service = createMeshCentralService(mockInstallation({ mockMode: false }));
    await assert.rejects(
      async () => service.getDeviceByName('ACME-WIN-001'),
      (err: unknown) => {
        const e = err as Error;
        return e.message.includes('unconfigured');
      },
    );
  });

  it('does not fall back to fixture data when real config is present without mockMode', async () => {
    const service = createMeshCentralService(
      mockInstallation({
        mockMode: false,
        config: {
          baseUrl: 'https://meshcentral.example.test',
          apiToken: 'redacted-test-token',
        },
      }),
    );

    const health = await service.health();
    assert.strictEqual(health.status, 'unconfigured');
    assert.strictEqual(health.connected, false);
    await assert.rejects(
      async () => service.listDevices(),
      (err: unknown) => {
        const e = err as Error;
        return e.message.includes('unconfigured');
      },
    );
  });
});
