'use client';

import { useState } from 'react';
import { X, CheckCircle, AlertTriangle, HelpCircle, Rocket, BookOpen } from 'lucide-react';

export function DemoGuidePanel() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return (
      <div className="rounded-lg border border-blue-700/30 bg-blue-950/20 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket size={14} className="text-blue-400" />
            <span className="text-xs font-medium text-blue-200">Demo Guide hidden</span>
          </div>
          <button
            onClick={() => setDismissed(false)}
            className="inline-flex items-center gap-1 rounded border border-blue-700/40 bg-blue-900/30 px-2 py-0.5 text-[10px] font-medium text-blue-300 hover:bg-blue-900/50"
          >
            <BookOpen size={10} />
            Show Start Here
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-blue-700/30 bg-blue-950/20 p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <Rocket size={16} className="text-blue-400" />
          <h3 className="text-sm font-semibold text-blue-200">Start Here — Demo Guide</h3>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-cockpit-400 hover:text-cockpit-300"
          title="Dismiss guide"
        >
          <X size={14} />
        </button>
      </div>

      <p className="text-xs text-cockpit-300 mb-3 leading-relaxed">
        <strong>SupportPlane</strong> is a governed AI support cockpit for IT teams and MSPs. This
        demo runs in a local Kubernetes sandbox. AI suggests; policy decides. Nothing here is
        production data.
      </p>

      <div className="grid grid-cols-1 gap-2 text-xs mb-3">
        <div className="flex items-center gap-2 text-emerald-300">
          <CheckCircle size={12} className="shrink-0" />
          <span>
            <strong>Zammad</strong> — Real sandbox ticket read
            <InfoTooltip text="Live Zammad instance in local cluster. OpenBao credential resolution." />
          </span>
        </div>
        <div className="flex items-center gap-2 text-emerald-300">
          <CheckCircle size={12} className="shrink-0" />
          <span>
            <strong>GLPI</strong> — Real sandbox ticket read
            <InfoTooltip text="Live GLPI instance in local cluster. REST API session token auth." />
          </span>
        </div>
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle size={12} className="shrink-0" />
          <span>
            <strong>osTicket</strong> — Fixture data only
            <InfoTooltip text="Blocked upstream: no read API, MySQL-only, no official container image." />
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <HelpCircle size={12} className="shrink-0" />
          <span>
            <strong>MeshCentral / Fortinet</strong> — Not configured
            <InfoTooltip text="Scaffolding exists but no real instance is deployed." />
          </span>
        </div>
      </div>

      <div className="text-xs text-amber-300 mb-3 border border-amber-700/30 rounded bg-amber-950/20 px-2 py-1.5">
        Writeback to external systems is blocked. All data is sandbox-only.
      </div>

      <div className="text-xs text-cockpit-300 space-y-1">
        <p className="font-medium text-cockpit-200">Recommended first-time path:</p>
        <ol className="list-decimal list-inside space-y-0.5">
          <li>
            Review the <strong>Demo Boundaries & Safety</strong> panel below
          </li>
          <li>
            Check <strong>Connector Status</strong> to see what is real vs. fixture vs. unconfigured
          </li>
          <li>
            Create a <strong>Session</strong> in the sidebar and load Zammad ticket{' '}
            <strong>#2</strong>
          </li>
          <li>Load GLPI ticket context via the GLPI flow</li>
          <li>
            Explore <strong>Admin</strong> → governance, policies, audit trail
          </li>
        </ol>
        <p className="mt-1 text-cockpit-400">
          For the full 20-30 minute guided test, see{' '}
          <code className="bg-cockpit-900 px-1 rounded">docs/user-testing/TEST_SCRIPT.md</code>.
        </p>
      </div>
    </div>
  );
}

function InfoTooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-flex items-center ml-1">
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center text-cockpit-400 hover:text-blue-400 focus:outline-none"
        aria-label="More information"
      >
        <HelpCircle size={10} />
      </button>
      {open && (
        <span
          className="absolute z-50 w-56 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-1.5 text-[10px] text-cockpit-200 shadow-lg"
          style={{ bottom: 'calc(100% + 4px)', left: '50%', transform: 'translateX(-50%)' }}
        >
          <span className="absolute left-1/2 top-full h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-cockpit-600 bg-cockpit-900" />
          {text}
        </span>
      )}
    </span>
  );
}
