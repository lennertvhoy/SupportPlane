# DPIA Precheck — Data Protection Impact Assessment Readiness

> **Status:** Readiness / Precheck — NOT a completed DPIA or legal sign-off.  
> **As of:** 2026-05-04

## 1. Likely DPIA Triggers (EDPB Guidelines)

SupportPlane processes personal data in contexts that may trigger a DPIA under GDPR Article 35:

| Trigger | Present? | Risk Level | Notes |
|---------|----------|------------|-------|
| **Systematic monitoring** | Partial | Medium | Audit logging is comprehensive (126+ event types). Not ambient surveillance, but all user actions are logged. |
| **Sensitive data / special categories** | No (current) | Low | No health, biometric, or racial data processed in MVP. Future screen OCR could touch sensitive app content. |
| **Large-scale processing** | No (current) | Low | Sandbox/demo scale only. Production scale would raise this. |
| **Vulnerable subjects** | No (current) | Low | End users are employees/customers, not children or vulnerable groups. |
| **Automated decision-making with legal/significant effects** | No | Low | AI drafts suggestions only; no automated ticket closure, rating, or legal decision. Human review is mandatory. |
| **Employee monitoring** | Partial | Medium | Endpoint diagnostics read device state (services, software, disk). No screen capture or keystroke logging. |
| **AI / profiling** | Partial | Medium | AI generates drafts/summaries from personal data. Policy gating and audit trail exist, but no formal fairness review. |

## 2. High-Risk Processing Areas

### 2.1 Endpoint Diagnostics (Medium → High if expanded)
- **What:** Inventory, disk, network, services, software collection from enrolled devices.
- **Current control:** Read-only fixed commands only; arbitrary shell blocked; approval required for remediation; tenant/device scoping.
- **Residual risk:** Device enrollment token could be leaked; software inventory may reveal personal applications.
- **Mitigation needed:** Deeper consent model (BL-118 gap); explicit user notification before enrollment.

### 2.2 Screen Observation / Operator Companion (Medium)
- **What:** Active-window metadata capture, manual screenshot metadata, structured redacted context upload.
- **Current control:** Mock-only in UI; no real OS active-window capture; redaction applied before storage; explicit sharing indicator; review gate before AI context packet.
- **Residual risk:** If real capture is implemented later, it becomes high-risk without explicit consent and retention limits.
- **Mitigation needed:** Keep mock-only until privacy design is accepted (BL-119/BL-120 deferred).

### 2.3 AI Recommendations / Draft Generation (Medium)
- **What:** Model generates draft responses, greetings, summaries from ticket personal data.
- **Current control:** Tenant AI policy enforced before every call; output retention mode configurable; redaction before model context; no autonomous send; audit events for every generation.
- **Residual risk:** Hallucination could expose data in unexpected ways; local Ollama model is not audited for bias.
- **Mitigation needed:** Human-in-the-loop is enforced; no automated writeback without approval.

### 2.4 Call Metadata & Recording (Low → Medium if PSTN added)
- **What:** Caller ID, normalized phone number, call events, session auto-creation.
- **Current control:** Asterisk AMI events only; no recording; no transcription; no PSTN.
- **Residual risk:** Phone numbers are personal data; call timeline retains them indefinitely.
- **Mitigation needed:** Retention policy should cover call events; purge worker needed.

### 2.5 Ticket Personal Data (Medium)
- **What:** Customer names, emails, ticket subjects, internal notes loaded from Zammad/GLPI.
- **Current control:** Tenant-scoped; RBAC; secret redaction; evidence bundles strip tokens.
- **Residual risk:** Ticket content may contain sensitive personal data from end customers.
- **Mitigation needed:** AI context redaction layer handles patterns, but not semantic PII detection.

## 3. DPIA Readiness Checklist

| DPIA Section | Status | Evidence |
|--------------|--------|----------|
| Description of processing | Partial | `GDPR_DATA_INVENTORY.md`, `PROJECT_DNA.yaml` |
| Necessity and proportionality | Partial | Policy gating, kill switch, approval gates exist |
| Risk assessment | Partial | Threat model (`docs/THREAT_MODEL.md`) |
| Measures to address risks | Partial | RBAC, audit, redaction, tenant isolation proven |
| Stakeholder consultation | Not done | — |
| DPO opinion | Not done | — |

## 4. Recommended Actions

1. **Formal DPIA document** — Create `docs/compliance/DPIA_FORMAL.md` when processing scales beyond sandbox.
2. **Consent model for endpoint enrollment** — Require explicit end-user acknowledgment before device enrollment.
3. **Screen capture privacy design** — Complete before BL-119/BL-120 implementation.
4. **AI fairness/bias review** — Document model selection rationale and known limitations.
5. **Retention policy enforcement** — Implement purge worker (currently `autoPurgeEnabled` is locked off).

---
*This precheck identifies likely triggers and risks but does not replace a formal DPIA.*
