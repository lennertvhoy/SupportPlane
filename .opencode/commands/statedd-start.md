# StateSpec Start Command

Perform the opening inspection for every SupportPlane coding-agent session.

## Steps

1. **Read required state docs in order:**
   - `AGENTS.md`
   - `STATUS.md`
   - `PROJECT_STATE.yaml`
   - `PROJECT_DNA.yaml`
   - `NEXT_ACTIONS.md`

2. **Read planning docs as needed:**
   - `BACKLOG.md` — for active backlog item details
   - `WORKLOG.md` — for recent history
   - `PROJECT_ADAPTER.yaml` — for stack/port/integration specifics

3. **Check runtime environment:**
   - `git status --short --branch` — current branch, HEAD, dirty/clean
   - `git log -5 --oneline` — recent commits
   - Active services and ports (`lsof -i :3200 :4110 :5434` or equivalent)
   - Node version (`node --version`)
   - npm/pnpm/bun availability

4. **Identify active backlog item:**
   - Read the first active item in `NEXT_ACTIONS.md`
   - Cross-reference with `BACKLOG.md` for full acceptance criteria
   - Note any blockers listed in `STATUS.md`

5. **Summarize current truth:**
   - Project state (from `STATUS.md`)
   - Active blockers
   - Last known good HEAD and evidence

6. **Produce execution plan:**
   - One coherent scope based on the active backlog item
   - Required verification gates (tests, lint, typecheck, browser proof)
   - Evidence folder path (next sequential session number)
   - Exit condition

7. **Confirm before editing:**
   - State the plan
   - Highlight any contradictions or risks found during inspection
   - Proceed only after the user confirms or a CTO handoff is provided
