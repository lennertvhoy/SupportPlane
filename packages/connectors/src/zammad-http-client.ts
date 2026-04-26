/**
 * Zammad HTTP transport boundary.
 *
 * Documented assumptions (unverified against live instance):
 * - Base URL is the root Zammad URL (e.g. https://helpdesk.example.com).
 * - API routes are under /api/v1/.
 * - Authentication uses `Authorization: Token token={apiToken}`.
 * - Ticket read: GET /api/v1/tickets/{id} returns JSON with id, title, state, priority, customer_id, etc.
 * - Customer/user read: GET /api/v1/users/{id} returns JSON with id, email, firstname, lastname.
 * - Article/note creation: POST /api/v1/ticket_articles with { ticket_id, subject, body, type: "note", internal: true }.
 *
 * Unsupported operations (documented):
 * - Ticket creation through this boundary.
 * - Ticket updates (state, priority, assignment) through this boundary.
 * - Full-text search through this boundary.
 * - Attachment upload through this boundary.
 */

export interface ZammadHttpClient {
  getTicket(ticketId: string): Promise<unknown>;
  getUser(userId: string): Promise<unknown>;
  createArticle(payload: Record<string, unknown>): Promise<unknown>;
}

export class FetchZammadHttpClient implements ZammadHttpClient {
  private readonly baseUrl: string;
  private readonly apiToken: string;
  private readonly timeoutMs: number;

  constructor(options: { baseUrl: string; apiToken: string; timeoutMs?: number }) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.apiToken = options.apiToken;
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    const url = `${this.baseUrl}/api/v1${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token token=${this.apiToken}`,
          ...(init.headers ?? {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text().catch(() => 'Unknown error');
        throw new Error(`Zammad HTTP ${response.status}: ${text}`);
      }

      if (response.status === 204) {
        return undefined;
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Zammad request timed out');
      }
      throw err;
    }
  }

  getTicket(ticketId: string): Promise<unknown> {
    return this.request(`/tickets/${encodeURIComponent(ticketId)}`);
  }

  getUser(userId: string): Promise<unknown> {
    return this.request(`/users/${encodeURIComponent(userId)}`);
  }

  createArticle(payload: Record<string, unknown>): Promise<unknown> {
    return this.request('/ticket_articles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}

/**
 * Mock Zammad HTTP client for deterministic testing without real credentials.
 */
export class MockZammadHttpClient implements ZammadHttpClient {
  private readonly fixtureTicketId: string;

  constructor(options?: { fixtureTicketId?: string }) {
    this.fixtureTicketId = options?.fixtureTicketId ?? '42';
  }

  async getTicket(ticketId: string): Promise<unknown> {
    return {
      id: Number(ticketId) || 42,
      title: `Zammad ticket ${ticketId}`,
      state: 'open',
      priority: '2 normal',
      customer_id: 100 + (Number(ticketId) || 42),
      number: ticketId,
      group_id: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async getUser(userId: string): Promise<unknown> {
    const id = Number(userId) || 100;
    return {
      id,
      email: `customer-${id}@example.com`,
      firstname: 'Customer',
      lastname: `${id}`,
      login: `customer-${id}@example.com`,
      active: true,
    };
  }

  async createArticle(payload: Record<string, unknown>): Promise<unknown> {
    return {
      id: 999,
      ticket_id: payload.ticket_id,
      subject: payload.subject,
      body: payload.body,
      type: payload.type,
      internal: payload.internal,
      created_at: new Date().toISOString(),
    };
  }
}
