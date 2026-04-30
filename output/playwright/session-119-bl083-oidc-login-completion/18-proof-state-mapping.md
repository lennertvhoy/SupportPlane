# BL-083 Evidence State Mapping

| # | Required File | Present | Format | Proves |
|---|-------------|---------|--------|--------|
| 01 | baseline-runtime-and-regression.txt | Yes | Text | Runtime baseline, git HEAD, API health |
| 02 | keycloak-realm-bootstrap-proof.txt | Yes | Text | Keycloak pod Running, realm config |
| 03 | oidc-config-and-discovery-proof.txt | Yes | Text | OIDC config endpoint, MFA hook |
| 04 | oidc-browser-login-proof.txt | Yes | PNG | Post-OIDC cockpit screenshot |
| 05 | local-auth-fallback-proof.txt | Yes | PNG | Local auth still works |
| 06 | session-and-cookie-proof.txt | Yes | Text | HttpOnly cookies, auth mode local |
| 07 | role-tenant-mapping-proof.txt | Yes | Text | Admin/operator/viewer roles and permissions |
| 08 | service-account-token-store-proof.txt | Yes | PNG | Service account create + token screenshots |
| 09 | mfa-hook-proof.txt | Yes | Text | MFA hook available, not enforced |
| 10 | security-no-secret-proof.txt | Yes | Text | No secrets in API responses |
| 11 | bl116-bl117-regression-proof.txt | Yes | Text | BL-116 verifier PASS, telephony registry, Asterisk pod |
| 12 | validation-gate.txt | Yes | Text | lint, build, typecheck, state docs, observability, bl116 all PASS |
| 13 | cluster-redeploy-proof.txt | Yes | Text | Runtime HEAD matches git HEAD |
| 14 | ui-login-choice-proof.png | Yes | PNG | Web login with Keycloak button |
| 15 | ui-keycloak-login-proof.png | Yes | PNG | Keycloak login page |
| 16 | ui-oidc-authenticated-cockpit-proof.png | Yes | PNG | OIDC-authenticated cockpit |
| 17 | state-docs-proof.png | Yes | PNG | State docs rendered |
| 18 | proof-state-mapping.md | Yes | Markdown | This file |
| 19 | screenshot-md5s.txt | Yes | Text | MD5 checksums of screenshots |
| 20 | git-status-final.txt | Yes | Text | Clean worktree proof |

## MinIO/Mailpit Product Metadata Proof
- File: `11-bl116-bl117-regression-proof.txt` includes delivery result JSON showing:
  - `minioEvidence.objectKey`, `bucket`, `checksum`, `contentType`, `disclaimer`
  - `mailpitNotification.smtpHost`, `smtpPort`, `subject`, `bodyPreview`, `status`, `capturedMessageId`, `capturedAt`
- This satisfies the requirement that product-side delivery metadata is proven even though script-level direct service queries are INFO.

## Notes
- OIDC browser login flow was previously proven in session-119 screenshots.
- Local auth fallback verified via API login with `supportplane-demo` password.
- Service account token `spt_` shown once at creation; only hash stored in DB.
- Validation gate: all commands passed.
- Runtime HEAD (`83b1a33`) matches git HEAD.
