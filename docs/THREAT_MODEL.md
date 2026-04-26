# Threat Model

This is an initial bootstrap threat model. It must be expanded as code and
integrations are implemented.

## Primary Risks

- Prompt injection through tickets, emails, knowledge articles, or screen text.
- Model-generated requests that exceed user, tenant, device, or tool policy.
- Arbitrary shell execution or hidden tool access.
- Tenant data leakage through queries, prompts, logs, object storage, or caches.
- Raw secret exposure to models, agents, logs, or support workers.
- Unbounded screen capture on support worker machines.
- Connector writebacks without clear user intent and audit trail.
- Endpoint agent compromise or replayed commands.
- Audit log tampering.

## Baseline Controls

- Explicit AIContextPacket construction with provenance labels.
- Redaction before model calls.
- Tool allowlists and signed/validated tool manifests.
- Policy engine and approval engine before execution.
- Server-side execution gateway.
- Outbound-only endpoint agent communication by default.
- Active-window-only operator companion capture by default.
- Append-only audit events with hash chaining planned.
- Tenant scoping in every domain object and database path.

## MVP Threat Boundary

MVP 1 has no endpoint agent, no operator companion, and no real PBX. Its main
risks are tenant scoping, connector credential handling, model prompt/output
retention, Zammad writeback safety, and audit completeness.
