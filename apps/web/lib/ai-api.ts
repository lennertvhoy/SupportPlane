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

export interface AiChatSession {
  id: string;
  tenantId: string;
  sessionId?: string;
  title?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: AiChatMessage[];
}

export interface AiChatMessage {
  id: string;
  tenantId: string;
  chatSessionId: string;
  role: string;
  content: string;
  provider?: string;
  model?: string;
  usageMetadata?: Record<string, unknown>;
  createdAt: string;
}

export interface TicketSummaryResponse {
  summary: string;
  keyPoints: string[];
  sentiment?: string;
  provider: 'mock' | 'ollama' | 'lmstudio';
  model: string;
  prompt: {
    id: string;
    version: string;
    purpose: string;
  };
  contextHash: string;
  usage: {
    latencyMs?: number;
    placeholder: boolean;
    providerMode?: 'mock' | 'local';
    runtime?: 'mock' | 'ollama' | 'lmstudio';
    fallbackUsed?: boolean;
    noCloudCall?: true;
  };
  safety: {
    mockOnly: boolean;
    externalCallMade: false;
    localProviderCallMade?: boolean;
    fallbackUsed?: boolean;
    policyChecks: string[];
    reviewRequired: true;
    writebackAllowed: false;
    runtime?: 'mock' | 'ollama' | 'lmstudio';
  };
  generatedAt: string;
}

class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown | null,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  identity: DevIdentity = DEFAULT_IDENTITY,
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
    credentials: 'include',
  });

  if (!res.ok) {
    let body: unknown | null = null;
    try {
      body = await res.json();
    } catch {
      // ignore parse failure
    }
    throw new ApiClientError(
      (body as { message?: string })?.message ?? `HTTP ${res.status}`,
      res.status,
      body,
    );
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export const aiApi = {
  createChatSession: (sessionId: string, body: { title?: string }, identity?: DevIdentity) =>
    apiFetch<AiChatSession>(
      `/support-sessions/${sessionId}/ai-chat`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
      identity,
    ),

  listChatSessions: (sessionId: string, identity?: DevIdentity) =>
    apiFetch<AiChatSession[]>(
      `/support-sessions/${sessionId}/ai-chat`,
      {
        method: 'GET',
      },
      identity,
    ),

  getChatSession: (sessionId: string, chatId: string, identity?: DevIdentity) =>
    apiFetch<AiChatSession>(
      `/support-sessions/${sessionId}/ai-chat/${chatId}`,
      { method: 'GET' },
      identity,
    ),

  sendChatMessage: (
    sessionId: string,
    chatId: string,
    body: {
      content: string;
      role?: string;
      modelSelection?: { provider?: string; model?: string };
    },
    identity?: DevIdentity,
  ) =>
    apiFetch<{ session: AiChatSession; assistantMessage?: AiChatMessage }>(
      `/support-sessions/${sessionId}/ai-chat/${chatId}/messages`,
      { method: 'POST', body: JSON.stringify(body) },
      identity,
    ),

  generateTicketSummary: (
    sessionId: string,
    body: {
      ticketReferenceId?: string;
      modelSelection?: { provider?: string; model?: string };
    } = {},
    identity?: DevIdentity,
  ) =>
    apiFetch<TicketSummaryResponse>(
      `/support-sessions/${sessionId}/ticket-summary`,
      { method: 'POST', body: JSON.stringify(body) },
      identity,
    ),
};
