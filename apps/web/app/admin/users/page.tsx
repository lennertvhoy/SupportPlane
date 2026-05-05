'use client';

import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { AdminDashboardShell } from '@/components/AdminDashboardShell';
import { Badge } from '@/components/Badge';
import { api, ApiClientError, type AuthIdentity } from '@/lib/api';

interface UserRow {
  id: string;
  email: string;
  name: string;
  status: string;
  roles: string[];
  lastLoginAt?: string;
  createdAt: string;
}

function UsersPageContent({
  identity,
  logout,
}: {
  identity: AuthIdentity;
  logout: () => Promise<void>;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // No dedicated user list API exists yet; show current identity as placeholder
    // and attempt to fetch service accounts as a proxy for tenant actors.
    Promise.all([api.me().catch(() => null)])
      .then(([me]) => {
        const rows: UserRow[] = [];
        if (me?.identity) {
          rows.push({
            id: me.identity.userId,
            email: me.identity.userEmail ?? me.identity.userId,
            name: me.identity.userName ?? me.identity.userEmail ?? me.identity.userId,
            status: 'active',
            roles: me.identity.roles,
            createdAt: new Date().toISOString(),
          });
        }
        setUsers(rows);
      })
      .catch((e) => setError(e instanceof ApiClientError ? e.message : 'Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminDashboardShell
      identity={identity}
      logout={logout}
      title="Users"
      subtitle="Tenant user directory."
    >
      <div className="mx-auto max-w-4xl space-y-4">
        {loading && <p className="text-xs text-cockpit-400">Loading...</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="rounded border border-cockpit-700 bg-cockpit-900/50 p-3">
          <div className="mb-2 text-xs font-medium text-cockpit-300">
            Users <span className="text-cockpit-400">({users.length})</span>
          </div>
          {users.length === 0 ? (
            <div className="text-xs text-cockpit-400">No users found.</div>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between rounded border border-cockpit-700 bg-cockpit-950/40 px-3 py-2"
                >
                  <div>
                    <div className="text-xs font-medium text-cockpit-100">{u.name}</div>
                    <div className="text-xs text-cockpit-400">
                      {u.email} · {u.id.slice(0, 8)}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {u.roles.map((r) => (
                      <Badge key={r} variant="muted">
                        {r}
                      </Badge>
                    ))}
                    <Badge variant={u.status === 'active' ? 'success' : 'warning'}>
                      {u.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded border border-amber-700/30 bg-amber-950/20 px-3 py-2 text-xs text-amber-300">
          Note: Full user management API is not yet wired. This page displays the authenticated
          identity only.
        </div>
      </div>
    </AdminDashboardShell>
  );
}

export default function UsersPage() {
  return (
    <AuthGate>
      {(identity, logout) => <UsersPageContent identity={identity} logout={logout} />}
    </AuthGate>
  );
}
