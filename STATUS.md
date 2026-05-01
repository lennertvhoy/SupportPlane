# SupportPlane Status

**Updated At:** 2026-05-01 11:30 CEST
**Execution Mode:** operating
**Project State:** bl_129_in_progress
**Public URL:** not configured

## Snapshot

- **BL-061/062/063/064/066/068 accepted.** Remote Tool Execution Safety Foundation with truth repair: tool manifest, policy engine, approval lifecycle, read-only invocation, execution gateway, and safety tests are solid. BL-065 is `partial` — approval queue dispatches but remediation does not execute end-to-end with a real result. BL-067 is `partial` — backend note draft service exists and UI now exposes "Create note draft" button, but needs browser proof for full acceptance.
- **BL-129 in progress.** Windows endpoint foundation: canonical `EndpointPlatform` enum, platform-aware policy enforcement, agent collector modules for linux/win32/darwin, Windows-safe read-only collectors, mocked Windows endpoint in seed data, Tool Registry platform badges, Device Console platform compatibility and unsupported tool states.
- **BL-076 accepted.** Policy editor foundation with delivery, connector, AI, and retention policies. Admin CRUD API with RBAC, safety validation, audit events with redacted diffs, compact tabbed UI. Runtime verified in Kind cluster.
- **BL-083 accepted.** OIDC browser login with Keycloak realm role mapping, service account token store with SHA-256 hashing and expiry, MFA hook available but not enforced, local auth fallback preserved. Evidence in `output/playwright/session-119-bl083-oidc-login-completion/`.
- **BL-086/087/090 and BL-104 through BL-117, BL-121 accepted.** API gateway hardening, backup/restore runbooks, release packaging, real self-hosted sandbox freeze (BL-116), and Asterisk AMI bridge (BL-117).
- **Cluster/self-hosted topology and gaps:** Kind/Podman control-plane Ready; API/web/worker pods plus Zammad, OpenBao, NATS JetStream, Mailpit, MinIO, host-controlled Ollama, Keycloak, and observability baseline are healthy when running. Remaining partial/mock/deferred: MFA enforcement, distributed rate limiting, production secrets, production monitoring, osTicket real integration, installed software inventory in endpoint diagnostics, production endpoint enrollment hardening, real Windows runner verification.

## Active Blockers

- OpenBao is local sandbox credential resolution only, not production secret management.
- NATS is local sandbox JetStream only, not production broker HA.
- Observability is local sandbox only, not production monitoring or alerting.
- Keycloak is local sandbox only, not production auth.
- osTicket integration blocked by upstream limitations.
- Windows remediation and service enumeration are not implemented; agents return `unsupported` with honest notes.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
- Windows support is architecture-grade (contracts, policy, agent, UI, docs) but real Windows runtime proof requires a Windows runner.
