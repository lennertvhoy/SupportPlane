import {
  TicketingAdapterType,
  TicketingAdapterStatus,
  TicketingAdapterCapability,
  TicketStatus,
  TicketPriority,
  type TicketingAdapter as TicketingAdapterShape,
  type TicketReference as TicketReferenceShape,
  type TicketingAdapterId,
  type TenantId,
  type TicketReferenceId,
} from '@supportplane/contracts';

import type { TicketingAdapterDriver } from './index.js';

/**
 * Deterministic mock ticketing adapter for development and testing.
 * No external credentials required. Returns stable fixture data
 * seeded by the external ticket ID so repeated calls are predictable.
 *
 * This is where real Zammad/GLPI/custom adapters will plug in later.
 */
export class MockTicketingAdapter implements TicketingAdapterDriver {
  readonly adapterType = 'mock';

  private readonly adapterId: TicketingAdapterId;

  constructor(adapterId: TicketingAdapterId) {
    this.adapterId = adapterId;
  }

  connect(_config: Record<string, unknown>): Promise<void> {
    return Promise.resolve();
  }

  getTicket(
    tenantId: TenantId,
    externalTicketId: string
  ): Promise<TicketReferenceShape> {
    const now = new Date().toISOString();
    const ticket: TicketReferenceShape = {
      id: `mock-tr-${externalTicketId}` as TicketReferenceId,
      tenantId,
      adapterId: this.adapterId,
      externalTicketId,
      subject: `Mock ticket ${externalTicketId}`,
      status: TicketStatus.enum.open,
      priority: TicketPriority.enum.normal,
      customerEmail: `customer-${externalTicketId}@example.com`,
      customerName: `Customer ${externalTicketId}`,
      rawData: { mock: true, source: 'MockTicketingAdapter' },
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    };
    return Promise.resolve(ticket);
  }

  getCustomer(email: string): Promise<{ email: string; name: string }> {
    return Promise.resolve({
      email,
      name: `Customer ${email.split('@')[0]}`,
    });
  }

  writeInternalNote(
    _ticketId: string,
    _body: string
  ): Promise<{ success: boolean }> {
    return Promise.resolve({ success: true });
  }

  getAdapterMetadata(): TicketingAdapterShape {
    const now = new Date().toISOString();
    return {
      id: this.adapterId,
      tenantId: 'system' as TenantId,
      name: 'Mock Ticketing Adapter',
      adapterType: TicketingAdapterType.enum.custom,
      capabilities: [
        TicketingAdapterCapability.enum.read_tickets,
        TicketingAdapterCapability.enum.read_customers,
        TicketingAdapterCapability.enum.search,
      ],
      status: TicketingAdapterStatus.enum.active,
      config: { mock: true },
      secretReferenceIds: [],
      createdAt: now,
      updatedAt: now,
    };
  }
}
