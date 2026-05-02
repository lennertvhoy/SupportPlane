#!/usr/bin/env python3
"""Validate SupportPlane documentation hygiene and freshness gates."""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOCS_DIR = ROOT / "docs"

REQUIRED_STATE_DOCS = [
    "AGENTS.md",
    "STATUS.md",
    "PROJECT_STATE.yaml",
    "PROJECT_DNA.yaml",
    "NEXT_ACTIONS.md",
    "BACKLOG.md",
    "WORKLOG.md",
    "docs/EVIDENCE_LOG.md",
    "docs/ACCEPTANCE_FREEZES.md",
]

REQUIRED_AGENTS_FRESHNESS_PHRASES = [
    "Doc freshness gate",
    "docs/README.md",
    "No stale claims",
    "Final handoff must list all docs changed",
]

DOCS_INDEX_FILE = "docs/README.md"


def check_required_state_docs() -> list[str]:
    issues: list[str] = []
    for relpath in REQUIRED_STATE_DOCS:
        if not (ROOT / relpath).exists():
            issues.append(f"Missing required state doc: {relpath}")
    return issues


def check_docs_index_coverage() -> list[str]:
    issues: list[str] = []
    index_path = ROOT / DOCS_INDEX_FILE
    if not index_path.exists():
        issues.append(f"Missing docs index: {DOCS_INDEX_FILE}")
        return issues

    index_text = index_path.read_text(encoding="utf-8")
    md_files_in_docs = sorted(
        p.name for p in DOCS_DIR.iterdir()
        if p.suffix == ".md" and p.name != "README.md"
    )
    for md_file in md_files_in_docs:
        if md_file not in index_text:
            issues.append(f"Docs index missing entry: {md_file}")

    subdirs = [p for p in DOCS_DIR.iterdir() if p.is_dir()]
    for subdir in subdirs:
        sub_mds = sorted(p.name for p in subdir.iterdir() if p.suffix == ".md")
        for sub_md in sub_mds:
            if sub_md not in index_text:
                issues.append(f"Docs index missing entry: {subdir.name}/{sub_md}")

    return issues


def check_agents_freshness_gate() -> list[str]:
    issues: list[str] = []
    agents_path = ROOT / "AGENTS.md"
    if not agents_path.exists():
        issues.append("Missing AGENTS.md")
        return issues

    agents_text = agents_path.read_text(encoding="utf-8")
    for phrase in REQUIRED_AGENTS_FRESHNESS_PHRASES:
        if phrase not in agents_text:
            issues.append(f"AGENTS.md missing doc freshness gate phrase: '{phrase}'")

    return issues


def check_no_design_md_reference() -> list[str]:
    issues: list[str] = []
    for md_path in ROOT.rglob("*.md"):
        text = md_path.read_text(encoding="utf-8")
        if "DESIGN.md" in text and "REAL_WRITEBACK_PATH_DESIGN.md" not in text.split("DESIGN.md")[0][-50:]:
            if md_path.name == "EVIDENCE_LOG.md":
                continue
            if "REAL_WRITEBACK_PATH_DESIGN" in text:
                continue
            rel = md_path.relative_to(ROOT)
            for i, line in enumerate(text.splitlines(), 1):
                if "DESIGN.md" in line and "REAL_WRITEBACK_PATH_DESIGN.md" not in line:
                    issues.append(f"{rel}:{i} references standalone DESIGN.md")
    return issues


def check_backlog_doc_hygiene_item() -> list[str]:
    issues: list[str] = []
    backlog_path = ROOT / "BACKLOG.md"
    if not backlog_path.exists():
        return issues

    backlog_text = backlog_path.read_text(encoding="utf-8")
    if "BL-134" not in backlog_text:
        issues.append("BL-134 (doc hygiene backlog item) not found in BACKLOG.md")

    agents_path = ROOT / "AGENTS.md"
    if agents_path.exists():
        agents_text = agents_path.read_text(encoding="utf-8")
        if "doc" not in agents_text.lower() or "freshness" not in agents_text.lower():
            issues.append("AGENTS.md does not contain doc freshness gate enforcement")

    return issues


def main() -> int:
    print("=" * 60)
    print("DOCS HYGIENE CHECK")
    print("=" * 60)

    all_issues: list[tuple[str, list[str]]] = []

    checks = [
        ("Required state docs", check_required_state_docs),
        ("Docs index coverage", check_docs_index_coverage),
        ("AGENTS.md freshness gate", check_agents_freshness_gate),
        ("No DESIGN.md references", check_no_design_md_reference),
        ("Backlog doc hygiene item", check_backlog_doc_hygiene_item),
    ]

    for label, check_fn in checks:
        issues = check_fn()
        all_issues.append((label, issues))
        print(f"\n{label}:")
        if issues:
            for issue in issues:
                print(f"  FAIL: {issue}")
        else:
            print("  PASS")

    print("\n" + "=" * 60)
    total = sum(len(issues) for _, issues in all_issues)
    if total:
        print(f"FAILED: {total} issue(s) found")
        for label, issues in all_issues:
            for issue in issues:
                print(f"  - [{label}] {issue}")
        return 1

    print("PASSED: All docs hygiene checks passed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
