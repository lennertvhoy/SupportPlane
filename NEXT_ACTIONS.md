# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-04-30 13:35 CEST
**Execution Mode:** operating
**Max Items:** 10

## Active Work

### P1 [BL-123/124/125] Plugin Registry + Runtime Resolver + Zammad Migration — Closure

- Owner: next coding-agent session.
- Next action: capture remaining UI screenshots for registry proof; commit evidence script; update BACKLOG.md and PROJECT_STATE.yaml to mark complete.
- Exit criteria: all evidence artifacts generated (max 20), reproducible script committed, state files reconciled, clean worktree.

### P2 [BL-126] AI Provider Registry — Runtime Verification

- Owner: next coding-agent session.
- Next action: verify AI provider registry (`packages/ai/src/registry.ts`) against Ollama/Gemma cluster path; confirm `createModelGatewayFromRegistry` populates providers correctly.
- Exit criteria: AI draft suggestion uses registry-resolved provider, evidence captured, no fallback to hardcoded path unless registry empty.

## Queue Rules

- Keep this file short.
- List only active, open work.
- Remove closed items immediately.
- Every active item must reference a backlog ID like `[BL-001]`.
- Include owner, next action, and exit criteria when items exist.
