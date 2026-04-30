# 02 Auth Architecture Proof (BL-083)

## Files Created / Modified

- `apps/api/src/auth/auth.types.ts` — Added `oidc` auth mode, `OidcConfig`, `ServiceAccount`, `MfaHookStatus`, `ShortLivedToken`.
- `apps/api/src/auth/auth.service.ts` — Added `getOidcConfig`, `validateOidcConfig`, `getServiceAccountHooks`, `getMfaHookStatus`.
- `apps/api/src/auth/auth.controller.ts` — Added `GET /auth/oidc/config`, `GET /auth/mfa/status`, `GET /auth/service-accounts`.
- `apps/api/src/auth/service-account.guard.ts` — New guard for `X-Service-Token` validation.
- `apps/api/src/auth/current-identity.middleware.ts` — Added redaction comment.
- `apps/api/src/health/health.controller.ts` — Added `oidcReady` and `mfaHookAvailable`.
- `apps/web/lib/api.ts` — Expanded `authMode` union to include `'oidc'`.
- `apps/web/app/page.tsx` — Health badge styling for OIDC mode.
- `docs/OIDC_READINESS.md` — Architecture and gap documentation.

## Key Code Snippets

### OIDC Config Service Hook
```ts
getOidcConfig(): OidcConfig | null {
  const issuerUrl = process.env['OIDC_ISSUER_URL'];
  const clientId = process.env['OIDC_CLIENT_ID'];
  const clientSecret = process.env['OIDC_CLIENT_SECRET'];
  const redirectUri = process.env['OIDC_REDIRECT_URI'];
  const scopesEnv = process.env['OIDC_SCOPES'];
  if (!issuerUrl || !clientId || !redirectUri) return null;
  return {
    issuerUrl,
    clientId,
    clientSecret: clientSecret ?? '',
    redirectUri,
    scopes: scopesEnv ? scopesEnv.split(',').map(s => s.trim()) : ['openid', 'profile', 'email'],
  };
}
```

### Service Account Guard (Conceptual)
```ts
const token = req.headers['x-service-token'];

if (typeof token !== 'string' || token === 'undefined' || token.length <= 10) {
  throw new UnauthorizedException({
    error: 'invalid_service_token',
    message: 'Service token invalid or expired',
  });
}
// No DB lookup; format validation only
req.currentIdentity = { authMode: 'service', roles: ['service'], permissions: [...], ... };
```

### Health Controller additions
```ts
oidcReady: !!(process.env['OIDC_ISSUER_URL'] && process.env['OIDC_CLIENT_ID']),
mfaHookAvailable: true,
```

## Honest Status

- **Real**: Type contracts, config endpoints, health flags, Kubernetes manifests.
- **Conceptual / Hook-only**: Service account guard (no DB), short-lived tokens (no storage), MFA status (no enforcement), OIDC config (no Passport strategy or browser flow).
- **Not implemented**: Full OIDC login redirect, callback handling, token persistence, Prisma migrations.
