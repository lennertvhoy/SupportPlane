'use client';

import { useCallback, useEffect, useState } from 'react';
import type React from 'react';
import { LogOut, ShieldCheck, KeyRound } from 'lucide-react';
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
  const [oidcEnabled, setOidcEnabled] = useState(false);

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
    // Check OIDC config
    fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4110'}/auth/oidc/config`)
      .then((r) => r.json())
      .then((data) => setOidcEnabled(data.oidcEnabled === true))
      .catch(() => setOidcEnabled(false));
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

  const startOidcLogin = async () => {
    setError(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4110'}/auth/oidc/login`, {
        method: 'GET',
        credentials: 'include',
      });
      const data = await res.json();
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError('OIDC login not available');
      }
    } catch {
      setError('OIDC login failed');
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-cockpit-950 text-sm text-cockpit-300">Checking session...</div>;
  }

  if (!identity) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cockpit-950 px-4">
        <div className="w-full max-w-sm rounded border border-cockpit-700 bg-cockpit-900 p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <div>
              <h1 className="text-sm font-semibold text-cockpit-100">SupportPlane</h1>
              <p className="text-xs text-cockpit-500">Governed AI support cockpit — local sandbox demo</p>
            </div>
          </div>
          <div className="mb-4 rounded border border-amber-700/30 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-300">
            This is a local development sandbox. No production data. No cloud AI. No compliance claims.
          </div>

          {oidcEnabled && (
            <button
              onClick={startOidcLogin}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded border border-cockpit-600 bg-cockpit-800 px-3 py-2 text-sm font-medium text-cockpit-100 hover:bg-cockpit-700"
            >
              <KeyRound size={14} />
              Continue with Keycloak
            </button>
          )}

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-cockpit-700" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-cockpit-900 px-2 text-cockpit-500">or local auth</span>
            </div>
          </div>

          <form onSubmit={login}>
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
          </form>

          <p className="mt-3 text-[11px] text-cockpit-500">Seeded local password: supportplane-demo</p>
          {oidcEnabled && (
            <p className="mt-1 text-[11px] text-cockpit-500">Keycloak local sandbox · OIDC login enabled · Not production SSO</p>
          )}
        </div>
      </main>
    );
  }

  return <>{children(identity, logout)}</>;
}

export function IdentityPill({ identity, logout }: { identity: AuthIdentity; logout: () => Promise<void> }) {
  const authLabel = identity.authMode === 'oidc' ? 'OIDC' : identity.authMode === 'local' ? 'Local' : identity.authMode === 'service' ? 'Service' : 'Dev';
  const authColor = identity.authMode === 'oidc' ? 'text-sky-300 border-sky-700/40 bg-sky-900/30' : 'text-emerald-300 border-emerald-700/40 bg-emerald-900/30';
  return (
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium ${authColor}`}>
        <ShieldCheck size={10} />
        {identity.userName ?? identity.userEmail} / {identity.tenantName ?? identity.tenantSlug} / {identity.userRole} / {authLabel}
      </span>
      <button onClick={() => void logout()} className="inline-flex items-center gap-1 rounded border border-cockpit-600 bg-cockpit-900 px-2 py-0.5 text-[10px] text-cockpit-300 hover:bg-cockpit-800">
        <LogOut size={10} />
        Logout
      </button>
    </div>
  );
}
