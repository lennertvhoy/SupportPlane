import type { InternalNoteWritebackResult as InternalNoteWritebackResultShape } from '@supportplane/contracts';
import type {
  TicketingAdapterFactory,
  TicketingAdapterClient,
  TicketingAdapterConfigValidation,
} from './types.js';

class OsTicketConnectorAdapter implements TicketingAdapterClient {
  readonly adapterType = 'osticket';

  constructor(readonly adapterId: string) {}

  async getTicket(_tenantId: string, externalId: string): Promise<unknown> {
    return {
      id: externalId,
      subject: `osTicket fixture ${externalId}`,
      status: 'open',
      priority: 'normal',
      customerName: 'Fixture Customer',
      customerEmail: 'fixture@example.com',
      adapterId: this.adapterId,
      source: 'osticket-fixture',
    };
  }

  async writeInternalNote(
    _ticketId: string,
    _body: string,
  ): Promise<InternalNoteWritebackResultShape> {
    throw new Error('osTicket writeback is not implemented in this slice.');
  }

  getAdapterMetadata(): Record<string, unknown> {
    return {
      adapterType: this.adapterType,
      adapterId: this.adapterId,
      readOnly: true,
      writebackEnabled: false,
      fixtureBacked: true,
    };
  }
}

class MockOsTicketConnectorAdapter implements TicketingAdapterClient {
  readonly adapterType = 'osticket-mock';

  constructor(readonly adapterId: string) {}

  async getTicket(_tenantId: string, externalId: string): Promise<unknown> {
    return {
      id: externalId,
      subject: `Mock osTicket ${externalId}`,
      status: 'open',
      priority: 'low',
      customerName: 'Mock Customer',
      customerEmail: 'mock@example.com',
      adapterId: this.adapterId,
      source: 'osticket-mock-fixture',
    };
  }

  async writeInternalNote(
    _ticketId: string,
    _body: string,
  ): Promise<InternalNoteWritebackResultShape> {
    throw new Error('Mock osTicket writeback is not implemented.');
  }

  getAdapterMetadata(): Record<string, unknown> {
    return {
      adapterType: this.adapterType,
      adapterId: this.adapterId,
      readOnly: true,
      writebackEnabled: false,
      fixtureBacked: true,
      mockDevOnly: true,
    };
  }
}

export class OsTicketAdapterFactory implements TicketingAdapterFactory {
  readonly adapterType = 'osticket';
  readonly capabilities = ['read_tickets', 'read_customers'];

  getConfigSchema(): unknown {
    return {
      type: 'object',
      properties: {
        baseUrl: { type: 'string', description: 'osTicket base URL' },
        apiKey: { type: 'string', description: 'osTicket API key' },
        timeoutMs: {
          type: 'integer',
          minimum: 1000,
          maximum: 60000,
          description: 'Request timeout in milliseconds',
        },
        mockMode: { type: 'boolean', description: 'Mock mode flag' },
      },
      required: ['baseUrl'],
      additionalProperties: false,
    };
  }

  validateConfig(config: unknown): TicketingAdapterConfigValidation {
    const issues: TicketingAdapterConfigValidation['issues'] = [];
    const cfg = config as Record<string, unknown>;
    if (typeof cfg.baseUrl !== 'string' || cfg.baseUrl.length === 0) {
      issues.push({
        field: 'baseUrl',
        severity: 'error',
        message: 'baseUrl is required for osTicket adapter.',
        code: 'CONFIG_INVALID',
      });
    }
    return {
      valid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
    };
  }

  createAdapter(adapterId: string): TicketingAdapterClient {
    return new OsTicketConnectorAdapter(adapterId);
  }
}

export class MockOsTicketAdapterFactory implements TicketingAdapterFactory {
  readonly adapterType = 'osticket-mock';
  readonly capabilities = ['read_tickets', 'read_customers'];

  getConfigSchema(): unknown {
    return {
      type: 'object',
      properties: {
        fixtureTicketId: { type: 'string', description: 'Mock fixture ticket ID' },
        mockMode: { type: 'boolean', const: true },
      },
      required: ['mockMode'],
      additionalProperties: false,
    };
  }

  validateConfig(config: unknown): TicketingAdapterConfigValidation {
    const issues: TicketingAdapterConfigValidation['issues'] = [];
    const cfg = config as Record<string, unknown>;
    if (cfg.mockMode !== true) {
      issues.push({
        field: 'mockMode',
        severity: 'error',
        message: 'mockMode must be true for mock adapter.',
        code: 'MOCK_MODE_REQUIRED',
      });
    }
    return {
      valid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
    };
  }

  createAdapter(adapterId: string): TicketingAdapterClient {
    return new MockOsTicketConnectorAdapter(adapterId);
  }
}

export function createOsTicketAdapterFactory(): OsTicketAdapterFactory {
  return new OsTicketAdapterFactory();
}

export function createMockOsTicketAdapterFactory(): MockOsTicketAdapterFactory {
  return new MockOsTicketAdapterFactory();
}
