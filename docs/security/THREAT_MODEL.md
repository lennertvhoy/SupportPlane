# SupportPlane Threat Model (BL-089)

## Scope
This threat model covers the SupportPlane MVP runtime: API, Web, Worker, and integration adapters (Zammad, Ollama, OpenBao, NATS, MinIO, Mailpit).

## Trust Boundaries
1. **User Browser** → Web UI (untrusted input)
2. **Web UI** → API (authenticated, tenant-scoped)
3. **API** → Postgres / OpenBao / NATS / MinIO (internal cluster network)
4. **API** → Zammad sandbox (integration egress)
5. **Worker** → NATS / MinIO / Zammad (outbox delivery)
6. **AI Provider** → Ollama/LMStudio (local sandbox only)

## Threats and Mitigations

### T-001: Unauthorized Tenant Access
- **Risk**: Cross-tenant data leakage via forged tenant headers.
- **Mitigation**: All store queries filter by `tenantId`. `CurrentIdentityMiddleware` binds identity to tenant. RBAC enforces `tenantId` scoping.
- **Status**: Mitigated. E2E proof in BL-116 verifier.

### T-002: Secret Exposure in Logs/Responses
- **Risk**: API tokens, passwords, or OpenBao secrets leak into logs or HTTP responses.
- **Mitigation**: 
  - `RedactionService` scrubs secrets before logging.
  - Connector status endpoints never return raw credentials.
  - OpenBao resolver returns metadata only; secrets are resolved server-side.
- **Status**: Mitigated. Unit tests cover redaction patterns.

### T-003: Unauthorized Writeback to Production Ticketing
- **Risk**: Sandbox internal note writeback reaches a production Zammad instance.
- **Mitigation**:
  - `evaluateEgressPolicy` blocks production-like URLs (zendesk.com, freshdesk.com, prod patterns).
  - Sandbox allowlist restricts egress to `localhost`, `127.0.0.1`, and cluster-internal hostnames.
  - Writeback requires explicit `writebackEnabled: true` + admin approval + queueing.
  - Action state machine: `draft` → `submitted` → `approved` → `queued` → `delivered`.
- **Status**: Mitigated. BL-116 verifier proves sandbox-only delivery.

### T-004: AI Prompt Injection / Data Exfiltration
- **Risk**: Malicious operator instructions cause AI to leak tenant data or generate harmful content.
- **Mitigation**:
  - All AI calls are local (Ollama/LMStudio); no cloud LLM API keys.
  - `ModelGateway` safety metadata marks every response as `reviewRequired: true`, `autonomousSend: false`.
  - Draft suggestions are never auto-sent; operator must review and approve.
  - `noCloudCall: true` is enforced in usage metadata.
- **Status**: Mitigated. BL-116 draft suggestion proof shows `autonomousSend: false`.

### T-005: Privilege Escalation
- **Risk**: Viewer or operator role gains admin privileges.
- **Mitigation**:
  - RBAC roles: `admin` (all permissions), `owner` (all), `operator` (read/write scoped), `viewer` (read-only), `support_agent` (operator-equivalent).
  - `requirePermission` guards every service method.
  - Role change requires re-authentication.
- **Status**: Mitigated. API tests verify role-based denials.

### T-006: Registry Adapter Injection
- **Risk**: Malicious adapter registered at runtime to exfiltrate data.
- **Mitigation**:
  - `registerTicketingAdapter` rejects duplicate registrations.
  - Registry is initialized once at module load time in `ConnectorsService` constructor.
  - Only known factory functions (`createZammadAdapterFactory`, `createMockZammadAdapterFactory`) are registered.
  - No runtime endpoint exposes `registerTicketingAdapter`.
- **Status**: Mitigated. BL-123/124/125 registry evidence shows controlled registration.

### T-007: Credential Resolver Substitution
- **Risk**: Attacker redirects credential resolution to a malicious OpenBao instance.
- **Mitigation**:
  - OpenBao base URL is configured via environment variable (`OPENBAO_ADDR`).
  - URL is validated against sandbox allowlist.
  - Credential references are tenant-scoped and immutable after creation.
- **Status**: Partially mitigated. Admin access to env vars is required for substitution.

### T-008: Outbox Replay / Duplicate Delivery
- **Risk**: Same action delivered multiple times due to replayed NATS messages.
- **Mitigation**:
  - Every outbox item has an `idempotencyKey`.
  - Zammad internal notes include the idempotency key in the body.
  - Delivery attempts are tracked in `action_outbox_attempts`.
- **Status**: Mitigated. BL-116 verifier checks single delivery.

## Accepted Risks
- **Local sandbox only**: No production Zammad or cloud LLM connectivity is claimed.
- **Dev-mode auth**: `SUPPORTPLANE_AUTH_MODE=local` trusts identity headers; not suitable for production.
- **In-cluster secrets**: OpenBao and Postgres credentials are in-cluster; production would use external secret management.

## Verification Artifacts
- BL-116 E2E verifier: `scripts/verify_bl116_real_sandbox_freeze.sh`
- BL-123/124/125 registry evidence: `output/playwright/session-116-bl089-bl123-bl124-bl125-plugin-registry/`
- API unit tests: `apps/api/test/api.test.ts` (147 tests, all pass)
- Policy unit tests: `packages/policy/src/index.test.ts`
- Connector unit tests: `packages/connectors/src/zammad-adapter.test.ts`
