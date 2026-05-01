# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-05-01 13:00 CEST
**Execution Mode:** operating
**Max Items:** 10

## Active Work

- [BL-130/BL-131/BL-132/BL-133] **Knowledge retrieval hardening and connector real-instance enablement**
  - Owner: future slice
  - Next action: pgvector extension in PostgreSQL for semantic search; real GLPI/MeshCentral/Fortinet instance connections with credential references.
  - Exit criteria: `POST /knowledge/retrieve` returns semantic results with `pgvectorEnabled: true`; at least one real connector (GLPI or MeshCentral) reads live data.

- [BL-065] **Low-risk remediation end-to-end result**
  - Owner: future remediation hardening slice
  - Next action: safely implement at least one low-risk remediation (e.g., flush DNS) so it executes end-to-end after approval and returns a real result.
  - Exit criteria: Approved remediation completes with result proof in API/browser evidence.

- [BL-133] **Windows real-runner verification and packaging**
  - Owner: future Windows hardening slice
  - Next action: real Windows runner CI harness or manual verification on Windows host.
  - Exit criteria: Agent runs on Windows, registers, heartbeat, diagnostics proven on real Windows runtime.

## Queue Rules

- Keep this file short.
- List only active, open work.
- Remove closed items immediately.
- Every active item must reference a backlog ID like `[BL-001]`.
- Include owner, next action, and exit criteria when items exist.
