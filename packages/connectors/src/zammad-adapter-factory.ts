import { ZammadConfig } from '@supportplane/contracts';
import type {
  TicketingAdapterFactory,
  TicketingAdapterClient,
  TicketingAdapterConfigValidation,
} from './types.js';
import { ZammadConnectorAdapter, MockZammadConnectorAdapter } from './zammad-adapter.js';

export class ZammadAdapterFactory implements TicketingAdapterFactory {
  readonly adapterType = 'zammad';
  readonly capabilities = ['read_tickets', 'read_customers', 'write_notes'];

  getConfigSchema(): unknown {
    return {
      type: 'object',
      properties: {
        baseUrl: { type: 'string', description: 'Zammad base URL' },
        apiToken: { type: 'string', description: 'Zammad API token' },
        timeoutMs: { type: 'integer', minimum: 1000, maximum: 60000, description: 'Request timeout in milliseconds' },
        mockMode: { type: 'boolean', description: 'Mock mode flag' },
      },
      required: ['baseUrl'],
      additionalProperties: false,
    };
  }

  validateConfig(config: unknown): TicketingAdapterConfigValidation {
    const issues: TicketingAdapterConfigValidation['issues'] = [];
    const parsed = ZammadConfig.safeParse(config);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push({
          field: issue.path.join('.') || 'config',
          severity: 'error',
          message: issue.message,
          code: 'CONFIG_INVALID',
        });
      }
    }
    return {
      valid: issues.filter((i) => i.severity === 'error').length === 0,
      issues,
    };
  }

  createAdapter(adapterId: string): TicketingAdapterClient {
    return new ZammadConnectorAdapter(adapterId as never);
  }
}

export class MockZammadAdapterFactory implements TicketingAdapterFactory {
  readonly adapterType = 'zammad-mock';
  readonly capabilities = ['read_tickets', 'read_customers', 'write_notes'];

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
    return new MockZammadConnectorAdapter(adapterId as never);
  }
}

export function createZammadAdapterFactory(): ZammadAdapterFactory {
  return new ZammadAdapterFactory();
}

export function createMockZammadAdapterFactory(): MockZammadAdapterFactory {
  return new MockZammadAdapterFactory();
}
