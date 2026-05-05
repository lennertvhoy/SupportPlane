import type { RuntimeResolverInput, RuntimeResolverOutput } from './types.js';
import { getTicketingAdapterFactory } from './registry.js';

export class AdapterRuntimeResolverError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AdapterRuntimeResolverError';
  }
}

export async function resolveAdapterRuntime(
  input: RuntimeResolverInput,
): Promise<RuntimeResolverOutput> {
  const { adapterType, installation, credentials, safety } = input;

  if (!installation.enabled) {
    throw new AdapterRuntimeResolverError(
      'INSTALLATION_DISABLED',
      `Connector installation ${installation.id} is disabled.`,
    );
  }

  const factory = getTicketingAdapterFactory(adapterType);
  if (!factory) {
    throw new AdapterRuntimeResolverError(
      'ADAPTER_NOT_REGISTERED',
      `Unknown adapter type: ${adapterType}`,
    );
  }

  const configSchema = factory.getConfigSchema();
  const validation = factory.validateConfig(installation.config);
  const configValid = validation.valid;

  // Create a fresh adapter instance
  // adapterId references TicketingAdapter.id (not ConnectorInstallation.id)
  const adapterId = input.adapterId ?? installation.id;
  const adapter = factory.createAdapter(adapterId);

  // Connect with resolved config merged with credentials
  const connectConfig = {
    ...installation.config,
    ...credentials,
  };

  if (
    typeof (adapter as unknown as { connect?: (c: Record<string, unknown>) => Promise<void> })
      .connect === 'function'
  ) {
    await (
      adapter as unknown as { connect: (c: Record<string, unknown>) => Promise<void> }
    ).connect(connectConfig);
  }

  const credentialReferenceCount = Object.keys(credentials).length > 0 ? 1 : 0;
  const credentialsResolved = Boolean(credentials.apiToken);

  return {
    adapter,
    metadata: {
      adapterType,
      installationId: installation.id,
      enabled: installation.enabled,
      mode: safety.sandboxMode ? 'sandbox' : safety.mockMode ? 'mock' : 'unknown',
      capabilities: factory.capabilities,
      configSchema,
      configValid,
      credentialReferenceCount,
      credentialsResolved,
      secretsExposed: false,
      egressPolicy: safety.egressPolicy,
      writebackEnabled: safety.writebackEnabled,
      mockMode: safety.mockMode,
      sandboxMode: safety.sandboxMode,
    },
  };
}
