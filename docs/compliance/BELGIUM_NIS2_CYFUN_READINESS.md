# Belgium NIS2 / CyberFundamentals Readiness Map

> **Status:** Readiness / Precheck — NOT a certification or audit report.  
> **Frameworks:** Belgium CyberFundamentals (Basisbeveiliging / Baseline) + EU NIS2 Directive mapping.  
> **As of:** 2026-05-04

## 1. Control Areas Mapped

| CF Area         | NIS2 Art.                               | Current Evidence                                                                                                                           | Honest Gap                                                                                        |
| --------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| **1. Identify** | Art. 21(1) — Risk management            | Threat model (6 categories), asset inventory (docs/KUBERNETES_SERVICE_CATALOG.md), runtime identity                                        | No formal asset register; no BIA (Business Impact Analysis)                                       |
| **2. Protect**  | Art. 21(2) — Access control, encryption | RBAC (admin/operator/viewer), tenant isolation, secret redaction, kill switch, policy gating                                               | No MFA enforcement; encryption at rest not proven; no TLS cert management documented              |
| **3. Detect**   | Art. 21(3) — Anomaly detection, logging | AuditEvent (126+ types), correlation IDs, Prometheus metrics, Loki-ready, anomaly detection not implemented                                | No SIEM integration; no automated anomaly alerts; no IDS/IPS                                      |
| **4. Respond**  | Art. 21(4) — Incident handling          | No formal incident response runbook; no CSIRT contact; no severity classification procedure                                                | Missing: `docs/RUNBOOK_INCIDENT_RESPONSE.md`                                                      |
| **5. Recover**  | Art. 21(5) — Backup & restore           | `scripts/backup_local_sandbox.sh`, `scripts/restore_local_sandbox.sh`, `docs/RUNBOOK_BACKUP_RESTORE.md`, PostgreSQL PVC persistence proven | No tested restore from backup in a clean environment; no disaster recovery time objective defined |

## 2. Detailed Control Mapping

### 2.1 Identify (ID)

| Control                            | Status   | Evidence                                                    | Gap                                                             |
| ---------------------------------- | -------- | ----------------------------------------------------------- | --------------------------------------------------------------- |
| ID.AM-1 — Hardware inventory       | Partial  | Kubernetes manifest catalog lists all deployed workloads    | No physical asset inventory; host is a Fedora workstation       |
| ID.AM-2 — Software inventory       | Partial  | `package.json` workspaces, Containerfiles, dependency lists | No automated SBOM; no license inventory                         |
| ID.AM-3 — Data flows               | Partial  | `docs/REAL_E2E_SANDBOX_FLOW.md`, `docs/BOUNDARY_MATRIX.md`  | No formal data-flow diagram with trust boundaries               |
| ID.RA-1 — Vulnerability assessment | Not done | —                                                           | No periodic vulnerability scan; no dependency update automation |
| ID.RA-2 — Threat intelligence      | Partial  | `docs/THREAT_MODEL.md`, OWASP reference                     | No threat-intel feed integration                                |

### 2.2 Protect (PR)

| Control                              | Status  | Evidence                                                                      | Gap                                                                |
| ------------------------------------ | ------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| PR.AC-1 — Identity management        | Partial | Local auth + OIDC-ready + service accounts + short-lived tokens               | No MFA enforcement; no password reset; no SSO production hardening |
| PR.AC-2 — Access enforcement         | Yes     | Server-side RBAC on all mutations; viewer 403 proven; cross-tenant 404 proven | Good                                                               |
| PR.AC-3 — Remote access              | Partial | Endpoint agent outbound-only; Tailscale Funnel used temporarily for CI        | No permanent secure remote access design                           |
| PR.DS-1 — Data-at-rest protection    | Unknown | PostgreSQL PVC uses `standard` storage class                                  | Encryption-at-rest not verified                                    |
| PR.DS-2 — Data-in-transit protection | Unknown | Cluster services communicate over plain HTTP                                  | TLS/mTLS not documented or proven                                  |
| PR.IP-1 — Baseline configurations    | Partial | Kubernetes manifests committed; ConfigMap/Secret separation                   | No configuration drift detection; no hardened container benchmarks |
| PR.IP-2 — Software integrity         | Partial | `package-lock.json` committed; no provenance attestation                      | No code signing; no supply-chain verification                      |
| PR.IP-3 — Change control             | Partial | Git-based; PRs via GitHub                                                     | No formal change-advisory board                                    |
| PR.MA-1 — Maintenance                | Partial | Podman images rebuilt regularly                                               | No automated patch management                                      |

### 2.3 Detect (DE)

| Control                      | Status  | Evidence                                                      | Gap                                                  |
| ---------------------------- | ------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| DE.AE-1 — Audit events       | Yes     | 126+ event types; global audit explorer; filtering/pagination | Good                                                 |
| DE.CM-1 — Network monitoring | Partial | Prometheus scrapes API metrics; no network-level monitoring   | No network flow logs; no DLP                         |
| DE.DP-1 — Anomaly detection  | No      | —                                                             | No ML or rule-based anomaly detection on logs/events |

### 2.4 Respond (RS)

| Control                  | Status  | Evidence                                                        | Gap                                            |
| ------------------------ | ------- | --------------------------------------------------------------- | ---------------------------------------------- |
| RS.RP-1 — Response plan  | No      | —                                                               | No incident response runbook                   |
| RS.CO-1 — Communications | No      | —                                                               | No stakeholder communication plan for breaches |
| RS.AN-1 — Analysis       | Partial | Audit trail enables forensic analysis                           | No incident timeline automation                |
| RS.MI-1 — Containment    | Partial | Kill switch blocks all writeback; policy can disable connectors | No automated containment playbooks             |
| RS.IM-1 — Improvement    | No      | —                                                               | No post-incident review process documented     |

### 2.5 Recover (RC)

| Control                 | Status  | Evidence                                             | Gap                                          |
| ----------------------- | ------- | ---------------------------------------------------- | -------------------------------------------- |
| RC.RP-1 — Recovery plan | Partial | Backup/restore scripts exist                         | Not tested end-to-end in a disaster scenario |
| RC.RP-2 — Restoration   | Partial | PostgreSQL persistence proven (pod restart survival) | No full-cluster restore from backup proven   |
| RC.IM-1 — Improvements  | No      | —                                                    | No lessons-learned process                   |

## 3. NIS2-Specific Obligations

| NIS2 Requirement                      | Status               | Notes                                              |
| ------------------------------------- | -------------------- | -------------------------------------------------- |
| Register as OES/OV                    | Not applicable (MVP) | Would apply if offered as a service to EU entities |
| Report significant incidents to CSIRT | No process           | Needs incident response runbook first              |
| Supply-chain security                 | Partial              | No SBOM; no vendor security assessments            |
| Vulnerability handling                | Partial              | Dependabot not enabled; no CVE tracking visible    |
| Cryptography                          | Partial              | Passwords hashed; no TLS/mTLS proven               |

## 4. Recommended Actions

1. **Create incident response runbook** (`docs/RUNBOOK_INCIDENT_RESPONSE.md`) — P0 for NIS2 readiness.
2. **Enable TLS/mTLS** for intra-cluster communication and external ingress.
3. **Generate SBOM** and establish dependency update cadence.
4. **Test backup/restore** end-to-end on a fresh host to validate RTO/RPO.
5. **Add anomaly detection** on audit events (e.g., unusual login patterns, mass export requests).

---

_This map is a readiness self-assessment, not a CyberFundamentals or NIS2 certification._
