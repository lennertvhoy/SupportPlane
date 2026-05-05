# Real Writeback Path Design Document

**Product:** SupportPlane  
**Backlog:** BL-100  
**Last updated:** 2026-04-28  
**Status:** Design document only. No implementation.

## 1. Current Truth

SupportPlane connector runtime is mock-only:

- Config validation enforces `mockMode: true`.
- Runtime readiness returns `realReady: false`, `realNetwork: false`, `writebackEnabled: false`.
- Runtime resolver returns `mode: 'mock'` and credential metadata without `secretRef`.
- Delivery policy controls return `realNetworkAllowed: false` on all decisions.
- Evidence bundles include connector runtime metadata only.
- Audit events track all runtime operations with `mockDevOnly: true`.
- No production credential broker, encrypted secret storage, or Vault/KMS boundary exists.
- No real Zammad API calls are made.

## 2. Why Real Writeback Is Intentionally Blocked Today

Real writeback to external ticketing systems (Zammad, GLPI, etc.) is blocked because:

1. **No secret resolution:** `secretRef` values are opaque placeholders. There is no broker to resolve them to real API tokens.
2. **No encrypted secret storage:** Connector config stores secrets as plain JSON in PostgreSQL. This is documented as dev-only.
3. **No network egress policy:** There is no allowlist, proxy, or egress control for API calls to external systems.
4. **No approval gates for real actions:** The action/outbox workflow has approval gates for mock delivery only. Real delivery requires human-review and policy gates that have not been designed for external network calls.
5. **No audit/evidence readiness for real outcomes:** Evidence bundles and audit events assume mock-only outcomes. Real writeback would require capturing real HTTP responses, error codes, and retry states.
6. **No kill switch for real network:** The kill switch exists for policy evaluation but is not wired to an actual network gate.
7. **No blast-radius controls:** A misconfigured connector could write to the wrong tenant, ticket, or system.

## 3. Required Architecture Before Any Real Zammad Writeback

### 3.1 Credential Broker / Secret Reference Resolver

A server-side service that can resolve `secretRef` identifiers to actual secret values without exposing them to the API response layer, UI, or evidence bundles.

Requirements:

- Resolve `secretRef` → actual secret value only inside the connector runtime service.
- Never return resolved secrets in API responses.
- Never store resolved secrets in audit event metadata.
- Support multiple secret kinds: `api_token`, `oauth_client`, `password`, `mTLS_cert`.

### 3.2 Encrypted Secret Storage or External Vault/KMS Boundary

Either:

- Encrypt `secretRef` values at rest in PostgreSQL using AES-256-GCM with a key from an external KMS.
- Or integrate with HashiCorp Vault, AWS Secrets Manager, or Azure Key Vault.

Requirements:

- Encryption keys are not stored in the application database.
- Key rotation is supported.
- Secret values are decrypted only in memory at resolution time.
- No plaintext secrets in database dumps, logs, or backups.

### 3.3 Tenant Admin Connector Configuration

A tenant-scoped admin UI and API for configuring real connector endpoints:

Requirements:

- Admin can set `baseUrl` (real Zammad URL) after explicit "enable real mode" opt-in.
- Admin can link credential references to installations.
- Admin can configure capabilities per installation.
- Admin can set timeout, retry, and validation policies.
- All changes are audited with `tenantAdmin` actor type.

### 3.4 Connector Runtime Resolver That Can Safely Resolve Secrets Server-Side

The `ConnectorRuntimeService.resolveRuntime()` must be able to:

- Look up the installation and its linked credential references.
- Call the credential broker to resolve `secretRef` to actual values.
- Construct a real `TicketingAdapterDriver` instance with resolved credentials.
- Return the driver to the action/outbox processing layer, not to the API/UI.

### 3.5 Network Egress Policy

Requirements:

