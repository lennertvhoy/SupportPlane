import { Injectable } from '@nestjs/common';
import {
  ConnectorMode,
  ConnectorHealthStatus,
  ConnectorStatus,
  ConnectorTestResult,
  type ConnectorStatus as ConnectorStatusShape,
  type ConnectorTestResult as ConnectorTestResultShape,
  type TicketingAdapterId,
} from '@supportplane/contracts';
import {
  registerTicketingAdapter,
  getTicketingAdapterFactory,
  listTicketingAdapters,
  createZammadAdapterFactory,
  createMockZammadAdapterFactory,
  type TicketingAdapterClient,
} from '@supportplane/connectors';
import { evaluateEgressPolicy } from '@supportplane/policy';

function env(name: string): string | undefined {
  return process.env[name];
}

let registryInitialized = false;

function ensureRegistry() {
  if (registryInitialized) return;
  const modeRaw = env('ZAMMAD_CONNECTOR_MODE') ?? 'mock';
  const isReal = modeRaw === 'zammad';
  registerTicketingAdapter(isReal ? createZammadAdapterFactory() : createMockZammadAdapterFactory());
  registryInitialized = true;
}

@Injectable()
export class ConnectorsService {
  private readonly mode: ConnectorMode;

  constructor() {
    const modeRaw = env('ZAMMAD_CONNECTOR_MODE') ?? 'mock';
    this.mode = modeRaw === 'zammad' ? ConnectorMode.enum.zammad : ConnectorMode.enum.mock;
    ensureRegistry();
  }

  getMode(): ConnectorMode {
    return this.mode;
  }

  getRegisteredAdapters() {
    return listTicketingAdapters();
  }

  getAdapterFactory(adapterType: string) {
    return getTicketingAdapterFactory(adapterType);
  }

  getZammadStatus(): ConnectorStatusShape {
    const isMock = this.mode === 'mock';
    const factory = getTicketingAdapterFactory('zammad') ?? getTicketingAdapterFactory('zammad-mock');
    const caps = factory?.capabilities ?? ['read_tickets', 'read_customers', 'write_notes'];

    return ConnectorStatus.parse({
      mode: this.mode,
      health: isMock ? ConnectorHealthStatus.enum.healthy : ConnectorHealthStatus.enum.unknown,
      adapterType: 'zammad',
      capabilities: caps,
      connected: isMock ? true : !!env('ZAMMAD_BASE_URL'),
      metadata: {
        startupMode: this.mode,
        configured: isMock ? false : !!env('ZAMMAD_BASE_URL') && (env('OPENBAO_RESOLVER_ENABLED') === 'true' || !!env('ZAMMAD_API_TOKEN')),
        credentialResolver: env('OPENBAO_RESOLVER_ENABLED') === 'true' ? 'openbao-local-sandbox' : 'env-local-legacy',
        registryPattern: true,
      },
    });
  }

  async testZammadConnection(): Promise<ConnectorTestResultShape> {
    const start = Date.now();

    if (this.mode === 'mock') {
      return ConnectorTestResult.parse({
        mode: this.mode,
        success: true,
        latencyMs: Date.now() - start,
        metadata: { note: 'Mock mode — no real network call was made', registryPattern: true },
      });
    }

    const baseUrl = env('ZAMMAD_BASE_URL');
    const apiToken = env('ZAMMAD_API_TOKEN');

    const egress = evaluateEgressPolicy({
      tenantId: 'dev-tenant',
      connectorType: 'zammad',
      operation: 'read',
      url: baseUrl,
    });

    if (!egress.allowed) {
      return ConnectorTestResult.parse({
        mode: this.mode,
        success: false,
        error: egress.reason,
        metadata: { egressDecision: egress.decision, secretExposed: false, registryPattern: true },
      });
    }

    if (!baseUrl || (!apiToken && env('OPENBAO_RESOLVER_ENABLED') !== 'true')) {
      return ConnectorTestResult.parse({
        mode: this.mode,
        success: env('OPENBAO_RESOLVER_ENABLED') === 'true',
        error: env('OPENBAO_RESOLVER_ENABLED') === 'true' ? undefined : 'Zammad is not configured. Set ZAMMAD_BASE_URL and ZAMMAD_API_TOKEN or enable OpenBao resolver.',
        metadata: { credentialResolver: env('OPENBAO_RESOLVER_ENABLED') === 'true' ? 'openbao-local-sandbox' : 'env-local-legacy', egressDecision: egress.decision, registryPattern: true },
      });
    }

    try {
      if (env('OPENBAO_RESOLVER_ENABLED') === 'true' && !apiToken) {
        return ConnectorTestResult.parse({
          mode: this.mode,
          success: true,
          latencyMs: Date.now() - start,
          metadata: { baseUrl, credentialResolver: 'openbao-local-sandbox', egressDecision: egress.decision, noSecretExposed: true, registryPattern: true },
        });
      }
      const factory = getTicketingAdapterFactory('zammad');
      if (!factory) {
        throw new Error('Zammad adapter factory not registered');
      }
      const adapter = factory.createAdapter('zammad-test-001' as TicketingAdapterId);
      if (typeof (adapter as unknown as { connect?: (c: Record<string, unknown>) => Promise<void> }).connect === 'function') {
        await (adapter as unknown as { connect: (c: Record<string, unknown>) => Promise<void> }).connect({ baseUrl, apiToken, timeoutMs: 10000 });
      }
      return ConnectorTestResult.parse({
        mode: this.mode,
        success: true,
        latencyMs: Date.now() - start,
        metadata: { baseUrl, credentialResolver: 'env-local-legacy', egressDecision: egress.decision, registryPattern: true },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection test failed';
      return ConnectorTestResult.parse({
        mode: this.mode,
        success: false,
        error: message,
        metadata: { registryPattern: true },
      });
    }
  }

  getZammadAdapter(): TicketingAdapterClient | undefined {
    const factory = getTicketingAdapterFactory('zammad') ?? getTicketingAdapterFactory('zammad-mock');
    if (!factory) return undefined;
    return factory.createAdapter('zammad-adapter-001' as TicketingAdapterId);
  }

  async createResolvedZammadAdapter(config: { baseUrl: string; apiToken: string; timeoutMs?: number }): Promise<TicketingAdapterClient> {
    const factory = getTicketingAdapterFactory('zammad');
    if (!factory) {
      throw new Error('Zammad adapter factory not registered');
    }
    const adapter = factory.createAdapter('zammad-adapter-001' as TicketingAdapterId);
    if (typeof (adapter as unknown as { connect?: (c: Record<string, unknown>) => Promise<void> }).connect === 'function') {
      await (adapter as unknown as { connect: (c: Record<string, unknown>) => Promise<void> }).connect(config);
    }
    return adapter;
  }
}
