import type { InternalNoteWritebackResult as InternalNoteWritebackResultShape } from '@supportplane/contracts';

export interface TicketingAdapterConfigIssue {
  field: string;
  severity: 'error' | 'warning';
  message: string;
  code: string;
}

export interface TicketingAdapterConfigValidation {
  valid: boolean;
  issues: TicketingAdapterConfigIssue[];
}

export interface ResolvedCredentialSet {
  apiToken?: string;
  [key: string]: unknown;
}

export interface AdapterSafetyContext {
  egressPolicy: unknown;
  writebackEnabled: boolean;
  mockMode: boolean;
  sandboxMode: boolean;
}

export interface AdapterRuntimeContext {
  tenantId: string;
  installationId: string;
  config: Record<string, unknown>;
  credentials: ResolvedCredentialSet;
  safety: AdapterSafetyContext;
}

export interface TicketingAdapterClient {
  readonly adapterType: string;
  getTicket(tenantId: string, externalId: string): Promise<unknown>;
  writeInternalNote(ticketId: string, body: string): Promise<InternalNoteWritebackResultShape>;
  getAdapterMetadata?(): Record<string, unknown>;
}

export interface TicketingAdapterFactory {
  readonly adapterType: string;
  readonly capabilities: string[];
  getConfigSchema(): unknown;
  validateConfig(config: unknown): TicketingAdapterConfigValidation;
  createAdapter(adapterId: string): TicketingAdapterClient;
}

export interface RegisteredAdapterSummary {
  adapterType: string;
  capabilities: string[];
}

export interface RuntimeResolverInput {
  adapterType: string;
  adapterId?: string;
  installation: {
    id: string;
    enabled: boolean;
    config: Record<string, unknown>;
    capabilities: string[];
  };
  credentials: ResolvedCredentialSet;
  safety: AdapterSafetyContext;
}

export interface RuntimeResolverOutput {
  adapter: TicketingAdapterClient;
  metadata: {
    adapterType: string;
    installationId: string;
    enabled: boolean;
    mode: string;
    capabilities: string[];
    configSchema: unknown;
    configValid: boolean;
    credentialReferenceCount: number;
    credentialsResolved: boolean;
    secretsExposed: false;
    egressPolicy: unknown;
    writebackEnabled: boolean;
    mockMode: boolean;
    sandboxMode: boolean;
  };
}
