import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { AlertTriangle, CheckCircle, XCircle, HelpCircle, Shield } from 'lucide-react';

interface ConnectorStatusItem {
  key: string;
  name: string;
  adapterType: string;
  status: string;
  transport: string;
  capabilities: string[];
  health: string;
  lastChecked: string;
  lastError?: string;
  tenantScoped: boolean;
}

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  configured: { icon: <CheckCircle className="w-4 h-4" />, color: 'text-emerald-400 bg-emerald-900/30 border-emerald-700', label: 'Configured' },
  mock: { icon: <AlertTriangle className="w-4 h-4" />, color: 'text-amber-400 bg-amber-900/30 border-amber-700', label: 'Mock / Fixture' },
  unconfigured: { icon: <HelpCircle className="w-4 h-4" />, color: 'text-slate-400 bg-slate-800/50 border-slate-600', label: 'Unconfigured' },
  disabled: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-400 bg-red-900/30 border-red-700', label: 'Disabled' },
  error: { icon: <XCircle className="w-4 h-4" />, color: 'text-red-400 bg-red-900/30 border-red-700', label: 'Error' },
};

const transportLabel = (t: string) => {
  switch (t) {
    case 'real': return 'Real HTTP';
    case 'mock': return 'Mock transport';
    case 'fixture': return 'Fixture data';
    case 'unconfigured': return 'Not connected';
    default: return t;
  }
};

export function ConnectorStatusPanel() {
  const [connectors, setConnectors] = useState<ConnectorStatusItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAllConnectorStatus()
      .then(setConnectors)
      .catch(() => setConnectors([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="rounded-lg border border-cockpit-700 bg-cockpit-800/50 p-4">
        <div className="text-sm text-cockpit-400">Loading connector status...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-cockpit-700 bg-cockpit-800/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-4 h-4 text-cockpit-300" />
        <h3 className="text-sm font-semibold text-cockpit-100">Connector Status</h3>
        <span className="text-xs text-cockpit-500 ml-auto">Tenant-scoped</span>
      </div>

      <div className="space-y-2">
        {connectors.map((conn) => {
          const cfg = statusConfig[conn.status] ?? statusConfig.unconfigured;
          return (
            <div key={conn.key} className={`rounded border px-3 py-2 ${cfg.color}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {cfg.icon}
                  <span className="text-sm font-medium">{conn.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cockpit-900/60 border border-current opacity-80">
                    {cfg.label}
                  </span>
                  <span className="text-xs opacity-70">{transportLabel(conn.transport)}</span>
                </div>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {conn.capabilities.map((cap) => (
                  <span key={cap} className="text-xs px-1.5 py-0.5 rounded bg-cockpit-900/40 border border-cockpit-700/50">
                    {cap}
                  </span>
                ))}
              </div>
              {conn.lastError && (
                <div className="mt-1 text-xs opacity-80 italic">{conn.lastError}</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-3 text-xs text-cockpit-500 border-t border-cockpit-700/50 pt-2">
        All connector credentials are tenant-scoped. External writeback requires explicit policy approval.
      </div>
    </div>
  );
}
