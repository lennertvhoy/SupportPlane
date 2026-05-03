# NEXT_ACTIONS - Active Execution Queue

**Updated At:** 2026-05-03 15:10 CEST
**Execution Mode:** operating
**Max Items:** 10

## Active Work

- [BL-073/BL-074] **Knowledge retrieval hardening**
  - Owner: future slice
  - Next action: add a reproducible pgvector-enabled PostgreSQL path with vector column/search, or extend ingestion while preserving the current explicit lexical fallback reason.
  - Exit criteria: `POST /knowledge/retrieve` returns semantic/hybrid results with `pgvectorEnabled: true` from a proven pgvector database, or remains explicitly lexical with a current unavailable reason.

- [BL-071/BL-072/BL-127] **Connector real-instance enablement**
  - Owner: future connector slice
  - Progress: BL-069 (GLPI) accepted in Session 142. Remaining: MeshCentral (BL-071), Fortinet (BL-072), osTicket (BL-127).
  - Next action: connect real MeshCentral, Fortinet, or osTicket instance; prove real data read through SupportPlane API.
  - Exit criteria: all non-Zammad connectors with real instances proven end-to-end.

- [BL-065] **Broader low-risk remediation coverage**
  - Owner: future remediation hardening slice
  - Next action: add a second safe low-risk remediation or real Windows flush-DNS proof while keeping fixed templates, policy gating, approval gating, and captured results.
  - Exit criteria: More than one low-risk remediation path is proven end-to-end, or Windows flush DNS is proven on a real Windows runner with browser/API evidence.

- [BL-132] **Windows service/install packaging**
  - Owner: future Windows packaging slice
  - Status: partial/service-scripts-ready. Service install/uninstall/run-once scripts created and syntactically validated on windows-latest. GitHub-hosted runner lacks admin privileges for sc.exe service creation. Credible packaging path exists — needs real Windows host with admin to complete.
  - Next action: run scripts/windows/install_endpoint_agent_service.ps1 on a real Windows host with admin privileges to prove service install, start, auto-start, and uninstall.
  - Exit criteria: service installs, starts, auto-starts on boot, runs heartbeat/diagnostic cycle, stops, uninstalls cleanly on real Windows host.

- [BL-135] **Per-doc content audit and full rewrite**
  - Owner: future slice
  - Next action: perform line-by-line audit of every doc in docs/* against current BACKLOG.md truth; rewrite remaining stale/mock-era language to current sandbox truth; verify all cross-references; purge orphaned files. ~40 docs remain (historical reports excluded). Dependencies: BL-134 accepted.
  - Exit criteria: all docs reference current truth, no stale language, no broken cross-references, all orphaned files purged.

## Recently Completed

- [BL-130] `[accepted]` Windows diagnostics collectors — real Windows runner proof (Session 134, repaired Session 135).
- [BL-131] `[accepted]` Windows tool-manifest compatibility — proven on real Windows runner (Session 134).
- [BL-133] `[accepted]` Windows verification strategy — workflow passed on windows-latest (Session 134).

## Queue Rules

- Keep this file short.
- List only active, open work.
- Remove closed items immediately.
- Every active item must reference a backlog ID like `[BL-001]`.
- Include owner, next action, and exit criteria when items exist.
