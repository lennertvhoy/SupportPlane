import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ConnectorMode,
  ConnectorErrorCode,
  ZammadConfig,
} from '@supportplane/contracts';
import {
  ZammadConnectorAdapter,
  MockZammadConnectorAdapter,
  createZammadAdapter,
  MockZammadHttpClient,
} from './index.js';

describe('ZammadConnectorAdapter', () => {
  it('rejects invalid config during connect', async () => {
    const adapter = new ZammadConnectorAdapter('zammad-001' as never);
    await assert.rejects(
      async () => adapter.connect({ baseUrl: 'not-a-url' }),
      (err: unknown) => {
        const e = err as { code: string };
        return e.code === ConnectorErrorCode.enum.CONFIG_INVALID;
      }
    );
  });

  it('accepts valid config during connect', async () => {
    const adapter = new ZammadConnectorAdapter('zammad-001' as never);
    await adapter.connect({
      baseUrl: 'https://zammad.example.com',
      apiToken: 'test-token',
      timeoutMs: 5000,
    });
    const meta = adapter.getAdapterMetadata?.() as { adapterType: string; status: string };
    assert.strictEqual(meta.adapterType, 'zammad');
  });

  it('does not expose apiToken in adapter metadata', async () => {
    const adapter = new ZammadConnectorAdapter('zammad-001' as never);
    await adapter.connect({
      baseUrl: 'https://zammad.example.com',
      apiToken: 'secret-token-123',
      timeoutMs: 5000,
    });
    const meta = adapter.getAdapterMetadata?.() as { config: Record<string, unknown> };
    const configJson = JSON.stringify(meta.config);
    assert.ok(!configJson.includes('secret-token-123'), 'Token must not leak in metadata');
    assert.ok(!configJson.includes('apiToken'), 'apiToken key must not appear in metadata');
  });
});

describe('MockZammadConnectorAdapter', () => {
  it('returns deterministic ticket data', async () => {
    const adapter = new MockZammadConnectorAdapter('mock-zammad-001' as never);
    const ticket = await adapter.getTicket('tenant-a' as never, 'TICKET-42') as {
      externalTicketId: string;
      subject: string;
      status: string;
      adapterType?: string;
    };
    assert.strictEqual(ticket.externalTicketId, 'TICKET-42');
    assert.ok(ticket.subject.includes('TICKET-42'));
    assert.strictEqual(ticket.status, 'open');
  });

  it('returns deterministic customer data', async () => {
    const adapter = new MockZammadConnectorAdapter('mock-zammad-001' as never);
    const ticket = await adapter.getTicket('tenant-a' as never, 'T-99') as {
      customerEmail: string;
      customerName: string;
    };
    assert.ok(ticket.customerEmail.includes('customer-'));
    assert.ok(ticket.customerName.includes('Customer'));
  });

  it('writeInternalNote returns success', async () => {
    const adapter = new MockZammadConnectorAdapter('mock-zammad-001' as never);
    const result = await adapter.writeInternalNote('42', 'Test note') as {
      success: boolean;
      externalArticleId?: string;
    };
    assert.strictEqual(result.success, true);
    assert.ok(result.externalArticleId);
  });
});

describe('createZammadAdapter factory', () => {
  it('creates mock adapter for mock mode', () => {
    const adapter = createZammadAdapter(ConnectorMode.enum.mock, 'a-1' as never);
    assert.strictEqual(adapter.adapterType, 'zammad');
    assert.ok(adapter instanceof MockZammadConnectorAdapter);
  });

  it('creates real adapter for zammad mode', () => {
    const adapter = createZammadAdapter(ConnectorMode.enum.zammad, 'a-1' as never);
    assert.strictEqual(adapter.adapterType, 'zammad');
    assert.ok(adapter instanceof ZammadConnectorAdapter);
  });
});

describe('ZammadConfig validation', () => {
  it('accepts well-formed config', () => {
    const config = ZammadConfig.parse({
      baseUrl: 'https://zammad.example.com',
      apiToken: 'token',
      timeoutMs: 5000,
    });
    assert.strictEqual(config.baseUrl, 'https://zammad.example.com');
    assert.strictEqual(config.timeoutMs, 5000);
  });

  it('rejects invalid URL', () => {
    assert.throws(() =>
      ZammadConfig.parse({
        baseUrl: 'not-a-url',
        apiToken: 'token',
      })
    );
  });

  it('applies default timeout', () => {
    const config = ZammadConfig.parse({
      baseUrl: 'https://zammad.example.com',
      apiToken: 'token',
    });
    assert.strictEqual(config.timeoutMs, 10000);
  });
});

describe('MockZammadHttpClient', () => {
  it('getTicket returns fixture shaped like Zammad API', async () => {
    const client = new MockZammadHttpClient();
    const ticket = await client.getTicket('55') as Record<string, unknown>;
    assert.strictEqual(typeof ticket.id, 'number');
    assert.strictEqual(ticket.title, 'Zammad ticket 55');
    assert.ok(ticket.state);
    assert.ok(ticket.customer_id);
  });

  it('createArticle returns fixture shaped like Zammad API', async () => {
    const client = new MockZammadHttpClient();
    const article = await client.createArticle({
      ticket_id: 1,
      body: 'Note',
      internal: true,
    }) as Record<string, unknown>;
    assert.strictEqual(typeof article.id, 'number');
    assert.strictEqual(article.internal, true);
  });
});
