# Ticket Context and Connector Safety Foundation (BL-020)

**Product:** SupportPlane  
**Scope:** BL-020 Ticket Context and Connector Safety Foundation  
**Last updated:** 2026-04-27

## Overview

BL-020 adds persistent, tenant-scoped customer identity, ticket summaries, and connector installation records to SupportPlane. This provides the data foundation for operator-facing ticket context and connector safety boundaries.

## Models

### CustomerReference

Persistent tenant-scoped customer identity linked to a `TicketingAdapter`.

- `id`: CUID primary key
- `tenantId`: scoped to tenant
- `adapterId`: linked to TicketingAdapter
- `externalCustomerId`: adapter-specific customer ID
- `name`, `email`, `phone`, `company`: contact fields
- `rawData`: adapter-specific JSON payload
- `lastSyncedAt`: last sync timestamp

**Tenant boundary:** All customer lookups enforce `tenantId`. Cross-tenant customer lookup is denied at the store layer.

**Seed data:** `dev-tenant` has Acme BVBA (`CUST-ACME-001`). `alt-tenant` has Globex (`CUST-GLOBEX-001`).

### TicketSummary

AI-generated or manual summaries linked to a `TicketReference` and optionally a `SupportSession`.

- `id`: CUID primary key
- `tenantId`: scoped to tenant
- `ticketReferenceId`: linked to TicketReference
- `sessionId`: optionally linked to SupportSession
- `summaryText`, `keyPoints`, `sentiment`: summary content
- `source`: `connector` | `ai` | `manual`
- `mockDevOnly`: defaults to `true`

**Current scope:** TicketSummary is persisted and included in evidence bundles. No dedicated API endpoint or UI panel exists yet. Dedicated TicketSummary API/UI is deferred to a future backlog item.

### ConnectorInstallation

Persistent connector configuration with safety flags and validation state.

- `id`: CUID primary key
- `tenantId`: scoped to tenant
- `name`: human-readable installation name
- `adapterType`: e.g. `zammad`
- `config`: JSON configuration object
- `secretReferenceIds`: array of secret reference IDs (not actual secrets)
- `status`: `active` | `inactive` | `error`
- `safetyFlags`: JSON object with safety settings
- `lastVerifiedAt`: last validation timestamp
- `lastError`: last error message (redacted in responses)

**Tenant boundary:** All installation lookups enforce `tenantId`. Cross-tenant installation lookup is denied at the store layer.

**Seed data:** `dev-tenant` has "Local Zammad Mock" (`conn-inst-dev-001`) with safety flags `{ maxRetries: 3, allowRealCalls: false, validateBeforeWrite: true }`.

## API Endpoints

### Customers

| Method | Endpoint | RBAC | Behavior |
|--------|----------|------|----------|
| GET | `/customers` | `customer:read` | List customer references for tenant |
| GET | `/customers/:id` | `customer:read` | Get single customer reference |

### Connector Installations

| Method | Endpoint | RBAC | Behavior |
|--------|----------|------|----------|
| GET | `/connector-installations` | `connector_installation:read` | List installations for tenant |
| GET | `/connector-installations/:id` | `connector_installation:read` | Get single installation |

| POST | `/connector-installations` | `connector_installation:write` | Create installation with mock defaults |
| PATCH | `/connector-installations/:id` | `connector_installation:write` | Update safe fields (displayName, description, status, enabled, timeout, capabilities, safetyFlags). Config secrets redacted in responses. |
| POST | `/connector-installations/:id/validate` | `connector_installation:test` | Mock validation only |
| POST | `/connector-installations/:id/test` | `connector_installation:test` | Mock test only |

## Evidence Bundle Integration

Evidence bundles include:

- `customerReferences`: array of customer summaries (redacted)
- `connectorInstallations`: array of installation summaries with safety flags (redacted)

No connector credentials, tokens, or raw secrets appear in evidence bundle exports.

## Mock-First Safety Model

- All new entities default to `mockDevOnly: true`.
- No real production Zammad, telephony, AI, or object storage is implemented.
- Connector safety flags are stored as JSON and displayed in the UI.
- Secret redaction runs on all connector config and safety flag fields before API responses and evidence bundle export.

## Audit Events

New audit event types added in BL-020:

- `customer_lookup`
- `customer_created`
- `ticket_summary_generated`
- `connector_installation_created`
- `connector_installation_updated`
- `connector_config_validated`
- `connector_config_validation_failed`
- `connector_safety_blocked`

## Environment Variables

No new required env vars. Existing vars:

- `SUPPORTPLANE_STORE=postgres` required for PrismaStore persistence
- `DATABASE_URL` required when `SUPPORTPLANE_STORE=postgres`

## Credential and Secret Handling (BL-095)

- Connector config secrets (e.g., `apiToken`, `password`) are stored as plain JSON fields in the `ConnectorInstallation.config` column **for local/mock/dev use only**.
- Secrets are redacted to `[REDACTED]` in all API GET responses and evidence bundle exports.
- This is **not production credential management**. Production deployments must use a dedicated credential broker, encrypted secret storage, or secret references (see BL-084).
- The UI shows a `•••••••• (managed server-side)` placeholder without exposing secret values.

## Known Limitations

- Customer lookup by email/phone query params is accepted by the controller but full adapter-backed lookup is not implemented.
- TicketSummary has no dedicated API endpoint or UI panel.
- All connector behavior remains mock-first.
- No production credential broker or encrypted secret storage exists.
