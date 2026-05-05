'use client';

import { AuthGate } from '@/components/AuthGate';
import { AdminDashboardShell } from '@/components/AdminDashboardShell';
import { GdprRequestPanel } from '@/components/GdprRequestPanel';
import type { AuthIdentity } from '@/lib/api';

function GdprAdminPageContent({
  identity,
  logout,
}: {
  identity: AuthIdentity;
  logout: () => Promise<void>;
}) {
  return (
    <AdminDashboardShell
      identity={identity}
      logout={logout}
      title="GDPR"
      subtitle="Data subject export and delete dry-run."
    >
      <div className="mx-auto max-w-4xl">
        <GdprRequestPanel identity={identity} />
      </div>
    </AdminDashboardShell>
  );
}

export default function GdprAdminPage() {
  return (
    <AuthGate>
      {(identity, logout) => <GdprAdminPageContent identity={identity} logout={logout} />}
    </AuthGate>
  );
}
