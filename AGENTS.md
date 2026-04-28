---
repo_mode: operating
initialized_on: 2026-04-26
last_updated: 2026-04-28
---

# State Driven Development Template Contract

**Purpose:** Stable operating contract for technical projects that use explicit state, evidence, and short active queues.

This repository supports two modes:
- `bootstrap` for discovery and baseline creation
- `operating` for steady-state delivery

## Read Order

Coding agents should start every repo session by reading:
1. `AGENTS.md`
2. `STATUS.md`
3. `PROJECT_STATE.yaml`
4. `PROJECT_DNA.yaml`
5. `NEXT_ACTIONS.md`

Read `BACKLOG.md` and `WORKLOG.md` when planning or reviewing history.

## Universal Rules

These rules apply in all modes:
- no fake completeness
- no unverified claims presented as fact
- user-facing behavior requires direct verification
- user-facing acceptance requires runtime identity proof, not screenshots alone
- negative searches stay negative: use `not found`, `not currently locatable`, or `not proven`
- screenshots or evidence are required for user-visible changes
- each backlog item gets exactly one screenshot folder under `output/playwright/`;
  name it clearly (e.g., `session-046-operator-companion-closure-canonical/`).
  if a canonical or final proof set supersedes an earlier partial folder,
  delete the old folder and update all doc references. do not leave multiple
  folders for the same backlog item
- active queue stays short
- history belongs in `WORKLOG.md`, not live state files
- structured state must remain machine-checkable
- end each implementation session with a handoff and hygiene check
- `README.md` is the primary project guide

## Current Mode

This repo currently operates in: `operating`

SupportPlane bootstrap completed on 2026-04-26. The repo has a truthful product
baseline and active queue, but no product runtime exists yet.

## Bootstrap Mode

### When Bootstrap Mode Applies
Use bootstrap mode when:
- the repo is new
- state files do not yet exist
- project truth is unclear
- the user explicitly asks for initialization or re-baselining

### Bootstrap Goal
Establish a truthful operating baseline for the project, including filled state
files and a real backlog, and only then switch the repo to operating mode.

### Bootstrap Procedure
1. Investigate the host system and runtime
2. Investigate the repo structure and implementation reality
3. Ask the user only the minimum strategic questions needed
4. Use the CTO lane for brainstorming, research, contradiction resolution, architecture framing, and backlog shaping
5. Generate and fill the state and governance files truthfully
6. Mark unknowns honestly
7. Create the initial backlog and next-actions queue
8. Update this file to operating mode only when bootstrap is complete
9. Record bootstrap completion in `PROJECT_STATE.yaml` and `WORKLOG.md`

### Required System Investigation
Inspect and record, when relevant:
- OS, distro, kernel
- shell and terminal environment
- package manager(s)
- language/runtime versions
- container/runtime tooling
- browser/debug tooling
- active ports and services
- git branch, head, and worktree state

### Required Repo Investigation
Inspect and record:
- top-level structure
- app/service boundaries
- main manifests and config files
- likely entrypoints
- test setup
- deployment assumptions
- contradictions between code and docs

### Bootstrap Output Files
Create or initialize:
- `AGENTS.md`
- `STATUS.md`
- `PROJECT_STATE.yaml`
- `PROJECT_DNA.yaml`
- `PROJECT_ADAPTER.yaml`
- `NEXT_ACTIONS.md`
- `BACKLOG.md`
- `WORKLOG.md`
- `docs/EVIDENCE_LOG.md`
- `docs/ACCEPTANCE_FREEZES.md`

Bootstrap is not complete until these files are filled out enough to guide real
implementation and `BACKLOG.md` is more than a placeholder.

### Bootstrap Honesty Rules
If something is not proven, label it as:
- `observed`
- `unknown`
- `reported`
- `assumed`
- `blocked`
- `stale`
- `invalid`

Do not invent architecture or maturity.

## Operating Mode

### Operating Model
The repo now runs in a human-in-the-loop workflow:
- CEO / human provides current state, requirements, priorities, and agent handoffs
- CTO / product-architecture lead reconstructs truth from user-relayed handoffs and pasted context, judges quality, chooses the next best move, and writes the next coding-agent prompt when appropriate
- coding agent implements one coherent step with verification and evidence, then ends with a final handoff for the CTO lane

