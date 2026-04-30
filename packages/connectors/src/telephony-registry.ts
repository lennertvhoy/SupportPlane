import {
  CallEvent,
  TelephonyAdapterStatus,
  type TelephonyWebhookEvent,
} from '@supportplane/contracts';
import {
  MockTelephonyAdapter,
  MOCK_TELEPHONY_CAPABILITIES,
  createMockTelephonyConfig,
} from './telephony-adapter.js';

// ---------------------------------------------------------------------------
// Runtime context and health types (local to telephony registry)
// ---------------------------------------------------------------------------

export interface TelephonyRuntimeContext {
  tenantId: string;
  installationId: string;
  config: Record<string, unknown>;
}

export interface TelephonyHealth {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'unknown' | 'local_sandbox';
  connected: boolean;
  reason?: string;
}

export interface TelephonyEvent {
  id: string;
  type: string;
  raw: unknown;
  occurredAt: string;
}

export type CanonicalCallEvent = CallEvent;

// ---------------------------------------------------------------------------
// Factory / client contracts
// ---------------------------------------------------------------------------

export interface TelephonyAdapterClient {
  health(): Promise<TelephonyHealth>;
  pollEvents?(): Promise<TelephonyEvent[]>;
  normalizeEvent(raw: unknown): CanonicalCallEvent;
}

export interface TelephonyAdapterFactory {
  readonly adapterType: string;
  readonly capabilities: string[];
  getConfigSchema(): unknown;
  createClient(ctx: TelephonyRuntimeContext): TelephonyAdapterClient;
}

export interface RegisteredTelephonyAdapterSummary {
  adapterType: string;
  capabilities: string[];
}

// ---------------------------------------------------------------------------
// Registry (follows the same Map-based pattern as ticketing registry)
// ---------------------------------------------------------------------------

const registry = new Map<string, TelephonyAdapterFactory>();

export function registerTelephonyAdapter(factory: TelephonyAdapterFactory): void {
  if (registry.has(factory.adapterType)) {
    throw new Error(`Telephony adapter '${factory.adapterType}' is already registered.`);
  }
  registry.set(factory.adapterType, factory);
}

export function getTelephonyAdapterFactory(
  adapterType: string
): TelephonyAdapterFactory | undefined {
  return registry.get(adapterType);
}

export function listTelephonyAdapters(): RegisteredTelephonyAdapterSummary[] {
  return Array.from(registry.values()).map((f) => ({
    adapterType: f.adapterType,
    capabilities: f.capabilities,
  }));
}

export function clearTelephonyAdapterRegistry(): void {
  registry.clear();
}

export function getRegisteredTelephonyAdapterTypes(): string[] {
  return Array.from(registry.keys());
}

// ---------------------------------------------------------------------------
// Mock telephony adapter factory
// ---------------------------------------------------------------------------

export class MockTelephonyAdapterFactory implements TelephonyAdapterFactory {
  readonly adapterType = 'mock-telephony';
  readonly capabilities = Object.entries(MOCK_TELEPHONY_CAPABILITIES)
    .filter(([, v]) => v === true)
    .map(([k]) => k);

  getConfigSchema(): unknown {
    return {
      type: 'object',
      properties: {
        tenantId: { type: 'string' },
        providerType: { type: 'string', const: 'mock' },
        mode: { type: 'string', const: 'mock' },
      },
      required: ['tenantId', 'providerType', 'mode'],
    };
  }

  createClient(ctx: TelephonyRuntimeContext): TelephonyAdapterClient {
    const adapter = new MockTelephonyAdapter(
      () =>
        createMockTelephonyConfig(ctx.tenantId)
    );

    return {
      async health(): Promise<TelephonyHealth> {
        const status = adapter.getStatus(ctx.tenantId);
        return {
          status: status.health,
          connected: status.connected,
        };
      },

      normalizeEvent(raw: unknown): CanonicalCallEvent {
        const event = raw as TelephonyWebhookEvent & { id: string; now: string };
        return adapter.mapWebhookToCallEvent(event);
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Asterisk AMI adapter factory (stub — honest unavailable)
// ---------------------------------------------------------------------------

export class AsteriskAmiAdapterFactory implements TelephonyAdapterFactory {
  readonly adapterType = 'asterisk-ami';
  readonly capabilities = ['inboundCalls', 'answer', 'hold', 'resume', 'end'];

  getConfigSchema(): unknown {
    return {
      type: 'object',
      properties: {
        host: { type: 'string' },
        port: { type: 'number', default: 5038 },
        username: { type: 'string' },
        secretRef: { type: 'string' },
      },
      required: ['host', 'port', 'username', 'secretRef'],
    };
  }

  createClient(_ctx: TelephonyRuntimeContext): TelephonyAdapterClient {
    return {
      async health(): Promise<TelephonyHealth> {
        return {
          status: 'local_sandbox',
          connected: false,
          reason: 'Asterisk sandbox not yet deployed',
        };
      },

      normalizeEvent(_raw: unknown): CanonicalCallEvent {
        throw new Error('asterisk-ami normalizeEvent not yet implemented');
      },
    };
  }
}

// ---------------------------------------------------------------------------
// Convenience helpers
// ---------------------------------------------------------------------------

export function createMockTelephonyAdapterFactory(): MockTelephonyAdapterFactory {
  return new MockTelephonyAdapterFactory();
}

export function createAsteriskAmiAdapterFactory(): AsteriskAmiAdapterFactory {
  return new AsteriskAmiAdapterFactory();
}
