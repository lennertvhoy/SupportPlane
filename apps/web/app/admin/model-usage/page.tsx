'use client';

import { AuthGate } from '@/components/AuthGate';
import { AdminDashboardShell } from '@/components/AdminDashboardShell';
import { ModelUsagePanel } from '@/components/ModelUsagePanel';
import type { AuthIdentity } from '@/lib/api';

function ModelUsagePageContent({ identity, logout }: { identity: AuthIdentity; logout: () => Promise<void> }) {
  return (
    <AdminDashboardShell identity={identity} logout={logout} title="Model Usage" subtitle="AI model call logs and cost summaries.">
      <div className="mx-auto max-w-5xl">
        <ModelUsagePanel tenantId={identity.tenantId} userId={identity.userId} userRole={identity.userRole} />
      </div>
    </AdminDashboardShell>
  );
}

export default function ModelUsagePage() {
  return <AuthGate>{(identity, logout) => <ModelUsagePageContent identity={identity} logout={logout} />}</AuthGate>;
}
