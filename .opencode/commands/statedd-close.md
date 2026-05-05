# StateDD Close Command

Perform StateDD closure for every SupportPlane coding-agent session.

## Pre-Closure Checklist

Run each check; document exact results.

### 1. Worktree

```bash
git status --short --branch
```

Must be clean unless user explicitly asked not to commit.

### 2. Code Quality

```bash
npm run lint          # ESLint
npm run typecheck     # TypeScript
npm test              # Workspace-scoped tests
```

Record exact commands and pass/fail counts. Never write "tests pass" alone.

### 3. Browser Verification (user-visible changes only)

- Screenshots captured via Playwright MCP
- Each screenshot shows a distinct state/interaction/panel
- URL visited, visible UI state documented
- Console errors inspected (none expected for accepted features)
- Duplicate detection run (`md5sum` on evidence files)

### 4. Evidence Folder

```bash
ls output/playwright/<session-folder> | wc -l
```

- Must be <= 20 files total (hard cap)
- No redundant `.html` wrappers
- No old/superseded folders for the same backlog item
- Folder uses correct sequential session number

### 5. Docs Sync

- [ ] `BACKLOG.md` updated with honest status markers
- [ ] `NEXT_ACTIONS.md` updated — closed items removed, new items added
- [ ] `STATUS.md` updated if project state changed
- [ ] `PROJECT_STATE.yaml` updated if structured truth changed
- [ ] `docs/EVIDENCE_LOG.md` updated if evidence captured
- [ ] `docs/README.md` updated if docs added/removed/reorganized
- [ ] All `docs/*` files current with codebase; no stale claims
- [ ] `README.md` current

### 6. No Stale Claims

- Search for contradicted or outdated status markers
- Verify no `501 Not Implemented` stub presented as complete without honest label
- Verify no database drift without committed migrations

## Final Handoff Report

Produce a report with all 7 sections:

### 1. Commits

Full commit hashes (not short), in order.

### 2. Worktree

```
$ git status --short --branch
<output>
```

### 3. What Changed

Concise bullet list of code, schema, UI, and doc changes.

### 4. Verification

Exact commands and pass/fail results:

```
$ npm run lint
... (N errors, M warnings)
$ npm run typecheck
... (passed/failed)
$ npm test
... (X passed, Y failed)
```

### 5. Evidence Inventory

- Folder: `output/playwright/session-NNN-description/`
- File count: N/20
- Numbered list mapping each file to the state it proves

### 6. Risks and Limitations

Honest list of what is NOT implemented, mock-only, or requires future work.

### 7. Next Recommended Action

One concrete next step or backlog item.

## Closure Gate

The session is NOT closure-grade if ANY of:

- Dirty worktree without explicit user permission
- Missing verification commands and counts
- Missing evidence for user-visible changes
- Missing or incomplete handoff sections
- Stale or contradicted claims in state/docs
- Evidence folder exceeds 20 files
- Required browser-proof states missing without explanation

Only claim "complete" when ALL gates pass.