The CTO role can be handled by ChatGPT, Claude, Gemini, or another separate AI chat.
Use `prompts/CTO_SESSION_PROMPT.md` as the startup prompt for that chat.
Assume the CTO lane does not have direct repo access unless the human pastes
state, screenshots, or other context into that chat.

Use the CTO lane for all non-trivial work. Non-trivial means any task involving
multiple files, architecture changes, user-facing behavior, integrations,
migrations, state-structure changes, or work likely to take more than one prompt.
Each non-trivial loop should normally start a fresh coding-agent session.
During initial bootstrap, an initial coding-agent session may come first so it
can read the repo contract, detect `bootstrap` mode, and ask the minimum
strategic questions needed before the CTO loop fully takes over.
Bootstrap should remain a joint CTO + coding-agent phase until the repo truth,
architecture, backlog, and active queue are ready for implementation mode.

A valid CTO handoff should define the verified current state, one coherent scope,
required verification, and the exit condition for the implementation step. If
important context is not preserved in repo state files, the CTO prompt must
restate it explicitly for the next coding-agent session.
In operating mode, the scope should usually be a backlog slice or a very small
set of tightly related backlog items.

### CTO Review Standard
Every handoff must be reviewed for:
- contradictions
- overclaims
- missing proof
- brittle logic
- wrong sequencing
- architectural drift
- weak product prioritization

### Coding-Agent Standard
Implementation prompts must:
- require reading `AGENTS.md` first
- anchor on current verified truth
- define one coherent scope
- forbid overclaiming
- require direct verification
- require runtime identity proof before accepting or investigating user-facing behavior
- require state and doc updates when truth changes
- require screenshots/evidence for user-facing work
- require the coding agent to ask the user to provide a CTO agent if no CTO lane or CTO handoff exists yet for non-trivial work
- require the coding agent to end with one final handoff message suitable for pasting into the CTO lane
- require the coding agent, when starting in unclear bootstrap mode, to ask the minimum strategic questions needed before implementation

If the tool supports subagents or parallel workers and the task clearly benefits,
the CTO lane may encourage using them. This is optional guidance, not a baseline
workflow requirement.

## State Files

- `STATUS.md` = short human truth snapshot
- `PROJECT_STATE.yaml` = structured current truth
- `PROJECT_DNA.yaml` = stable architecture contract
- `PROJECT_ADAPTER.yaml` = optional project-specific vocabulary/runtime adapter
- `NEXT_ACTIONS.md` = active queue only
- `BACKLOG.md` = strategic roadmap with stable backlog IDs
- `WORKLOG.md` = append-only history
- `docs/EVIDENCE_LOG.md` = proof ledger
- `docs/ACCEPTANCE_FREEZES.md` = accepted user-facing milestone ledger

## Handoff Requirements

Every implementation session ends with:
- what changed
- what was directly verified
- repo path
- branch
- what remains partial or risky
- git head
- process or container serving the verified artifact
- port or endpoint used for verification
- whether the running artifact was rebuilt in this slice
- clean worktree status
- evidence references
- absolute file paths for evidence artifacts when available
- next recommended action
- handoff wording suitable for direct paste into the CTO chat

### Closure-grade validation gate (mandatory)

A backlog item may **not** be claimed complete unless the final handoff includes:
- full final commit hash
- clean worktree proof (`git status --short --branch`)
- exact validation commands run and exact pass/fail results
- screenshot folder path and screenshot count for user-visible/browser-tested work
- browser proof summary where required
- runtime status and ports where services are involved
- explicit unresolved limitations or risks

Unacceptable shortcuts:
- "Tests pass" or "validated" without listing the exact commands
- dirty worktree, unchanged HEAD after claimed work, missing commit, missing browser proof, incomplete validation reporting, or unexplained contradictions

### Stubbed route and incomplete feature rule (mandatory)

A backlog item may not be called "complete" if any newly introduced route, UI action, script, or contract is stubbed, fake-successing, or untested unless:
- it returns an explicit honest unavailable response such as `501 Not Implemented`,
- it is hidden from normal UI flows,
- it is documented as out of scope,
- tests prove the honest unavailable behavior,
- and the final handoff lists it under remaining limitations.

Final handoffs must include full commit hashes, not short hashes.
"Implementation complete" is forbidden when core acceptance behavior remains partial.
Incomplete validation-gate reporting means not closure-grade even when code appears to work.

### Database migration and drift rule (mandatory)

