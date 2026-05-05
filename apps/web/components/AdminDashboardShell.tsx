'use client';

import { useRouter, usePathname } from 'next/navigation';
import {
  Shield,
  Users,
  UserCog,
  BarChart3,
  FileSearch,
  Database,
  Plug,
  ArrowLeft,
  LogOut,
} from 'lucide-react';
import { IdentityPill } from './AuthGate';
import type { AuthIdentity } from '@/lib/api';

const navItems = [
  { label: 'Policies', href: '/admin', icon: Shield },
  { label: 'Users', href: '/admin/users', icon: Users },
  { label: 'Roles', href: '/admin/roles', icon: UserCog },
  { label: 'Model Usage', href: '/admin/model-usage', icon: BarChart3 },
  { label: 'Audit Explorer', href: '/admin/audit', icon: FileSearch },
  { label: 'GDPR', href: '/admin/gdpr', icon: Database },
  { label: 'Connectors', href: '/admin/connectors', icon: Plug },
];

export function AdminDashboardShell({
  identity,
  logout,
  children,
  title,
  subtitle,
}: {
  identity: AuthIdentity;
  logout: () => Promise<void>;
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isAdmin =
    identity.permissions.includes('*') ||
    identity.roles.includes('admin') ||
    identity.roles.includes('owner');

  return (
    <div className="flex h-screen flex-col bg-cockpit-950 text-cockpit-100">
      <header className="flex items-center justify-between border-b border-cockpit-800 px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-cockpit-700 bg-cockpit-900 text-cockpit-300 hover:border-accent-500"
            title="Back to cockpit"
            aria-label="Back to cockpit"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            {subtitle && <p className="text-xs text-cockpit-500">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <IdentityPill identity={identity} logout={logout} />
          <button
            type="button"
            onClick={() => void logout()}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-cockpit-700 bg-cockpit-900 text-cockpit-300 hover:border-accent-500"
            title="Logout"
            aria-label="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sidebar */}
        <aside className="w-56 shrink-0 overflow-y-auto border-r border-cockpit-800 bg-cockpit-900/40 p-3">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => router.push(item.href)}
                  className={`flex w-full items-center gap-2 rounded px-3 py-2 text-xs font-medium transition-colors ${
                    active
                      ? 'bg-cockpit-700 text-white'
                      : 'text-cockpit-300 hover:bg-cockpit-800 hover:text-cockpit-100'
                  } ${item.label !== 'Policies' && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={item.label !== 'Policies' && !isAdmin}
                >
                  <Icon size={14} />
                  {item.label}
                  {!isAdmin && item.label !== 'Policies' && (
                    <span className="ml-auto text-[9px] text-cockpit-500">Admin</span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="min-h-0 flex-1 overflow-auto p-4">{children}</main>
      </div>
    </div>
  );
}