- Allowlist of permitted external domains/IPs per tenant.
- HTTPS-only for production.
- Proxy support for corporate environments.
- Certificate pinning option for high-security tenants.
- Timeout and connection-pool limits.

### 3.6 Delivery Policy Gates

Extend the existing `DeliveryPolicy` model:

- `allowRealNetworkCalls: boolean` — currently always `false`, must be tenant-admin enabled.
- `requireConnectorValidationBeforeDelivery: boolean` — must validate real connector config before queueing.
- `requireEvidenceBundleBeforeDelivery: boolean` — already exists, must enforce for real writeback.
- `minimumApproverRole` for real writeback should default to `admin` or higher.

### 3.7 Approval / Human-Review Gates

Real writeback must require:

- Explicit approval by a user with `minimumApproverRole`.
- Review of the draft content before queueing.
- Optional second approval for high-risk actions (e.g., public replies, status changes).

### 3.8 Audit / Evidence Bundle Requirements

For real writeback:

- Audit events must include real HTTP status codes, response times, and error messages (redacted if they contain secrets).
- Evidence bundles must include real connector operation summaries with `realNetwork: true`.
- Attempt history must include real HTTP response summaries.
- All real writeback attempts must be cryptographically signed in the audit trail (future requirement).

### 3.9 Retry / Dead-Letter Behavior

- Exponential backoff with jitter for retryable HTTP errors (5xx, timeout).
- Dead-letter after max attempts with full error context.
- Manual retry by admin from the Delivery Operations UI.
- Idempotency keys must be respected by the target system (Zammad article creation).

### 3.10 Dry-Run Mode

Before real writeback, a dry-run mode must:

- Validate the connector config against the real Zammad API (read-only health check).
- Simulate the writeback without persisting changes (if Zammad supports drafts or preview).
- Or at minimum, validate that the ticket exists and the credentials are valid.

### 3.11 Kill Switch Behavior

The existing kill switch must:

- Block all real network calls immediately when toggled.
- Not affect mock-only operations.
- Be tenant-scoped.
- Append `delivery_policy_blocked` audit events.

### 3.12 Blast-Radius Controls

- Per-tenant connector installations prevent cross-tenant writeback.
- Action-type allowlist prevents unexpected operations (e.g., ticket deletion).
- Capability checks prevent writeback to connectors that do not advertise `write_notes`.

## 4. Proposed Phased Path

### Phase 0: Current Mock-Only State (Implemented)

- All connector runtime behavior is mock-only.
- No real network calls.
- No secret resolution.
- Delivery policy denies all real writeback.

### Phase 1: Credential Broker Placeholder

- Design the credential broker interface.
- Implement in-memory mock broker for local testing.
- Add `CredentialBrokerService` scaffold with `resolveSecret(ref)` method.
- Keep all existing mock-only safety gates in place.
- No real Vault/KMS integration yet.

### Phase 2: Sandbox Connector Integration Tests

- Create a sandbox Zammad instance (Docker Compose fixture).
- Write integration tests that exercise real HTTP calls against the sandbox.
- Tests run only in CI or local sandbox mode, never against production.
- Validate that the connector can read tickets and write internal notes in the sandbox.

### Phase 3: Admin-Enabled Dry-Run

- Add tenant admin UI for "Enable real connector mode" opt-in.
- Add dry-run endpoint that validates real credentials against the sandbox.
- Dry-run returns `dryRun: true`, `realNetwork: true`, `externalWriteAttempted: false`.
- Still blocked by delivery policy unless explicitly enabled.

### Phase 4: Real Writeback Behind Approval + Kill Switch

- Enable real writeback for approved actions only.
- Require `minimumApproverRole: admin` for real writeback.
- Wire kill switch to block real network calls.
- Add real HTTP attempt history to outbox items.
- Update evidence bundles to include real operation summaries.
- Full audit trail for real writeback attempts.

## 5. Explicit Non-Goals

