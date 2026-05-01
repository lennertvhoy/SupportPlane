'use client';

import { ArrowLeft, Activity } from 'lucide-react';
import { AuditExplorerPanel } from '@/components/AuditExplorerPanel';

export default function AuditExplorerPage() {
  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-cockpit-700 bg-cockpit-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent">
            <Activity size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-cockpit-100">Audit Explorer</h1>
            <p className="text-[10px] text-cockpit-500">Filtered audit event search</p>
          </div>
        </div>
        <button
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-3 py-1.5 text-xs text-cockpit-300 hover:bg-cockpit-800"
        >
          <ArrowLeft size={14} />
          Back to Cockpit
        </button>
      </header>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl">
          <AuditExplorerPanel />
        </div>
      </main>
    </div>
  );
}
