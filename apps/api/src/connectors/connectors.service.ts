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
  createOsTicketAdapterFactory,
  createMockOsTicketAdapterFactory,
  resolveCanonicalAdapterId,
  registerTelephonyAdapter,
  createMockTelephonyAdapterFactory,
  createAsteriskAmiAdapterFactory,
  registerGlpiAdapter,
  registerConnector,
  createMeshCentralService,
  createFortinetService,
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
  // Register osTicket adapter (read-only, no writeback in this slice)
  registerTicketingAdapter(createOsTicketAdapterFactory());
  registerTicketingAdapter(createMockOsTicketAdapterFactory());
  // Register GLPI adapters
  registerGlpiAdapter();
  // Register telephony adapters
  registerTelephonyAdapter(createMockTelephonyAdapterFactory());
  registerTelephonyAdapter(createAsteriskAmiAdapterFactory());
  // Register MeshCentral and Fortinet as unconfigured by default. Do not use
  // fixture clients for registry entries that the status API reports as real.
  const mockInstallation = {
    id: 'mock-conn-inst',
    tenantId: 'dev-tenant',
    name: 'Mock Connector',
    adapterType: 'mock',
    capabilities: [],
    config: {},
    secretReferenceIds: [],
    status: 'active',
    mockMode: false,
    enabled: false,
    safetyFlags: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as unknown as Parameters<typeof createMeshCentralService>[0];
  registerConnector('meshcentral', createMeshCentralService(mockInstallation));
  registerConnector('fortinet', createFortinetService(mockInstallation));
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
    return factory.createAdapter(resolveCanonicalAdapterId('zammad') as TicketingAdapterId);
  }

  async createResolvedZammadAdapter(config: { baseUrl: string; apiToken: string; timeoutMs?: number }): Promise<TicketingAdapterClient> {
    const factory = getTicketingAdapterFactory('zammad');
    if (!factory) {
      throw new Error('Zammad adapter factory not registered');
    }
    const adapter = factory.createAdapter(resolveCanonicalAdapterId('zammad') as TicketingAdapterId);
    if (typeof (adapter as unknown as { connect?: (c: Record<string, unknown>) => Promise<void> }).connect === 'function') {
      await (adapter as unknown as { connect: (c: Record<string, unknown>) => Promise<void> }).connect(config);
    }
    return adapter;
  }

  getAllConnectorStatus(_tenantId: string): Array<{
    id: string;
    key: string;
    displayName: string;
    name: string;
    adapterType: string;
    mode: 'fixture' | 'mock' | 'configured' | 'live' | 'error' | 'unconfigured';
    status: 'fixture' | 'mock' | 'configured' | 'live' | 'error' | 'unconfigured';
    transport: 'real' | 'mock' | 'fixture' | 'unconfigured';
    capabilities: string[];
    credentialSource: 'none' | 'env' | 'vault' | 'local_dev_secret' | 'redacted';
    health: string;
    lastCheck: {
      status: 'ok' | 'warning' | 'error' | 'not_run';
      timestamp: string;
    };
    lastChecked: string;
    errorCode: 'CONFIG_MISSING' | 'AUTH_FAILED' | 'NETWORK_FAILED' | 'UNSUPPORTED' | 'OK';
    fixtureWarning?: string;
    lastError?: string;
    tenantScoped: boolean;
  }> {
    const now = new Date().toISOString();
    const zammadStatus = this.getZammadStatus();
    const isZammadMock = zammadStatus.mode === 'mock';
    const zammadBaseUrl = env('ZAMMAD_BASE_URL');
    const zammadApiToken = env('ZAMMAD_API_TOKEN');
    const openBaoEnabled = env('OPENBAO_RESOLVER_ENABLED') === 'true';
    const zammadConfigured = isZammadMock || Boolean(zammadBaseUrl && (zammadApiToken || openBaoEnabled));
    const zammadMode = isZammadMock ? 'mock' : zammadConfigured ? 'configured' : 'unconfigured';
    const zammadCredentialSource = isZammadMock
      ? 'none'
      : openBaoEnabled
        ? 'vault'
        : zammadApiToken
          ? 'env'
          : 'none';
    const zammadConfigError = !isZammadMock && !zammadConfigured;

    const classifyConfigOnlyConnector = (connector: {
      id: string;
      displayName: string;
      adapterType: string;
      baseUrlEnv: string;
      tokenEnv: string;
      capabilities: string[];
      fixtureByDefault: boolean;
      fixtureWarning?: string;
      unsupportedRealClient?: boolean;
      configHint: string;
    }) => {
      const baseUrl = env(connector.baseUrlEnv);
      const token = env(connector.tokenEnv);
      const hasAnyConfig = Boolean(baseUrl || token);
      const hasFullConfig = Boolean(baseUrl && token);
      const credentialSource = token ? 'env' as const : 'none' as const;
      const isUnsupported = hasFullConfig && connector.unsupportedRealClient === true;
      const mode = connector.fixtureByDefault && !hasAnyConfig
        ? 'fixture' as const
        : isUnsupported
          ? 'error' as const
          : hasFullConfig
            ? 'configured' as const
            : hasAnyConfig
              ? 'error' as const
              : 'unconfigured' as const;
      const errorCode = mode === 'fixture' || mode === 'configured'
        ? 'OK' as const
        : isUnsupported
          ? 'UNSUPPORTED' as const
          : 'CONFIG_MISSING' as const;
      const lastError = errorCode === 'OK'
        ? undefined
        : isUnsupported
          ? `${connector.displayName} real HTTP client is not implemented in this slice. Fixture fallback is disabled when real config is present.`
          : connector.configHint;
      const transport = mode === 'fixture'
        ? 'fixture' as const
        : mode === 'configured'
          ? 'real' as const
          : 'unconfigured' as const;

      return {
        id: connector.id,
        key: connector.id,
        displayName: connector.displayName,
        name: connector.displayName,
        adapterType: connector.adapterType,
        mode,
        status: mode,
        transport,
        capabilities: connector.capabilities,
        credentialSource,
        health: mode === 'fixture' ? 'healthy' : mode === 'configured' ? 'unknown' : 'unknown',
        lastCheck: {
          status: errorCode === 'OK' ? 'ok' as const : 'error' as const,
          timestamp: now,
        },
        lastChecked: now,
        errorCode,
        fixtureWarning: mode === 'fixture' ? connector.fixtureWarning : undefined,
        lastError,
        tenantScoped: true,
      };
    };

    return [
      {
        id: 'zammad',
        key: 'zammad',
        displayName: 'Zammad',
        name: 'Zammad',
        adapterType: 'zammad',
        mode: zammadMode,
        status: zammadMode,
        transport: isZammadMock ? 'mock' : 'real',
        capabilities: zammadStatus.capabilities,
        credentialSource: zammadCredentialSource,
        health: zammadConfigError ? 'unknown' : zammadStatus.health,
        lastCheck: {
          status: zammadConfigError ? 'error' : 'ok',
          timestamp: now,
        },
        lastChecked: now,
        errorCode: zammadConfigError ? 'CONFIG_MISSING' : 'OK',
        fixtureWarning: isZammadMock ? 'Zammad is running in mock mode; no real Zammad network call is made.' : undefined,
        lastError: zammadConfigError ? 'Zammad is not configured. Set ZAMMAD_BASE_URL and ZAMMAD_API_TOKEN or enable OpenBao resolver.' : undefined,
        tenantScoped: true,
      },
      classifyConfigOnlyConnector({
        id: 'glpi',
        displayName: 'GLPI',
        adapterType: 'glpi',
        capabilities: ['read_tickets', 'read_customers'],
        baseUrlEnv: 'GLPI_BASE_URL',
        tokenEnv: 'GLPI_API_TOKEN',
        fixtureByDefault: true,
        unsupportedRealClient: true,
        fixtureWarning: 'GLPI is fixture-backed until GLPI_BASE_URL and GLPI_API_TOKEN are configured; no real GLPI network call is made.',
        configHint: 'GLPI is not fully configured. Set GLPI_BASE_URL and GLPI_API_TOKEN to enable the real adapter path.',
      }),
      classifyConfigOnlyConnector({
        id: 'osticket',
        displayName: 'osTicket',
        adapterType: 'osticket',
        capabilities: ['read_tickets', 'read_customers'],
        baseUrlEnv: 'OSTICKET_BASE_URL',
        tokenEnv: 'OSTICKET_API_TOKEN',
        fixtureByDefault: true,
        fixtureWarning: 'osTicket is fixture-backed in this slice; no real osTicket network call is made.',
        unsupportedRealClient: true,
        configHint: 'osTicket is not fully configured. Real osTicket integration remains out of scope for this slice.',
      }),
      classifyConfigOnlyConnector({
        id: 'meshcentral',
        displayName: 'MeshCentral',
        adapterType: 'meshcentral',
        capabilities: ['read_devices'],
        baseUrlEnv: 'MESHCENTRAL_BASE_URL',
        tokenEnv: 'MESHCENTRAL_API_TOKEN',
        fixtureByDefault: false,
        unsupportedRealClient: true,
        configHint: 'No MeshCentral instance configured. Set MESHCENTRAL_BASE_URL and MESHCENTRAL_API_TOKEN to enable future real readiness work.',
      }),
      classifyConfigOnlyConnector({
        id: 'fortinet',
        displayName: 'Fortinet',
        adapterType: 'fortinet',
        capabilities: ['read_firewall_context'],
        baseUrlEnv: 'FORTINET_BASE_URL',
        tokenEnv: 'FORTINET_API_TOKEN',
        fixtureByDefault: false,
        unsupportedRealClient: true,
        configHint: 'No Fortinet instance configured. Set FORTINET_BASE_URL and FORTINET_API_TOKEN to enable future real readiness work.',
      }),
    ];
  }
}
