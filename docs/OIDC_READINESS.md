# OIDC Readiness (BL-083)

## Current Truth

- **Local auth only**: The only working authentication path is `local` (email + password against the seeded Postgres database) and `dev` (header-based identity for development).
- **OIDC target**: Keycloak local sandbox manifests are provided under `infra/kubernetes/local-podman/integrations/keycloak/`. The local pod has been verified Running/Ready after increasing local sandbox resources and moving health probes to Keycloak's management port. These manifests are **not production hardened**.
- **No browser OIDC login flow**: Passport OIDC strategy, redirect handlers, and callback routes are **not implemented**.
- **No Prisma schema changes**: No migration was added for OIDC sessions, service accounts, or short-lived tokens.

## What Is Implemented

1. **Keycloak Local Sandbox**
   - Kubernetes manifests for Keycloak 25.0 + Postgres 16-alpine.
   - ConfigMap, Secret, Deployment, Service, Postgres PVC/Deployment/Service.
   - Resource/probe settings support the local sandbox: 1Gi request, 1536Mi limit, startup probe, and management health probes on port 9000.
   - Marked with honest comments: _Local sandbox only. Not production hardened._

2. **OIDC Configuration Hooks**
   - `AuthService.getOidcConfig()` reads `OIDC_ISSUER_URL`, `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_REDIRECT_URI`, `OIDC_SCOPES`.
   - `AuthService.validateOidcConfig()` performs basic URL-well-formedness checks.
   - `GET /auth/oidc/config` returns metadata **without secrets**.
   - `GET /health` includes `oidcReady: boolean` when env vars are present.

3. **MFA Hooks**
   - `AuthService.getMfaHookStatus()` returns `{ mfaHookAvailable: true, mfaEnforced: false, mfaRequired: false }`.
   - `GET /auth/mfa/status` exposes this status honestly labeled as "hook only".
   - `GET /health` includes `mfaHookAvailable: true`.

4. **Service Account Concept**
   - `GET /auth/service-accounts` returns an empty list with documentation metadata.
   - `ServiceAccountGuard` validates `X-Service-Token` header format and sets a conceptual `currentIdentity`.
   - `current-identity.middleware.ts` service-auth path remains intact; comment added about token redaction.

5. **Short-Lived Token Concept**
   - `ShortLivedToken` interface is defined in `auth.types.ts`.
   - No persistent storage or hashing logic is wired; documented as a future gap.

6. **Web UI Auth Mode Awareness**
   - `AuthIdentity` and `api.me()` types accept `'oidc'`.
   - Health info badge in the cockpit uses accent styling when `authMode === 'oidc'`.

## Production Gaps

| Gap                                                         | Status          |
| ----------------------------------------------------------- | --------------- |
| Passport OIDC strategy with browser redirect/callback       | Not implemented |
| OIDC session persistence (Prisma table + migration)         | Not implemented |
| Service account CRUD and token storage                      | Not implemented |
| Short-lived token DB table, hashing, and expiry enforcement | Not implemented |
| MFA enforcement logic (TOTP/WebAuthn verification)          | Not implemented |
| Keycloak realm bootstrap automation                         | Not implemented |
| TLS/HTTPS for Keycloak and callback URLs                    | Not implemented |
| Secret rotation and token revocation endpoints              | Not implemented |

## Honest Summary

BL-083 is **partially complete**: local Keycloak manifests are deployed and Ready, OIDC config endpoints are wired, and MFA/service-account hooks are in place. The **full OIDC login flow is intentionally not claimed** because no Passport strategy or browser redirect handling exists.
