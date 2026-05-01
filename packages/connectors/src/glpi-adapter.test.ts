import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ConnectorErrorCode,
  GlpiConfig,
} from '@supportplane/contracts';
import {
  GlpiConnectorAdapter,
  MockGlpiConnectorAdapter,
  MockGlpiHttpClient,
} from './index.js';

describe('GlpiConnectorAdapter', () => {
  it('rejects invalid config during connect', async () => {
    const adapter = new GlpiConnectorAdapter('glpi-001' as never);
    await assert.rejects(
      async () => adapter.connect({ baseUrl: 'not-a-url' }),
      (err: unknown) => {
        const e = err as { code: string };
        return e.code === ConnectorErrorCode.enum.CONFIG_INVALID;
      }
    );
  });

  it('accepts valid config during connect', async () => {
    const adapter = new GlpiConnectorAdapter('glpi-001' as never);
    await adapter.connect({
      baseUrl: 'https://glpi.example.com',
      apiToken: 'test-token',
      timeoutMs: 5000,
    });
    const meta = adapter.getAdapterMetadata?.() as { adapterType: string; status: string };
    assert.strictEqual(meta.adapterType, 'glpi');
  });

  it('does not expose apiToken in adapter metadata', async () => {
    const adapter = new GlpiConnectorAdapter('glpi-001' as never);
    await adapter.connect({
      baseUrl: 'https://glpi.example.com',
      apiToken: 'secret-token-123',
      timeoutMs: 5000,
    });
    const meta = adapter.getAdapterMetadata?.() as { config: Record<string, unknown> };
    const configJson = JSON.stringify(meta.config);
    assert.ok(!configJson.includes('secret-token-123'), 'Token must not leak in metadata');
    assert.ok(!configJson.includes('apiToken'), 'apiToken key must not appear in metadata');
  });

  it('throws when getTicket is called before connect', async () => {
    const adapter = new GlpiConnectorAdapter('glpi-001' as never);
    await assert.rejects(
      async () => adapter.getTicket('tenant-a' as never, 'GLPI-101'),
      (err: unknown) => {
        const e = err as { code: string };
        return e.code === ConnectorErrorCode.enum.CONFIG_MISSING;
      }
    );
  });

  it('writeInternalNote returns read-only error', async () => {
    const adapter = new GlpiConnectorAdapter('glpi-001' as never);
    await adapter.connect({
      baseUrl: 'https://glpi.example.com',
      apiToken: 'test-token',
      timeoutMs: 5000,
    });
    const result = await adapter.writeInternalNote('GLPI-101', 'Test note') as {
      success: boolean;
      error?: { code: string };
    };
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error?.code, ConnectorErrorCode.enum.NOTEBACK_WRITE_FAILED);
  });
});

describe('MockGlpiConnectorAdapter', () => {
  it('returns deterministic ticket data', async () => {
    const adapter = new MockGlpiConnectorAdapter('mock-glpi-001' as never);
    const ticket = await adapter.getTicket('tenant-a' as never, 'GLPI-101') as {
      externalTicketId: string;
      subject: string;
      status: string;
      customerName: string;
      customerEmail: string;
    };
    assert.strictEqual(ticket.externalTicketId, 'GLPI-101');
    assert.strictEqual(ticket.subject, 'Network outage in building B');
    assert.strictEqual(ticket.status, 'new');
    assert.strictEqual(ticket.customerName, 'Acme BVBA');
    assert.strictEqual(ticket.customerEmail, 'support@acme.example');
  });

  it('writeInternalNote returns read-only error', async () => {
    const adapter = new MockGlpiConnectorAdapter('mock-glpi-001' as never);
    const result = await adapter.writeInternalNote('GLPI-101', 'Test note') as {
      success: boolean;
      error?: { code: string };
    };
    assert.strictEqual(result.success, false);
    assert.strictEqual(result.error?.code, ConnectorErrorCode.enum.NOTEBACK_WRITE_FAILED);
  });
});

describe('MockGlpiHttpClient', () => {
  it('getTicket returns fixture shaped like GLPI API', async () => {
    const client = new MockGlpiHttpClient();
    const ticket = await client.getTicket('GLPI-101') as Record<string, unknown>;
    assert.strictEqual(ticket.id, 'GLPI-101');
    assert.strictEqual(ticket.subject, 'Network outage in building B');
    assert.strictEqual(ticket.status, 'new');
    assert.ok(ticket.customer_id);
  });

  it('getUser returns fixture shaped like GLPI API', async () => {
    const client = new MockGlpiHttpClient();
    const user = await client.getUser('GLPI-USER-5') as Record<string, unknown>;
    assert.strictEqual(user.id, 'GLPI-USER-5');
    assert.strictEqual(user.name, 'Acme BVBA');
    assert.strictEqual(user.email, 'support@acme.example');
  });

  it('searchTicket returns fixture list', async () => {
    const client = new MockGlpiHttpClient();
    const results = await client.searchTicket('network') as Array<Record<string, unknown>>;
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].id, 'GLPI-101');
  });
});

describe('GlpiConfig validation', () => {
  it('accepts well-formed config', () => {
    const config = GlpiConfig.parse({
      baseUrl: 'https://glpi.example.com',
      apiToken: 'token',
      timeoutMs: 5000,
    });
    assert.strictEqual(config.baseUrl, 'https://glpi.example.com');
    assert.strictEqual(config.timeoutMs, 5000);
  });

  it('rejects invalid URL', () => {
    assert.throws(() =>
      GlpiConfig.parse({
        baseUrl: 'not-a-url',
        apiToken: 'token',
      })
    );
  });

  it('applies default timeout', () => {
    const config = GlpiConfig.parse({
      baseUrl: 'https://glpi.example.com',
      apiToken: 'token',
    });
    assert.strictEqual(config.timeoutMs, 10000);
  });
});
