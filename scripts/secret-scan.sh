#!/usr/bin/env bash
# =============================================================================
# Secret Scan Script — BL-155
# Runs gitleaks against the repo with baseline allowlist handling.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-.}"
SCAN_MODE="${SCAN_MODE:-current}"  # current | history

print_usage() {
  cat <<EOF
Usage: $0 [OPTIONS]

Options:
  --output-dir PATH     Directory to write reports (default: .)
  --history             Scan full git history instead of current tree only
  -h, --help            Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --history)
      SCAN_MODE="history"
      shift
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

# Detect gitleaks
GITLEAKS_CMD=""
if command -v gitleaks &>/dev/null; then
  GITLEAKS_CMD="gitleaks"
elif [[ -x /tmp/gitleaks ]]; then
  GITLEAKS_CMD="/tmp/gitleaks"
else
  echo "WARNING: gitleaks not found. Install from https://github.com/gitleaks/gitleaks"
  echo "         Secret scan will be skipped in local runs. CI workflow installs it."
  echo "{\"tool\":\"gitleaks\",\"status\":\"not_installed\",\"findings\":0}" > "${OUTPUT_DIR}/secret-scan.json"
  exit 0
fi

echo "=== Secret Scan (gitleaks) ==="
echo "Mode: ${SCAN_MODE}"
echo "Output: ${OUTPUT_DIR}"
echo ""

CONFIG_FLAG=""
if [[ -f "${REPO_ROOT}/.gitleaks.toml" ]]; then
  CONFIG_FLAG="--config ${REPO_ROOT}/.gitleaks.toml"
fi

if [[ "${SCAN_MODE}" == "history" ]]; then
  ${GITLEAKS_CMD} detect --source "${REPO_ROOT}" ${CONFIG_FLAG} --verbose --report-format json --report-path "${OUTPUT_DIR}/secret-scan.json" || true
else
  ${GITLEAKS_CMD} detect --source "${REPO_ROOT}" --no-git ${CONFIG_FLAG} --verbose --report-format json --report-path "${OUTPUT_DIR}/secret-scan.json" || true
fi

# Summarize
if [[ -f "${OUTPUT_DIR}/secret-scan.json" ]]; then
  FINDINGS=$(python3 -c "import json,sys; d=json.load(open('${OUTPUT_DIR}/secret-scan.json')); print(len(d))" 2>/dev/null || echo "0")
  echo ""
  echo "Findings: ${FINDINGS}"
  if [[ "${FINDINGS}" -eq 0 ]]; then
    echo "PASS: No secrets detected."
    exit 0
  else
    echo "FAIL: ${FINDINGS} potential secret(s) detected."
    echo "Review ${OUTPUT_DIR}/secret-scan.json and triage before suppressing."
    exit 1
  fi
else
  echo "No report generated."
  exit 1
fi
