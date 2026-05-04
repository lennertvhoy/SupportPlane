'use client';

import { useState } from 'react';
import { Info, X, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';

export function DemoGuidePanel() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="rounded-lg border border-blue-700/30 bg-blue-950/20 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-200">Demo Guide — Start Here</h3>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-cockpit-500 hover:text-cockpit-300"
          title="Dismiss guide"
        >
          <X size={14} />
        </button>
      </div>

      <p className="text-xs text-cockpit-300 mb-3">
        This is a local sandbox demo of SupportPlane. Nothing here is production data.
        Follow the recommended path below to evaluate the cockpit.
      </p>

      <div className="grid grid-cols-1 gap-2 text-xs mb-3">
        <div className="flex items-center gap-2 text-emerald-300">
          <CheckCircle size={12} className="shrink-0" />
          <span><strong>Zammad</strong> — Real sandbox ticket read</span>
        </div>
        <div className="flex items-center gap-2 text-emerald-300">
          <CheckCircle size={12} className="shrink-0" />
          <span><strong>GLPI</strong> — Real sandbox ticket read</span>
        </div>
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle size={12} className="shrink-0" />
          <span><strong>osTicket</strong> — Fixture data only</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <HelpCircle size={12} className="shrink-0" />
          <span><strong>MeshCentral / Fortinet</strong> — Not configured</span>
        </div>
      </div>

      <div className="text-xs text-amber-300 mb-3 border border-amber-700/30 rounded bg-amber-950/20 px-2 py-1.5">
        Writeback to external systems is blocked. All data is sandbox-only.
      </div>

      <div className="text-xs text-cockpit-300 space-y-1">
        <p className="font-medium text-cockpit-200">Recommended test path:</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>Check <strong>Connector Status</strong> panel below to see what is real vs. fixture</li>
          <li>Create a <strong>Session</strong> in the sidebar and load Zammad ticket <strong>TICKET-101</strong></li>
          <li>Load GLPI ticket context via the GLPI flow</li>
          <li>Explore <strong>Admin</strong> → governance, policies, audit trail</li>
          <li>Try the <strong>Call Console</strong> and <strong>Device Console</strong></li>
        </ol>
        <p className="mt-1 text-cockpit-500">
          For the full 20-30 minute guided test, see the tester script in <code className="bg-cockpit-900 px-1 rounded">docs/user-testing/TEST_SCRIPT.md</code>.
        </p>
      </div>
    </div>
  );
}
