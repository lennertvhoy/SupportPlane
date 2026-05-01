'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, ChevronLeft, ChevronRight, Shield, Clock, User, Filter } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';

interface AuditEvent {
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

interface AuditExplorerResponse {
  events: AuditEvent[];
  total: number;
  limit: number;
  offset: number;
}

const API_BASE = typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_BASE_URL
  ? process.env.NEXT_PUBLIC_API_BASE_URL
  : 'http://localhost:4110';

async function fetchAuditEvents(query: Record<string, string>): Promise<AuditExplorerResponse> {
  const params = new URLSearchParams(query);
  const url = `${API_BASE}/audit-events?${params.toString()}`;
  const res = await fetch(url, {
    headers: {
      'x-tenant-id': 'dev-tenant',
      'x-user-id': 'dev-user',
      'x-user-role': 'support_agent',
    },
    credentials: 'include',
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

const EVENT_TYPES = [
  'all',
  'user_login',
  'user_login_failed',
  'user_logout',
  'session_created',
  'session_updated',
  'ticket_linked',
  'ticket_unlinked',
  'ai_context_loaded',
  'ai_draft_generated',
  'greeting_suggestion_generated',
  'screen_observation_captured',
  'screen_observation_reviewed',
  'screen_observation_context_packet_created',
  'internal_note_drafted',
  'internal_note_writeback_attempted',
  'internal_note_writeback_succeeded',
  'internal_note_writeback_failed',
  'telephony_adapter_tested',
  'telephony_webhook_received',
  'telephony_call_control_requested',
  'evidence_bundle_generated',
  'evidence_bundle_exported',
  'tenant_boundary_denied',
  'policy_decision',
];

const ACTOR_TYPES = ['all', 'user', 'service_account', 'system'];

export function AuditExplorerPanel() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    eventType: 'all',
    actorType: 'all',
    actorId: '',
    resourceType: '',
    resourceId: '',
    dateFrom: '',
    dateTo: '',
  });

  const [offset, setOffset] = useState(0);
  const limit = 25;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query: Record<string, string> = { limit: String(limit), offset: String(offset) };
      if (filters.eventType !== 'all') query.eventType = filters.eventType;
      if (filters.actorType !== 'all') query.actorType = filters.actorType;
      if (filters.actorId.trim()) query.actorId = filters.actorId.trim();
      if (filters.resourceType.trim()) query.resourceType = filters.resourceType.trim();
      if (filters.resourceId.trim()) query.resourceId = filters.resourceId.trim();
      if (filters.dateFrom) query.dateFrom = filters.dateFrom;
      if (filters.dateTo) query.dateTo = filters.dateTo;

      const data = await fetchAuditEvents(query);
      setEvents(data.events);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit events');
    } finally {
      setLoading(false);
    }
  }, [filters, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <Panel
      title="Audit Explorer"
      headerRight={
        <div className="flex items-center gap-2">
          <Badge variant="info" className="text-[10px]">
            {total} events
          </Badge>
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            <Filter size={10} />
            Filter
          </button>
        </div>
      }
    >
      {/* Filters */}
      <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-3">
        <div>
          <label className="mb-0.5 block text-[10px] text-cockpit-500">Event Type</label>
          <select
            value={filters.eventType}
            onChange={(e) => { setFilters((f) => ({ ...f, eventType: e.target.value })); setOffset(0); }}
            className="w-full rounded border border-cockpit-700 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-200"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-cockpit-500">Actor Type</label>
          <select
            value={filters.actorType}
            onChange={(e) => { setFilters((f) => ({ ...f, actorType: e.target.value })); setOffset(0); }}
            className="w-full rounded border border-cockpit-700 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-200"
          >
            {ACTOR_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-cockpit-500">Actor ID</label>
          <input
            type="text"
            value={filters.actorId}
            onChange={(e) => { setFilters((f) => ({ ...f, actorId: e.target.value })); setOffset(0); }}
            placeholder="Search actor..."
            className="w-full rounded border border-cockpit-700 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-200 placeholder:text-cockpit-600"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-cockpit-500">Resource Type</label>
          <input
            type="text"
            value={filters.resourceType}
            onChange={(e) => { setFilters((f) => ({ ...f, resourceType: e.target.value })); setOffset(0); }}
            placeholder="e.g. support_session"
            className="w-full rounded border border-cockpit-700 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-200 placeholder:text-cockpit-600"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-cockpit-500">Date From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => { setFilters((f) => ({ ...f, dateFrom: e.target.value })); setOffset(0); }}
            className="w-full rounded border border-cockpit-700 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-200"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10px] text-cockpit-500">Date To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => { setFilters((f) => ({ ...f, dateTo: e.target.value })); setOffset(0); }}
            className="w-full rounded border border-cockpit-700 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-200"
          />
        </div>
      </div>

      {error && (
        <div className="mb-2 rounded border border-red-700/30 bg-red-900/20 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-cockpit-400">
          <Loader2 size={16} className="animate-spin" />
          Loading audit events...
        </div>
      ) : events.length === 0 ? (
        <div className="py-6 text-center text-sm text-cockpit-500">
          <Shield size={24} className="mx-auto mb-2 opacity-50" />
          No audit events match the current filters.
        </div>
      ) : (
        <>
          <ul className="space-y-2">
            {events.map((e) => (
              <li
                key={e.id}
                className="rounded border border-cockpit-700 bg-cockpit-900/40 px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-cockpit-200">
                    {e.eventType}
                  </span>
                  <span className="shrink-0 text-[10px] text-cockpit-500">
                    <Clock size={10} className="mr-1 inline" />
                    {new Date(e.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-cockpit-400">
                  <span className="inline-flex items-center gap-1">
                    <User size={10} />
                    {e.actorType}:{e.actorId.slice(0, 12)}
                  </span>
                  <span className="text-cockpit-500">→</span>
                  <span>
                    {e.action} {e.resourceType}:{e.resourceId.slice(0, 12)}
                  </span>
                </div>
                {e.sessionId && (
                  <div className="mt-0.5 text-[10px] text-cockpit-600">
                    Session: {e.sessionId}
                  </div>
                )}
                {Object.keys(e.metadata).length > 0 && (
                  <div className="mt-1.5 rounded bg-cockpit-950 px-2 py-1 text-[10px] text-cockpit-500">
                    {JSON.stringify(e.metadata)}
                  </div>
                )}
              </li>
            ))}
          </ul>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => setOffset((o) => Math.max(0, o - limit))}
                disabled={offset === 0}
                className="inline-flex items-center gap-1 rounded border border-cockpit-700 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-300 hover:bg-cockpit-800 disabled:opacity-40"
              >
                <ChevronLeft size={12} />
                Prev
              </button>
              <span className="text-xs text-cockpit-500">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setOffset((o) => o + limit)}
                disabled={offset + limit >= total}
                className="inline-flex items-center gap-1 rounded border border-cockpit-700 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-300 hover:bg-cockpit-800 disabled:opacity-40"
              >
                Next
                <ChevronRight size={12} />
              </button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}
