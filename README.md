# SupportPlane

SupportPlane is a governed AI support cockpit for IT teams and MSPs.

It is designed around one principle: the AI is helpful, but it is not the
authority. SupportPlane unifies tickets, calls, screen context, endpoint
diagnostics, remote support activity, and knowledge into governed
`SupportSession` workflows where policy, approvals, tool manifests, execution
gateways, and audit logs decide what is allowed.

## Current State

This repository is in operating mode after bootstrap. It has product state,
architecture docs, backlog, and active next actions, but no application runtime
exists yet.

The first target is MVP 1: a ticket-aware AI cockpit with:

- Zammad connector boundary
- SupportSession
- AIContextPacket
- AI chat
- ticket summary
- draft internal note
- note writeback path
- audit log

## Architecture

Planned monorepo structure:

```text
apps/
  web/                 Next.js support cockpit
  api/                 NestJS API
  worker/              async jobs and evidence generation
  operator-companion/  later Tauri desktop companion
  endpoint-agent/      later Go endpoint agent
packages/
  contracts/
  policy/
  connectors/
  ai/
  audit/
  ui/
infra/
  docker-compose/
  kubernetes/
  terraform-later/
```

See `docs/ARCHITECTURE.md` for the current baseline.

## Safety Model

The authority chain is:

```text
user role -> tenant policy -> device policy -> tool manifest -> risk level
-> approval rules -> audit rules -> execution gateway
```

The AI may reason, summarize, suggest, draft, and request actions. It must not
directly execute privileged work, receive raw secrets, invent tools, or bypass
policy, approval, and audit.

See `docs/SECURITY_MODEL.md` and `docs/AI_GOVERNANCE.md`.

## Development Workflow

Read order for coding sessions:

1. `AGENTS.md`
2. `STATUS.md`
3. `PROJECT_STATE.yaml`
4. `PROJECT_DNA.yaml`
5. `NEXT_ACTIONS.md`

Use `BACKLOG.md` for roadmap IDs and `WORKLOG.md` for completed work history.
The completed planning backlog is ready for the CTO/coding-agent loop; use
`prompts/OPERATING_LOOP_START_PROMPT.md` to start that workflow from a fresh CTO
chat and a fresh coding-agent session.

Run documentation hygiene checks after state/doc changes:

```bash
python3 scripts/check_state_docs.py
```

Before accepting any user-facing behavior, prove runtime identity: repo path,
branch, HEAD, process/container, endpoint, rebuild status, duplicate runtime
check, and evidence artifact.

## First Implementation Slice

Start with `NEXT_ACTIONS.md`, currently:

- `[BL-001]` initialize the monorepo scaffold
- `[BL-002]` define MVP 1 contracts and database model
- `[BL-003]` build the mock-first ticket-aware API slice

No external integration should be claimed as implemented until it is directly
verified against a real service or a controlled fixture.
