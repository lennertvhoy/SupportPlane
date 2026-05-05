import {
  TicketingAdapterType,
  TicketingAdapterStatus,
  TicketingAdapterCapability,
  TicketStatus,
  TicketPriority,
  ConnectorErrorCode,
  ConnectorMode,
  ZammadConfig,
  type TicketingAdapter as TicketingAdapterShape,
  type TicketReference as TicketReferenceShape,
  type TicketingAdapterId,
  type TenantId,
  type TicketReferenceId,
  type ConnectorError,
} from '@supportplane/contracts';
import type { TicketingAdapterDriver } from './index.js';
import {
  type ZammadHttpClient,
  FetchZammadHttpClient,
  MockZammadHttpClient,
} from './zammad-http-client.js';

function normalizeZammadState(state: string | number): TicketReferenceShape['status'] {
  const lower = String(state).toLowerCase();
  if (lower === 'new' || lower === '1') return TicketStatus.enum.new;
  if (lower === 'open' || lower === '2') return TicketStatus.enum.open;
  if (lower === 'pending reminder' || lower === 'pending close' || lower === '3' || lower === '6')
    return TicketStatus.enum.pending;
  if (lower === 'closed' || lower === '4') return TicketStatus.enum.closed;
  if (lower === 'merged' || lower === '5') return TicketStatus.enum.merged;
  return TicketStatus.enum.unknown;
}

function normalizeZammadPriority(
  priority: string | number | Record<string, unknown>,
): TicketReferenceShape['priority'] {
  const raw = typeof priority === 'string' ? priority : String(priority);
  const lower = raw.toLowerCase();
  if (lower.includes('1') || lower.includes('low')) return TicketPriority.enum.low;
  if (lower.includes('3') || lower.includes('high')) return TicketPriority.enum.high;
  if (lower.includes('4') || lower.includes('critical') || lower.includes('very high'))
    return TicketPriority.enum.critical;
  return TicketPriority.enum.normal;
}

function buildConnectorError(
  code: ConnectorErrorCode,
  message: string,
  safeToDisplay = false,
  metadata: Record<string, unknown> = {},
): ConnectorError {
  return {
    code,
    message,
    safeToDisplay,
    metadata,
  };
}

function sanitizeErrorForPublic(
  error: Error,
  fallbackCode: ConnectorErrorCode = ConnectorErrorCode.enum.UNKNOWN,
): ConnectorError {
  const message = error.message ?? 'Unknown connector error';
  // Never expose token-related details
  const safeMessage = message.replace(/token=[^\s&]+/gi, 'token=<redacted>');
  return buildConnectorError(fallbackCode, safeMessage, false);
}

export class ZammadConnectorAdapter implements TicketingAdapterDriver {
  readonly adapterType = 'zammad';
  private readonly adapterId: TicketingAdapterId;
  private httpClient?: ZammadHttpClient;
  private config?: { baseUrl: string; apiToken: string; timeoutMs: number };

  constructor(adapterId: TicketingAdapterId) {
    this.adapterId = adapterId;
  }

  connect(inputConfig: Record<string, unknown>): Promise<void> {
    const parsed = ZammadConfig.safeParse(inputConfig);
    if (!parsed.success) {
      return Promise.reject(
        buildConnectorError(ConnectorErrorCode.enum.CONFIG_INVALID, 'Invalid Zammad configuration'),
      );
    }
    this.config = parsed.data;
    this.httpClient = new FetchZammadHttpClient(parsed.data);
    return Promise.resolve();
  }

  async getTicket(tenantId: TenantId, externalTicketId: string): Promise<TicketReferenceShape> {
    if (!this.httpClient) {
      throw buildConnectorError(
        ConnectorErrorCode.enum.CONFIG_MISSING,
        'Zammad adapter not connected',
      );
    }

    try {
      const raw = await this.httpClient.getTicket(externalTicketId);
      const data = raw as Record<string, unknown>;
      const now = new Date().toISOString();

      let customerEmail: string | undefined;
      let customerName: string | undefined;

      const customerId = data.customer_id ?? data.customer;
      if (customerId !== undefined && customerId !== null) {
        try {
          const userRaw = await this.httpClient.getUser(String(customerId));
          const user = userRaw as Record<string, unknown>;
          customerEmail = typeof user.email === 'string' ? user.email : undefined;
          const first = typeof user.firstname === 'string' ? user.firstname : '';
          const last = typeof user.lastname === 'string' ? user.lastname : '';
          customerName = `${first} ${last}`.trim() || undefined;
        } catch {
          // Customer lookup failure is non-fatal; ticket still loads
          customerEmail = undefined;
          customerName = undefined;
        }
      }

      const ticket: TicketReferenceShape = {
        id: `zammad-tr-${externalTicketId}` as TicketReferenceId,
        tenantId,
        adapterId: this.adapterId,
        externalTicketId,
        subject: typeof data.title === 'string' ? data.title : `Ticket ${externalTicketId}`,
        status: normalizeZammadState(
          typeof data.state === 'string'
            ? data.state
            : typeof data.state_id === 'number'
              ? String(data.state_id)
              : 'unknown',
        ),
        priority: normalizeZammadPriority(
          data.priority as string | number | Record<string, unknown>,
        ),
        customerEmail,
        customerName,
        rawData: data as Record<string, unknown>,
        lastSyncedAt: now,
        createdAt: typeof data.created_at === 'string' ? data.created_at : now,
        updatedAt: typeof data.updated_at === 'string' ? data.updated_at : now,
      };

      return ticket;
    } catch (err) {
      const connectorErr = sanitizeErrorForPublic(
        err instanceof Error ? err : new Error(String(err)),
        ConnectorErrorCode.enum.TICKET_READ_FAILED,
      );
      throw connectorErr;
    }
  }

