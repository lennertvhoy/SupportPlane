# Persistence

**Scope:** PostgreSQL persistence after BL-050, extended by BL-018 local auth  
**Last updated:** 2026-04-27

SupportPlane supports two store modes:

| Mode | Env var | Notes |
|------|---------|-------|
| Memory | `SUPPORTPLANE_STORE=memory` or unset | Test/dev fallback. Data is lost on restart. |
| PostgreSQL | `SUPPORTPLANE_STORE=postgres` | Uses Prisma with local PostgreSQL on `localhost:5434` in the verified Podman topology. |

## Local PostgreSQL commands

```bash
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
```

Resetting local data is destructive:

```bash
npx prisma migrate reset
```

## Persisted models

The current Prisma schema persists tenants, users, roles, local auth sessions, support sessions, call events, call recordings, screen observations, sharing state, ticket references, AI context packets, audit events, policy decisions, internal note drafts, and ticketing adapters.

## Auth persistence

BL-018 added:

- `User.passwordHash` for local-only seeded password authentication.
- `LocalAuthSession` with token hashes, expiry, revocation, tenant ID, and user ID.
- A composite user/session relation so a local auth session references a user in the same tenant.

Passwords and session tokens are not returned in API responses, UI, screenshots, or evidence bundle JSON.

## Limitations

- No object storage is used.
- Evidence bundles are generated on demand, not persisted as files or object-store artifacts.
- No raw screenshots, raw audio, or media blobs are stored.
- No production audit immutability or cryptographic hash chain is claimed.
