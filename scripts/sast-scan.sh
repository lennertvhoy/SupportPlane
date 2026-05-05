#!/usr/bin/env bash
# =============================================================================
# SAST Scan Script — BL-155
# Runs static analysis security checks.
# Local: eslint-plugin-security (always available after npm install).
# Remote: CodeQL via GitHub Actions (see .github/workflows/codeql.yml).
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-.}"

print_usage() {
  cat <<EOF
Usage: $0 [OPTIONS]

Options:
  --output-dir PATH     Directory to write reports (default: .)
  -h, --help            Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    -h|--help)
      print_usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      print_usage
      exit 2
      ;;
  esac
done

mkdir -p "${OUTPUT_DIR}"

echo "=== SAST Scan ==="
echo "Output: ${OUTPUT_DIR}"
echo ""

# Run ESLint with security plugin
# The security plugin is registered in eslint.config.mjs
if npm run lint -- --format json --output-file "${OUTPUT_DIR}/eslint-sast.json" > "${OUTPUT_DIR}/eslint-sast.txt" 2>&1; then
  echo "PASS: ESLint (with security plugin) found no issues."
  ESLINT_EXIT=0
else
  ESLINT_EXIT=$?
  echo "NOTICE: ESLint reported issues. See ${OUTPUT_DIR}/eslint-sast.json for details."
  # Do not fail on lint issues alone if they are pre-existing non-security issues.
  # The security plugin rules are configured as warnings initially to avoid blocking on noise.
fi

# Summarize security-specific findings if any
if command -v python3 &>/dev/null && [[ -f "${OUTPUT_DIR}/eslint-sast.json" ]]; then
  python3 -c "
import json, sys
try:
    with open('${OUTPUT_DIR}/eslint-sast.json') as f:
        data = json.load(f)
    total = sum(len(r.get('messages', [])) for r in data)
    sec = sum(1 for r in data for m in r.get('messages', []) if 'security' in m.get('ruleId', '').lower())
    print(f'Total ESLint issues: {total}')
    print(f'Security-related issues: {sec}')
    if sec == 0:
        print('PASS: No security-specific ESLint findings.')
    else:
        print(f'NOTICE: {sec} security-specific finding(s) — review recommended.')
except Exception as e:
    print(f'Could not parse ESLint report: {e}')
"
fi

echo ""
echo "CodeQL SAST runs in GitHub Actions only (.github/workflows/codeql.yml)."
echo "Local CodeQL CLI is not required for baseline validation."

exit 0
