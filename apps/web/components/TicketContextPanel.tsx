'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Ticket, User, Mail, Tag, Globe, Plug, Shield, Lock } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import type { TicketReference, SupportSession, ConnectorInstallation } from '@/lib/api';

export function TicketContextPanel({
  session,
  ticket,
  loading,
  error,
  onLoad,
  connectorMode,
  connectorInstallation,
}: {
  session?: SupportSession;
  ticket?: TicketReference;
  loading: boolean;
  error: string | null;
  onLoad: (externalTicketId: string) => void;
  connectorMode?: 'mock' | 'zammad' | 'glpi';
  connectorInstallation?: ConnectorInstallation;
}) {
  const defaultTicketId = connectorMode === 'glpi' ? '1' : connectorMode === 'zammad' ? '2' : 'TICKET-101';
  const [ticketId, setTicketId] = useState(defaultTicketId);

  useEffect(() => {
    const next = connectorMode === 'glpi' ? '1' : connectorMode === 'zammad' ? '2' : 'TICKET-101';
    setTicketId(next);
  }, [connectorMode]);

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
                  {connectorMode === 'zammad' ? 'Zammad Sandbox' : connectorMode === 'glpi' ? 'GLPI Sandbox' : 'Mock Connector Data'}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={connectorMode === 'zammad' || connectorMode === 'glpi' ? 'success' : 'warning'}>
                  {connectorMode === 'zammad' ? 'Zammad sandbox' : connectorMode === 'glpi' ? 'GLPI sandbox' : 'Mock'}
                </Badge>
                {(connectorMode === 'zammad' || connectorMode === 'glpi') && (
                  <Badge variant="muted">Read-only</Badge>
                )}
              </div>
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
                {(connectorMode === 'zammad' || connectorMode === 'glpi') && (
                  <span className="inline-flex items-center gap-1 text-amber-400">
                    <Shield size={10} />
                    Sandbox · No writeback · No production data
                  </span>
                )}
              </div>
              {connectorMode === 'zammad' && (
                <div className="grid grid-cols-2 gap-2 rounded border border-emerald-700/30 bg-emerald-950/20 px-2 py-1.5 text-[10px] text-emerald-200">
                  <span>Sandbox allowlist</span>
                  <span>Read operation allowed by sandbox allowlist</span>
                  <span>OpenBao sandbox resolver</span>
                  <span>Secrets resolved server-side</span>
                  <span>No cloud AI</span>
                  <span>Writeback blocked</span>
                </div>
              )}
              {connectorMode === 'glpi' && (
                <div className="grid grid-cols-2 gap-2 rounded border border-emerald-700/30 bg-emerald-950/20 px-2 py-1.5 text-[10px] text-emerald-200">
                  <span>Real sandbox</span>
                  <span>Read operation via GLPI REST API</span>
                  <span>Session token auth</span>
                  <span>Credentials server-side only</span>
                  <span>No cloud AI</span>
                  <span>Writeback blocked</span>
                </div>
              )}

              {/* Connector Runtime Provenance */}
              {connectorInstallation && (
                <div className="rounded border border-cockpit-700 bg-cockpit-900/40 p-2 space-y-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-medium text-cockpit-300">
                    <Plug size={10} className="text-accent" />
                    Connector Runtime Provenance
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[10px]">
                    <div className="text-cockpit-500">Installation:</div>
                    <div className="text-cockpit-200">{connectorInstallation.displayName || connectorInstallation.name}</div>
                    <div className="text-cockpit-500">Type:</div>
                    <div className="text-cockpit-200">{connectorInstallation.adapterType}</div>
                    <div className="text-cockpit-500">Mode:</div>
                    <div className="inline-flex items-center gap-1">
                      {connectorInstallation.mockMode ? (
                        <>
                          <Lock size={8} className="text-amber-400" />
                          <span className="text-amber-300">mock</span>
                        </>
                      ) : (
                        <>
                          <Globe size={8} className="text-emerald-400" />
                          <span className="text-emerald-300">real sandbox</span>
                        </>
                      )}
                    </div>
                    <div className="text-cockpit-500">Network:</div>
                    <div className="inline-flex items-center gap-1">
                      {connectorInstallation.mockMode ? (
                        <>
                          <Shield size={8} className="text-emerald-400" />
                          <span className="text-emerald-300">none (local-only)</span>
                        </>
                      ) : (
                        <>
                          <Globe size={8} className="text-amber-400" />
                          <span className="text-amber-300">sandbox local cluster</span>
                        </>
                      )}
                    </div>
                    <div className="text-cockpit-500">Credentials:</div>
                    <div className="text-cockpit-200">{connectorInstallation.secretReferenceIds.length} linked · server-side only</div>
                    <div className="text-cockpit-500">Capabilities:</div>
                    <div className="text-cockpit-200">{connectorInstallation.capabilities.join(', ')}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
