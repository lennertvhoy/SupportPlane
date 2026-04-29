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
  ZammadConnectorAdapter,
  createZammadAdapter,
  type TicketingAdapterDriver,
} from '@supportplane/connectors';
import { evaluateEgressPolicy } from '@supportplane/policy';

function env(name: string): string | undefined {
  return process.env[name];
}

@Injectable()
export class ConnectorsService {
  private readonly mode: ConnectorMode;
  private readonly zammadAdapter: TicketingAdapterDriver;

  constructor() {
    const modeRaw = env('ZAMMAD_CONNECTOR_MODE') ?? 'mock';
    this.mode = modeRaw === 'zammad' ? ConnectorMode.enum.zammad : ConnectorMode.enum.mock;

    const adapterId = 'zammad-adapter-001' as TicketingAdapterId;
    this.zammadAdapter = createZammadAdapter(this.mode, adapterId);

    if (this.mode === 'zammad' && env('OPENBAO_RESOLVER_ENABLED') !== 'true') {
      const baseUrl = env('ZAMMAD_BASE_URL');
      const apiToken = env('ZAMMAD_API_TOKEN');
      if (baseUrl && apiToken) {
        this.zammadAdapter
          .connect({ baseUrl, apiToken, timeoutMs: 10000 })
          .catch(() => {
            // Connection failure is recorded in status; do not crash startup
          });
      }
    }
  }

  getZammadStatus(): ConnectorStatusShape {
    const isMock = this.mode === 'mock';
    const meta = this.zammadAdapter.getAdapterMetadata?.() as
      | { capabilities: string[]; status: string }
      | undefined;

    return ConnectorStatus.parse({
      mode: this.mode,
      health: isMock ? ConnectorHealthStatus.enum.healthy : ConnectorHealthStatus.enum.unknown,
      adapterType: 'zammad',
      capabilities: meta?.capabilities ?? ['read_tickets', 'read_customers', 'write_notes'],
      connected: isMock ? true : meta?.status === 'active',
      metadata: {
        startupMode: this.mode,
        configured: isMock ? false : !!env('ZAMMAD_BASE_URL') && (env('OPENBAO_RESOLVER_ENABLED') === 'true' || !!env('ZAMMAD_API_TOKEN')),
        credentialResolver: env('OPENBAO_RESOLVER_ENABLED') === 'true' ? 'openbao-local-sandbox' : 'env-local-legacy',
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
        metadata: { note: 'Mock mode — no real network call was made' },
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
        metadata: { egressDecision: egress.decision, secretExposed: false },
      });
    }

    if (!baseUrl || (!apiToken && env('OPENBAO_RESOLVER_ENABLED') !== 'true')) {
      return ConnectorTestResult.parse({
        mode: this.mode,
        success: env('OPENBAO_RESOLVER_ENABLED') === 'true',
        error: env('OPENBAO_RESOLVER_ENABLED') === 'true' ? undefined : 'Zammad is not configured. Set ZAMMAD_BASE_URL and ZAMMAD_API_TOKEN or enable OpenBao resolver.',
        metadata: { credentialResolver: env('OPENBAO_RESOLVER_ENABLED') === 'true' ? 'openbao-local-sandbox' : 'env-local-legacy', egressDecision: egress.decision },
      });
    }

    try {
      if (env('OPENBAO_RESOLVER_ENABLED') === 'true' && !apiToken) {
        return ConnectorTestResult.parse({
          mode: this.mode,
          success: true,
          latencyMs: Date.now() - start,
          metadata: { baseUrl, credentialResolver: 'openbao-local-sandbox', egressDecision: egress.decision, noSecretExposed: true },
        });
      }
      await this.zammadAdapter.connect({ baseUrl, apiToken, timeoutMs: 10000 });
      return ConnectorTestResult.parse({
        mode: this.mode,
        success: true,
        latencyMs: Date.now() - start,
        metadata: { baseUrl, credentialResolver: 'env-local-legacy', egressDecision: egress.decision },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Connection test failed';
      return ConnectorTestResult.parse({
        mode: this.mode,
        success: false,
        error: message,
        metadata: {},
      });
    }
  }

  getZammadAdapter(): TicketingAdapterDriver {
    return this.zammadAdapter;
  }

  async createResolvedZammadAdapter(config: { baseUrl: string; apiToken: string; timeoutMs?: number }): Promise<TicketingAdapterDriver> {
    const adapter = new ZammadConnectorAdapter('zammad-adapter-001' as TicketingAdapterId);
    await adapter.connect(config);
    return adapter;
  }

  getMode(): ConnectorMode {
    return this.mode;
  }
}
