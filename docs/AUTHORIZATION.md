# Authorization And Local Auth

**Scope:** BL-018 local MVP identity, tenant boundary, and RBAC foundation  
**Last updated:** 2026-04-27

## Auth modes

SupportPlane now has two explicit local auth modes:

| Mode | Env var | Behavior |
|------|---------|----------|
| Dev headers | `SUPPORTPLANE_AUTH_MODE=dev` | Preserves old development headers: `x-tenant-id`, `x-user-id`, optional `x-user-role`. This is dev-only and not authenticated. |
| Local auth | `SUPPORTPLANE_AUTH_MODE=local` | Requires login through `POST /auth/local/login` and resolves user, tenant, roles, and permissions from PostgreSQL. Arbitrary identity headers are ignored. |

The PostgreSQL MVP browser proof uses:

```bash
SUPPORTPLANE_STORE=postgres
SUPPORTPLANE_AUTH_MODE=local
```

## Seeded local users

All seeded local demo users use the local-only password:

```text
supportplane-demo
```

These are development credentials only.

| Tenant slug | User | Role |
|-------------|------|------|
| `dev-tenant` | `admin@supportplane.local` | `admin` |
| `dev-tenant` | `operator@supportplane.local` | `operator` |
| `dev-tenant` | `viewer@supportplane.local` | `viewer` |
| `alt-tenant` | `admin@alt.supportplane.local` | `admin` |
| `alt-tenant` | `operator@alt.supportplane.local` | `operator` |

## Role model

- `admin` has all local MVP permissions.
- `operator` can create and work support sessions, calls, observations, evidence bundles, and tenant audit reads needed for the local demo.
- `viewer` can inspect sessions, calls, evidence, audit, and connector status, but cannot create sessions or approve operator work.

RBAC is enforced server-side in API services/controllers. The UI also shows role affordances, but hidden or disabled controls are not the security boundary.

## What is real

- PostgreSQL-backed local users, roles, password hashes, and sessions.
- Login, logout, and `/auth/me`.
- HTTP-only local session cookie.
- Server-side actor/tenant resolution in local auth mode.
- Server-side RBAC checks for support sessions, calls, recordings, telephony, screen observations, context packets, evidence bundles, audit reads, and connector status.
- Tenant-scoped store access remains enforced by tenant ID.
- Audit events are written for login, logout, failed login when a user record is found, tenant boundary denials, and normal support workflow actions.

## What is not real

- No SSO/OAuth/SAML/OIDC.
- No MFA, password reset, production password policy, account lockout, rate limiting, or hardened session management.
- No compliance certification.
- Audit integrity hashes remain placeholders, not production immutable/tamper-evident audit.
- Dev-header auth mode remains available only for tests and old development workflows.

## Verification

Run PostgreSQL/local mode first, then:

```bash
scripts/verify_local_auth_rbac.sh
```

The script verifies valid login, invalid login, logout/session invalidation, RBAC denial, cross-tenant denial, forged-header resistance in local mode, and absence of auth secret material in evidence bundle output.
