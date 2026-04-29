'use client';

import { useCallback, useEffect, useState } from 'react';
import type React from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';
import { api, ApiClientError, type AuthIdentity } from '@/lib/api';

export function AuthGate({
  children,
}: {
  children: (identity: AuthIdentity, logout: () => Promise<void>) => React.ReactNode;
}) {
  const [identity, setIdentity] = useState<AuthIdentity | null>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('operator@supportplane.local');
  const [password, setPassword] = useState('supportplane-demo');
  const [tenantSlug, setTenantSlug] = useState('dev-tenant');
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api.me();
      setIdentity(me.identity);
    } catch {
      setIdentity(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      const result = await api.login({ email, password, tenantSlug });
      setIdentity(result.identity);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Login failed');
    }
  };

  const logout = async () => {
    await api.logout();
    setIdentity(null);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-cockpit-950 text-sm text-cockpit-300">Checking local session...</div>;
  }

  if (!identity) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cockpit-950 px-4">
        <form onSubmit={login} className="w-full max-w-sm rounded border border-cockpit-700 bg-cockpit-900 p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <div>
              <h1 className="text-sm font-semibold text-cockpit-100">SupportPlane local login</h1>
              <p className="text-xs text-cockpit-500">Local MVP auth, not SSO or production auth.</p>
            </div>
          </div>
          <label className="mb-3 block text-xs text-cockpit-300">
            Tenant
            <input className="mt-1 w-full rounded border border-cockpit-700 bg-white px-3 py-2 text-black" value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} />
          </label>
          <label className="mb-3 block text-xs text-cockpit-300">
            Email
            <input className="mt-1 w-full rounded border border-cockpit-700 bg-white px-3 py-2 text-black" value={email} onChange={(e) => setEmail(e.target.value)} />
          </label>
          <label className="mb-4 block text-xs text-cockpit-300">
            Password
            <input type="password" className="mt-1 w-full rounded border border-cockpit-700 bg-white px-3 py-2 text-black" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
          {error && <div className="mb-3 rounded border border-red-700/50 bg-red-950/40 px-3 py-2 text-xs text-red-200">{error}</div>}
          <button type="submit" className="w-full rounded bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent/90">
            Log in
          </button>
          <p className="mt-3 text-[11px] text-cockpit-500">Seeded local password: supportplane-demo</p>
        </form>
      </main>
    );
  }

  return <>{children(identity, logout)}</>;
}

export function IdentityPill({ identity, logout }: { identity: AuthIdentity; logout: () => Promise<void> }) {
  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded border border-emerald-700/40 bg-emerald-900/30 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
        <ShieldCheck size={10} />
        {identity.userName ?? identity.userEmail} / {identity.tenantName ?? identity.tenantSlug} / {identity.userRole}
      </span>
      <button onClick={() => void logout()} className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-0.5 text-[10px] text-cockpit-300 hover:bg-cockpit-800">
        <LogOut size={10} />
        Logout
      </button>
    </div>
  );
}
