# Security Regression Matrix

## How to Use This Matrix
Each row is a security control. After any code change that touches the relevant subsystem, run the verification command and update the `Last Verified` column.

| Control | Subsystem | Verification Command | Expected Result | Last Verified |
|---------|-----------|---------------------|-----------------|---------------|
| T-001 Tenant isolation | API store | `npm test --workspace=@supportplane/api` | Tests 8, 10, 15 pass (no cross-tenant leakage) | 2026-04-30 |
| T-002 Secret redaction | Logging | `npm test --workspace=@supportplane/api` | Redaction tests pass (no secrets in output) | 2026-04-30 |
| T-003 Egress policy | Policy + Connectors | `bash scripts/verify_bl116_real_sandbox_freeze.sh` | Steps 3, 5, 6 pass (sandbox-only writeback) | 2026-04-30 |
| T-004 AI safety | AI package | `npm test --workspace=@supportplane/ai` | All tests pass; `autonomousSend: false` enforced | 2026-04-30 |
| T-005 RBAC enforcement | Auth middleware | `npm test --workspace=@supportplane/api` | Role-based denials return 403 | 2026-04-30 |
| T-006 Registry control | Connectors package | `node scripts/bl123_bl124_bl125_evidence.js` | Registry listing shows only registered adapters | 2026-04-30 |
| T-007 Credential resolver | OpenBao integration | `bash scripts/verify_bl116_real_sandbox_freeze.sh` | Step 6 shows `secretExposed: false` | 2026-04-30 |
| T-008 Outbox idempotency | Worker + NATS | `bash scripts/verify_bl116_real_sandbox_freeze.sh` | Step 6 shows single attempt, idempotency key present | 2026-04-30 |
| T-009 OIDC honesty | Auth + Keycloak | `curl -s http://localhost:4210/auth/oidc/config` and `kubectl get pods -n supportplane-integrations -l app.kubernetes.io/name=keycloak` | OIDC config reports disabled until env/flow exists; Keycloak pod Running/Ready only proves local sandbox readiness | 2026-04-30 |

## Regression Test Checklist (run before claiming closure)
- [ ] `npm run build` passes for all workspaces
- [ ] `npm test --workspace=@supportplane/api` passes (147 tests)
- [ ] `npm test --workspace=@supportplane/connectors` passes
- [ ] `npm test --workspace=@supportplane/policy` passes
- [ ] `npm test --workspace=@supportplane/ai` passes
- [ ] `bash scripts/verify_bl116_real_sandbox_freeze.sh` passes
- [ ] `bash scripts/bl123_bl124_bl125_evidence.js` generates evidence artifacts
- [ ] Worktree is clean (`git status --short --branch` shows nothing)
