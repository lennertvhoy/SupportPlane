import type { InternalNoteWritebackResult as InternalNoteWritebackResultShape } from '@supportplane/contracts';
export {
  TicketingAdapter,
  TicketingAdapterType,
  TicketingAdapterStatus,
  TicketingAdapterCapability,
  TicketingAdapterId,
  TicketReference,
  TicketStatus,
  TicketPriority,
  TicketReferenceId,
  ConnectorMode,
  ConnectorHealthStatus,
  ConnectorConfig,
  ConnectorStatus,
  ConnectorTestResult,
  ConnectorErrorCode,
  ConnectorError,
  InternalNoteDraft,
  InternalNoteWritebackRequest,
  InternalNoteWritebackResult,
  ConnectorAuditMetadata,
  ZammadConfig,
  type TicketingAdapter as TicketingAdapterShape,
  type TicketReference as TicketReferenceShape,
  type ConnectorMode as ConnectorModeShape,
  type ConnectorStatus as ConnectorStatusShape,
  type ConnectorTestResult as ConnectorTestResultShape,
  type ConnectorError as ConnectorErrorShape,
  type InternalNoteDraft as InternalNoteDraftShape,
} from '@supportplane/contracts';

/**
 * Legacy interface for a ticketing adapter driver.
 * Concrete implementations (Zammad, GLPI, custom) implement this.
 */
export interface TicketingAdapterDriver {
  readonly adapterType: string;
  connect(config: Record<string, unknown>): Promise<void>;
  getTicket(tenantId: string, externalId: string): Promise<unknown>;
  writeInternalNote(ticketId: string, body: string): Promise<InternalNoteWritebackResultShape>;
  getAdapterMetadata?(): Record<string, unknown>;
}

export { MockTicketingAdapter } from './mock-ticketing-adapter.js';
export {
  ZammadConnectorAdapter,
  MockZammadConnectorAdapter,
  createZammadAdapter,
} from './zammad-adapter.js';
export {
  FetchZammadHttpClient,
  MockZammadHttpClient,
  type ZammadHttpClient,
} from './zammad-http-client.js';
export {
  MockGlpiHttpClient,
  type GlpiHttpClient,
} from './glpi-http-client.js';
export {
  GlpiConnectorAdapter,
  MockGlpiConnectorAdapter,
} from './glpi-adapter.js';
export {
  MeshCentralConnectorService,
  createMeshCentralService,
  type MeshCentralService,
} from './meshcentral-service.js';
export {
  MockMeshCentralClient,
  type MeshCentralClient,
  type MeshDevice,
} from './meshcentral-client.js';
export {
  FortinetConnectorService,
  createFortinetService,
  type FortinetService,
} from './fortinet-service.js';
export {
  MockFortinetClient,
  type FortinetClient,
  type FortinetFirewallStatus,
  type FortinetInterface,
} from './fortinet-client.js';
export {
  MOCK_TELEPHONY_CAPABILITIES,
  MockTelephonyAdapter,
  createMockTelephonyConfig,
  createTelephonyAdapter,
  redactTelephonySecrets,
  sanitizeTelephonyError,
  type TelephonyAdapter,
} from './telephony-adapter.js';

// Registry foundation (BL-123 / BL-124)
export type {
  TicketingAdapterFactory,
  TicketingAdapterClient,
  TicketingAdapterConfigValidation,
  TicketingAdapterConfigIssue,
  ResolvedCredentialSet,
  AdapterSafetyContext,
  AdapterRuntimeContext,
  RegisteredAdapterSummary,
  RuntimeResolverInput,
  RuntimeResolverOutput,
} from './types.js';
export {
  registerTicketingAdapter,
  getTicketingAdapterFactory,
  listTicketingAdapters,
  clearTicketingAdapterRegistry,
  getRegisteredAdapterTypes,
} from './registry.js';
export {
  registerTelephonyAdapter,
  getTelephonyAdapterFactory,
  listTelephonyAdapters,
  clearTelephonyAdapterRegistry,
  getRegisteredTelephonyAdapterTypes,
  createMockTelephonyAdapterFactory,
  createAsteriskAmiAdapterFactory,
  MockTelephonyAdapterFactory,
  AsteriskAmiAdapterFactory,
  type TelephonyAdapterFactory,
  type TelephonyAdapterClient,
  type TelephonyRuntimeContext,
  type TelephonyHealth,
  type TelephonyEvent,
  type CanonicalCallEvent,
  type RegisteredTelephonyAdapterSummary,
} from './telephony-registry.js';
export {
  resolveAdapterRuntime,
  AdapterRuntimeResolverError,
} from './runtime-resolver.js';
export {
  ZammadAdapterFactory,
  MockZammadAdapterFactory,
  createZammadAdapterFactory,
  createMockZammadAdapterFactory,
} from './zammad-adapter-factory.js';
export {
  OsTicketAdapterFactory,
  MockOsTicketAdapterFactory,
  createOsTicketAdapterFactory,
  createMockOsTicketAdapterFactory,
} from './osticket-adapter-factory.js';
export {
  GlpiAdapterFactory,
  MockGlpiAdapterFactory,
  createGlpiAdapterFactory,
  createMockGlpiAdapterFactory,
  registerGlpiAdapter,
} from './glpi-adapter-factory.js';
export {
  registerConnector,
  getConnector,
  listConnectorTypes,
  clearConnectorRegistry,
} from './connector-registry.js';

/**
 * Canonical adapter ID resolver.
 * Temporary mapping until ConnectorInstallation stores a proper adapterId reference.
 * Migration gap: add adapterId field to ConnectorInstallation linking to TicketingAdapter.
 */
export function resolveCanonicalAdapterId(adapterType: string): string {
  const map: Record<string, string> = {
    zammad: 'zammad-adapter-001',
    osticket: 'osticket-adapter-001',
    glpi: 'glpi-adapter-001',
    mock: 'mock-adapter-001',
  };
  return map[adapterType] ?? `${adapterType}-adapter-001`;
}
