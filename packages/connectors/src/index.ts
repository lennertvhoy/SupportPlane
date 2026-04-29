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
 * Placeholder interface for a ticketing adapter driver.
 * Concrete implementations (Zammad, GLPI, custom) will implement this.
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
  MOCK_TELEPHONY_CAPABILITIES,
  MockTelephonyAdapter,
  createMockTelephonyConfig,
  createTelephonyAdapter,
  redactTelephonySecrets,
  sanitizeTelephonyError,
  type TelephonyAdapter,
} from './telephony-adapter.js';