  async writeInternalNote(
    ticketId: string,
    body: string,
  ): Promise<{ success: boolean; externalArticleId?: string; error?: ConnectorError }> {
    if (!this.httpClient) {
      return {
        success: false,
        error: buildConnectorError(
          ConnectorErrorCode.enum.CONFIG_MISSING,
          'Zammad adapter not connected',
        ),
      };
    }

    try {
      const raw = await this.httpClient.createArticle({
        ticket_id: Number(ticketId) || ticketId,
        subject: 'Internal note',
        body,
        type: 'note',
        internal: true,
      });
      const data = raw as Record<string, unknown>;
      return {
        success: true,
        externalArticleId:
          typeof data.id === 'number' || typeof data.id === 'string' ? String(data.id) : undefined,
      };
    } catch (err) {
      return {
        success: false,
        error: sanitizeErrorForPublic(
          err instanceof Error ? err : new Error(String(err)),
          ConnectorErrorCode.enum.NOTEBACK_WRITE_FAILED,
        ),
      };
    }
  }

  getAdapterMetadata(): TicketingAdapterShape {
    const now = new Date().toISOString();
    return {
      id: this.adapterId,
      tenantId: 'system' as TenantId,
      name: 'Zammad Connector',
      adapterType: TicketingAdapterType.enum.zammad,
      capabilities: [
        TicketingAdapterCapability.enum.read_tickets,
        TicketingAdapterCapability.enum.read_customers,
        TicketingAdapterCapability.enum.write_notes,
      ],
      status: this.httpClient
        ? TicketingAdapterStatus.enum.active
        : TicketingAdapterStatus.enum.inactive,
      config: this.config ? { baseUrl: this.config.baseUrl, timeoutMs: this.config.timeoutMs } : {},
      secretReferenceIds: [],
      createdAt: now,
      updatedAt: now,
    };
  }
}

/**
 * Deterministic mock Zammad adapter for tests and local development.
 * No external credentials required.
 */
export class MockZammadConnectorAdapter implements TicketingAdapterDriver {
  readonly adapterType = 'zammad';
  private readonly adapterId: TicketingAdapterId;
  private httpClient: MockZammadHttpClient;

  constructor(adapterId: TicketingAdapterId) {
    this.adapterId = adapterId;
    this.httpClient = new MockZammadHttpClient();
  }

  connect(_config: Record<string, unknown>): Promise<void> {
    return Promise.resolve();
  }

  async getTicket(tenantId: TenantId, externalTicketId: string): Promise<TicketReferenceShape> {
    const raw = await this.httpClient.getTicket(externalTicketId);
    const data = raw as Record<string, unknown>;
    const userRaw = await this.httpClient.getUser(String(data.customer_id ?? '100'));
    const user = userRaw as Record<string, unknown>;
    const now = new Date().toISOString();

    return {
      id: `zammad-tr-${externalTicketId}` as TicketReferenceId,
      tenantId,
      adapterId: this.adapterId,
      externalTicketId,
      subject:
        typeof data.title === 'string' ? data.title : `Mock Zammad ticket ${externalTicketId}`,
      status: normalizeZammadState(String(data.state ?? 'open')),
      priority: normalizeZammadPriority(data.priority as string | number | Record<string, unknown>),
      customerEmail:
        typeof user.email === 'string' ? user.email : `customer-${externalTicketId}@example.com`,
      customerName: `${user.firstname ?? 'Customer'} ${user.lastname ?? externalTicketId}`.trim(),
      rawData: { mock: true, source: 'MockZammadConnectorAdapter', data },
      lastSyncedAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }

  async writeInternalNote(
    ticketId: string,
    body: string,
  ): Promise<{ success: boolean; externalArticleId?: string }> {
    const raw = await this.httpClient.createArticle({
      ticket_id: ticketId,
      subject: 'Internal note',
      body,
      type: 'note',
      internal: true,
    });
    const data = raw as Record<string, unknown>;
    return {
      success: true,
      externalArticleId:
        typeof data.id === 'number' || typeof data.id === 'string'
          ? String(data.id)
          : 'mock-article-001',
    };
  }

  getAdapterMetadata(): TicketingAdapterShape {
    const now = new Date().toISOString();
    return {
      id: this.adapterId,
      tenantId: 'system' as TenantId,
      name: 'Mock Zammad Connector',
      adapterType: TicketingAdapterType.enum.zammad,
      capabilities: [
        TicketingAdapterCapability.enum.read_tickets,
        TicketingAdapterCapability.enum.read_customers,
        TicketingAdapterCapability.enum.write_notes,
      ],
      status: TicketingAdapterStatus.enum.active,
      config: { mock: true },
      secretReferenceIds: [],
      createdAt: now,
      updatedAt: now,
    };
  }
}

export function createZammadAdapter(
  mode: ConnectorMode,
  adapterId: TicketingAdapterId,
): TicketingAdapterDriver {
  if (mode === 'zammad') {
    return new ZammadConnectorAdapter(adapterId);
  }
  return new MockZammadConnectorAdapter(adapterId);
}
