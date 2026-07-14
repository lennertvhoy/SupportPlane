# SupportPlane Documentation Index

Enterprise-grade documentation index for the SupportPlane project.
The primary project guide lives in the repository root `README.md`.

## Documentation Standard

All project documentation follows the standard defined in
`docs/DOC_STANDARD.md`. Every doc must have a purpose, an owner category,
and must be updated when the behavior it describes changes. The doc freshness
gate in `AGENTS.md` requires that no session closes with stale or
contradictory documentation.

## Product and State Docs

These files define current project truth, governance, and workflow state.

| File                    | Purpose                                                              |
| ----------------------- | -------------------------------------------------------------------- |
| `EVIDENCE_LOG.md`       | Proof ledger for user-facing claims and external planning references |
| `ACCEPTANCE_FREEZES.md` | Accepted user-facing milestone ledger                                |
| `BOOTSTRAP_QUALITY.md`  | Rubric for judging bootstrap output quality                          |
| `REALITY_MATRIX.md`     | System-by-system real vs mock vs sandbox status inventory            |
| `adr/0001-stateware-public-naming.md` | Stateware public terminology and legacy identifier boundary |

## Architecture Docs

Product architecture, contracts, and design boundaries.

| File                            | Purpose                                                     |
| ------------------------------- | ----------------------------------------------------------- |
| `ARCHITECTURE.md`               | Product architecture baseline                               |
| `PERSISTENCE.md`                | Database schema, Prisma conventions, and migration strategy |
| `CONNECTOR_CONTRACTS.md`        | Connector interfaces and integration order                  |
| `CONNECTOR_RUNTIME_CONTRACT.md` | Connector runtime config, readiness, and schema discovery   |
| `EVIDENCE_MODEL.md`             | Evidence bundle and acceptance-freeze model                 |
| `ACTION_OUTBOX_WORKFLOW.md`     | Durable action/outbox workflow design                       |
| `DELIVERY_POLICY_CONTROLS.md`   | Writeback readiness gates and delivery policy               |
| `SUPPORT_CASE_WORKFLOW.md`      | End-to-end support case workflow                            |
| `REAL_WRITEBACK_PATH_DESIGN.md` | Design doc for future real writeback (no implementation)    |
| `BOUNDARY_MATRIX.md`            | Strict capability boundary matrix (real vs mock vs sandbox) |
| `WORKFLOW_TRUTH.md`             | Workflow truth matrix for current runtime state             |

## Operations and Runbooks

Operational guides for local development, deployment, and maintenance.

| File                          | Purpose                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| `LOCAL_DEVELOPMENT.md`        | Local development setup, env vars, and runbook                     |
| `DEMO_GUIDE.md`               | Demo walkthrough guide                                             |
| `DEMO_RUNBOOK.md`             | Demo reset and operation runbook                                   |
| `ENTERPRISE_DEMO_GUIDE.md`    | Enterprise-grade demo guide with credible sandbox-backed scenarios |
| `RELEASE_RUNBOOK.md`          | Release packaging and deployment runbook                           |
| `RUNBOOK_BACKUP_RESTORE.md`   | PostgreSQL and object storage backup/restore                       |
| `MVP_COMPLETION_AUDIT.md`     | MVP completion audit record                                        |
| `OUTBOX_WORKER_OPERATIONS.md` | Background outbox worker retry and dead-letter operations          |
| `USER_TESTING_GUIDE.md`       | User testing guide for non-technical testers                       |
| `TESTER_FEEDBACK_TEMPLATE.md` | Tester feedback collection template                                |
| `KNOWN_DEMO_LIMITATIONS.md`   | Honest list of current demo limitations                            |

## User Testing Docs

