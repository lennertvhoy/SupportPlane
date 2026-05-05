'use client';

import { useState, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import { api, type TicketReference, type AuthIdentity, ApiClientError } from '@/lib/api';

export function TicketSummaryPanel({
  identity,
  selectedTicket,
  onSelectTicket,
}: {
  identity: AuthIdentity;
  selectedTicket?: TicketReference;
  onSelectTicket?: (ticket: TicketReference) => void;
}) {
  const [tickets, setTickets] = useState<TicketReference[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('');

  const canRead =
    identity.permissions.includes('*') || identity.permissions.includes('ticket:read');

  const handleSearch = useCallback(async () => {
    if (!canRead) {
      setError('Viewer role cannot search tickets');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (email) params.email = email;
      if (status) params.status = status;
      const data = await api.listTickets(params);
      setTickets(data);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [email, status, canRead]);

  return (
    <Panel title="Ticket Summary">
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Search by email..."
            className="flex-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100 placeholder:text-cockpit-600"
            disabled={!canRead}
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100"
            disabled={!canRead}
          >
            <option value="">All statuses</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
            <option value="pending">Pending</option>
          </select>
          <button
            onClick={handleSearch}
            disabled={loading || !canRead}
            className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent/90 disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
            Search
          </button>
        </div>

        {error && (
          <div className="rounded bg-red-900/30 px-2 py-1 text-xs text-red-300">{error}</div>
        )}

        {tickets.length === 0 && !loading && !error && (
          <div className="rounded border border-cockpit-700 bg-cockpit-900/50 px-3 py-3 text-center text-xs text-cockpit-500">
            <p className="mb-1">No aggregated ticket list loaded in this sandbox view.</p>
            <p>
              Use the Zammad or GLPI demo flows in <strong>Ticket Context</strong> to load ticket
              data, or search by email above.
            </p>
          </div>
        )}

        <div className="space-y-2">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              onClick={() => onSelectTicket?.(ticket)}
              className={`w-full rounded border px-2 py-2 text-left text-xs transition-colors ${
                selectedTicket?.id === ticket.id
                  ? 'border-accent bg-accent/10'
                  : 'border-cockpit-700 bg-cockpit-900/40 hover:bg-cockpit-800/60'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-cockpit-100">{ticket.externalTicketId}</span>
                <Badge
                  variant={
                    ticket.status === 'open'
                      ? 'success'
                      : ticket.status === 'closed'
                        ? 'default'
                        : 'warning'
                  }
                >
                  {ticket.status}
                </Badge>
              </div>
              <div className="mt-0.5 text-cockpit-400">{ticket.subject}</div>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-cockpit-500">
                <span>{ticket.priority}</span>
                {ticket.customerName && <span>• {ticket.customerName}</span>}
                {ticket.customerEmail && <span>• {ticket.customerEmail}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </Panel>
  );
}
