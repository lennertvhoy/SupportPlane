'use client';

import { Shield, User, Settings, Phone, Bot, FileText, AlertTriangle } from 'lucide-react';
import type { EvidenceBundle } from '@/lib/api';

interface EvidenceBundleTimelineProps {
  bundle?: EvidenceBundle;
}

function eventIcon(eventType: string) {
  if (eventType.includes('call') || eventType.includes('telephony')) return Phone;
  if (eventType.includes('ai_') || eventType.includes('draft') || eventType.includes('greeting'))
    return Bot;
  if (eventType.includes('screen')) return Settings;
  if (eventType.includes('login') || eventType.includes('logout') || eventType.includes('user'))
    return User;
  if (eventType.includes('policy') || eventType.includes('boundary')) return Shield;
  if (eventType.includes('evidence')) return FileText;
  return AlertTriangle;
}

function provenanceLabel(eventType: string): string {
  if (eventType.includes('ai_')) return 'AI';
  if (eventType.includes('call') || eventType.includes('telephony')) return 'Telephony';
  if (eventType.includes('screen')) return 'Screen';
  if (eventType.includes('zammad') || eventType.includes('connector')) return 'Connector';
  if (eventType.includes('login') || eventType.includes('logout')) return 'Auth';
  if (eventType.includes('policy')) return 'Policy';
  if (eventType.includes('evidence')) return 'Evidence';
  return 'System';
}

export function EvidenceBundleTimeline({ bundle }: EvidenceBundleTimelineProps) {
  if (!bundle || bundle.auditTimeline.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-cockpit-500">
        No audit timeline events available.
      </div>
    );
  }

  const sorted = [...bundle.auditTimeline].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className="space-y-0">
      {sorted.map((event, index) => {
        const Icon = eventIcon(event.eventType);
        const isLast = index === sorted.length - 1;
        return (
          <div key={event.id} className="relative flex gap-3">
            {/* Timeline line */}
            {!isLast && <div className="absolute left-[11px] top-6 h-full w-px bg-cockpit-700" />}

            {/* Icon dot */}
            <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cockpit-800 border border-cockpit-600">
              <Icon size={12} className="text-cockpit-400" />
            </div>

            {/* Content */}
            <div className="pb-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-cockpit-200">{event.eventType}</span>
                <span className="rounded bg-cockpit-800 px-1.5 py-0.5 text-[10px] text-cockpit-400">
                  {provenanceLabel(event.eventType)}
                </span>
                <span className="text-[10px] text-cockpit-500">
                  {new Date(event.createdAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-cockpit-400">
                <span className="inline-flex items-center gap-1">
                  <User size={10} />
                  {event.actorType}:{event.actorId.slice(0, 12)}
                </span>
                <span className="mx-1 text-cockpit-600">→</span>
                <span>
                  {event.action} on {event.resourceType}:{event.resourceId.slice(0, 12)}
                </span>
              </div>
              {Object.keys(event.metadataSummary).length > 0 && (
                <div className="mt-1 rounded bg-cockpit-950 px-2 py-1 text-[10px] text-cockpit-500">
                  {JSON.stringify(event.metadataSummary)}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
