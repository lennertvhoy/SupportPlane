'use client';

import { useState, useEffect } from 'react';
import { Loader2, AlertCircle, Plug, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Panel } from './Panel';
import { Badge } from './Badge';
import { api, type ConnectorStatus, type ConnectorTestResult, ApiClientError } from '@/lib/api';

export function ConnectorPanel() {
  const [status, setStatus] = useState<ConnectorStatus | undefined>(undefined);
  const [testResult, setTestResult] = useState<ConnectorTestResult | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchStatus() {
    setLoading(true);
    setError(null);
    try {
      const s = await api.getConnectorStatus();
      setStatus(s);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Failed to load connector status');
    } finally {
      setLoading(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    setError(null);
    try {
      const r = await api.testConnector();
      setTestResult(r);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Test failed');
    } finally {
      setTesting(false);
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  const isMock = status?.mode === 'mock';

  return (
    <Panel
      title="Connector"
      headerRight={
        status ? (
          <Badge variant={isMock ? 'warning' : 'success'}>
            {isMock ? 'Mock mode' : 'Zammad mode'}
          </Badge>
        ) : null
      }
    >
      <div className="space-y-3">
        {loading && (
          <div className="flex items-center gap-2 text-xs text-cockpit-400">
            <Loader2 size={14} className="animate-spin" />
            Loading connector status...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {status && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cockpit-400">Type</span>
              <span className="font-medium text-cockpit-100">{status.adapterType}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-cockpit-400">Health</span>
              <span className="inline-flex items-center gap-1 font-medium text-cockpit-100">
                {status.health === 'healthy' ? (
                  <CheckCircle size={12} className="text-emerald-400" />
                ) : status.health === 'unhealthy' ? (
                  <XCircle size={12} className="text-danger" />
                ) : (
                  <AlertCircle size={12} className="text-amber-400" />
                )}
                {status.health}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-cockpit-400">Connected</span>
              <span className={status.connected ? 'text-emerald-400' : 'text-danger'}>
                {status.connected ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="text-xs text-cockpit-400">
              Capabilities:{' '}
              <span className="text-cockpit-200">{status.capabilities.join(', ')}</span>
            </div>
            {isMock && (
              <div className="rounded border border-amber-700/30 bg-amber-950/20 px-2 py-1.5 text-[10px] text-amber-300">
                No real writeback unless configured. Credentials not stored in browser.
              </div>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                onClick={fetchStatus}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-800 px-2 py-1 text-[10px] font-medium text-cockpit-200 hover:bg-cockpit-700 disabled:opacity-50"
              >
                <RefreshCw size={10} />
                Refresh
              </button>
              <button
                onClick={handleTest}
                disabled={testing}
                className="inline-flex items-center gap-1 rounded bg-accent px-2 py-1 text-[10px] font-medium text-white hover:bg-accent-dark disabled:opacity-50"
              >
                {testing && <Loader2 size={10} className="animate-spin" />}
                <Plug size={10} />
                Test
              </button>
            </div>

            {testResult && (
              <div className="rounded border border-cockpit-700 bg-cockpit-900/50 p-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-cockpit-400">Test result</span>
                  <Badge variant={testResult.success ? 'success' : 'danger'}>
                    {testResult.success ? 'Passed' : 'Failed'}
                  </Badge>
                </div>
                {testResult.latencyMs !== undefined && (
                  <div className="mt-1 text-cockpit-500">Latency: {testResult.latencyMs}ms</div>
                )}
                {testResult.error && (
                  <div className="mt-1 text-danger">{testResult.error}</div>
                )}
                {typeof testResult.metadata?.note === 'string' && (
                  <div className="mt-1 text-cockpit-500">{testResult.metadata.note}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}
