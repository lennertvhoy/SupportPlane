# GDPR Data Inventory — Readiness / Precheck

> **Status:** Readiness / Precheck — NOT a compliance certification.  
> **Scope:** Personal data categories processed by SupportPlane MVP and sandbox.  
> **As of:** 2026-05-04

## 1. Inventory by Data Category

| Category                                        | Source                                                                        | Purpose                                   | Lawful Basis (Assumed)                                   | Access Control                                          | Retention                                                                    | Export                                                        | Delete                                      | Redaction Notes                                                                  |
| ----------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------- |
| **Customer / Ticket Data**                      | Zammad/GLPI connectors (sandbox read), manual entry                           | Support session context, AI reasoning     | Legitimate interest / contract                           | Tenant-scoped; admin/operator read; viewer read-only    | Tenant retention policy (configurable days)                                  | `POST /gdpr/export-preview` dry-run                           | `POST /gdpr/delete-preview` dry-run         | API redacts secrets before response; evidence bundles redact tokens              |
| **End-User Personal Data (name, email, phone)** | Zammad customer object, caller matching fixture                               | Caller identification, session linking    | Legitimate interest                                      | Tenant-scoped; role-based                               | Linked to tenant retention policy                                            | Via GDPR export-preview                                       | Via GDPR delete-preview                     | Phone normalized; no raw PII in audit metadata beyond IDs                        |
| **User / Operator Accounts**                    | Local auth seed, OIDC realm mapping                                           | Authentication, RBAC, audit attribution   | Contract / legitimate interest                           | Admin CRUD; self-profile read                           | Persistent until admin deletion                                              | Admin can list users; no self-export yet                      | Admin can delete users                      | Passwords hashed (bcrypt); no plaintext passwords in logs                        |
| **Endpoint Diagnostics**                        | Endpoint agent heartbeat, inventory, disk/network/service/software collectors | Device health assessment, troubleshooting | Contract / legitimate interest                           | Tenant-scoped; device linked to tenant enrollment token | Device snapshots persist until purge policy implemented                      | Not explicitly covered in GDPR preview yet                    | Not explicitly covered in GDPR preview yet  | Agent outbound-only; no arbitrary shell; command results stored scoped by tenant |
| **Call Metadata**                               | Fake webhook fixture, Asterisk AMI events                                     | Session auto-creation, caller matching    | Legitimate interest                                      | Tenant-scoped; telephony adapter boundary               | Call events in audit timeline                                                | Evidence bundle includes call summaries                       | No dedicated deletion flow                  | No raw audio or transcript stored                                                |
| **AI Prompts / Context Packets**                | Operator request, ticket context, screen observation metadata                 | Draft generation, summary, greeting, chat | Legitimate interest / consent implied by operator action | Tenant-scoped; policy-gated                             | Retention policy enforces `outputRetentionMode`: None / Metadata_only / Full | Export-preview includes session data; prompts may be redacted | Delete-preview dry-run covers session scope | PII redaction layer applied before model context; secrets stripped               |
| **Audit Logs**                                  | Append-only `AuditEvent` writer                                               | Accountability, security forensics        | Legal obligation / legitimate interest                   | Admin/auditor read; viewer denied                       | Append-only design; hash-chain placeholder                                   | Global `/audit-events` API with filters                       | Not designed for deletion (append-only)     | Metadata redacted based on retention policy; no raw secrets                      |
| **Evidence Bundles**                            | Generated on demand from session + audit + context                            | Session record, dispute resolution        | Legitimate interest / contract                           | Tenant-scoped; generated by operator/admin              | Not auto-purged; stored in MinIO (sandbox)                                   | JSON/Markdown/PDF export                                      | No automatic deletion                       | Redaction helpers strip tokens, passwords, hashes before export                  |
| **Credentials / Secrets**                       | OpenBao sandbox resolver, Kubernetes secrets, local env                       | Connector authentication                  | Contract                                                 | Server-side only; never sent to browser                 | OpenBao inmem (lost on restart; reseed script available)                     | Never exported                                                | Manual secret rotation not implemented      | API always returns `[REDACTED]`; evidence bundles show `secretExposed: false`    |

## 2. Data Subject Rights — Current State

| Right           | Status                                  | Evidence                                        | Gap                                                         |
| --------------- | --------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------- |
| Access (export) | Partial — dry-run preview exists        | `GdprRequestPanel`, `POST /gdpr/export-preview` | No one-click full data package; no self-service portal      |
| Rectification   | Partial — admin can edit users/policies | Admin UI                                        | No dedicated DSR rectification endpoint                     |
| Erasure         | Partial — dry-run delete preview exists | `POST /gdpr/delete-preview`                     | No actual deletion execution; `autoPurgeEnabled` locked off |
| Portability     | Not implemented                         | —                                               | No machine-readable export format dedicated to portability  |
| Restriction     | Not implemented                         | —                                               | No DSR restriction flag on entities                         |
| Objection       | Not implemented                         | —                                               | No automated objection workflow                             |

## 3. Cross-Border & Processor Notes

- **Current deployment:** Local Kubernetes sandbox on Podman (self-hosted).
- **Cloud AI:** Disabled (`cloudAiAllowed: false`). No data leaves the cluster for AI processing.
- **Ollama:** Local host-controlled provider; no external API calls.
- **Third-party processors:** Zammad (sandbox), GLPI (sandbox), Asterisk (sandbox), Mailpit (local), MinIO (local) — all self-hosted in the same cluster.
- **No DPA** (Data Processing Agreement) is in place because all services are self-hosted sandbox instances under operator control.

## 4. Security Measures Relevant to GDPR

| Measure                     | Status                                                                                    |
| --------------------------- | ----------------------------------------------------------------------------------------- |
| Tenant isolation            | Enforced in Prisma queries (observed in tests)                                            |
| RBAC                        | Admin/operator/viewer roles enforced server-side                                          |
| Secret redaction            | `[REDACTED]` in all API responses and evidence bundles                                    |
| Audit logging               | All access/modification events append-only                                                |
| Kill switch / policy gating | Delivery policy can block all external writeback                                          |
| Encryption at rest          | Not proven — PostgreSQL PVC uses `standard` storage class without documented encryption   |
| Encryption in transit       | Not proven — cluster uses plain HTTP between services (no TLS cert management documented) |

## 5. Honest Gaps & Backlog

- No formal **Records of Processing Activities (ROPA)**.
- No **Data Protection Officer (DPO)** appointment documented.
- No **privacy policy** or **cookie notice** for the web UI.
- **Encryption at rest / in transit** not validated.
- **Breach notification procedure** not documented.
- **Cross-border transfer mechanism** not applicable yet (all local), but not assessed for future cloud use.

---

_This inventory is a precheck for engineering readiness, not a legal GDPR compliance assessment._
