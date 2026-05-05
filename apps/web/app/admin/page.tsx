'use client';

import { useRouter } from 'next/navigation';
import { Shield, Users, UserCog, BarChart3, FileSearch, Database, Plug } from 'lucide-react';
import { AuthGate } from '@/components/AuthGate';
import { AdminDashboardShell } from '@/components/AdminDashboardShell';
import { AdminPolicyPanel } from '@/components/AdminPolicyPanel';
import type { AuthIdentity } from '@/lib/api';

const cards = [
  { label: 'Policies', href: '/admin', icon: Shield, color: 'border-cockpit-600' },
  { label: 'Users', href: '/admin/users', icon: Users, color: 'border-cockpit-600' },
  { label: 'Roles', href: '/admin/roles', icon: UserCog, color: 'border-cockpit-600' },
  {
    label: 'Model Usage',
    href: '/admin/model-usage',
    icon: BarChart3,
    color: 'border-cockpit-600',
  },
  { label: 'Audit Explorer', href: '/admin/audit', icon: FileSearch, color: 'border-cockpit-600' },
  { label: 'GDPR', href: '/admin/gdpr', icon: Database, color: 'border-cockpit-600' },
  { label: 'Connectors', href: '/admin/connectors', icon: Plug, color: 'border-cockpit-600' },
];

function AdminPageContent({
  identity,
  logout,
}: {
  identity: AuthIdentity;
  logout: () => Promise<void>;
}) {
  const router = useRouter();
  const isAdmin =
    identity.permissions.includes('*') ||
    identity.roles.includes('admin') ||
    identity.roles.includes('owner');

  return (
    <AdminDashboardShell
      identity={identity}
      logout={logout}
      title="Admin Dashboard"
      subtitle="Control plane for policies, users, and governance."
    >
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            const disabled = !isAdmin && card.label !== 'Policies';
            return (
              <button
                key={card.href}
                onClick={() => router.push(card.href)}
                disabled={disabled}
                className={`flex flex-col items-center gap-2 rounded-lg border bg-cockpit-900/60 p-4 text-center transition-colors hover:bg-cockpit-800 focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none ${card.color} ${disabled ? 'bg-cockpit-900 text-cockpit-600 cursor-not-allowed opacity-60' : ''}`}
              >
                <Icon size={20} className="text-cockpit-300" />
                <span className="text-xs font-medium text-cockpit-200">{card.label}</span>
              </button>
            );
          })}
        </div>

        <AdminPolicyPanel identity={identity} />
      </div>
    </AdminDashboardShell>
  );
}

export default function AdminPage() {
  return (
    <AuthGate>
      {(identity, logout) => <AdminPageContent identity={identity} logout={logout} />}
    </AuthGate>
  );
}
