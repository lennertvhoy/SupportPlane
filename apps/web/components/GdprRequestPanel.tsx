'use client';

import { useState } from 'react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import { api, ApiClientError, type AuthIdentity } from '@/lib/api';

type GdprTab = 'export-preview' | 'delete-preview' | 'export';

export function GdprRequestPanel({ identity }: { identity: AuthIdentity }) {
  const [activeTab, setActiveTab] = useState<GdprTab>('export-preview');
  const [subjectType, setSubjectType] = useState<'user' | 'customer' | 'tenant'>('user');
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  const canWrite =
    identity.permissions.includes('*') || identity.permissions.includes('audit:write');

  const handleSubmit = async () => {
    if (!subjectId.trim()) {
      setError('Subject ID is required');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      let data;
      if (activeTab === 'export-preview') {
        data = await api.gdprExportPreview({ subjectType, subjectId: subjectId.trim() });
      } else if (activeTab === 'delete-preview') {
        if (!canWrite) {
          setError('Admin role required for delete preview');
          setLoading(false);
          return;
        }
        data = await api.gdprDeletePreview({ subjectType, subjectId: subjectId.trim() });
      } else {
        data = await api.gdprExport({ subjectType, subjectId: subjectId.trim() });
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof ApiClientError ? e.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const tabs: { key: GdprTab; label: string; adminOnly?: boolean }[] = [
    { key: 'export-preview', label: 'Export Preview' },
    { key: 'delete-preview', label: 'Delete Dry-Run', adminOnly: true },
    { key: 'export', label: 'Export' },
  ];

  return (
    <Panel
      title="GDPR Request Panel (BL-082)"
      headerRight={<Badge variant="warning">Dry-Run</Badge>}
    >
      <div className="space-y-3">
        <div className="flex gap-1 border-b border-cockpit-700 pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActiveTab(t.key);
                setResult(null);
                setError(null);
              }}
              className={`rounded px-2 py-1 text-[10px] font-medium ${
                activeTab === t.key
                  ? 'bg-cockpit-600 text-white'
                  : 'text-cockpit-400 hover:text-cockpit-200'
              }`}
              disabled={t.adminOnly && !canWrite}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-cockpit-300">Subject type</span>
            <select
              value={subjectType}
              onChange={(e) => setSubjectType(e.target.value as 'user' | 'customer' | 'tenant')}
              className="rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-100"
            >
              <option value="user">User</option>
              <option value="customer">Customer</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-cockpit-300">Subject ID</span>
            <input
              type="text"
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              placeholder="e.g. user-id or customer-id"
              className="w-48 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-[10px] text-cockpit-100"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-3 py-1 text-[10px] text-cockpit-300 hover:bg-cockpit-800 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Run'}
        </button>

        {error && <p className="text-xs text-red-400">{error}</p>}

        {result && (
          <div className="space-y-2">
            {(result as { warning?: string }).warning && (
              <div className="rounded border border-amber-700/40 bg-amber-900/20 px-2 py-1 text-[10px] text-amber-300">
                {(result as { warning: string }).warning}
              </div>
            )}
            <div className="max-h-64 overflow-auto rounded border border-cockpit-700 bg-cockpit-950/50 p-2">
              <pre className="text-[10px] text-cockpit-300">{JSON.stringify(result, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </Panel>
  );
}
