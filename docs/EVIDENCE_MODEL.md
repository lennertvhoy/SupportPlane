# Evidence Model

Evidence bundles are exportable records of support interactions. They should
help answer what context was used, what was suggested, what was approved or
blocked, what was executed, and what was written back.

## EvidenceBundle Contents

Planned bundle sections:

- SupportSession timeline
- customer and ticket references
- AIContextPacket hashes and redaction status
- AI outputs and model metadata
- actions proposed
- policy decisions
- approvals and rejections
- tool results
- connector writebacks
- screen observations when enabled
- audit event references

## Storage

PostgreSQL stores bundle metadata and object storage holds generated exports,
optional redacted screenshots, large diagnostic outputs, attachments, and
transcripts if tenant policy allows them.

## Retention

Default design should minimize raw screen storage, prefer summaries over
retained screenshots, and allow tenant-level retention settings.

## Acceptance Freezes

Accepted user-facing milestones should be recorded in
`docs/ACCEPTANCE_FREEZES.md` with source, runtime identity, routes/endpoints,
and evidence references.
