# SupportPlane Status

**Updated At:** 2026-04-30 22:40 CEST
**Execution Mode:** operating
**Project State:** bl_083_accepted_bl_076_active
**Public URL:** not configured

## Snapshot

- **BL-083 accepted.** OIDC browser login flow with Keycloak realm role mapping, service account token store with SHA-256 hashing and expiry, MFA hook available but not enforced, local auth fallback preserved. Evidence in `output/playwright/session-119-bl083-oidc-login-completion/`.
- **BL-104 through BL-117, BL-121, and BL-122 are accepted.** BL-116 freezes the complete real self-hosted sandbox milestone. BL-117 adds local Asterisk AMI bridge.
- **BL-086/087/090 accepted.** API gateway hardening (rate limits, body limits, validation, security headers, audit events), backup/restore runbooks, and release packaging with demo reset.
- **BL-128 blocked.** osTicket integration blocked by no official container image, no PostgreSQL support, and no read API in v1.x.
- **Cluster foundation:** Kind/Podman control-plane Ready; CoreDNS, kube-proxy, local-path-provisioner running; API/web/worker pods running local images.
- **Self-hosted topology:** Zammad seeded and reachable; OpenBao initialized/unsealed; NATS JetStream file-backed; Mailpit capturing SMTP; MinIO healthy; Ollama host-controlled with AMD GPU; Keycloak sandbox Running/Ready after local resource/probe repair; observability baseline active.
- **What is real now:** OIDC browser login flow, Keycloak realm role mapping, service account token store with SHA-256 hashing and expiry, MFA hook interfaces, in-memory rate limiting, body limits, request validation, security headers, security audit service, backup/restore scripts, release/demo runbooks, Security Readiness UI panel.
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
