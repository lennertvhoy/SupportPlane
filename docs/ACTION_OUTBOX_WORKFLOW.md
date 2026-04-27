# Action Outbox Workflow

**Backlog:** BL-092
**Status:** local durable workflow foundation

## Purpose

The durable action/outbox workflow lets an authenticated operator prepare a local
support action, submit it for review, have an admin approve or reject it, queue
the approved action into a PostgreSQL-backed outbox, and record a mock delivery
attempt. This is not a production queue and does not perform real writeback.

## Persisted State

BL-092 adds committed Prisma migration
`prisma/migrations/20260427234000_durable_action_outbox_workflow/` with
`support_actions`, `action_outbox_items`, and `action_outbox_attempts`. Each
table is tenant-scoped and reproducible through committed Prisma migrations.

## Lifecycle and RBAC

Support action statuses: `draft`, `review_required`, `approved`, `queued`,
`mock_delivered`, `failed`, `cancelled`, `rejected`.

Outbox statuses: `queued`, `mock_delivered`, `failed`, `cancelled`.

Viewer can inspect only. Operator/support_agent can create, submit, cancel, and
run mock delivery. Admin/owner can approve, reject, and queue. In local auth
mode, forged identity headers are ignored.

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
- `POST /outbox/:id/retry`
- `POST /outbox/:id/mock-deliver`

## Mock Delivery Safety

Mock delivery responses include `mode: "mock"`, `realNetwork: false`,
`writebackEnabled: false`, `externalWriteAttempted: false`, and
`deliveryClaim: "mock_delivered"`.

No real Zammad writeback, email sending, telephony, AI provider call, external
queue-backed workflow, object storage, raw media storage, production audit
immutability, compliance claim, SSO/OAuth/SAML/OIDC, MFA, password reset, or
production deployment is implemented.

## Evidence

Case timeline includes support action and outbox lifecycle entries. Evidence
bundle JSON and Markdown include `actionOutbox` summaries with review, queued,
attempt, mock delivery, and safety flags. Payload summaries are redacted and do
not include connector tokens, password hashes, session tokens, raw audio, raw
screen pixels, or private credentials.

## Verification

Run:

```bash
npx prisma validate
npx prisma generate
npx prisma migrate status
npx prisma db seed
scripts/verify_durable_action_outbox.sh
```
