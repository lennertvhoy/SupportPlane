const API_BASE =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL
    ? process.env.NEXT_PUBLIC_API_BASE_URL
    : 'http://localhost:4110';

export interface DevIdentity {
  tenantId: string;
  userId: string;
  userRole?: string;
}

const DEFAULT_IDENTITY: DevIdentity = {
  tenantId: 'dev-tenant',
  userId: 'dev-user',
  userRole: 'support_agent',
};

export interface SupportSession {
  id: string;
  tenantId: string;
  status: string;
  priority: string;
  title: string;
  description?: string;
  assignedUserId?: string;
  linkedTicketIds: string[];
  aiContextPacketIds: string[];
  screenObservationIds: string[];
  auditEventIds: string[];
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AIContextPacket {
  id: string;
  tenantId: string;
  sessionId: string;
  provenance: string;
  sourceTicketIds: string[];
  sourceAdapterId?: string;
  payload: Record<string, unknown>;
  redactionLog: Array<{
    field: string;
    reason: string;
    method: string;
  }>;
  contextHash?: string;
  modelPolicySnapshotId?: string;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  tenantId: string;
  sessionId?: string;
  eventType: string;
  actorType: string;
  actorId: string;
  action: string;
  resourceType: string;
  resourceId: string;
  metadata: Record<string, unknown>;
  integrityHash?: string;
  createdAt: string;
}

export interface TicketReference {
  id: string;
  tenantId: string;
  adapterId: string;
  externalTicketId: string;
  subject: string;
  status: string;
  priority: string;
  customerEmail: string;
  customerName: string;
  rawData: Record<string, unknown>;
  lastSyncedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiError {
  statusCode: number;
  error: string;
  message: string;
}

class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: ApiError | null
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  identity: DevIdentity = DEFAULT_IDENTITY
): Promise<T> {
  const url = `${API_BASE}${path}`;
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('x-tenant-id', identity.tenantId);
  headers.set('x-user-id', identity.userId);
  if (identity.userRole) {
    headers.set('x-user-role', identity.userRole);
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let body: ApiError | null = null;
    try {
      body = (await res.json()) as ApiError;
    } catch {
      // ignore parse failure
    }
    throw new ApiClientError(
      body?.message ?? `HTTP ${res.status}`,
      res.status,
      body
    );
  }

  // Handle 204 No Content
  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const api = {
  // Sessions
  listSessions: (identity?: DevIdentity) =>
    apiFetch<SupportSession[]>('/support-sessions', { method: 'GET' }, identity),

  createSession: (
    body: { title: string; description?: string; priority?: string },
    identity?: DevIdentity
  ) =>
    apiFetch<SupportSession>('/support-sessions', {
      method: 'POST',
      body: JSON.stringify(body),
    }, identity),

  getSession: (id: string, identity?: DevIdentity) =>
    apiFetch<SupportSession>(`/support-sessions/${id}`, { method: 'GET' }, identity),

  // Ticket context
  loadTicketContext: (
    sessionId: string,
    externalTicketId: string,
    identity?: DevIdentity
  ) =>
    apiFetch<{
      ticketReference: TicketReference;
      contextPacket: AIContextPacket;
      session: SupportSession;
    }>(`/support-sessions/${sessionId}/ticket-context`, {
      method: 'POST',
      body: JSON.stringify({ externalTicketId }),
    }, identity),

  // Context packets
  listContextPackets: (sessionId: string, identity?: DevIdentity) =>
    apiFetch<AIContextPacket[]>(
      `/support-sessions/${sessionId}/context-packets`,
      { method: 'GET' },
      identity
    ),

  createContextPacket: (
    sessionId: string,
    body: { provenance: string; payload: Record<string, unknown> },
    identity?: DevIdentity
  ) =>
    apiFetch<AIContextPacket>(
      `/support-sessions/${sessionId}/context-packets`,
      { method: 'POST', body: JSON.stringify(body) },
      identity
    ),

  // Audit events
  listAuditEvents: (sessionId: string, identity?: DevIdentity) =>
    apiFetch<AuditEvent[]>(
      `/support-sessions/${sessionId}/audit-events`,
      { method: 'GET' },
      identity
    ),
};

export { ApiClientError };
