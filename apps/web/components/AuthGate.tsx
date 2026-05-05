'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4110'}/auth/oidc/login`,
        {
          method: 'GET',
          credentials: 'include',
        },
      );
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
    return (
      <div className="flex h-screen items-center justify-center bg-cockpit-950 text-sm text-cockpit-300">
        Checking session...
      </div>
    );
  }

  if (!identity) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cockpit-950 px-4">
        <div className="w-full max-w-sm rounded border border-cockpit-700 bg-cockpit-900 p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-accent" />
            <div>
              <h1 className="text-sm font-semibold text-cockpit-100">SupportPlane</h1>
              <p className="text-xs text-cockpit-400">
                Governed AI support cockpit — local sandbox demo
              </p>
            </div>
          </div>
          <div className="mb-4 rounded border border-amber-700/30 bg-amber-950/20 px-3 py-2 text-[11px] text-amber-300">
            This is a local development sandbox. No production data. No cloud AI. No compliance
            claims.
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
              <span className="bg-cockpit-900 px-2 text-cockpit-400">or local auth</span>
            </div>
          </div>

          <form onSubmit={login}>
            <label className="mb-3 block text-xs text-cockpit-300">
              Tenant
              <input
                className="mt-1 w-full rounded border border-cockpit-700 bg-white px-3 py-2 text-black focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
                value={tenantSlug}
                onChange={(e) => setTenantSlug(e.target.value)}
              />
            </label>
            <label className="mb-3 block text-xs text-cockpit-300">
              Email
              <input
                className="mt-1 w-full rounded border border-cockpit-700 bg-white px-3 py-2 text-black focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="mb-4 block text-xs text-cockpit-300">
              Password
              <input
                type="password"
                className="mt-1 w-full rounded border border-cockpit-700 bg-white px-3 py-2 text-black focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            {error && (
              <div className="mb-3 rounded border border-red-700/50 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            )}
            <button
              type="submit"
              className="w-full rounded bg-accent-dark px-3 py-2 text-sm font-medium text-white hover:bg-accent-dark/90 focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
            >
              Log in
            </button>
          </form>

          <p className="mt-3 text-[11px] text-cockpit-400">
            Seeded local password: supportplane-demo
          </p>
          {oidcEnabled && (
            <p className="mt-1 text-[11px] text-cockpit-400">
              Keycloak local sandbox · OIDC login enabled · Not production SSO
            </p>
          )}
        </div>
      </main>
    );
  }

  return <>{children(identity, logout)}</>;
}

export function IdentityPill({ identity }: { identity: AuthIdentity }) {
  const authLabel =
    identity.authMode === 'oidc'
      ? 'OIDC'
      : identity.authMode === 'local'
        ? 'Local'
        : identity.authMode === 'service'
          ? 'Service'
          : 'Dev';
  const authColor =
    identity.authMode === 'oidc'
      ? 'text-sky-300 border-sky-700/40 bg-sky-900/30'
      : 'text-emerald-300 border-emerald-700/40 bg-emerald-900/30';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[10px] font-medium ${authColor}`}
    >
      <ShieldCheck size={10} />
      {identity.userName ?? identity.userEmail} / {identity.tenantName ?? identity.tenantSlug} /{' '}
      {identity.userRole} / {authLabel}
    </span>
  );
}

export function UserMenu({
  identity,
  logout,
}: {
  identity: AuthIdentity;
  logout: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials = (identity.userName ?? identity.userEmail ?? '?')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const authLabel =
    identity.authMode === 'oidc'
      ? 'OIDC'
      : identity.authMode === 'local'
        ? 'Local'
        : identity.authMode === 'service'
          ? 'Service'
          : 'Dev';

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-cockpit-600 bg-cockpit-800 text-xs font-medium text-cockpit-200 hover:bg-cockpit-700 focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
        aria-label="Open user menu"
        aria-expanded={open}
        title="User menu"
      >
        {initials}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-cockpit-700 bg-cockpit-900 shadow-lg">
          <div className="border-b border-cockpit-700 px-4 py-3">
            <div className="text-sm font-medium text-cockpit-100">
              {identity.userName ?? identity.userEmail}
            </div>
            <div className="text-xs text-cockpit-400">{identity.userEmail}</div>
          </div>
          <div className="space-y-1 px-4 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-cockpit-400">Tenant</span>
              <span className="font-medium text-cockpit-200">
                {identity.tenantName ?? identity.tenantSlug}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-cockpit-400">Role</span>
              <span className="font-medium text-cockpit-200">{identity.userRole}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-cockpit-400">Auth</span>
              <span className="font-medium text-cockpit-200">{authLabel}</span>
            </div>
          </div>
          <div className="border-t border-cockpit-700 px-4 py-2">
            <button
              onClick={() => void logout()}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-cockpit-300 hover:bg-cockpit-800 focus-visible:ring-2 focus-visible:ring-accent-light focus-visible:ring-offset-2 focus-visible:ring-offset-cockpit-950 focus-visible:outline-none"
            >
              <LogOut size={12} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
