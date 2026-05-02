# SupportPlane Documentation Standard

**Purpose:** Define the enterprise-grade documentation format, ownership,
review cadence, and update triggers for all SupportPlane project documentation.

This standard is enforced by the doc freshness gate in `AGENTS.md`. No
coding-agent session may close if documentation is stale or contradictory.

## Doc Categories

Every document in `docs/` belongs to one of the following categories:

| Category | Owner | Update Trigger |
|----------|-------|----------------|
| Product/State | CTO/coding-agent | When project truth changes |
| Architecture | CTO/coding-agent | When architecture or contracts change |
| Operations/Runbooks | CTO/coding-agent | When deployment or operational procedures change |
| Security/Governance | CTO/coding-agent | When security model, threats, or policy changes |
| Integration | CTO/coding-agent | When connector or integration behavior changes |
| Self-Hosted/Kubernetes | CTO/coding-agent | When sandbox/cluster topology or services change |
| Endpoint/Windows | CTO/coding-agent | When endpoint agent or platform behavior changes |
| Evidence | coding-agent | When evidence is captured or accepted |
| Historical Reports | none (frozen) | Never updated after closure |

The category assignment is recorded in `docs/README.md` (the docs index).

## Format Requirements

### All Docs Must Include

1. **Title and purpose** — A heading and one-sentence purpose statement.
2. **Current-truth scope** — What this doc covers and what it does not claim.
3. **Non-claims** — Explicit list of what the doc does NOT guarantee or cover,
   when applicable (especially for mock-only, sandbox-only, or partial features).
4. **Last-updated signal** — A date or session reference indicating freshness.
   State files (`STATUS.md`, `PROJECT_STATE.yaml`, `NEXT_ACTIONS.md`,
   `BACKLOG.md`) use explicit timestamps. Architecture and integration docs
   may use the git log as the freshness signal.

### Prohibited Patterns

- **No stale status markers** — Do not leave `[planned]` or `[accepted]`
  markers in docs that contradict `BACKLOG.md` truth.
- **No TODO drift** — A `TODO` or `FIXME` in a doc must be linked to a
  backlog item or explicitly marked as a known gap with a reason.
- **No fake completeness** — Do not write docs that imply a feature is
  production-ready when it is mock-only or partial.
- **No orphaned cross-references** — Every cross-reference must point to a
  file that exists. Broken paths must be fixed or removed.
- **No DESIGN.md** — A standalone `DESIGN.md` is forbidden; design content
  belongs in named, purpose-scoped docs like `REAL_WRITEBACK_PATH_DESIGN.md`.

## Update Triggers

The following events require doc updates:

| Event | Docs to Update |
|-------|----------------|
| Backlog item status changes | `BACKLOG.md`, `NEXT_ACTIONS.md`, `STATUS.md`, `PROJECT_STATE.yaml` |
| New feature implemented | All relevant `docs/*` files, `docs/README.md` index |
| Behavior changes at runtime | Affected architecture/integration/runbook docs |
| Evidence captured | `docs/EVIDENCE_LOG.md` |
| Milestone accepted | `docs/ACCEPTANCE_FREEZES.md`, `STATUS.md`, `PROJECT_STATE.yaml` |
| Doc added or removed | `docs/README.md` index |
| Connector or integration change | Affected integration doc, `CONNECTOR_RUNTIME_CONTRACT.md` if applicable |
| Security or policy change | Affected security/governance docs, `THREAT_MODEL.md` |

## Review Cadence

- **Every coding-agent session:** Doc freshness gate enforced per `AGENTS.md`.
- **Every acceptance freeze:** All docs in the affected category are reviewed
  for consistency with code and runtime.
- **Quarterly or on request:** Full doc inventory review against `docs/README.md`.

## Quality Gate

The `scripts/check_docs_hygiene.py` script validates:

1. Required state docs exist (`AGENTS.md`, `STATUS.md`, `PROJECT_STATE.yaml`,
   `PROJECT_DNA.yaml`, `NEXT_ACTIONS.md`, `BACKLOG.md`, `WORKLOG.md`,
   `docs/EVIDENCE_LOG.md`, `docs/ACCEPTANCE_FREEZES.md`).
2. `docs/README.md` index lists every `.md` file in `docs/`.
3. AGENTS.md contains the doc freshness gate checklist.
4. No references to a standalone `DESIGN.md`.
5. Open backlog items for doc hygiene (e.g., BL-134) have corresponding
   checklist enforcement.

Run: `python3 scripts/check_docs_hygiene.py`

## Historical Reports

Docs like `BL-094-REPORT.md` are closure reports for specific backlog items.
They are frozen after the item is accepted and should not be updated. They
are categorized as "Historical Reports" in the docs index and are explicitly
not living documentation.
