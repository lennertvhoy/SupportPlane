export interface GlpiHttpClient {
  searchTicket(query: string): Promise<unknown>;
  getTicket(ticketId: string): Promise<unknown>;
  getUser(userId: string): Promise<unknown>;
}

export class MockGlpiHttpClient implements GlpiHttpClient {
  async searchTicket(_query: string): Promise<unknown> {
    return [
      {
        id: 'GLPI-101',
        subject: 'Network outage in building B',
        status: 'new',
        priority: 'high',
        customerName: 'Acme BVBA',
        customerEmail: 'support@acme.example',
      },
    ];
  }

  async getTicket(ticketId: string): Promise<unknown> {
    return {
      id: ticketId,
      subject: 'Network outage in building B',
      status: 'new',
      priority: 'high',
      customer_id: 'GLPI-USER-5',
      date: new Date().toISOString(),
    };
  }

  async getUser(userId: string): Promise<unknown> {
    return {
      id: userId,
      name: 'Acme BVBA',
      email: 'support@acme.example',
      firstname: 'Acme',
      lastname: 'BVBA',
    };
  }
}

/**
 * Real GLPI HTTP client using the GLPI REST API.
 *
 * GLPI REST API conventions:
 * - Base URL is the GLPI root (e.g. https://glpi.example.com).
 * - API routes are under /apirest.php/.
 * - Authentication: initSession with Basic auth (username:password) to get session_token.
 *   Credential format: apiToken = "username:password".
 * - Session token: Initiated via GET /apirest.php/initSession, returned as `session_token`.
 * - Ticket read: GET /apirest.php/Ticket/{id} with Session-Token header.
 * - Ticket search: GET /apirest.php/search/Ticket with query parameters.
 * - User read: GET /apirest.php/User/{id}.
 *
 * Unsupported operations:
 * - Ticket creation through this boundary.
 * - Ticket updates through this boundary.
 * - ITIL followup/comment creation through this boundary.
 */
export class FetchGlpiHttpClient implements GlpiHttpClient {
  private readonly baseUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly timeoutMs: number;
  private sessionToken?: string;
  private sessionInitPromise?: Promise<void>;

  constructor(options: { baseUrl: string; apiToken: string; timeoutMs?: number }) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    const parts = options.apiToken.split(':');
    this.username = parts[0] ?? '';
    this.password = parts.slice(1).join(':') ?? '';
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  private async initSession(): Promise<void> {
    const url = `${this.baseUrl}/apirest.php/initSession`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const basicAuth = Buffer.from(`${this.username}:${this.password}`).toString('base64');
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${basicAuth}`,
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text().catch(() => 'Unknown error');
        throw new Error(`GLPI initSession failed HTTP ${response.status}: ${text}`);
      }

      const data = (await response.json()) as Record<string, unknown>;
      this.sessionToken = data['session_token'] as string;
      if (!this.sessionToken) {
        throw new Error('GLPI initSession did not return a session_token');
      }
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('GLPI initSession timed out');
      }
      throw err;
    }
  }

  private async ensureSession(): Promise<void> {
    if (this.sessionToken) return;
    if (!this.sessionInitPromise) {
      this.sessionInitPromise = this.initSession();
    }
    await this.sessionInitPromise;
  }

  private async request(path: string, init: RequestInit = {}): Promise<unknown> {
    await this.ensureSession();

    const url = `${this.baseUrl}/apirest.php${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...init,
        headers: {
          'Content-Type': 'application/json',
          'Session-Token': this.sessionToken ?? '',
          ...(init.headers ?? {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!response.ok) {
        const text = await response.text().catch(() => 'Unknown error');
        throw new Error(`GLPI HTTP ${response.status}: ${text}`);
      }

      if (response.status === 204) {
        return undefined;
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeout);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('GLPI request timed out');
      }
      throw err;
    }
  }

  async searchTicket(query: string): Promise<unknown> {
    const params = new URLSearchParams();
    params.set('criteria[0][field]', '1'); // title
    params.set('criteria[0][searchtype]', 'contains');
    params.set('criteria[0][value]', query);
    return this.request(`/search/Ticket?${params.toString()}`);
  }

  async getTicket(ticketId: string): Promise<unknown> {
    return this.request(`/Ticket/${encodeURIComponent(ticketId)}`);
  }

  async getUser(userId: string): Promise<unknown> {
    return this.request(`/User/${encodeURIComponent(userId)}`);
  }
}
