'use client';

import { Loader2, Shield } from 'lucide-react';
import { Panel } from './Panel';
import type { AuditEvent, SupportSession } from '@/lib/api';

export function AuditTrailPanel({
  session,
  events,
  loading,
}: {
  session?: SupportSession;
  events: AuditEvent[];
  loading: boolean;
}) {
  return (
    <Panel title="Audit Trail">
      {!session ? (
        <div className="rounded border border-cockpit-600 bg-cockpit-900/50 px-3 py-4 text-center text-sm text-cockpit-500">
          Select a session to view audit events.
        </div>
      ) : loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-cockpit-400">
          <Loader2 size={16} className="animate-spin" />
          Loading audit events...
        </div>
      ) : events.length === 0 ? (
        <div className="py-6 text-center text-sm text-cockpit-500">
          <Shield size={24} className="mx-auto mb-2 opacity-50" />
          No audit events yet.
        </div>
      ) : (
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
                  {new Date(e.createdAt).toLocaleTimeString()}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-cockpit-400">
                <span className="inline-flex items-center gap-1">
                  <Shield size={10} />
                  {e.actorType}
                </span>
                <span className="truncate max-w-[120px]" title={e.actorId}>
                  {e.actorId.slice(0, 12)}
                </span>
                <span className="text-cockpit-500">→</span>
                <span>
                  {e.resourceType}:{e.resourceId.slice(0, 8)}
                </span>
              </div>
              {Object.keys(e.metadata).length > 0 && (
                <div className="mt-1.5 rounded bg-cockpit-800/60 px-2 py-1 text-[10px] text-cockpit-500">
                  {JSON.stringify(e.metadata)}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
