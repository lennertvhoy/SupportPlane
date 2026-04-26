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
  type TicketingAdapter as TicketingAdapterShape,
  type TicketReference as TicketReferenceShape,
} from '@supportplane/contracts';

/**
 * Placeholder interface for a ticketing adapter driver.
 * Concrete implementations (Zammad, GLPI, custom) will implement this.
 */
export interface TicketingAdapterDriver {
  readonly adapterType: string;
  connect(config: Record<string, unknown>): Promise<void>;
  getTicket(externalId: string): Promise<unknown>;
  writeInternalNote(ticketId: string, body: string): Promise<unknown>;
}
