# SupportPlane Status

**Updated At:** 2026-04-30 23:36 CEST
**Execution Mode:** operating
**Project State:** bl_076_accepted
**Public URL:** not configured

## Snapshot

- **BL-076 accepted.** Policy editor foundation with delivery, connector, AI, and retention policies. Admin CRUD API with RBAC, safety validation, audit events with redacted diffs, compact tabbed UI. Runtime verified in Kind cluster.
- **BL-083 accepted.** OIDC browser login with Keycloak realm role mapping, service account token store with SHA-256 hashing and expiry, MFA hook available but not enforced, local auth fallback preserved. Evidence in `output/playwright/session-119-bl083-oidc-login-completion/`.
- **BL-086/087/090 and BL-104 through BL-117, BL-121 accepted.** API gateway hardening, backup/restore runbooks, release packaging, real self-hosted sandbox freeze (BL-116), and Asterisk AMI bridge (BL-117).
- **BL-128 blocked.** osTicket integration blocked by no official container image, no PostgreSQL support, and no read API in v1.x.
- **Cluster foundation:** Kind/Podman control-plane Ready; API/web/worker pods running local images built from current HEAD.
- **Self-hosted topology:** Zammad, OpenBao, NATS JetStream, Mailpit, MinIO, Ollama (host-controlled), Keycloak, and observability baseline all healthy.
- **What remains partial/mock/deferred:** MFA enforcement, distributed rate limiting, production secrets, production monitoring, osTicket real integration.

## Active Blockers

- OpenBao is local sandbox credential resolution only, not production secret management.
- NATS is local sandbox JetStream only, not production broker HA.
- Observability is local sandbox only, not production monitoring or alerting.
- Keycloak is local sandbox only, not production auth.
- osTicket integration blocked by upstream limitations.

## Notes

- Use `prompts/OPERATING_LOOP_START_PROMPT.md` to start the CTO/coding-agent operating loop.
- Do not claim any external integration is implemented until directly verified.
- Do not accept user-facing behavior without runtime identity proof and evidence.
