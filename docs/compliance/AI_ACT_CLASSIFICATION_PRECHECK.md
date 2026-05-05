# EU AI Act Classification Precheck

> **Status:** Readiness / Precheck — NOT a formal AI Act risk classification dossier.  
> **As of:** 2026-05-04  
> **Model in use:** Local Ollama `gemma4:e4b` (8B param, Q4_K_M), with `fallbackUsed=false`, `noCloudCall=true`.

## 1. AI System Definition

SupportPlane uses AI to **reason, summarize, suggest, and draft** support content. It does **not** make autonomous decisions, execute privileged actions, or bypass human review.

## 2. AI Feature Inventory

| Feature                        | Input Data                                          | Output              | Human Oversight                                                | Policy Gate                                | Audit Event                                 | Risk Candidate           |
| ------------------------------ | --------------------------------------------------- | ------------------- | -------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------- | ------------------------ |
| **Draft generation**           | Ticket context, customer data, operator instruction | Internal note draft | Required (review checkbox + disabled writeback until reviewed) | `allowDraftGeneration`, `mockOnly` default | `ai_draft_generated`                        | Limited risk             |
| **Greeting suggestion**        | Call event + ticket context                         | Greeting text       | Operator decides to use                                        | Tenant AI policy                           | `greeting_suggestion_generated`             | Minimal risk             |
| **Ticket summary**             | Ticket + customer + session context                 | Summary text        | Admin/operator views; no auto-action                           | Tenant AI policy                           | `ticket_summary_generated`                  | Limited risk             |
| **Chat (admin AI)**            | Operator messages + session context                 | Assistant reply     | Reviewed in chat thread                                        | Tenant AI policy, output retention         | `ai_chat_message_generated`                 | Limited risk             |
| **Screen observation summary** | Structured screen metadata (mock-only)              | Contextual summary  | Review gate before packet creation                             | Mock-only currently                        | `screen_observation_context_packet_created` | Minimal risk (mock-only) |

## 3. Risk Classification Assessment

### 3.1 Prohibited Practices (Article 5)

| Practice                                            | Present? | Evidence                         |
| --------------------------------------------------- | -------- | -------------------------------- |
| Subliminal techniques                               | No       | No manipulation of user behavior |
| Exploitation of vulnerabilities                     | No       | No targeting of age/disability   |
| Social scoring                                      | No       | No scoring of individuals        |
| Real-time biometric identification in public spaces | No       | No biometric data processing     |
| Emotion recognition in workplace/education          | No       | No emotion detection             |
| Untargeted scraping of facial images                | No       | No facial image collection       |

**Conclusion:** No prohibited practices identified.

### 3.2 High-Risk Systems (Annex III)

| Annex III Area                     | Applicable? | Reasoning                                                                                            |
| ---------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------- |
| Critical infrastructure            | No          | Not managing traffic, water, gas, electricity                                                        |
| Education / vocational training    | No          | Not an educational system                                                                            |
| Employment / worker management     | Partial     | Endpoint diagnostics + AI suggestions touch worker devices, but no hiring/firing/promotion decisions |
| Access to essential services       | No          | Not credit scoring, insurance, or welfare                                                            |
| Law enforcement                    | No          | Not used by police/judicial authorities                                                              |
| Migration / border control         | No          | Not applicable                                                                                       |
| Administration of justice          | No          | Not applicable                                                                                       |
| Biometrics                         | No          | No biometric identification                                                                          |
| General-purpose AI (systemic risk) | No          | `gemma4:e4b` is a small local model; not a general-purpose AI model with systemic risk               |

**Conclusion:** Not a high-risk system under Annex III as currently scoped.

### 3.3 Limited Risk / Transparency Obligations (Article 50)

| Obligation             | Status         | Evidence                                                                                      |
| ---------------------- | -------------- | --------------------------------------------------------------------------------------------- |
| AI disclosure to users | Partial        | UI shows "Mock AI only" and "review required"; no explicit "AI-generated" watermark on drafts |
| Deepfake labeling      | Not applicable | No image/video generation                                                                     |

### 3.4 Minimal Risk

Most SupportPlane AI features fall here: human-in-the-loop, no autonomous action, local model, sandbox-only.

## 4. Governance Controls Relevant to AI Act

| Requirement             | SupportPlane State                                                  | Gap                                                    |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------------------------ |
| Risk management system  | Partial — threat model + policy gates                               | No formal risk management system document              |
| Data governance         | Partial — redaction + retention policy                              | No training data governance (model is pre-trained)     |
| Technical documentation | Partial — `docs/AI_PROVIDER_READINESS.md`, model usage logs         | No formal technical documentation package              |
| Record-keeping          | Yes — `AuditEvent`, `ModelUsageLog`, evidence bundles               | Good coverage                                          |
| Transparency            | Partial — UI labels exist                                           | Could strengthen "AI-generated" marking on all outputs |
| Human oversight         | Yes — mandatory review before writeback; approval gates for actions | Strong                                                 |
| Accuracy / robustness   | Partial — local deterministic model; no formal accuracy testing     | No benchmark suite for support-domain accuracy         |
| Cybersecurity           | Partial — AppSec baseline, no pen test                              | Needs hardening for production                         |

## 5. Honest Limitations

- No legal review of this classification.
- Model selection (`gemma4:e4b`) is based on pragmatic local runtime constraints, not a formal model card or bias audit.
- Cloud AI provider slots exist but are disabled; enabling them would change the risk profile.
- Future features (autonomous triage, sentiment-based escalation) could move the system toward limited or high risk.

## 6. Recommended Actions

1. Add explicit "AI-generated" badge/watermark to all draft/summary/chat outputs.
2. Create a lightweight **model card** for `gemma4:e4b` documenting known limitations.
3. Document the **human-in-the-loop** workflow as a formal oversight procedure.
4. Review classification if any Annex III scope is added (e.g., worker management features).

---

_This precheck is an engineering self-assessment, not a legal AI Act classification._
