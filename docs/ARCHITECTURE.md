# SupportPlane Architecture

SupportPlane is a governed AI support cockpit for IT teams and MSPs. The core
aggregate is `SupportSession`, which binds tickets, calls, customer/device
context, AI conversation, tool requests, approvals, audit events, and evidence
into one timeline.

## Core Principle

The AI is not the authority. The authority chain is:

```text
user role -> tenant policy -> device policy -> tool manifest -> risk level
-> approval rules -> audit rules -> execution gateway
```

AI can summarize, reason, suggest, draft, and request actions. System policy
decides what is allowed.

## Planned Applications

- `apps/web`: Next.js cockpit for support sessions, ticket context, call console, device context, evidence bundles, and admin.
- `apps/api`: NestJS backend for auth, tenancy, sessions, AI orchestration, policy, connectors, approvals, audit, and evidence.
- `apps/worker`: async jobs, connector sync, model/background work, and evidence generation.
- `apps/operator-companion`: later Tauri desktop companion for explicit active-window screen context on the support worker machine.
- `apps/endpoint-agent`: later Go agent for outbound-only registration, heartbeat, read-only diagnostics, and approved tools.

## Shared Packages

- `packages/contracts`: OpenAPI schemas, event schemas, generated clients, and shared TypeScript types.
- `packages/policy`: RBAC, ABAC, tool risk evaluation, and approval rules.
- `packages/connectors`: Zammad, GLPI, Asterisk, MeshCentral, and mock connectors.
- `packages/ai`: context builder, redaction, prompt templates, model gateway, and output parsers.
- `packages/audit`: audit event types, hash-chain helpers, and evidence bundle logic.
- `packages/ui`: shared web UI components.

## Data Plane

- PostgreSQL for transactional state.
- pgvector later for knowledge retrieval when needed.
- NATS for events and async work.
- MinIO locally and S3-compatible object storage later for evidence artifacts.
- OpenTelemetry for traces/metrics/log correlation.

## MVP Sequence

1. MVP 1: ticket-aware AI cockpit.
2. MVP 2: simulated incoming call workflow.
3. MVP 3: operator companion screen context.
4. MVP 4: endpoint agent read-only diagnostics.
5. MVP 5: approval-gated low-risk remediation.

## First Demo Story

A customer calls about VPN problems. SupportPlane recognizes the caller, loads
Zammad tickets, creates a SupportSession, builds an AIContextPacket, gives the
support worker a briefing, later adds screen and endpoint context, drafts a
resolution note, writes it back, and exports an evidence bundle.
