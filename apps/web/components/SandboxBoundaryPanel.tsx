'use client';

import { Shield, Globe, Lock, Eye, CheckCircle, AlertTriangle, HelpCircle } from 'lucide-react';
import { Panel } from './Panel';
import { BoundaryLabel } from './InfoTooltip';

export function SandboxBoundaryPanel() {
  return (
    <Panel
      title="Demo Boundaries & Safety"
      headerRight={
        <span className="inline-flex items-center gap-1 text-[10px] text-cockpit-400">
          <HelpCircle size={10} />
          What is real?
        </span>
      }
    >
      <div className="space-y-3">
        <div className="rounded border border-cockpit-700/50 bg-cockpit-900/40 px-3 py-2 text-xs text-cockpit-300">
          <div className="mb-1.5 flex items-center gap-1.5 font-medium text-cockpit-100">
            <Shield size={13} className="text-accent" />
            SupportPlane is a governed AI support cockpit.
          </div>
          <p className="leading-relaxed">
            AI can reason, summarize, and suggest actions. Policy, role, and approval controls
            decide what is allowed. Every action is auditable. Nothing executes autonomously.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-cockpit-400">
            Connector states
          </div>
          <div className="flex flex-wrap gap-1.5">
            <BoundaryLabel type="real-sandbox" />
            <BoundaryLabel type="mock-fixture" />
            <BoundaryLabel type="unconfigured" />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wide text-cockpit-400">
            Governance states
          </div>
          <div className="flex flex-wrap gap-1.5">
            <BoundaryLabel type="read-only" />
            <BoundaryLabel type="approval-gated" />
            <BoundaryLabel type="policy-blocked" />
            <BoundaryLabel type="audit-evidence" />
          </div>
        </div>

        <div className="space-y-2 rounded border border-cockpit-700/50 bg-cockpit-900/40 p-2.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-cockpit-200">
            <Globe size={12} className="text-emerald-400" />
            Network boundary
          </div>
          <ul className="space-y-1 text-[11px] text-cockpit-400">
            <li className="flex items-start gap-1.5">
              <CheckCircle size={11} className="mt-0.5 shrink-0 text-emerald-400" />
              Local Kubernetes sandbox only
            </li>
            <li className="flex items-start gap-1.5">
              <Lock size={11} className="mt-0.5 shrink-0 text-amber-400" />
              No external internet writeback
            </li>
            <li className="flex items-start gap-1.5">
              <Eye size={11} className="mt-0.5 shrink-0 text-blue-400" />
              All egress is allowlisted and auditable
            </li>
          </ul>
        </div>

        <div className="space-y-2 rounded border border-amber-700/30 bg-amber-950/20 p-2.5">
          <div className="flex items-center gap-2 text-[11px] font-medium text-amber-200">
            <AlertTriangle size={12} />
            Not production
          </div>
          <ul className="space-y-1 text-[11px] text-amber-300/80">
            <li>• No real customer data</li>
            <li>• No cloud AI (local Ollama only)</li>
            <li>• No compliance certification claimed</li>
            <li>• Secrets are sandbox defaults (lost on restart)</li>
          </ul>
        </div>
      </div>
    </Panel>
  );
}
