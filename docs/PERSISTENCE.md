# Persistence

**Scope:** PostgreSQL persistence after BL-050, extended by BL-018 local auth and BL-093 outbox worker state
**Last updated:** 2026-04-28

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

The current Prisma schema persists tenants, users, roles, local auth sessions, support sessions, call events, call recordings, screen observations, sharing state, ticket references, AI context packets, audit events, policy decisions, internal note drafts, action/outbox workflow records, and ticketing adapters.

BL-092 action/outbox persistence is represented by `support_actions`,
`action_outbox_items`, and `action_outbox_attempts` in
`prisma/migrations/20260427234000_durable_action_outbox_workflow/`. These tables
are local/mock workflow state only; they are not a production queue and do not
perform external writeback.

BL-093 extends `action_outbox_items` and `action_outbox_attempts` through
`prisma/migrations/20260428120000_outbox_worker_retry_deadletter_foundation/`.
The added fields persist local worker claim locks, retry scheduling, max attempts,
redacted error codes/messages, cancellation, and dead-letter state. The worker
uses PostgreSQL rows only; NATS is not consumed by this slice.

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
- BL-093 worker state is local MVP processing state, not production queue infrastructure.
