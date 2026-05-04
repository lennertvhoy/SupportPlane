'use client';

import { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';

export function InfoTooltip({
  children,
  icon = 'info',
  size = 14,
  className = '',
}: {
  children: React.ReactNode;
  icon?: 'info' | 'help';
  size?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const Icon = icon === 'help' ? HelpCircle : Info;

  return (
    <span className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((s) => !s)}
        className="inline-flex items-center justify-center rounded p-0.5 text-cockpit-400 hover:text-accent focus:outline-none focus:ring-1 focus:ring-accent"
        aria-label="More information"
      >
        <Icon size={size} />
      </button>
      {open && (
        <span
          className="absolute z-50 w-64 rounded border border-cockpit-600 bg-cockpit-900 px-3 py-2 text-xs text-cockpit-200 shadow-lg"
          style={{ bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' }}
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <span className="absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-cockpit-600 bg-cockpit-900" />
          {children}
        </span>
      )}
    </span>
  );
}

export function InlineHelp({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="rounded border border-cockpit-700/50 bg-cockpit-900/60 px-3 py-2 text-xs text-cockpit-300">
      {title && <div className="mb-1 font-medium text-cockpit-200">{title}</div>}
      {children}
    </div>
  );
}

export function BoundaryLabel({
  type,
}: {
  type: 'real-sandbox' | 'mock-fixture' | 'unconfigured' | 'read-only' | 'approval-gated' | 'policy-blocked' | 'audit-evidence';
}) {
  const config: Record<string, { text: string; className: string; description: string }> = {
    'real-sandbox': {
      text: 'Real sandbox',
      className: 'border-emerald-700/40 bg-emerald-900/30 text-emerald-300',
      description: 'Reads/writes only to local demo service. Never production.',
    },
    'mock-fixture': {
      text: 'Mock fixture',
      className: 'border-amber-700/40 bg-amber-900/30 text-amber-300',
      description: 'Deterministic local demo data. Not a real connector.',
    },
    'unconfigured': {
      text: 'Unconfigured',
      className: 'border-slate-600 bg-slate-800/50 text-slate-400',
      description: 'No real instance connected. Scaffolding only.',
    },
    'read-only': {
      text: 'Read-only',
      className: 'border-blue-700/40 bg-blue-900/30 text-blue-300',
      description: 'SupportPlane can inspect context but cannot mutate this system.',
    },
    'approval-gated': {
      text: 'Approval required',
      className: 'border-purple-700/40 bg-purple-900/30 text-purple-300',
      description: 'Action is queued until an authorized role approves it.',
    },
    'policy-blocked': {
      text: 'Blocked by policy',
      className: 'border-red-700/40 bg-red-900/30 text-red-300',
      description: 'Governance rules prevent this action.',
    },
    'audit-evidence': {
      text: 'Audit trail',
      className: 'border-cyan-700/40 bg-cyan-900/30 text-cyan-300',
      description: 'Every action is logged and exportable for review.',
    },
  };

  const cfg = config[type];
  if (!cfg) return null;

  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${cfg.className}`}>
      {cfg.text}
      <InfoTooltip size={10}>
        <div className="text-[11px] leading-relaxed">{cfg.description}</div>
      </InfoTooltip>
    </span>
  );
}
