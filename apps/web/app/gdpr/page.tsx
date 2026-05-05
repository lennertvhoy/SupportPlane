'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AuthGate, UserMenu } from '@/components/AuthGate';
import { GdprRequestPanel } from '@/components/GdprRequestPanel';
import type { AuthIdentity } from '@/lib/api';

function GdprPageContent({
  identity,
  logout,
}: {
  identity: AuthIdentity;
  logout: () => Promise<void>;
}) {
  const router = useRouter();
  return (
    <div className="flex h-screen flex-col bg-cockpit-950 text-cockpit-100">
      <header className="flex items-center justify-between border-b border-cockpit-800 px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="inline-flex h-9 w-9 items-center justify-center rounded border border-cockpit-700 bg-cockpit-900 text-cockpit-300 hover:border-accent-500"
            title="Back to admin"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-lg font-semibold">GDPR Requests</h1>
            <p className="text-xs text-cockpit-400">Data subject export and delete dry-run.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserMenu identity={identity} logout={logout} />
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-4xl">
          <GdprRequestPanel identity={identity} />
        </div>
      </main>
    </div>
  );
}

export default function GdprPage() {
  return (
    <AuthGate>
      {(identity, logout) => <GdprPageContent identity={identity} logout={logout} />}
    </AuthGate>
  );
}
