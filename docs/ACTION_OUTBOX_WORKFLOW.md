# Action Outbox Workflow

**Backlog:** BL-092, extended by BL-093
**Status:** local durable workflow plus local worker/retry/dead-letter foundation

## Purpose

The durable action/outbox workflow lets an authenticated operator prepare a local
support action, submit it for review, have an admin approve or reject it, queue
the approved action into a PostgreSQL-backed outbox, and record a mock delivery
attempt. BL-093 adds a local PostgreSQL-backed worker/process-once path,
retry scheduling, dead-letter/cancel controls, and a Delivery Operations UI.
This is not production queue infrastructure and does not perform real writeback.

## Persisted State

BL-092 adds committed Prisma migration
`prisma/migrations/20260427234000_durable_action_outbox_workflow/` with
`support_actions`, `action_outbox_items`, and `action_outbox_attempts`. Each
table is tenant-scoped and reproducible through committed Prisma migrations.
BL-093 adds committed migration
`prisma/migrations/20260428120000_outbox_worker_retry_deadletter_foundation/`
with worker lock, retry, max-attempt, redacted error, and dead-letter fields.

## Lifecycle and RBAC

Support action statuses: `draft`, `review_required`, `approved`, `queued`,
`processing`, `mock_delivered`, `failed`, `retry_scheduled`,
`dead_lettered`, `cancelled`, `rejected`.

Outbox statuses: `queued`, `processing`, `mock_delivered`, `failed`,
`retry_scheduled`, `dead_lettered`, `cancelled`.

Viewer can inspect only. Operator/support_agent can create, submit, retry, and
use the legacy manual mock-deliver path. Admin/owner can approve, reject, queue,
process once, cancel, dead-letter, and retry. In local auth mode, forged
identity headers are ignored.

## API

- `GET /support-sessions/:id/actions`
- `POST /support-sessions/:id/actions`
- `GET /actions/:id`
- `POST /actions/:id/submit-for-review`
- `POST /actions/:id/approve`
- `POST /actions/:id/reject`
- `POST /actions/:id/queue`
- `POST /actions/:id/mock-deliver`
- `POST /actions/:id/cancel`
- `GET /outbox`
- `GET /outbox/:id`
- `GET /outbox/worker/status`
- `POST /outbox/:id/retry`
- `POST /outbox/:id/cancel`
- `POST /outbox/:id/dead-letter`
- `POST /outbox/process-once`
- `POST /outbox/:id/mock-deliver`

## Mock Delivery Safety

Mock delivery responses include `mode: "mock"`, `realNetwork: false`,
`writebackEnabled: false`, `externalWriteAttempted: false`, and
`deliveryClaim: "mock_delivered"`.

Failure simulation is local and deterministic through `mockDeliveryScenario`:
`success`, `retryable_failure_once`, `retryable_failure`,
`connector_unavailable`, `validation_failure`, and `non_retryable_failure`.

No real Zammad writeback, email sending, telephony, AI provider call, external
queue-backed workflow, object storage, raw media storage, production audit
immutability, compliance claim, SSO/OAuth/SAML/OIDC, MFA, password reset, or
production deployment is implemented.

## Evidence

Case timeline includes support action and outbox lifecycle entries. Evidence
bundle JSON and Markdown include `actionOutbox` summaries with review, queued,
attempt history, retry/dead-letter timestamps, redacted failure reasons, worker
provenance, mock delivery, and safety flags. Payload summaries are redacted and
do not include connector tokens, password hashes, session tokens, raw audio, raw
screen pixels, or private credentials.

## Verification

Run:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate status
npx prisma db seed
scripts/verify_durable_action_outbox.sh
scripts/verify_outbox_worker_retry_deadletter.sh
```

See also `docs/OUTBOX_WORKER_OPERATIONS.md`.
