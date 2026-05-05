'use client';

import { useEffect, useState } from 'react';
import { AuthGate } from '@/components/AuthGate';
import { AdminDashboardShell } from '@/components/AdminDashboardShell';
import { Badge } from '@/components/Badge';
import { api, ApiClientError, type AuthIdentity } from '@/lib/api';

interface RoleRow {
  name: string;
  permissions: string[];
}

function RolesPageContent({
  identity,
  logout,
}: {
  identity: AuthIdentity;
  logout: () => Promise<void>;
}) {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    api
      .me()
      .then((me) => {
        const uniqueRoles = Array.from(new Set(me.identity.roles));
        const roleMap: Record<string, string[]> = {
          admin: ['*'],
          owner: ['*'],
          operator: [
            'support_session:read',
            'support_session:create',
            'ticket:read',
            'ticket:write',
            'ai:generate',
            'audit:read',
            'connector:read',
            'delivery_policy:read',
          ],
          viewer: ['support_session:read', 'audit:read', 'connector:read', 'ticket:read'],
          support_agent: [
            'support_session:read',
            'support_session:create',
            'ticket:read',
            'ticket:write',
            'ai:generate',
            'audit:read',
            'connector:read',
          ],
        };
        setRoles(
          uniqueRoles.map((r) => ({
            name: r,
            permissions: roleMap[r] ?? ['support_session:read'],
          })),
        );
      })
      .catch((e) => setError(e instanceof ApiClientError ? e.message : 'Failed to load roles'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminDashboardShell
      identity={identity}
      logout={logout}
      title="Roles"
      subtitle="Tenant role definitions and permissions."
    >
      <div className="mx-auto max-w-4xl space-y-4">
        {loading && <p className="text-xs text-cockpit-500">Loading...</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="rounded border border-cockpit-700 bg-cockpit-900/50 p-3">
          <div className="mb-2 text-xs font-medium text-cockpit-300">
            Roles <span className="text-cockpit-500">({roles.length})</span>
          </div>
          {roles.length === 0 ? (
            <div className="text-xs text-cockpit-500">No roles found.</div>
          ) : (
            <div className="space-y-3">
              {roles.map((r) => (
                <div
                  key={r.name}
                  className="rounded border border-cockpit-700 bg-cockpit-950/40 px-3 py-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-cockpit-100 capitalize">
                      {r.name}
                    </div>
                    <Badge variant={r.name === 'admin' || r.name === 'owner' ? 'danger' : 'info'}>
                      {r.permissions.includes('*') ? 'All' : `${r.permissions.length} permissions`}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {r.permissions.slice(0, 8).map((p) => (
                      <span
                        key={p}
                        className="rounded bg-cockpit-800 px-1.5 py-0.5 text-[9px] text-cockpit-400"
                      >
                        {p}
                      </span>
                    ))}
                    {r.permissions.length > 8 && (
                      <span className="text-[9px] text-cockpit-500">
                        +{r.permissions.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded border border-amber-700/30 bg-amber-950/20 px-3 py-2 text-[10px] text-amber-300">
          Note: Full role management API is not yet wired. This page shows roles derived from the
          current identity.
        </div>
      </div>
    </AdminDashboardShell>
  );
}

export default function RolesPage() {
  return (
    <AuthGate>
      {(identity, logout) => <RolesPageContent identity={identity} logout={logout} />}
    </AuthGate>
  );
}
