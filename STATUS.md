# SupportPlane Status

**Updated At:** 2026-05-01 14:35 CEST
**Execution Mode:** operating
**Project State:** session_123b_repair_closed
**Public URL:** not configured

## Snapshot

- **BL-061/062/063/064/066/067/068 accepted.** Remote Tool Execution Safety Foundation with truth repair: tool manifest, policy engine, approval lifecycle, read-only invocation, execution gateway, note draft from tool results, and safety tests are solid. BL-065 is `partial/linux-tested` — `remediation.flush_dns_cache` is fixed-template, policy-gated, approval-gated, and result-capturing, but broader remediation coverage and real Windows proof remain open.
- **BL-129 accepted; BL-130/131/132 partial Linux-tested.** Windows endpoint foundation has canonical `EndpointPlatform`, platform-aware policy enforcement, collector modules, mocked Windows endpoint, Tool Registry badges, and Device Console compatibility states. Windows service/software collectors now have fixed `sc.exe`/`reg.exe` templates and Linux-tested fixture parsers, plus packaging readiness scaffold docs/script. Real Windows execution remains unproven.
- **BL-076 accepted.** Policy editor foundation with delivery, connector, AI, and retention policies. Admin CRUD API with RBAC, safety validation, audit events with redacted diffs, compact tabbed UI. Runtime verified in Kind cluster.
- **BL-083 accepted.** OIDC browser login with Keycloak realm role mapping, service account token store with SHA-256 hashing and expiry, MFA hook available but not enforced, local auth fallback preserved. Evidence in `output/playwright/session-119-bl083-oidc-login-completion/`.
- **BL-086/087/090 and BL-104 through BL-117, BL-121 accepted.** API gateway hardening, backup/restore runbooks, release packaging, real self-hosted sandbox freeze (BL-116), and Asterisk AMI bridge (BL-117).
- **BL-073/074 partial/hybrid-ready.** Knowledge source/article schema, CRUD API, seed data, and lexical retrieval exist. Retrieval now exposes pgvector readiness reason, embedding provider availability, semantic eligibility, source provenance, and non-fabricated confidence (`null`). Deterministic mock embeddings exist for tests only. No external ingestion pipeline; no local pgvector semantic path is accepted unless the database extension/vector column and provider are proven.
- **Connector expansion and cluster topology partial.** GLPI/osTicket fixture status and MeshCentral/Fortinet unconfigured/error status are explicit in `/connectors/status`, including credential source, last check, error code, fixture warning, and no silent fixture fallback when real config is present. No real GLPI/MeshCentral/Fortinet/osTicket instances connected. Kind/Podman control-plane Ready; API/web/worker pods plus Zammad, OpenBao, NATS JetStream, Mailpit, MinIO, host-controlled Ollama, Keycloak, and observability baseline are healthy when running. Remaining gaps: MFA enforcement, distributed rate limiting, production secrets/monitoring, osTicket real integration, installed software real-runner proof, production endpoint enrollment hardening, real Windows runner verification, real connector instances, pgvector semantic retrieval.

## Active Blockers

- OpenBao is local sandbox credential resolution only, not production secret management.
- NATS is local sandbox JetStream only, not production broker HA.
- Observability is local sandbox only, not production monitoring or alerting.
- Keycloak is local sandbox only, not production auth.
- osTicket integration blocked by upstream limitations.
- Windows service/software and remediation fixed-template scaffolding require real Windows proof before acceptance.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
- Windows support is architecture-grade (contracts, policy, agent, UI, docs) but real Windows runtime proof requires a Windows runner.
