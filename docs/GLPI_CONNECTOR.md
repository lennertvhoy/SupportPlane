# GLPI Connector

**Status:** Real sandbox (BL-069 accepted)
**Last Verified:** 2026-05-03

## Overview

SupportPlane integrates with GLPI (ITSM/IT asset management) as a real sandbox connector. The connector uses the GLPI REST API (v2 /apirest.php/) with Basic auth for session initialization and Session-Token for subsequent requests.

## Current Capabilities

- **Read tickets** (`read_tickets`): Fetch GLPI ticket details by ID via `GET /apirest.php/Ticket/:id`
- **Read customers** (`read_customers`): Fetch GLPI user details by ID via `GET /apirest.php/User/:id`
- **Write notes**: Not implemented (read-only in this slice)

## Sandbox Deployment

- **K8s StatefulSet**: `glpi-0` in `supportplane-integrations` namespace (2/2: GLPI + MariaDB)
- **Internal DNS**: `glpi.supportplane-integrations.svc.cluster.local:80`
- **API user**: `sp-api` (Super-Admin, sandbox dev only)
- **Test ticket**: ID 1, "VPN connection issue"

## Connector Status

Authenticated connector-status (`GET /connectors/status`):
- Mode: `configured`
- Transport: `real`
- Credential source: `env`
- Error code: `OK`
- Capabilities: `read_tickets`, `read_customers`

## API Endpoints

- `POST /support-sessions/:id/glpi/ticket-context` — Load GLPI ticket into a SupportPlane session
  - Body: `{ "externalTicketId": "1" }`
  - Returns: session, ticket reference, and AI context packet with provenance

## Configuration

- `GLPI_BASE_URL`: GLPI instance base URL (set in K8s ConfigMap)
- `GLPI_API_TOKEN`: GLPI API credentials in `username:password` format (set in K8s ConfigMap)
- Format: Basic auth for `initSession`, Session-Token header for subsequent requests

## Adapter Implementation

- **HTTP Client**: `FetchGlpiHttpClient` (`packages/connectors/src/glpi-http-client.ts`)
- **Adapter**: `GlpiConnectorAdapter` (`packages/connectors/src/glpi-adapter.ts`)
- **Factory**: `GlpiAdapterFactory` (`packages/connectors/src/glpi-adapter-factory.ts`)

## Safety Gates

- Read-only by design (writeback returns error)
- Egress policy allowlisted to `glpi.supportplane-integrations.svc.cluster.local` only
- No raw credentials in API responses, logs, or evidence
- Sandbox dev credentials only (not production)

## Known Limitations

- Writeback not implemented (read-only adapter)
- No ticket creation or mutation through this boundary
- Credentials stored as env vars in K8s ConfigMap (local sandbox only)
- No OpenBao credential resolution (uses env vars directly)
