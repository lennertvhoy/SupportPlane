# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-04-29 17:15 CEST
**Execution Mode:** operating
**Max Items:** 10

## Active Work

### P1 [BL-107] Zammad sandbox bootstrap and real read connector

- Owner: next coding-agent session.
- Next action: seed deterministic Zammad customer/ticket data and implement real sandbox read connector with provenance.
- Exit criteria: SupportPlane reads customer/ticket from real Zammad sandbox, with no writeback claim.

### P2 [BL-108] Ollama local AI provider integration

- Owner: future coding-agent session.
- Next action: integrate host-controlled Ollama as local provider for drafts/summaries with model metadata and no cloud calls.
- Exit criteria: local provider metadata visible, deterministic test fallback labeled.

### P3 [BL-109] OpenBao credential resolver foundation

- Owner: future coding-agent session.
- Next action: server-side placeholder resolution through OpenBao with disable path and no raw secret exposure.
- Exit criteria: resolver returns metadata only, no token in API/UI/evidence/logs.

### P4 [BL-110] NATS JetStream durable worker/outbox bridge

- Owner: future coding-agent session.
- Next action: bridge outbox processing to durable streams/consumers with idempotency, retry, dead-letter.
- Exit criteria: durable stream, restart survival, worker status UI proof.

## Queue Rules

- Keep this file short.
- List only active, open work.
- Remove closed items immediately.
- Every active item must reference a backlog ID like `[BL-001]`.
- Include owner, next action, and exit criteria when items exist.
