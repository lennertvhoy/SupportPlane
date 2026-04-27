'use client';

import { useState } from 'react';
import { Plus, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import type { SupportSession } from '@/lib/api';

export function SessionListPanel({
  sessions,
  selectedId,
  loading,
  error,
  onSelect,
  onCreate,
  canCreate = true,
}: {
  sessions: SupportSession[];
  selectedId?: string;
  loading: boolean;
  error: string | null;
  onSelect: (session: SupportSession) => void;
  onCreate: (title: string, description?: string) => void;
  canCreate?: boolean;
}) {
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showForm, setShowForm] = useState(false);

  return (
    <Panel
      title="Sessions"
      headerRight={
        <button
          onClick={() => setShowForm((s) => !s)}
          disabled={!canCreate}
          title={canCreate ? 'Create session' : 'Viewer role cannot create sessions'}
          className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-xs font-medium text-white hover:bg-accent-dark disabled:cursor-not-allowed disabled:bg-cockpit-700 disabled:text-cockpit-400"
        >
          <Plus size={14} />
          New
        </button>
      }
      className="h-full"
    >
      {showForm && (
        <div className="mb-3 rounded border border-cockpit-600 bg-cockpit-900 p-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Session title"
            className="w-full rounded border border-cockpit-600 bg-cockpit-800 px-2 py-1 text-sm text-cockpit-100 placeholder:text-cockpit-500 focus:border-accent focus:outline-none"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="mt-2 w-full rounded border border-cockpit-600 bg-cockpit-800 px-2 py-1 text-sm text-cockpit-100 placeholder:text-cockpit-500 focus:border-accent focus:outline-none"
          />
          <div className="mt-2 flex items-center gap-2">
            <button
              onClick={() => {
                if (!newTitle.trim()) return;
                onCreate(newTitle.trim(), newDesc.trim() || undefined);
                setNewTitle('');
                setNewDesc('');
                setShowForm(false);
              }}
              className="rounded bg-accent px-3 py-1 text-xs font-medium text-white hover:bg-accent-dark"
            >
              Create
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded bg-cockpit-700 px-3 py-1 text-xs text-cockpit-300 hover:bg-cockpit-600"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {!canCreate && (
        <div className="mb-2 rounded border border-amber-700/40 bg-amber-900/20 px-3 py-2 text-xs text-amber-200">
          Viewer role can inspect sessions but cannot create operator work.
        </div>
      )}

      {error && (
        <div className="mb-2 flex items-center gap-2 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-4 text-sm text-cockpit-400">
          <Loader2 size={16} className="animate-spin" />
          Loading sessions...
        </div>
      ) : sessions.length === 0 ? (
        <div className="py-6 text-center text-sm text-cockpit-500">
          <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
          No sessions yet.
          <br />
          Create one to get started.
        </div>
      ) : (
        <ul className="space-y-1">
          {sessions.map((s) => (
            <li key={s.id}>
              <button
                onClick={() => onSelect(s)}
                className={`w-full rounded border px-3 py-2 text-left text-sm transition-colors ${
                  selectedId === s.id
                    ? 'border-accent/40 bg-accent/10 text-cockpit-100'
                    : 'border-transparent bg-cockpit-900/50 text-cockpit-300 hover:bg-cockpit-700/50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate font-medium">{s.title}</span>
                  <Badge variant={statusVariant(s.status)}>{s.status}</Badge>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-cockpit-500">
                  <span>{s.id.slice(0, 8)}</span>
                  <span>•</span>
                  <span>{s.priority}</span>
                  <span>•</span>
                  <span>{new Date(s.updatedAt).toLocaleTimeString()}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function statusVariant(status: string) {
  switch (status) {
    case 'open':
      return 'success';
    case 'paused':
      return 'warning';
    case 'resolved':
      return 'info';
    case 'escalated':
      return 'danger';
    default:
      return 'muted';
  }
}