A backlog item may not be claimed complete if it requires manual database changes
not represented in committed schema and migrations. Any new persisted table,
column, index, enum, relation, or seed dependency must be reproducible from
committed migrations and documented seed/reset commands. Manual SQL is allowed
only as a committed migration file or an explicitly documented one-off repair,
never as hidden runtime state. A clean worktree is not enough if the running
database contains uncommitted schema drift.

### Screenshot and lifecycle contradiction rule (mandatory)

Browser proof must not contain state-machine contradictions.
If a UI panel shows related lifecycle data, it must be scoped to the selected
entity or clearly labeled as historical/global.
A backlog item is not closure-grade if screenshots show stale, unrelated, or
contradictory state without explicit explanation.
State-machine workflows must include proof that invalid transitions are impossible
and that related UI data belongs to the selected item.
Final handoff must explicitly call out any screenshot anomaly or stale-state
artifact instead of presenting it as clean proof.

### Closure repair rule (mandatory)

A closure repair may not be called "closure-grade complete" unless it satisfies
every requirement specified in the original closure prompt. Partial repairs,
placeholder evidence, skipped screenshots, or incomplete validation gates
remain incomplete regardless of how many iterations have passed. If a repair
session does not finish the full closure scope, the handoff must state exactly
what remains open and why.

### Closure proof completeness rule (mandatory)

A closure handoff may not claim "complete" when required browser-proof states
from the prompt are missing. If fewer screenshots are captured than requested,
the handoff must explicitly map each omitted proof to another valid artifact or
state why it is not applicable. For safety/governance features, browser proof
must include both allowed and blocked paths, admin and viewer roles,
cross-tenant denial, evidence/no-secret proof, and persistence/restart proof
when requested. Validation summaries are not enough; final handoffs must list
exact commands and pass/fail results.

### Screenshot budget and quality rule (mandatory)

- Default screenshot budget is 20 per backlog item. This is a default, not a hard
  ceiling that overrides explicit closure requirements.
- If a closure prompt explicitly requires specific proof states, those required
  states take precedence over the default cap. Capture every required state.
- If a required proof state is omitted, the handoff must explicitly map it to
  another valid artifact (e.g., API response log, test output, curl result) or
  state why it is not applicable.
- Screenshots must be sequentially numbered with descriptive kebab-case names.
- Each screenshot must show a distinct state, interaction, or panel; redundant
  near-identical captures of the same unchanged page are unacceptable.
- Viewport-only captures (not full-page) are preferred when scrolling to specific
  panels; full-page is acceptable only when the entire vertical state matters.
- The reproducible screenshot script must be committed (e.g. under `scripts/`).
- After capture, run duplicate detection (e.g. `md5sum`) and report results.
  Unexplained duplicate screenshots fail closure.

### Final handoff report structure rule (mandatory)

Every final handoff must include a structured report with all of the following
sections. Missing sections make the handoff incomplete.

1. **Commits** — full hashes for all commits in the slice, in order
2. **Worktree** — `git status --short --branch` output proving clean state
3. **What Changed** — concise bullet list of code, schema, UI, and doc changes
4. **Verification** — exact commands run and exact pass/fail results (counts,
   not "tests pass")
5. **Evidence Inventory** — screenshot folder path, count, and a numbered list
   mapping each screenshot file to the state it proves
6. **Risks and Limitations** — honest list of what is NOT implemented, what is
   mock-only, and what requires future work
7. **Next Recommended Action** — one concrete next step or backlog item

### Better report quality rule (mandatory)

- Do not use vague phrases like "validated" or "tests pass" without listing
  exact commands and counts.
- Do not claim "complete" when any required section is missing or any
  verification command failed.
- Do not omit the reproducible screenshot script from commits.
- Do not present screenshots without explaining what each one proves.

These rules are repo truth. Violations mean "not closure-grade."}}}}

Use `prompts/FINAL_HANDOFF_TEMPLATE.md` when you need a canonical handoff shape.
Use `prompts/RUNTIME_IDENTITY_CHECKLIST.md` before UI acceptance or regression forensics.
Use `prompts/ACCEPTANCE_FREEZE_TEMPLATE.md` after accepting a user-facing milestone.

## Hygiene Rules

- `STATUS.md` <= 120 lines
- `PROJECT_STATE.yaml` <= 900 lines
- `NEXT_ACTIONS.md` active-only
- no roadmap prose in structured state
- no closed history in `STATUS.md`
