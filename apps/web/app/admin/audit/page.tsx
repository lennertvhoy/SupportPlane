'use client';

import { AuthGate } from '@/components/AuthGate';
import { AdminDashboardShell } from '@/components/AdminDashboardShell';
import { AuditExplorerPanel } from '@/components/AuditExplorerPanel';
import type { AuthIdentity } from '@/lib/api';

function AuditPageContent({ identity, logout }: { identity: AuthIdentity; logout: () => Promise<void> }) {
  return (
    <AdminDashboardShell identity={identity} logout={logout} title="Audit Explorer" subtitle="Search and filter tenant audit events.">
      <div className="mx-auto max-w-5xl">
        <AuditExplorerPanel />
      </div>
    </AdminDashboardShell>
  );
}

export default function AuditPage() {
  return <AuthGate>{(identity, logout) => <AuditPageContent identity={identity} logout={logout} />}</AuthGate>;
}