| File                                               | Purpose                                                                                                  |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `user-testing/README.md`                           | Tester onboarding: what the demo is, login, flows, limitations                                           |
| `user-testing/TEST_SCRIPT.md`                      | 20-30 minute guided test script across 5 flows                                                           |
| `user-testing/FEEDBACK_FORM.md`                    | Structured tester feedback form                                                                          |
| `user-testing/BUG_REPORT_TEMPLATE.md`              | Bug report submission template                                                                           |
| `user-testing/TESTER_PERSONAS.md`                  | 5 tester personas with testing focus                                                                     |
| `user-testing/TRIAGE_WORKFLOW.md`                  | Feedback triage process, severity levels, tagging taxonomy                                               |
| `user-testing/FEEDBACK_LOG.md`                     | Feedback log tracking table                                                                              |
| `user-testing/FIRST_TEST_ROUND.md`                 | First test round packet with demo URL, flows, limitations, and submission instructions                   |
| `user-testing/TEST_ROUND_001_PLAN.md`              | Test round 001 plan with date, testers, personas, success criteria, and stop-testing rules               |
| `user-testing/TEST_ROUND_001_INTERNAL_DRY_RUN.md`  | Internal dry run findings for round 001                                                                  |
| `user-testing/SEND_TO_TESTERS.md`                  | Copy-pasteable tester invitation packet with access instructions, flows, and known limitations           |
| `user-testing/OPERATOR_CHECKLIST.md`               | Demo operator step-by-step checklist: start, reset, smoke test, assign persona, collect feedback, triage |
| `user-testing/TEST_ROUND_001_PREFLIGHT_DRY_RUN.md` | Preflight dry run after reset — verified GO for real testers, GLPI seed fix applied                      |
| `user-testing/OBSERVATION_NOTES_TEMPLATE.md`       | Structured template for operator observation during tester sessions                                      |
| `user-testing/TEST_ROUND_001_CONTROL.md`           | Test round 001 control sheet: tester slots, persona assignments, pre/post checklists                     |
| `user-testing/OUTREACH_MESSAGE.md`                 | Copy-pasteable tester invitation message with intro, credentials, sandbox warning                        |
| `user-testing/POST_TEST_DEBRIEF.md`                | Post-test debrief template: surprise, trust, distrust, improvements, quotes                              |
| `user-testing/FEEDBACK_TO_BACKLOG_RULES.md`        | P0-P3 severity classification, tagging taxonomy, triage workflow per tester                              |

## Security and Governance

Security model, threat modeling, AI governance, and policy.

| File                                     | Purpose                                                                    |
| ---------------------------------------- | -------------------------------------------------------------------------- |
| `SECURITY_MODEL.md`                      | Identity, authorization, tenant isolation, secrets, tools, and audit model |
| `AI_GOVERNANCE.md`                       | AI boundaries, context packets, model gateway, and governance references   |
| `THREAT_MODEL.md`                        | Initial bootstrap threat model                                             |
| `AUTHORIZATION.md`                       | Authorization and RBAC model                                               |
| `SCREEN_CONTEXT_SAFETY.md`               | Screen observation safety, consent, and privacy boundaries                 |
| `TICKET_CONTEXT_CONNECTOR_SAFETY.md`     | Ticket context connector safety boundaries                                 |
| `OIDC_READINESS.md`                      | OIDC/Keycloak readiness status                                             |
| `security/SECURITY_REGRESSION_MATRIX.md` | Security regression test matrix                                            |
| `security/THREAT_MODEL.md`               | Detailed threat model with threat categories                               |

## Compliance and Assurance

Belgium/EU readiness prechecks and compliance evidence. These are **readiness/precheck documents**, not certifications or legal opinions.

| File                                           | Purpose                                                                       |
| ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `compliance/ASSURANCE_EVIDENCE_INDEX.md`       | Master index of compliance evidence areas, existing proof, and gaps           |
| `compliance/GDPR_DATA_INVENTORY.md`            | Personal data categories, sources, retention, export, delete, redaction notes |
| `compliance/DPIA_PRECHECK.md`                  | Likely DPIA triggers and risk-level assessment                                |
| `compliance/AI_ACT_CLASSIFICATION_PRECHECK.md` | AI feature inventory and candidate EU AI Act risk classification              |
| `compliance/BELGIUM_NIS2_CYFUN_READINESS.md`   | NIS2 / CyberFundamentals control mapping with honest gaps                     |
| `compliance/ACCESSIBILITY_AUDIT.md`            | Initial accessibility pass: known issues, improvements, backlog               |
| `compliance/SUPPLY_CHAIN_AUDIT.md`             | Dependency/SBOM status, license gap, container hardening recommendations      |
| `compliance/OPERATIONAL_READINESS_AUDIT.md`    | Backup/restore, incident response gap, health checks, runbook status          |

