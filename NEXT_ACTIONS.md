# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-05-03 11:40 CEST
**Execution Mode:** operating
**Max Items:** 10

## Active Work

- [BL-073/BL-074] **Knowledge retrieval hardening**
  - Owner: future slice
  - Next action: add a reproducible pgvector-enabled PostgreSQL path with vector column/search, or extend ingestion while preserving the current explicit lexical fallback reason.
  - Exit criteria: `POST /knowledge/retrieve` returns semantic/hybrid results with `pgvectorEnabled: true` from a proven pgvector database, or remains explicitly lexical with a current unavailable reason.

- [BL-069/BL-071/BL-072/BL-127] **Connector real-instance enablement**
  - Owner: future connector slice
  - Next action: connect at least one real GLPI, MeshCentral, Fortinet, or osTicket instance through credential references and fail-closed configuration.
  - Exit criteria: at least one connector reads live data from a real instance with no secrets exposed and with honest transport/status labels.

- [BL-065] **Broader low-risk remediation coverage**
  - Owner: future remediation hardening slice
  - Next action: add a second safe low-risk remediation or real Windows flush-DNS proof while keeping fixed templates, policy gating, approval gating, and captured results.
  - Exit criteria: More than one low-risk remediation path is proven end-to-end, or Windows flush DNS is proven on a real Windows runner with browser/API evidence.

- [BL-130/BL-131/BL-132/BL-133] **Windows first-class endpoint completion**
  - Owner: future Windows hardening slice
  - Next action: run the fixed service/software collectors and packaging scaffold on a real Windows host or Windows CI runner; capture registration, heartbeat, diagnostic, and policy-denial proof.
  - Exit criteria: agent runs on actual Windows, registers, heartbeats, diagnostics and policy enforcement are proven, and unsupported remediation remains honestly labeled unless safely implemented.

- [BL-135] **Per-doc content audit and full rewrite**
  - Owner: future slice
  - Next action: perform line-by-line audit of every doc in docs/* against current BACKLOG.md truth; rewrite remaining stale/mock-era language to current sandbox truth; verify all cross-references; purge orphaned files. ~40 docs remain (historical reports excluded). Dependencies: BL-134 accepted.
  - Exit criteria: all docs reference current truth, no stale language, no broken cross-references, all orphaned files purged.

## Queue Rules

- Keep this file short.
- List only active, open work.
- Remove closed items immediately.
- Every active item must reference a backlog ID like `[BL-001]`.
- Include owner, next action, and exit criteria when items exist.