- **No browser-stored credentials:** Secret values must never be stored in browser localStorage, sessionStorage, or cookies.
- **No arbitrary shell:** Connector runtime must not execute arbitrary shell commands or scripts.
- **No hidden real network calls:** All real network calls must be explicit, audited, and gated by policy.
- **No production compliance claim:** SupportPlane does not claim SOC 2, ISO 27001, or GDPR compliance.

## 6. Acceptance Gates for Future Real Writeback

Before any real writeback can be accepted:

1. [ ] Credential broker interface is designed and reviewed.
2. [ ] Encrypted secret storage or Vault/KMS integration is implemented.
3. [ ] Sandbox Zammad integration tests pass in CI.
4. [ ] Dry-run mode is implemented and tested.
5. [ ] Delivery policy allows real network calls only when tenant-admin enabled.
6. [ ] Kill switch blocks real network calls within 1 second.
7. [ ] Approval gate requires admin role for real writeback.
8. [ ] Audit events include real HTTP status codes and response times.
9. [ ] Evidence bundles include real operation summaries without secrets.
10. [ ] Blast-radius controls prevent cross-tenant writeback.
11. [ ] Rollback plan is documented and tested.
12. [ ] Security review is completed.

## 7. Threat / Risk Table

| Threat                                         | Likelihood | Impact   | Mitigation                                                                               |
| ---------------------------------------------- | ---------- | -------- | ---------------------------------------------------------------------------------------- |
| Secret leakage in API responses                | Low        | Critical | Zod schema rejects `secretRef` in runtime resolver output; redaction in evidence bundles |
| Misconfigured connector writes to wrong tenant | Medium     | High     | Tenant isolation at store layer; blast-radius controls                                   |
| Credential broker compromise                   | Low        | Critical | External Vault/KMS; keys not in app DB; short-lived tokens                               |
| Real network calls without approval            | Medium     | High     | Delivery policy gates; approval workflow; kill switch                                    |
| Replay attack on writeback                     | Low        | High     | Idempotency keys; hash-chain audit events                                                |
| DDoS of external ticketing system              | Medium     | Medium   | Rate limiting; egress policy; timeout controls                                           |
| Evidence bundle contains real secrets          | Low        | Critical | Redaction layer; secret-free schema enforcement                                          |

## 8. Test Plan for Future Implementation

1. **Unit tests:** Credential broker mock, resolver with resolved secrets, policy gates.
2. **Integration tests:** Sandbox Zammad read/write, dry-run validation, retry/dead-letter.
3. **Security tests:** Secret redaction in API responses, cross-tenant denial, viewer mutation denial.
4. **Performance tests:** Connector timeout, retry backoff, egress proxy latency.
5. **Chaos tests:** Kill switch under load, broker unavailability, Zammad sandbox outage.

## 9. Rollback / Disable Strategy

1. **Kill switch:** Toggle `killSwitch: true` in delivery policy to block all real writeback immediately.
2. **Feature flag:** Add `realWritebackEnabled` tenant flag; set to `false` to disable without code change.
3. **Database revert:** Revert connector installation `mockMode` to `true` for all tenants.
4. **Code rollback:** Revert to previous commit if Phase 4 introduces bugs.

## 10. "Do Not Build Until..." Checklist

- [ ] Credential broker interface is stable and reviewed by security.
- [ ] Encrypted secret storage strategy is selected (native encryption vs. external Vault).
- [ ] Sandbox Zammad instance is available for CI integration tests.
- [ ] Delivery policy UI supports real-network toggle with explicit warnings.
- [ ] Kill switch is tested and documented.
- [ ] Audit event schema supports real HTTP outcomes.
- [ ] Evidence bundle schema supports real operation summaries.
- [ ] Tenant admin role can opt-in to real mode with explicit confirmation.
- [ ] Rollback plan is documented and rehearsed.
- [ ] Legal/compliance review approves real writeback for target use cases.
