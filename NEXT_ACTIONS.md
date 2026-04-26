# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-04-26 18:40 CEST
**Execution Mode:** operating
**Max Items:** 10

## Active Work

### P0 [BL-001] Initialize the application monorepo scaffold
Owner: coding agent
Next: create the SupportPlane monorepo skeleton with apps, packages, infra, package manager config, formatting, and baseline health/version contract
Exit: repo has app/package directories, install/test commands, generated baseline contracts, and normal hygiene checks pass

### P0 [BL-002] Define MVP 1 contracts and database model
Owner: coding agent
Next: implement shared TypeScript contract schemas for SupportSession, AIContextPacket, AuditEvent, TicketingAdapter, and initial Prisma schema
Exit: contracts compile, schema validates, and tests cover tenant scoping and core object shape

### P1 [BL-003] Build mock-first ticket-aware API slice
Owner: coding agent
Next: create NestJS API endpoints for sessions, ticket context loading through a mock connector, AI context packet creation, and audit event append
Exit: API smoke test proves session creation, context packet generation, and audit logging without external credentials

## Queue Rules

- Keep this file short.
- List only active, open work.
- Remove completed items immediately.
- Every active item must reference a backlog ID like `[BL-001]`.
- Include owner, next action, and exit criteria when items exist.
