# Outbox Worker Operations

BL-093 adds a local PostgreSQL-backed worker foundation for durable action outbox rows.
It remains mock-only and local-only.

## Runtime Mode

- Worker mode: `local_mock_worker`
- Queue backend: `postgres-local-outbox`
- Delivery mode: `mock`
- Safety flags: `realNetwork=false`, `writebackEnabled=false`, `externalWriteAttempted=false`
- No NATS consumer, external broker, real Zammad writeback, email sending, telephony, or AI provider call is used.

## Lifecycle

Outbox items can move through:

```text
queued -> processing -> mock_delivered
queued -> processing -> retry_scheduled -> queued -> processing -> mock_delivered
queued -> processing -> dead_lettered
queued/retry_scheduled/failed/processing -> cancelled
dead_lettered -> queued when an admin explicitly retries
```

The worker claim writes `processing`, `workerLockId`, `workerLockedAt`,
`workerLockExpiresAt`, and `processingStartedAt`. Attempts record attempt number,
state, redacted error code/message, completion time, and mock safety flags.

## API

- `GET /outbox/worker/status` reports local worker truth and queue counts.
- `POST /outbox/process-once` claims and processes one eligible outbox item.
- `POST /outbox/:id/retry` returns failed, retry-scheduled, or dead-lettered items to `queued`.
- `POST /outbox/:id/cancel` cancels eligible local outbox work.
- `POST /outbox/:id/dead-letter` forces an eligible item into `dead_lettered`.

## RBAC

- Viewer can inspect outbox and worker status only.
- Operator/support_agent can create, submit, inspect, retry, and use the legacy manual mock-deliver path.
- Admin/owner can process once, cancel, dead-letter, approve, queue, and retry.
- Local auth mode ignores forged identity headers.
- All reads and mutations use server-side tenant scoping; cross-tenant access returns not found or forbidden.

## Failure Simulation

Action creation accepts local test-only `mockDeliveryScenario`:

- `success`
- `retryable_failure_once`
- `retryable_failure`
- `connector_unavailable`
- `validation_failure`
- `non_retryable_failure`

Failures are deterministic and do not call external services.

## Evidence And Audit

Audit events include processing started/succeeded/failed, retry scheduled/requested,
dead-lettered, cancelled, worker status checked, process-once requested, and access
denied.

Evidence bundles include action/outbox state, retry/dead-letter timestamps, redacted
failure reason, attempt history, worker provenance, and the mock safety flags. Secret-like
values, session tokens, password hashes, raw audio, and raw screen pixels must not appear
in evidence output.

## Commands

```bash
npm run status --workspace @supportplane/worker
npm run process-once --workspace @supportplane/worker
scripts/verify_outbox_worker_retry_deadletter.sh
```

Known limitation: this is not production queue infrastructure. It is a local MVP
foundation for durable processing semantics.
