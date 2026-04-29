# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-04-29 21:05 CEST
**Execution Mode:** operating
**Max Items:** 10

## Active Work

### P1 [BL-108] Ollama host-call repair

- Owner: next coding-agent session.
- Next action: make the cluster API complete a host-controlled Ollama model call through `OLLAMA_BASE_URL`, or document the exact host/network/model blocker with repair evidence.
- Exit criteria: provider metadata shows `provider=ollama`, `providerMode=local`, `fallbackUsed=false`, `noCloudCall=true`, and `autonomousSend=false` from the running cluster.

### P2 [BL-111] Sandbox-only Zammad internal note writeback

- Owner: future coding-agent session.
- Next action: implement one approval-gated internal note writeback to the local Zammad sandbox only, after BL-108 host-call repair or an explicit CTO decision to proceed with fallback-only AI.
- Exit criteria: allowed sandbox writeback, blocked/kill-switch path, idempotency, no-secret proof, browser evidence, and explicit no-production/non-public-reply boundary.

## Queue Rules

- Keep this file short.
- List only active, open work.
- Remove closed items immediately.
- Every active item must reference a backlog ID like `[BL-001]`.
- Include owner, next action, and exit criteria when items exist.
