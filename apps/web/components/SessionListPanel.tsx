'use client';

import { useState, useMemo } from 'react';
import { Plus, MessageSquare, Loader2, AlertCircle, Search, Filter, X } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import type { SupportSession } from '@/lib/api';

const QUICK_FILTERS = ['Smoke', 'Bug', 'Round', 'Evidence', 'Zammad', 'GLPI'] as const;

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
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredSessions = useMemo(() => {
    let result = sessions;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      result = result.filter((s) => s.title.toLowerCase().includes(q));
    }
    if (activeFilter) {
      const f = activeFilter.toLowerCase();
      result = result.filter((s) => s.title.toLowerCase().includes(f));
    }
    return result;
  }, [sessions, searchText, activeFilter]);

  return (
    <Panel
      title="Sessions"
      headerRight={
        <button
          onClick={() => setShowForm((s) => !s)}
          disabled={!canCreate}
          title={canCreate ? 'Create session' : 'Viewer role cannot create sessions'}
          className="inline-flex items-center gap-1 rounded bg-accent-dark px-2 py-1 text-xs font-medium text-white hover:bg-accent-dark/90 disabled:cursor-not-allowed disabled:bg-cockpit-900 disabled:text-cockpit-600 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
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
            className="w-full rounded border border-cockpit-600 bg-cockpit-800 px-2 py-1 text-sm text-cockpit-100 placeholder:text-cockpit-400 focus:border-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950"
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            className="mt-2 w-full rounded border border-cockpit-600 bg-cockpit-800 px-2 py-1 text-sm text-cockpit-100 placeholder:text-cockpit-400 focus:border-accent focus:outline-none"
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
              className="rounded bg-accent-dark px-3 py-1 text-xs font-medium text-white hover:bg-accent-dark/90 focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
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

      {/* Search and quick filters */}
      {sessions.length > 0 && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1">
            <Search size={12} className="text-cockpit-400 shrink-0" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search sessions..."
              className="flex-1 bg-transparent text-xs text-cockpit-100 placeholder:text-cockpit-600 focus:outline-none"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="text-cockpit-400 hover:text-cockpit-300"
              >
                <X size={12} />
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {QUICK_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(activeFilter === f ? null : f)}
                className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors ${
                  activeFilter === f
                    ? 'bg-accent-dark text-white'
                    : 'bg-cockpit-800 text-cockpit-400 hover:bg-cockpit-700 hover:text-cockpit-200 focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none'
                }`}
              >
                <Filter size={8} />
                {f}
              </button>
            ))}
          </div>
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
        <div className="py-6 text-center text-sm text-cockpit-400">
          <MessageSquare size={24} className="mx-auto mb-2 text-cockpit-400" />
          No sessions yet.
          <br />
          Create one to get started.
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="py-6 text-center text-sm text-cockpit-400">
          <Search size={24} className="mx-auto mb-2 text-cockpit-400" />
          No sessions match your search or filter.
          <br />
          <button
            onClick={() => {
              setSearchText('');
              setActiveFilter(null);
            }}
            className="text-accent hover:underline text-xs mt-1"
          >
            Clear search
          </button>
        </div>
      ) : (
        <ul className="space-y-1">
          {filteredSessions.map((s) => (
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
                <div className="mt-1 flex items-center gap-2 text-xs text-cockpit-400">
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
