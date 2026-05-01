import { GlpiConfig } from '@supportplane/contracts';
import type {
  TicketingAdapterFactory,
  TicketingAdapterClient,
  TicketingAdapterConfigValidation,
} from './types.js';
import { GlpiConnectorAdapter, MockGlpiConnectorAdapter } from './glpi-adapter.js';
import { registerTicketingAdapter } from './registry.js';

export class GlpiAdapterFactory implements TicketingAdapterFactory {
  readonly adapterType = 'glpi';
  readonly capabilities = ['read_tickets', 'read_customers'];

  getConfigSchema(): unknown {
    return {
      type: 'object',
      properties: {
        baseUrl: { type: 'string', description: 'GLPI base URL' },
        apiToken: { type: 'string', description: 'GLPI API token' },
        timeoutMs: { type: 'integer', minimum: 1000, maximum: 60000, description: 'Request timeout in milliseconds' },
        mockMode: { type: 'boolean', description: 'Mock mode flag' },
      },
      required: ['baseUrl'],
      additionalProperties: false,
    };
  }

  validateConfig(config: unknown): TicketingAdapterConfigValidation {
    const issues: TicketingAdapterConfigValidation['issues'] = [];
    const parsed = GlpiConfig.safeParse(config);
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
    return new GlpiConnectorAdapter(adapterId as never);
  }
}

export class MockGlpiAdapterFactory implements TicketingAdapterFactory {
  readonly adapterType = 'glpi-mock';
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
    return new MockGlpiConnectorAdapter(adapterId as never);
  }
}

export function createGlpiAdapterFactory(): GlpiAdapterFactory {
  return new GlpiAdapterFactory();
}

export function createMockGlpiAdapterFactory(): MockGlpiAdapterFactory {
  return new MockGlpiAdapterFactory();
}

export function registerGlpiAdapter(): void {
  registerTicketingAdapter(new GlpiAdapterFactory());
  registerTicketingAdapter(new MockGlpiAdapterFactory());
}
