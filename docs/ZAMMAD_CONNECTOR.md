# Zammad Connector Documentation

**Product:** SupportPlane  
**Scope:** BL-007 Zammad connector boundary  
**Last updated:** 2026-04-29

> BL-102 truth update: the accepted runtime still treats Zammad behavior as
> mock/local only. Real Zammad sandbox read is planned under BL-107 and
> sandbox-only internal-note writeback under BL-111. Do not claim real Zammad
> read/write until those backlog items are implemented and verified against the
> local self-hosted sandbox.

## Overview

The Zammad connector is a safe, mock-first boundary for integrating SupportPlane with a Zammad ticketing instance. The accepted MVP uses only mock mode:

- **mock** (default) — deterministic, no external credentials, used for tests and local UI.
- **zammad** — historical/future adapter path. It is not accepted as the current runtime path and must not be used for production or claimed as verified real integration without a dedicated sandbox backlog slice.

## Mock mode behavior

- `createZammadAdapter('mock', adapterId)` returns `MockZammadConnectorAdapter`.
- `getTicket()` returns deterministic fixture data shaped like Zammad API output.
- `writeInternalNote()` returns `{ success: true, externalArticleId: 'mock-article-001' }`.
- No network calls are made.
- The UI shows "Mock mode", "No real writeback unless configured", and "Credentials not stored in browser".

## Future real Zammad sandbox configuration

The future sandbox path should not rely on raw env tokens as the long-term
credential model. BL-107 should prove read-only sandbox access; BL-109 should
introduce server-side OpenBao credential resolution; BL-111 should add
approval-gated sandbox-only internal-note writeback. Any temporary local env
configuration must be documented as dev-only and replaced by the resolver path.

Historical variables that may appear in older code/docs:

```bash
ZAMMAD_CONNECTOR_MODE=zammad
ZAMMAD_BASE_URL=https://zammad.example.com
ZAMMAD_API_TOKEN=your_personal_access_token
```

The adapter will attempt to connect on startup. Connection failures are recorded in status but do not crash the process.

## Required environment variables

| Variable | Default | Required for real mode |
|----------|---------|----------------------|
| `ZAMMAD_CONNECTOR_MODE` | `mock` | No |
| `ZAMMAD_BASE_URL` | — | Yes |
| `ZAMMAD_API_TOKEN` | — | Yes |

## Secret handling rules

- API tokens are **never** exposed in:
  - UI panels, responses, or audit metadata
  - Adapter metadata (`getAdapterMetadata()` strips the token)
  - Error messages (sanitized via regex replacement)
  - Browser screenshots or test output
- Tokens are passed only in the `Authorization: Token token={token}` HTTP header.
- Token-related errors are redacted before being returned or logged.

## Supported operations

| Operation | Mock | Real | Endpoint |
|-----------|------|------|----------|
| Connector status | Yes | Yes | `GET /connectors/zammad/status` |
| Connector test | Yes | Yes | `POST /connectors/zammad/test` |
| Ticket read | Yes | Yes | `POST /support-sessions/:id/zammad/ticket-context` |
| Internal note draft | Yes | Yes | `POST /support-sessions/:id/zammad/internal-note-draft` |
| Internal note writeback | Yes (mock-safe) | Yes | `POST /support-sessions/:id/zammad/internal-note-writeback` |

## Unsupported operations

- Ticket creation through this boundary.
- Ticket updates (state, priority, assignment) through this boundary.
- Full-text search through this boundary.
- Attachment upload through this boundary.
- Bulk ticket operations.

## Known assumptions (unverified)

These assumptions are based on Zammad REST API documentation and community sources. They have **not** been verified against a live Zammad instance in this slice:

- **Base URL:** The root Zammad URL (e.g. `https://helpdesk.example.com`). API routes are appended as `/api/v1/...`.
- **Authentication:** `Authorization: Token token={apiToken}` header.
- **Ticket read:** `GET /api/v1/tickets/{id}` returns JSON with `id`, `title`, `state`, `priority`, `customer_id`, `number`, `group_id`, `created_at`, `updated_at`.
- **Customer lookup:** `GET /api/v1/users/{customer_id}` returns JSON with `id`, `email`, `firstname`, `lastname`.
- **Internal note creation:** `POST /api/v1/ticket_articles` with `{ ticket_id, subject, body, type: "note", internal: true }`.
- **State normalization:** Zammad states like `new`, `open`, `pending reminder`, `pending close`, `closed`, `merged` are mapped to SupportPlane `TicketStatus` values.
- **Priority normalization:** Zammad priorities like `1 low`, `2 normal`, `3 high`, `4 very high` are mapped to SupportPlane `TicketPriority` values.

## How to test without real credentials

1. Ensure `ZAMMAD_CONNECTOR_MODE` is unset or set to `mock`.
2. Start the API: `cd apps/api && API_PORT=4110 npm run dev`
3. Start the web: `cd apps/web && npm run dev`
4. Open the Support Cockpit at `http://localhost:3200`.
5. Create a session, load any ticket ID (e.g. `TICKET-101`), generate a draft, and trigger writeback.
6. All operations are deterministic and safe.

## How to verify against a real Zammad instance later

1. Create a personal access token in your Zammad profile.
2. Set `ZAMMAD_CONNECTOR_MODE=zammad`, `ZAMMAD_BASE_URL`, and `ZAMMAD_API_TOKEN`.
3. Restart the API.
4. Use `POST /connectors/zammad/test` to verify connectivity.
5. Load a real ticket ID through the Support Cockpit.
6. Document the exact Zammad version, endpoint behavior, and any deviations from the assumptions above.
7. Update this document and add new evidence artifacts.

## Audit events

The following audit events are emitted by the connector boundary:

- `connector_status_checked` — when the status endpoint is queried.
- `connector_tested` — when the test endpoint is called.
- `zammad_ticket_loaded` — when ticket context is loaded through the connector.
- `internal_note_drafted` — when an internal note draft is created.
- `internal_note_writeback_attempted` — when writeback is triggered.
- `internal_note_writeback_succeeded` — when writeback succeeds.
- `internal_note_writeback_failed` — when writeback fails.

All events include:
- `tenantId`, `actorId`
- `connectorType`: `zammad`
- `connectorMode`: `mock` or `zammad`
- `externalTicketId` where applicable
- Sanitized error code/message on failure (no tokens)
