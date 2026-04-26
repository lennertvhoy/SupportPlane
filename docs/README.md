# Documentation

This folder holds durable SupportPlane documentation and evidence.

The primary project guide lives in the repository root `README.md`.

## Current Files

- `ARCHITECTURE.md` - product architecture baseline
- `SECURITY_MODEL.md` - identity, authorization, tenant isolation, secrets, tools, and audit model
- `AI_GOVERNANCE.md` - AI boundaries, context packets, model gateway, and governance references
- `CONNECTOR_CONTRACTS.md` - connector interfaces and integration order
- `EVIDENCE_MODEL.md` - evidence bundle and acceptance-freeze model
- `THREAT_MODEL.md` - initial bootstrap threat model
- `EVIDENCE_LOG.md` - ledger of verification artifacts and planning references
- `ACCEPTANCE_FREEZES.md` - accepted milestone ledger
- `BOOTSTRAP_QUALITY.md` - rubric for judging bootstrap output

## Rules

- Put evidence in `docs/EVIDENCE_LOG.md`.
- Put accepted user-facing milestones in `docs/ACCEPTANCE_FREEZES.md`.
- Do not use generated or temporary paths as durable evidence references.
- Keep historical notes in `WORKLOG.md`, not in current-status docs.
