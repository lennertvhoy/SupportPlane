'use client';

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Panel } from './Panel';
import { api, type SupportSession, ApiClientError } from '@/lib/api';

interface TimelineItem {
  id: string;
  type: string;
  timestamp: string;
  title: string;
  description?: string;
  metadata: Record<string, unknown>;
}

export function CaseTimelinePanel({ session }: { session?: SupportSession }) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      setTimeline([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    api
      .getCaseTimeline(session.id)
      .then((res) => {
        if (!cancelled) setTimeline(res.timeline);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof ApiClientError ? err.message : 'Failed to load timeline');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [session?.id]);

  return (
    <Panel title="Case Timeline">
      {!session && (
        <div className="text-xs text-cockpit-400">Select a session to view the case timeline.</div>
      )}
      {session && loading && (
        <div className="flex items-center gap-2 text-xs text-cockpit-400">
          <Loader2 size={12} className="animate-spin" /> Loading timeline...
        </div>
      )}
      {error && <div className="rounded bg-red-900/30 px-2 py-1 text-xs text-red-300">{error}</div>}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {timeline.map((item) => (
          <div key={item.id} className="relative pl-4 border-l border-cockpit-600">
            <div className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-accent" />
            <div className="text-xs font-medium text-cockpit-100">{item.title}</div>
            {item.description && (
              <div className="text-[11px] text-cockpit-400">{item.description}</div>
            )}
            <div className="text-[10px] text-cockpit-400">
              {new Date(item.timestamp).toLocaleString()}
            </div>
            {item.type.startsWith('audit:') && (
              <div className="text-[10px] text-cockpit-600">
                {String(item.metadata.resourceType)} / {String(item.metadata.resourceId)}
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  );
}
