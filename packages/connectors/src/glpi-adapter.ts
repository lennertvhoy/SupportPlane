import {
  TicketingAdapterType,
  TicketingAdapterStatus,
  TicketingAdapterCapability,
  TicketStatus,
  TicketPriority,
  ConnectorErrorCode,
  GlpiConfig,
  type TicketingAdapter as TicketingAdapterShape,
  type TicketReference as TicketReferenceShape,
  type TicketingAdapterId,
  type TenantId,
  type TicketReferenceId,
  type ConnectorError,
  type InternalNoteWritebackResult as InternalNoteWritebackResultShape,
} from '@supportplane/contracts';
import type { TicketingAdapterClient } from './types.js';
import {
  type GlpiHttpClient,
  MockGlpiHttpClient,
} from './glpi-http-client.js';

function normalizeGlpiState(state: string | number): TicketReferenceShape['status'] {
  const lower = String(state).toLowerCase();
  if (lower === 'new' || lower === '1') return TicketStatus.enum.new;
  if (lower === 'open' || lower === '2') return TicketStatus.enum.open;
  if (lower === 'pending' || lower === '3') return TicketStatus.enum.pending;
  if (lower === 'closed' || lower === '4' || lower === 'solved') return TicketStatus.enum.closed;
  return TicketStatus.enum.unknown;
}

function normalizeGlpiPriority(priority: string | number | Record<string, unknown>): TicketReferenceShape['priority'] {
  const raw = typeof priority === 'string' ? priority : String(priority);
  const lower = raw.toLowerCase();
  if (lower.includes('1') || lower.includes('low')) return TicketPriority.enum.low;
  if (lower.includes('3') || lower.includes('high')) return TicketPriority.enum.high;
  if (lower.includes('4') || lower.includes('critical') || lower.includes('very high')) return TicketPriority.enum.critical;
  return TicketPriority.enum.normal;
}

function buildConnectorError(
  code: ConnectorErrorCode,
  message: string,
  safeToDisplay = false,
  metadata: Record<string, unknown> = {}
): ConnectorError {
  return {
    code,
    message,
    safeToDisplay,
    metadata,
  };
}

export class GlpiConnectorAdapter implements TicketingAdapterClient {
  readonly adapterType = 'glpi';
  private readonly adapterId: TicketingAdapterId;
  private httpClient?: GlpiHttpClient;
  private config?: { baseUrl: string; apiToken: string; timeoutMs: number };

  constructor(adapterId: TicketingAdapterId) {
    this.adapterId = adapterId;
  }

  connect(inputConfig: Record<string, unknown>): Promise<void> {
    const parsed = GlpiConfig.safeParse(inputConfig);
    if (!parsed.success) {
      return Promise.reject(
        buildConnectorError(ConnectorErrorCode.enum.CONFIG_INVALID, 'Invalid GLPI configuration')
      );
    }
    this.config = parsed.data;
    // Real GLPI HTTP client is not implemented. Reject honestly rather than silently falling back to mock.
    return Promise.reject(
      buildConnectorError(
        ConnectorErrorCode.enum.CONFIG_MISSING,
        'Real GLPI HTTP client not implemented'
      )
    );
  }

  async getTicket(tenantId: TenantId, externalTicketId: string): Promise<TicketReferenceShape> {
    if (!this.httpClient) {
      throw buildConnectorError(ConnectorErrorCode.enum.CONFIG_MISSING, 'GLPI adapter not connected');
    }

    const raw = await this.httpClient.getTicket(externalTicketId);
    const data = raw as Record<string, unknown>;
    const now = new Date().toISOString();

    let customerEmail: string | undefined;
    let customerName: string | undefined;

    const customerId = data.customer_id ?? data.user;
    if (customerId !== undefined && customerId !== null) {
      try {
        const userRaw = await this.httpClient.getUser(String(customerId));
        const user = userRaw as Record<string, unknown>;
        customerEmail = typeof user.email === 'string' ? user.email : undefined;
        const first = typeof user.firstname === 'string' ? user.firstname : '';
        const last = typeof user.lastname === 'string' ? user.lastname : '';
        customerName = `${first} ${last}`.trim() || (typeof user.name === 'string' ? user.name : undefined);
      } catch {
        customerEmail = undefined;
        customerName = undefined;
      }
    }

    return {
      id: `glpi-tr-${externalTicketId}` as TicketReferenceId,
      tenantId,
      adapterId: this.adapterId,
      externalTicketId,
      subject: typeof data.subject === 'string' ? data.subject : `GLPI Ticket ${externalTicketId}`,
      status: normalizeGlpiState(
        typeof data.status === 'string'
          ? data.status
          : typeof data.state === 'string'
            ? data.state
            : 'unknown'
      ),
      priority: normalizeGlpiPriority(data.priority as string | number | Record<string, unknown>),
      customerEmail,
      customerName,
      rawData: data as Record<string, unknown>,
      lastSyncedAt: now,
      createdAt: typeof data.date === 'string' ? data.date : now,
      updatedAt: typeof data.updated_at === 'string' ? data.updated_at : now,
    };
  }

