# BL-128: osTicket Real Integration Triage

**Date:** 2026-04-30
**Scope:** Research osTicket deployability and API suitability for SupportPlane connector integration.
**Constraint:** Do not deploy; research and decision only.

---

## 1. Executive Summary

**Recommendation: BLOCK BL-128.** osTicket (current stable v1.x) cannot satisfy SupportPlane's read-ticket/read-customer integration requirements. Two hard blockers exist:

1. **No read API** — osTicket v1.x only supports ticket *creation* via HTTP API. Listing tickets, reading ticket details, and reading users/customers is not exposed.
2. **No PostgreSQL support** — osTicket v1.x requires MySQL/MariaDB. SupportPlane's cluster is PostgreSQL-only. Adding a second RDBMS engine increases operational surface and contradicts the existing single-store topology.

Additionally, there is no official osTicket container image, which introduces supply-chain and maintenance risk.

---

## 2. osTicket Deployability Research

### 2.1 Official Docker Image

**Finding: None exists.**

- osTicket maintainers confirmed in a [GitHub issue comment (2022)](https://github.com/osTicket/osTicket/issues/6050) and an [osTicket forum post (2021)](https://forum.osticket.com/d/99645-official-docker-image) that **there is no official Docker image** and none of the core maintainers use Docker.
- The DockerHub namespace `osticket/osticket` is a third-party community image (source: `pi0/osticket-docker`), not maintained by the osTicket project.
- Other community images exist (`campbellsoftwaresolutions/osticket`, `tiredofit/osticket`, `ppcm/osticket`) but have sporadic maintenance and no upstream guarantee.

### 2.2 Database Requirements

**Finding: MySQL/MariaDB only.**

- osTicket v1.x prerequisites: Apache/IIS, PHP 8.2–8.4, **MySQL 5.5+ or MariaDB**.
- [osTicket FAQ](https://osticket.com/faq/) lists MySQL as a hard requirement.
- A [May 2024 forum reply from osTicket staff](https://forum.osticket.com/d/104832-postgresql-instead-of-mysql-for-installation) states: *"no, we only support MySQL and MariaDB databases at this time. We are currently working on v2.0 which will support PostgreSQL and other database backends."*
- osTicket 2.0 (announced March 2026 on [next.osticket.com](https://next.osticket.com/)) is planned to use Laravel and support PostgreSQL, but it is **not released** and no GA timeline is published.

### 2.3 Kubernetes Deployment Complexity

Deploying osTicket in the existing `supportplane-integrations` namespace would require:

1. **MySQL/MariaDB StatefulSet** — new PVC, Secret, Service, and backup policy, or reuse of an existing MariaDB instance (none exists in cluster).
2. **Web / PHP-FPM container** — unofficial image with nginx or Apache sidecar.
3. **Cron container** — osTicket requires periodic cron jobs for email fetching and ticket cleanup. Some community images split this into a separate image (`ppcm/osticket-cron`).
4. **Setup wizard** — osTicket requires a web-based installation wizard to create the initial admin account and database schema, which is not fully automatable in the same way as Zammad's init container.
5. **Ingress / Service** — new Service and potential Ingress rule.

**Estimated effort:** 2–4 hours for a one-off local deployment, but ongoing maintenance burden is non-trivial because the image is unofficial and PHP-version compatibility must be tracked manually.

**Comparison:** Zammad has an official image (`zammad/zammad:6.4.1-1`), documented init-container patterns, and a single-container railsserver that fits neatly into a StatefulSet. osTicket does not.

---

## 3. osTicket API Suitability Research

### 3.1 Official API Documentation

Source: [osTicket API Docs](https://docs.osticket.com/en/latest/Developer%20Documentation/API%20Docs.html)

> "The osTicket API is implemented as (somewhat) simple XML or JSON over HTTP. **For now, only ticket creation is supported**, but eventually, all resources inside osTicket will be accessible and modifiable via the API."

### 3.2 Available Endpoints

| Endpoint | Method | Purpose | Supported |
|----------|--------|---------|-----------|
| `/api/tickets.json` | POST | Create ticket | Yes |
| `/api/tickets.xml` | POST | Create ticket | Yes |
| `/api/tickets.email` | POST | Create ticket via email | Yes |
| `/api/tasks/cron` | POST | Trigger cron | Yes |
| `GET /api/tickets.*` | GET | List tickets | **No** |
| `GET /api/tickets/{id}.*` | GET | Read ticket details | **No** |
| `GET /api/users.*` | GET | Read customers/users | **No** |

### 3.3 Authentication

- API keys are created in the osTicket Admin Panel under **Manage → API Keys**.
- Keys are **tied to source IP addresses**. The remote IP of the HTTP client must match the whitelisted IP.
- In Kubernetes, where pod IPs are ephemeral and egress may pass through NAT, IP-based whitelisting is fragile. It requires either:
  - A stable egress NAT IP (not guaranteed in Kind/Podman local clusters), or
  - Running osTicket behind a reverse proxy that provides `X-Forwarded-For` and trusting that header.

This is workable but adds operational friction compared to token-based auth (e.g., Zammad's `Authorization: Token ...`).

### 3.4 Gap vs. SupportPlane Adapter Contract

The existing `OsTicketAdapterFactory` in `packages/connectors/src/osticket-adapter-factory.ts` advertises:

```ts
readonly capabilities = ['read_tickets', 'read_customers'];
```

osTicket v1.x **cannot fulfill either capability** via its HTTP API. The only available operation is `create_ticket` (write, not read).

---

## 4. Decision

### 4.1 Verdict

**BLOCK BL-128.** Keep status as `blocked/planned`.

### 4.2 Exact Blockers

| Blocker | Severity | Details |
|---------|----------|---------|
| **B1: No read API** | Hard | osTicket v1.x HTTP API supports only ticket creation. No endpoints exist to list tickets, read ticket details, or read users/customers. SupportPlane's adapter contract requires `read_tickets` and `read_customers`. |
| **B2: No PostgreSQL support** | Hard | osTicket v1.x requires MySQL/MariaDB. SupportPlane's cluster topology is PostgreSQL-only. Adding a second RDBMS is out of scope for BL-128 and increases operational surface. |
| **B3: No official container image** | Risk | All available Docker images are community-maintained and unofficial. No upstream security patches or version guarantees. |

### 4.3 Conditions for Unblocking

BL-128 can be reconsidered when **either** of the following becomes true:

1. **osTicket 2.0 GA release** with:
   - A published REST API that supports `GET` operations on tickets and users.
   - Official PostgreSQL support.
   - An official, maintained container image (or a Helm chart).
2. **Alternative integration path** identified, such as:
   - Direct database reads (not recommended — couples SupportPlane to osTicket schema, bypasses business logic, and creates a security boundary violation).
   - A mature, community-maintained osTicket plugin that exposes a read REST API.

### 4.4 Recommended Next Step

- **Keep the existing `OsTicketAdapterFactory` as a fixture-backed stub.** It already returns deterministic fixture data and is correctly labeled `fixtureBacked: true`.
- **Update `BACKLOG.md` and `PROJECT_STATE.yaml`** to mark BL-128 as `blocked` with blockers B1, B2, B3 explicitly listed.
- **Do not allocate implementation time** to a real osTicket integration until osTicket 2.0 is generally available and its API capabilities are verified.

---

## 5. Research Sources

1. osTicket official API documentation — `https://docs.osticket.com/en/latest/Developer%20Documentation/API%20Docs.html`
2. osTicket Tickets API documentation — `https://docs.osticket.com/en/latest/Developer%20Documentation/API/Tickets.html`
3. osTicket GitHub issue #6050 — maintainer comment: "There is no official docker image available at this time."
4. osTicket Forum — "Official Docker image?" (Jul 2021) — moderator confirmation of no official image.
5. osTicket Forum — "PostgreSQL instead of MySQL for installation" (May 2024) — staff confirmation of MySQL/MariaDB-only support.
6. osTicket 2.0 announcement — `https://next.osticket.com/` (Mar 2026) — mentions future PostgreSQL and API-First support, but no GA date.
7. Community Docker images reviewed: `pi0/osticket-docker`, `CampbellSoftwareSolutions/docker-osticket`, `tiredofit/docker-osticket`, `PPCM/docker-osticket`.

---

## 6. Honesty Notes

- No osTicket container was deployed during this triage.
- No runtime verification of the API was performed because the documentation explicitly states read operations are unsupported.
- The assessment of osTicket 2.0 is based on marketing/announcement pages, not a released product. Dates and capabilities may change.
