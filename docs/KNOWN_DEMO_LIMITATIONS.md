# Known Demo Limitations

**Last updated:** 2026-05-03
**For testers:** These are honest limitations of the current demo. None are bugs.

---

## Connectors

| Connector | Status | Limitation |
|-----------|--------|------------|
| **Zammad** | Real sandbox | Sandbox instance only. No production Zammad. OpenBao inmem credentials (lost on pod restart, re-seed script exists). |
| **GLPI** | Real sandbox | Sandbox instance only. Read-only adapter (no ticket creation or mutation through SupportPlane). Credentials stored as K8s ConfigMap env vars (local dev only, not OpenBao-backed). |
| **osTicket** | Fixture-backed | Returns deterministic demo data. No real osTicket connection. Blocked by upstream: osTicket v1.x has no read API, requires MySQL, and has no official container image. See `docs/OSTICKET_TRIAGE.md`. |
| **MeshCentral** | Unconfigured | No real MeshCentral instance. Shows honest "unconfigured" status. |
| **Fortinet** | Unconfigured | No real Fortinet instance. Shows honest "unconfigured" status. |

---

## AI / Model

| Limitation | Detail |
|------------|--------|
| Local Ollama only | AI drafts use local Ollama (gemma4:e4b). Cloud AI providers (OpenAI, Azure, Anthropic) return honest `configured: false`. |
| Model availability | Ollama must be running on the host (`localhost:11434` or `10.88.0.1:11435`). If Ollama is down, fallback may be used. |
| No autonomous decisions | AI can draft and suggest but cannot execute writeback or bypass policy. |

---

## Writeback / Notifications

| Limitation | Detail |
|------------|--------|
| Sandbox writeback only | Zammad writeback is restricted to local sandbox (`zammad.supportplane-integrations.svc.cluster.local`). Production writeback is locked off. |
| No public replies | Only internal notes. Public customer replies are disabled. |
| Mailpit local capture | Email notifications go to local Mailpit (sandbox SMTP). No internet email is sent. |

---

## Secrets / Security

| Limitation | Detail |
|------------|--------|
| OpenBao inmem storage | Secrets are lost on cluster pod restart. Re-seed with `bash scripts/seed_openbao_zammad_secret.sh`. |
| Env-var credentials | GLPI credentials are stored in K8s ConfigMap env vars (not OpenBao-backed). Local sandbox only. |
| No production secret management | No rotation, no KMS, no production-grade vault. |
| Sandbox dev tokens | All tokens and credentials are local dev defaults (visible in source code). Not production secrets. |

---

## Endpoint / Windows

| Limitation | Detail |
|------------|--------|
| Windows diagnostics proven | Real Windows runner proof achieved via GitHub Actions CI (BL-130/131/133 accepted). |
| Windows service install NOT proven | Service install/uninstall requires admin privileges. GitHub CI runner lacks admin. Real Windows host with admin needed (BL-132). |
| No endpoint UI in browser demo | Device Console exists but endpoint agents are not part of this browser demo flow. |

---

## Infrastructure

| Limitation | Detail |
|------------|--------|
| Local-only | All services run on localhost (K8s port-forwards). No public URL. No internet access required. |
| Pod restart impact | OpenBao secrets, NATS in-memory state lost on pod restart. Cluster must be brought up cleanly. |
| Single-node K8s | Kind cluster is single-node. Not HA. Not production topology. |
| No browser tooling in recent sessions | Browser proof from recent sessions used CLI/API artifacts, not screenshots. Testers should verify UI directly on the demo URL. |

---

## Not Implemented (Intentionally)

- Production deployment (no cloud, no HA, no TLS enforcement)
- Production auth (no SSO/OAuth/SAML enforcement, no MFA enforcement)
- Compliance certification (no SOC2, ISO, or GDPR compliance claimed)
- Real telephony (mock/simulated only)
- Real screen capture/OCR (mock metadata only)
- Tauri operator companion (scaffold not built)
- pgvector semantic search (lexical fallback only)
- Broader remediation coverage (one low-risk path only)

---

## Honesty Statement

> This demo is a truthful representation of the current codebase. Every connector label, policy gate, AI safety flag, and audit event reflects actual runtime behavior. Nothing is simulated behind the scenes. Where a feature is incomplete, the UI and API return honest unavailable responses rather than fake success.