  async writeInternalNote(_ticketId: string, _body: string): Promise<InternalNoteWritebackResultShape> {
    if (!this.httpClient) {
      return {
        success: false,
        error: buildConnectorError(ConnectorErrorCode.enum.CONFIG_MISSING, 'GLPI adapter not connected'),
      };
    }
    return {
      success: false,
      error: buildConnectorError(ConnectorErrorCode.enum.NOTEBACK_WRITE_FAILED, 'GLPI adapter is read-only in this slice'),
    };
  }

  getAdapterMetadata(): TicketingAdapterShape {
    const now = new Date().toISOString();
    return {
      id: this.adapterId,
      tenantId: 'system' as TenantId,
      name: 'GLPI Connector',
      adapterType: TicketingAdapterType.enum.glpi,
      capabilities: [
        TicketingAdapterCapability.enum.read_tickets,
        TicketingAdapterCapability.enum.read_customers,
      ],
      status: this.httpClient ? TicketingAdapterStatus.enum.active : TicketingAdapterStatus.enum.inactive,
      config: this.config ? { baseUrl: this.config.baseUrl, timeoutMs: this.config.timeoutMs } : {},
      secretReferenceIds: [],
      createdAt: now,
      updatedAt: now,
    };
  }
}

export class MockGlpiConnectorAdapter implements TicketingAdapterClient {
  readonly adapterType = 'glpi';
  private readonly adapterId: TicketingAdapterId;
  private httpClient: MockGlpiHttpClient;

  constructor(adapterId: TicketingAdapterId) {
    this.adapterId = adapterId;
    this.httpClient = new MockGlpiHttpClient();
  }

  connect(_config: Record<string, unknown>): Promise<void> {
    return Promise.resolve();
  }

  async getTicket(tenantId: TenantId, externalTicketId: string): Promise<TicketReferenceShape> {
    const raw = await this.httpClient.getTicket(externalTicketId);
    const data = raw as Record<string, unknown>;
    const userRaw = await this.httpClient.getUser(String(data.customer_id ?? 'GLPI-USER-5'));
    const user = userRaw as Record<string, unknown>;
    const now = new Date().toISOString();

    return {
      id: `glpi-tr-${externalTicketId}` as TicketReferenceId,
      tenantId,
      adapterId: this.adapterId,
      externalTicketId,
      subject: typeof data.subject === 'string' ? data.subject : `Mock GLPI ticket ${externalTicketId}`,
      status: normalizeGlpiState(String(data.status ?? 'new')),
      priority: normalizeGlpiPriority(data.priority as string | number | Record<string, unknown>),
      customerEmail: typeof user.email === 'string' ? user.email : 'support@acme.example',
      customerName: `${user.firstname ?? 'Acme'} ${user.lastname ?? 'BVBA'}`.trim(),
      rawData: { mock: true, source: 'MockGlpiConnectorAdapter', data },
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }

  async writeInternalNote(_ticketId: string, _body: string): Promise<InternalNoteWritebackResultShape> {
    return {
      success: false,
      error: buildConnectorError(ConnectorErrorCode.enum.NOTEBACK_WRITE_FAILED, 'Mock GLPI adapter is read-only'),
    };
  }

  getAdapterMetadata(): TicketingAdapterShape {
    const now = new Date().toISOString();
    return {
      id: this.adapterId,
      tenantId: 'system' as TenantId,
      name: 'Mock GLPI Connector',
      adapterType: TicketingAdapterType.enum.glpi,
      capabilities: [
        TicketingAdapterCapability.enum.read_tickets,
        TicketingAdapterCapability.enum.read_customers,
      ],
      status: TicketingAdapterStatus.enum.active,
      config: { mock: true },
      secretReferenceIds: [],
      createdAt: now,
      updatedAt: now,
    };
  }
}
