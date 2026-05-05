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
} from 'lucide-react';
import { UserMenu } from './AuthGate';
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
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-cockpit-700 bg-cockpit-900 text-cockpit-300 hover:border-accent-500 focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
            title="Back to cockpit"
            aria-label="Back to cockpit"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            {subtitle && <p className="text-xs text-cockpit-400">{subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu identity={identity} logout={logout} />
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
                  className={`flex w-full items-center gap-2 rounded px-3 py-2 text-xs font-medium transition-colors focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none ${
                    active
                      ? 'bg-cockpit-700 text-white'
                      : 'text-cockpit-300 hover:bg-cockpit-800 hover:text-cockpit-100'
                  } ${item.label !== 'Policies' && !isAdmin ? 'cursor-not-allowed opacity-50 grayscale' : ''}`}
                  disabled={item.label !== 'Policies' && !isAdmin}
                  aria-disabled={item.label !== 'Policies' && !isAdmin}
                  title={item.label !== 'Policies' && !isAdmin ? 'Admin role required' : item.label}
                >
                  <Icon size={14} className={item.label !== 'Policies' && !isAdmin ? 'text-cockpit-500' : ''} />
                  <span className={item.label !== 'Policies' && !isAdmin ? 'text-cockpit-500' : ''}>{item.label}</span>
                  {!isAdmin && item.label !== 'Policies' && (
                    <span className="ml-auto rounded bg-cockpit-800 px-1 py-0.5 text-[9px] text-cockpit-400">Admin</span>
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