## Integration Docs

Connector-specific documentation for external system integrations.

| File                      | Purpose                                                        |
| ------------------------- | -------------------------------------------------------------- |
| `GLPI_CONNECTOR.md`       | GLPI connector read path, sandbox deployment, and safety gates |
| `ZAMMAD_CONNECTOR.md`     | Zammad connector read/write path and sandbox labels            |
| `TELEPHONY_ADAPTERS.md`   | Telephony adapter contracts and bridge boundary                |
| `CALL_CONSOLE.md`         | Call Console UI and telephony integration                      |
| `CALL_SIMULATOR.md`       | Fake incoming call webhook and simulator                       |
| `CALL_RECORDINGS.md`      | Call recording status (not implemented)                        |
| `GREETING_SUGGESTIONS.md` | AI greeting suggestion flow                                    |
| `OSTICKET_TRIAGE.md`      | osTicket read-only adapter foundation                          |
| `OPERATOR_COMPANION.md`   | Operator companion screen context design                       |

## Self-Hosted and Kubernetes Docs

Local sandbox, Kubernetes, and self-hosted stack documentation.

| File                                | Purpose                                     |
| ----------------------------------- | ------------------------------------------- |
| `SELF_HOSTED_STACK.md`              | Self-hosted service register                |
| `LOCAL_KUBERNETES_PODMAN_TARGET.md` | Local Kubernetes-on-Podman target           |
| `KUBERNETES_SERVICE_CATALOG.md`     | Kubernetes workload/service catalog         |
| `REAL_E2E_SANDBOX_FLOW.md`          | Target E2E flow and real/mock status matrix |
| `SANDBOX_INTEGRATION_ACCEPTANCE.md` | Acceptance gates for sandbox integrations   |
| `IMPLEMENTATION_PHASES_REAL_E2E.md` | Phase plan for real E2E sandbox             |
| `BACKLOG_REAL_E2E_ROADMAP.md`       | Current-to-future backlog mapping           |

## Endpoint and Windows Docs

Endpoint agent and Windows platform documentation.

| File                                       | Purpose                                                           |
| ------------------------------------------ | ----------------------------------------------------------------- |
| `WINDOWS_ENDPOINT_SUPPORT.md`              | Windows endpoint compatibility, collectors, and packaging         |
| `WINDOWS_ENDPOINT_VERIFICATION_RUNBOOK.md` | Windows endpoint manual verification runbook and BL-133 checklist |

## Evidence Bundles

| File                  | Purpose                                           |
| --------------------- | ------------------------------------------------- |
| `EVIDENCE_BUNDLES.md` | Evidence bundle format, content model, and export |
| `evidence/`           | Evidence artifact storage directory               |

## Reviews and Audits

Structured audit and review artifacts for governance, quality, and backlog
tracking. These are living documents when they guide active work; historical
when superseded.

| File                                                               | Purpose                                                                                                     |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| `reviews/PROJECT_IMPROVEMENT_AUDIT_2026-05-04.md`                  | Comprehensive project improvement audit (runtime identity, model-usage, tool-registry, UX, test quality)    |
| `reviews/AUTOMATION_DESIGN_ASSURANCE_BACKLOG_REVIEW_2026-05-05.md` | Automation, design, and assurance backlog review (CI/CD, tests, security, accessibility, logo, house style) |

## Historical Reports

These files document specific backlog item closures and are retained for
audit trail purposes. They are not maintained as living documentation.

| File               | Purpose                                        |
| ------------------ | ---------------------------------------------- |
| `BL-094-REPORT.md` | BL-094 delivery policy controls closure report |

## Rules

- Put evidence in `docs/EVIDENCE_LOG.md`.
- Put accepted user-facing milestones in `docs/ACCEPTANCE_FREEZES.md`.
- Do not use generated or temporary paths as durable evidence references.
- Keep historical notes in `WORKLOG.md`, not in current-status docs.
- When adding or removing a doc, update this index immediately.
- Follow `docs/DOC_STANDARD.md` for format and update triggers.
