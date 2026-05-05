import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  registerTelephonyAdapter,
  getTelephonyAdapterFactory,
  listTelephonyAdapters,
  clearTelephonyAdapterRegistry,
  getRegisteredTelephonyAdapterTypes,
  createMockTelephonyAdapterFactory,
  createAsteriskAmiAdapterFactory,
} from './telephony-registry.js';

describe('telephony-registry', () => {
  it('registers mock-telephony and asterisk-ami adapters', () => {
    clearTelephonyAdapterRegistry();

    const mockFactory = createMockTelephonyAdapterFactory();
    const amiFactory = createAsteriskAmiAdapterFactory();

    registerTelephonyAdapter(mockFactory);
    registerTelephonyAdapter(amiFactory);

    assert.deepStrictEqual(getRegisteredTelephonyAdapterTypes(), [
      'mock-telephony',
      'asterisk-ami',
    ]);
  });

  it('duplicate registration fails', () => {
    clearTelephonyAdapterRegistry();

    const mockFactory = createMockTelephonyAdapterFactory();
    registerTelephonyAdapter(mockFactory);

    assert.throws(
      () => registerTelephonyAdapter(mockFactory),
      /Telephony adapter 'mock-telephony' is already registered/,
    );
  });

  it('unknown adapter returns undefined', () => {
    clearTelephonyAdapterRegistry();

    const result = getTelephonyAdapterFactory('nonexistent');
    assert.strictEqual(result, undefined);
  });

  it('listTelephonyAdapters returns both registered factories', () => {
    clearTelephonyAdapterRegistry();

    const mockFactory = createMockTelephonyAdapterFactory();
    const amiFactory = createAsteriskAmiAdapterFactory();

    registerTelephonyAdapter(mockFactory);
    registerTelephonyAdapter(amiFactory);

    const adapters = listTelephonyAdapters();
    assert.strictEqual(adapters.length, 2);

    const types = adapters.map((a) => a.adapterType).sort();
    assert.deepStrictEqual(types, ['asterisk-ami', 'mock-telephony']);

    const mockEntry = adapters.find((a) => a.adapterType === 'mock-telephony');
    assert.ok(mockEntry);
    assert.ok(mockEntry!.capabilities.includes('inboundCalls'));
    assert.ok(mockEntry!.capabilities.includes('answer'));

    const amiEntry = adapters.find((a) => a.adapterType === 'asterisk-ami');
    assert.ok(amiEntry);
    assert.ok(amiEntry!.capabilities.includes('inboundCalls'));
    assert.ok(amiEntry!.capabilities.includes('end'));
  });

  it('mock-telephony client health returns healthy', async () => {
    clearTelephonyAdapterRegistry();

    const mockFactory = createMockTelephonyAdapterFactory();
    registerTelephonyAdapter(mockFactory);

    const factory = getTelephonyAdapterFactory('mock-telephony');
    assert.ok(factory);

    const client = factory!.createClient({
      tenantId: 'tenant-a',
      installationId: 'inst-1',
      config: {},
    });

    const health = await client.health();
    assert.strictEqual(health.status, 'healthy');
    assert.strictEqual(health.connected, true);
  });

  it('asterisk-ami client health returns honest unavailable', async () => {
    clearTelephonyAdapterRegistry();

    const amiFactory = createAsteriskAmiAdapterFactory();
    registerTelephonyAdapter(amiFactory);

    const factory = getTelephonyAdapterFactory('asterisk-ami');
    assert.ok(factory);

    const client = factory!.createClient({
      tenantId: 'tenant-a',
      installationId: 'inst-1',
      config: {},
    });

    const health = await client.health();
    assert.strictEqual(health.status, 'local_sandbox');
    assert.strictEqual(health.connected, false);
    assert.ok(health.reason?.includes('Asterisk sandbox not yet deployed'));
  });

  it('asterisk-ami normalizeEvent throws not implemented', () => {
    clearTelephonyAdapterRegistry();

    const amiFactory = createAsteriskAmiAdapterFactory();
    registerTelephonyAdapter(amiFactory);

    const factory = getTelephonyAdapterFactory('asterisk-ami');
    assert.ok(factory);

    const client = factory!.createClient({
      tenantId: 'tenant-a',
      installationId: 'inst-1',
      config: {},
    });

    assert.throws(() => client.normalizeEvent({}), /not yet implemented/);
  });
});
