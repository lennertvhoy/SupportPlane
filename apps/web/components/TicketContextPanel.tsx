'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, Ticket, User, Mail, Tag, Globe } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import type { TicketReference, SupportSession } from '@/lib/api';

export function TicketContextPanel({
  session,
  ticket,
  loading,
  error,
  onLoad,
  connectorMode,
}: {
  session?: SupportSession;
  ticket?: TicketReference;
  loading: boolean;
  error: string | null;
  onLoad: (externalTicketId: string) => void;
  connectorMode?: 'mock' | 'zammad';
}) {
  const [ticketId, setTicketId] = useState('TICKET-101');

  return (
    <Panel title="Ticket Context">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
            placeholder="External ticket ID"
            disabled={loading || !session}
            className="flex-1 rounded border border-cockpit-600 bg-cockpit-900 px-3 py-2 text-sm text-cockpit-100 placeholder:text-cockpit-500 focus:border-accent focus:outline-none disabled:opacity-50"
          />
          <button
            onClick={() => onLoad(ticketId.trim())}
            disabled={loading || !session || !ticketId.trim()}
            className="inline-flex items-center gap-1 rounded bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Load
          </button>
        </div>

        {!session && (
          <div className="rounded border border-cockpit-600 bg-cockpit-900/50 px-3 py-4 text-center text-sm text-cockpit-500">
            Select a session to load ticket context.
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {ticket && (
          <div className="rounded border border-cockpit-600 bg-cockpit-900/50">
            <div className="flex items-center justify-between border-b border-cockpit-700 px-3 py-2">
              <div className="flex items-center gap-2">
                <Ticket size={14} className="text-accent" />
                <span className="text-xs font-medium text-cockpit-300">
                  {connectorMode === 'zammad' ? 'Zammad Connector Data' : 'Mock Connector Data'}
                </span>
              </div>
              <Badge variant={connectorMode === 'zammad' ? 'success' : 'warning'}>
                {connectorMode === 'zammad' ? 'Zammad' : 'Mock'}
              </Badge>
            </div>
            <div className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold text-cockpit-100">
                  {ticket.subject}
                </h3>
                <Badge variant="muted">{ticket.externalTicketId}</Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 text-cockpit-400">
                  <Tag size={12} />
                  Status: <span className="text-cockpit-200">{ticket.status}</span>
                </div>
                <div className="flex items-center gap-1.5 text-cockpit-400">
                  <Tag size={12} />
                  Priority:{' '}
                  <span className="text-cockpit-200">{ticket.priority}</span>
                </div>
                <div className="flex items-center gap-1.5 text-cockpit-400">
                  <User size={12} />
                  {ticket.customerName}
                </div>
                <div className="flex items-center gap-1.5 text-cockpit-400">
                  <Mail size={12} />
                  {ticket.customerEmail}
                </div>
              </div>

              <div className="flex items-center justify-between rounded bg-cockpit-800/60 px-2 py-1.5 text-xs text-cockpit-500">
                <span>Adapter: {ticket.adapterId}</span>
                {connectorMode === 'zammad' && (
                  <span className="inline-flex items-center gap-1 text-emerald-400">
                    <Globe size={10} />
                    Live
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
