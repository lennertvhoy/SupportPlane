# Connector Runtime Contract

**Product:** SupportPlane  
**Scope:** BL-099 Connector Runtime Test Coverage + Documentation Hardening; updated by later sandbox slices  
**Last updated:** 2026-04-30

## Overview

The connector runtime layer began as a mock-only, tenant-scoped, auditable boundary for connector configuration validation, runtime readiness checks, and runtime resolution. Later sandbox slices add a narrow local Zammad sandbox path with OpenBao credential resolution and policy-gated internal-note writeback. Production connector behavior remains not implemented.

## Implemented Behavior (Local / Mock And Narrow Sandbox)

| Endpoint | Method | RBAC | Implemented Behavior |
|----------|--------|------|---------------------|
| `/connector-installations/:id/config-schema` | GET | `connector_installation:read` | Returns hardcoded mock-only JSON schema with `mockMode: true` const, safe fields list, rejected fields list |
| `/connector-installations/:id/validate-config` | POST | `connector_installation:test` | Validates config against mock-only safety rules: `mockMode` must be `true`, rejects secret-like keys, rejects real-network implying keys, warns on unknown fields |
| `/connector-installations/:id/runtime-readiness` | POST | `connector_installation:test` | Returns mock readiness for mock installs and sandbox readiness fields for the accepted local Zammad sandbox path. Production readiness remains false. |
| `/connector-installations/runtime/resolve` | GET | `connector_installation:read` | Returns tenant-scoped enabled installation with credential reference metadata only (no `secretRef`); mode may be `mock` or accepted local `sandbox`. |

## Mock-Only Safety Rules

### Config Validation Rules

1. `mockMode` must be `true`. Any other value returns `MOCK_MODE_REQUIRED` error.
2. Secret-like keys are rejected: `apiToken`, `apiKey`, `authToken`, `password`, `secret`, `token`, `privateKey`, `credential`, `bearer`, `zammadApiToken`, `zammadBaseUrl`, `realEndpoint`, `productionUrl`, `webhookSecret`.
3. Real-network implying keys are rejected: `baseUrl`, `endpoint`, `url`, `host`, `proxy` (except `baseUrlPlaceholder`).
4. Unknown fields produce warnings but do not fail validation.

### Runtime Readiness Rules

- `mockReady = installation.mockMode === true && installation.enabled === true`
- `realReady` is always `false`
- `realNetwork` is always `false`
- `writebackEnabled` is always `false`
- `externalWriteAttempted` is always `false`
- Warnings include: "This is a mock readiness check. No real network call was made.", "Real writeback is not implemented.", "Secret resolution is not implemented."

### Runtime Resolver Rules

- Returns the first enabled installation matching `connectorType`, or the first matching installation if none are enabled.
- Credential references include metadata only: `id`, `displayName`, `kind`, `status`, `lastValidatedAt`, `secretResolutionImplemented: false`.
- `secretRef` is never exposed.
- `mode` is always `'mock'`.

## Credential References Are Metadata Only

- `secretRef` values are local-dev opaque placeholders.
- No production credential broker exists.
- No secret resolution is implemented.
- Evidence bundles include credential reference summaries without secrets.

## No Production Writeback

- Production writeback remains blocked.
- The only accepted non-mock writeback is local Zammad sandbox internal notes behind approval, kill-switch, egress, idempotency, audit, and evidence gates.
- Public replies, production URLs, uncontrolled egress, and hidden connector writes remain blocked.

## Audit Events

The connector runtime emits these audit events:

- `connector_config_validated` — after config validation
- `connector_readiness_checked` — after runtime readiness check
- `connector_runtime_resolved` — after runtime resolver invocation

All audit events include `mockDevOnly: true` metadata.

## Tenant Isolation

- All runtime endpoints enforce `tenantId` scoping.
- Cross-tenant access returns `404 Not Found`.

## RBAC Boundaries

| Role | Config Schema | Validate Config | Runtime Readiness | Runtime Resolve |
|------|--------------|-----------------|-------------------|-----------------|
| admin | read | test | test | read |
| operator | read | test | test | read |
| viewer | read | denied (403) | denied (403) | read |

## Not Implemented

The following are explicitly not implemented and blocked by current safety rules:

- Real Zammad API calls
- Real network egress from connector runtime
- Secret reference resolution (Vault/KMS/broker)
- Production credential storage or encryption
- Dynamic connector schema generation
- Real connector health checks against external systems
- Writeback to external ticketing systems
