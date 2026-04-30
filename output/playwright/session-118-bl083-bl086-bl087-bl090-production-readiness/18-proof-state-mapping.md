# BL-118 Proof State Mapping

| # | File | Proves | Backlog Item |
|---|------|--------|--------------|
| 01 | 01-baseline-runtime-and-regression.txt | Cluster health before changes, BL-116 verifier passes | BL-118 baseline |
| 02 | 02-auth-architecture-proof.md | Auth type extensions, OIDC config, service account, MFA hook interfaces | BL-083 |
| 03 | 03-keycloak-oidc-topology-proof.txt | Keycloak k8s manifests deployed in cluster | BL-083 |
| 04 | 04-oidc-login-and-local-auth-proof.txt | Local auth still works, OIDC config endpoint honest, Keycloak initializing | BL-083 |
| 05 | 05-service-account-token-proof.txt | ServiceAccountGuard validates X-Service-Token, returns 401 for invalid | BL-083 |
| 06 | 06-api-hardening-proof.txt | Security headers, body limits, rate limits, validation guards, audit events | BL-086 |
| 07 | 07-rate-body-validation-proof.txt | Specific rate/body/validation test results and integration points | BL-086 |
| 08 | 08-security-audit-proof.txt | SecurityAuditService methods, safe metadata, no secret leakage | BL-086 |
| 09 | 09-backup-restore-proof.txt | Backup/restore scripts exist, dry-run works, safeguards documented | BL-087 |
| 10 | 10-release-package-proof.txt | Release packaging script dry-run works, runbooks created | BL-090 |
| 11 | 11-demo-reset-proof.txt | Demo reset script updated, service verification, dry-run works | BL-090 |
| 12 | 12-osticket-triage-proof.txt | osTicket blocked: no official image, no PostgreSQL, no read API | BL-128 |
| 13 | 13-validation-gate.txt | All validation commands pass: lint, typecheck, tests, verifiers, dry-runs | BL-118 |
| 14 | 14-cluster-redeploy-proof.txt | Images built, cluster redeployed, pods healthy, API health ok | BL-118 |
| 15 | 15-ui-auth-security-proof.png | Security & Release Readiness panel visible in web UI | BL-083/086/090 |
| 16 | 16-ui-release-ops-proof.png | API health JSON with oidcReady and mfaHookAvailable fields | BL-083 |
| 17 | 17-state-docs-proof.png | Cockpit header with auth mode badges after redeploy | BL-118 |
| 18 | 18-proof-state-mapping.md | This file — maps each evidence artifact to its claim | BL-118 |
| 19 | 19-screenshot-md5s.txt | MD5 checksums of screenshots, zero duplicates among finals | BL-118 |
| 20 | 20-git-status-final.txt | Clean worktree proof at final commit | BL-118 |

Total files: 20
Screenshot duplicates: 0 (3 unique screenshots)
