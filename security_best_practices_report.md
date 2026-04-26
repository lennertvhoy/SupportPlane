# Security Best Practices Report

## Executive Summary

Scope reviewed: the published template repository at commit `490039a`, with
focus on live executable code in `scripts/` and the public CI workflow in
`.github/workflows/`.

Overall result: no remote-code-execution or shell-injection issue was found in
the current codebase, but one real filesystem safety issue was verified in
`scripts/init_template.py`. A second medium-severity hardening issue exists in
the GitHub Actions workflow.

## High Severity

### SEC-001: `init_template.py` can write outside the target repo through existing symlinks

Impact: a malicious or untrusted target repo can cause `new` or `adopt` to
overwrite files outside the repo tree that are writable by the current user.

Affected code:

- `scripts/init_template.py:860`
- `scripts/init_template.py:861`
- `scripts/init_template.py:862`
- `scripts/init_template.py:1043`
- `scripts/init_template.py:1044`
- `scripts/init_template.py:1045`
- `scripts/init_template.py:1046`
- `scripts/init_template.py:1047`
- `scripts/init_template.py:1100`
- `scripts/init_template.py:1101`
- `scripts/init_template.py:1102`
- `scripts/init_template.py:1103`
- `scripts/init_template.py:1104`
- `scripts/init_template.py:1148`
- `scripts/init_template.py:1149`
- `scripts/init_template.py:1164`

Why this matters:

- `write_file()` writes directly to the requested path after `mkdir(parents=True)`
  without checking whether the destination path or any parent component is a
  symlink.
- `copy_assets()` uses `shutil.copy2()` into `target / relpath` with the same
  assumption.
- `copy_template_tree()` uses `shutil.copytree(..., dirs_exist_ok=True)`, which
  will also write into already-existing target paths without validating whether
  those directories are symlinks.

Verified behavior:

1. A temporary repo was created with `repo/docs` as a symlink to an external
   directory.
2. Running `python3 scripts/init_template.py adopt --name "Audit Demo" --target "$repo"`
   wrote files outside the repo.
3. Verified external files created:
   - `ACCEPTANCE_FREEZES.md`
   - `BOOTSTRAP_QUALITY.md`
   - `EVIDENCE_LOG.md`
   - `evidence/.gitkeep`

Local proof output:

```text
/tmp/tmp.XWd4kDh0LH/outside/ACCEPTANCE_FREEZES.md
/tmp/tmp.XWd4kDh0LH/outside/BOOTSTRAP_QUALITY.md
/tmp/tmp.XWd4kDh0LH/outside/EVIDENCE_LOG.md
/tmp/tmp.XWd4kDh0LH/outside/evidence/.gitkeep
```

Recommended fix:

- Before any write or copy, resolve the destination path and every parent
  directory with `lstat`-style checks and reject symlinks.
- Enforce that resolved destination paths stay within the resolved target repo
  root.
- Apply the same check to:
  - managed file writes
  - support asset copies
  - README append flow
  - full template tree copy

## Medium Severity

### SEC-002: GitHub Actions workflow uses mutable version tags instead of immutable SHAs

Impact: if an upstream action tag is retargeted or the action publisher is
compromised, CI execution for this public repo could run unintended code.

Affected code:

- `.github/workflows/validate.yml:12`
- `.github/workflows/validate.yml:15`

Details:

- `actions/checkout@v4`
- `actions/setup-python@v5`

These major-version tags are common, but they are not immutable. For a public
repository, pinning third-party actions to full commit SHAs is the safer
default.

Recommended fix:

- Replace tag references with full-length pinned SHAs.
- Optionally document a scheduled maintenance step for updating pinned action
  SHAs.

## Low Severity / Observations

### SEC-003: No shell injection was found in current subprocess usage

Observed code:

- `scripts/init_template.py:873`
- `scripts/init_template.py:875`
- `scripts/init_template.py:876`

`git` is invoked with an argument list and `shell=True` is not used. That is a
good secure default.

### SEC-004: The public template does not appear to expose embedded secrets

Reviewed surfaces:

- root repo files
- `scripts/`
- `prompts/`
- `.github/workflows/`

No hardcoded tokens, passwords, or obvious secret material were found in the
reviewed files.

## Recommended Next Steps

1. Fix SEC-001 first. It is the only verified high-severity issue.
2. Pin GitHub Actions to immutable SHAs.
3. After SEC-001 is fixed, add regression tests that create symlinked target
   paths and assert that `new` and `adopt` fail safely instead of writing
   through them.
