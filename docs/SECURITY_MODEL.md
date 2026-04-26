# Security Model

SupportPlane must be safe by design because it joins AI assistance with IT
operations. The baseline rule is deterministic control around any action.

## Identity And Authorization

Planned identity model:

- OIDC-ready auth
- MFA support
- session management
- service accounts for connectors
- short-lived tokens
- device identity keys

Planned roles:

- Tenant Owner
- Admin
- Support Manager
- Senior Support
- Junior Support
- Auditor
- Read-only Viewer
- External Customer Contact

Authorization uses RBAC for general capability and ABAC for specific action
decisions on a tenant, device, session, risk level, and approval state.

## Tenant Isolation

Every tenant-scoped object must include `tenant_id`. Query paths must enforce
tenant scope from the first database slice. Later hardening can include
PostgreSQL row-level security, tenant-scoped object storage paths, and
per-tenant encryption keys.

## Secrets

- AI never sees raw secrets.
- Endpoint agents never receive connector credentials.
- Connector credentials are encrypted and referenced by ID.
- Tool execution uses server-side credential brokers.

## Tool Execution

No arbitrary shell execution in v1. The endpoint agent executes fixed,
manifest-defined implementations only after the server-side policy and approval
chain allows the request.

Allowed MVP tool risk:

- `read_only`
- `low` with approval support

Blocked in MVP:

- arbitrary shell
- critical actions
- unrestricted remote execution

## Audit

Audit events are append-only and should support hash chaining. Important events
include AI suggestions, policy decisions, approvals, blocked actions, tool
execution, connector writebacks, evidence generation, and admin changes.
