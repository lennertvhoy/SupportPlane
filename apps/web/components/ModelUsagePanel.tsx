'use client';

import { useEffect, useState, useCallback } from 'react';
import { Loader2, BarChart3 } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';

interface ModelUsageLogEntry {
  id: string;
  tenantId: string;
  actorId: string;
  feature: string;
  provider: string;
  model: string;
  latencyMs: number;
  status: string;
  createdAt: string;
}

interface ModelUsageSummary {
  totalCalls: number;
  byFeature: Record<string, number>;
  byProvider: Record<string, number>;
  byStatus: Record<string, number>;
}

export function ModelUsagePanel({
  tenantId,
  userId,
  userRole,
}: {
  tenantId: string;
  userId: string;
  userRole?: string;
}) {
  const [logs, setLogs] = useState<ModelUsageLogEntry[]>([]);
  const [summary, setSummary] = useState<ModelUsageSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterFeature, setFilterFeature] = useState('');
  const [filterProvider, setFilterProvider] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4110';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterFeature) params.set('feature', filterFeature);
      if (filterProvider) params.set('provider', filterProvider);
      if (filterStatus) params.set('status', filterStatus);

      const headers: Record<string, string> = {
        'x-tenant-id': tenantId,
        'x-user-id': userId,
        ...(userRole ? { 'x-user-role': userRole } : {}),
      };

      const [logsRes, summaryRes] = await Promise.all([
        fetch(`${apiBase}/model-usage?${params.toString()}`, { headers, credentials: 'include' }),
        fetch(`${apiBase}/model-usage/summary?${params.toString()}`, { headers, credentials: 'include' }),
      ]);

      if (!logsRes.ok) throw new Error(`Failed to load usage logs: ${logsRes.status}`);
      if (!summaryRes.ok) throw new Error(`Failed to load usage summary: ${summaryRes.status}`);

      const logsData = (await logsRes.json()) as { logs: ModelUsageLogEntry[]; total: number };
      const summaryData = (await summaryRes.json()) as ModelUsageSummary;

      setLogs(logsData.logs);
      setSummary(summaryData);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load model usage');
    } finally {
      setLoading(false);
    }
  }, [tenantId, userId, userRole, filterFeature, filterProvider, filterStatus, apiBase]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Panel title="Model Usage" headerRight={<Badge variant="info">BL-080</Badge>}>
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={filterFeature}
            onChange={(e) => setFilterFeature(e.target.value)}
            className="rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100"
          >
            <option value="">All features</option>
            <option value="draft">draft</option>
            <option value="greeting">greeting</option>
            <option value="chat">chat</option>
            <option value="summary">summary</option>
            <option value="retrieval">retrieval</option>
            <option value="other">other</option>
          </select>
          <select
            value={filterProvider}
            onChange={(e) => setFilterProvider(e.target.value)}
            className="rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100"
          >
            <option value="">All providers</option>
            <option value="mock">mock</option>
            <option value="ollama">ollama</option>
            <option value="lmstudio">lmstudio</option>
            <option value="openai">openai</option>
            <option value="azure">azure</option>
            <option value="anthropic">anthropic</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1 text-xs text-cockpit-100"
          >
            <option value="">All statuses</option>
            <option value="succeeded">succeeded</option>
            <option value="failed">failed</option>
            <option value="blocked_by_policy">blocked_by_policy</option>
            <option value="fallback_mock">fallback_mock</option>
          </select>
          <button
            onClick={fetchData}
            className="rounded bg-accent px-2 py-1 text-xs font-medium text-white"
          >
            Refresh
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-4 text-sm text-cockpit-400">
            <Loader2 size={16} className="animate-spin" />
            Loading usage data...
          </div>
        )}

        {error && (
          <div className="rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            {error}
          </div>
        )}

        {summary && !loading && (
          <div className="rounded border border-cockpit-700 bg-cockpit-900/50 p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-cockpit-200">
              <BarChart3 size={14} />
              Summary
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs text-cockpit-400 sm:grid-cols-4">
              <div>
                Total calls: <span className="text-cockpit-100">{summary.totalCalls}</span>
              </div>
              {Object.entries(summary.byFeature).map(([k, v]) => (
                <div key={k}>
                  {k}: <span className="text-cockpit-100">{v}</span>
                </div>
              ))}
              {Object.entries(summary.byProvider).map(([k, v]) => (
                <div key={k}>
                  {k}: <span className="text-cockpit-100">{v}</span>
                </div>
              ))}
              {Object.entries(summary.byStatus).map(([k, v]) => (
                <div key={k}>
                  {k}: <span className="text-cockpit-100">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && logs.length === 0 && !error && (
          <div className="py-6 text-center text-sm text-cockpit-500">No model usage logs yet.</div>
        )}

        {!loading && logs.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-cockpit-700 text-cockpit-400">
                  <th className="px-2 py-1">Feature</th>
                  <th className="px-2 py-1">Provider</th>
                  <th className="px-2 py-1">Model</th>
                  <th className="px-2 py-1">Status</th>
                  <th className="px-2 py-1">Latency</th>
                  <th className="px-2 py-1">Time</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-cockpit-800 text-cockpit-200">
                    <td className="px-2 py-1.5">
                      <Badge variant="muted">{log.feature}</Badge>
                    </td>
                    <td className="px-2 py-1.5">{log.provider}</td>
                    <td className="max-w-[120px] truncate px-2 py-1.5" title={log.model}>
                      {log.model}
                    </td>
                    <td className="px-2 py-1.5">
                      <Badge
                        variant={
                          log.status === 'succeeded'
                            ? 'success'
                            : log.status === 'fallback_mock'
                              ? 'warning'
                              : log.status === 'failed'
                                ? 'danger'
                                : 'muted'
                        }
                      >
                        {log.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-1.5">{log.latencyMs}ms</td>
                    <td className="px-2 py-1.5 text-cockpit-500">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Panel>
  );
}
