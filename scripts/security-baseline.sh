#!/usr/bin/env bash
# =============================================================================
# Security Baseline Script — BL-155 partial
# Runs dependency audit and captures findings for triage.
# =============================================================================
set -euo pipefail

AUDIT_LEVEL="${AUDIT_LEVEL:-high}"
OUTPUT_DIR="${OUTPUT_DIR:-.}"

print_usage() {
  cat <<EOF
Usage: $0 [OPTIONS]

Options:
  --audit-level LEVEL   npm audit level: info, low, moderate, high, critical (default: high)
  --output-dir PATH     Directory to write reports (default: .)
  -h, --help            Show this help message
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --audit-level)
      AUDIT_LEVEL="$2"
      shift 2
      ;;
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

echo "=== Security Baseline ==="
echo "Audit level: ${AUDIT_LEVEL}"
echo "Output dir:  ${OUTPUT_DIR}"
echo ""

echo "--- Dependency Audit (blocking level: ${AUDIT_LEVEL}) ---"
if npm audit --audit-level="${AUDIT_LEVEL}" > "${OUTPUT_DIR}/npm-audit.txt" 2>&1; then
  echo "PASS: No vulnerabilities at '${AUDIT_LEVEL}' level or higher."
  AUDIT_EXIT=0
else
  AUDIT_EXIT=$?
  echo "FINDINGS: Vulnerabilities detected at '${AUDIT_LEVEL}' level or higher."
  echo "          See ${OUTPUT_DIR}/npm-audit.txt for details."
fi

echo ""
echo "--- Full Dependency Audit (moderate, for artifact) ---"
npm audit --audit-level=moderate > "${OUTPUT_DIR}/npm-audit-full.txt" 2>&1 || true

echo ""
echo "Reports saved to:"
echo "  - ${OUTPUT_DIR}/npm-audit.txt (blocking level)"
echo "  - ${OUTPUT_DIR}/npm-audit-full.txt (full moderate+)"

exit "${AUDIT_EXIT}"
