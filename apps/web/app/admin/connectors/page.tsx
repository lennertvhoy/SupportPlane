'use client';

import { AuthGate } from '@/components/AuthGate';
import { AdminDashboardShell } from '@/components/AdminDashboardShell';
import { ConnectorPanel } from '@/components/ConnectorPanel';
import type { AuthIdentity } from '@/lib/api';

function ConnectorsPageContent({ identity, logout }: { identity: AuthIdentity; logout: () => Promise<void> }) {
  return (
    <AdminDashboardShell identity={identity} logout={logout} title="Connectors" subtitle="Connector installations and credential management.">
      <div className="mx-auto max-w-5xl">
        <ConnectorPanel identity={identity} />
      </div>
    </AdminDashboardShell>
  );
}

export default function ConnectorsPage() {
  return <AuthGate>{(identity, logout) => <ConnectorsPageContent identity={identity} logout={logout} />}</AuthGate>;
}
