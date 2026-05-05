#!/usr/bin/env bash
# =============================================================================
# Evidence Hygiene Gate — BL-158
# Validates evidence folder compliance per AGENTS.md rules.
# =============================================================================
set -euo pipefail

EVIDENCE_ROOT="${EVIDENCE_ROOT:-output/playwright}"
EXIT_CODE=0

print_usage() {
  cat <<EOF
Usage: $0 [OPTIONS]

Options:
  --evidence-root PATH  Root directory for evidence folders (default: output/playwright)
  -h, --help            Show this help message

Checks:
  1. Evidence folder is alphabetically last in the directory.
  2. File count ≤ 20 per folder (hard cap).
  3. No .html wrappers for JSON/text artifacts.
  4. No duplicate screenshots (md5sum check).
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --evidence-root)
      EVIDENCE_ROOT="$2"
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

echo "=== Evidence Hygiene Gate ==="
echo "Evidence root: ${EVIDENCE_ROOT}"
echo ""

if [[ ! -d "${EVIDENCE_ROOT}" ]]; then
  echo "WARNING: Evidence root does not exist: ${EVIDENCE_ROOT}"
  exit 0
fi

# Find all session-NNN folders
FOLDERS=$(find "${EVIDENCE_ROOT}" -maxdepth 1 -type d -name 'session-*' | sort -V)

if [[ -z "${FOLDERS}" ]]; then
  echo "No evidence folders found."
  exit 0
fi

LATEST_FOLDER=$(echo "${FOLDERS}" | tail -n 1)
LATEST_NAME=$(basename "${LATEST_FOLDER}")

echo "Latest evidence folder: ${LATEST_NAME}"
echo ""

# Check 1: Alphabetically last
PENULTIMATE=$(echo "${FOLDERS}" | tail -n 2 | head -n 1)
if [[ -n "${PENULTIMATE}" && "${PENULTIMATE}" != "${LATEST_FOLDER}" ]]; then
  PENULTIMATE_NAME=$(basename "${PENULTIMATE}")
  if [[ "${LATEST_NAME}" < "${PENULTIMATE_NAME}" ]]; then
    echo "WARNING: Latest folder (${LATEST_NAME}) is not alphabetically last."
    echo "         ${PENULTIMATE_NAME} sorts after it."
    EXIT_CODE=1
  else
    echo "PASS: Latest folder is alphabetically last."
  fi
else
  echo "PASS: Only one evidence folder exists."
fi

# Check 2: File count ≤ 20
FILE_COUNT=$(find "${LATEST_FOLDER}" -maxdepth 1 -type f | wc -l)
echo ""
echo "File count in ${LATEST_NAME}: ${FILE_COUNT}"

if [[ "${FILE_COUNT}" -gt 20 ]]; then
  echo "FAIL: File count (${FILE_COUNT}) exceeds hard cap of 20."
  EXIT_CODE=1
else
  echo "PASS: File count within limit (≤20)."
fi

# Check 3: No .html wrappers for JSON/text artifacts
echo ""
echo "Checking for .html wrappers on JSON/text artifacts..."
HTML_WRAPPERS=$(find "${LATEST_FOLDER}" -maxdepth 1 -type f -name '*.html' | while read -r f; do
  BASE=$(basename "$f" .html)
  if [[ -f "${LATEST_FOLDER}/${BASE}.json" || -f "${LATEST_FOLDER}/${BASE}.txt" || -f "${LATEST_FOLDER}/${BASE}.md" ]]; then
    echo "  ${f}"
  fi
done || true)

if [[ -n "${HTML_WRAPPERS}" ]]; then
  echo "FAIL: Found .html wrappers for JSON/text artifacts:"
  echo "${HTML_WRAPPERS}"
  EXIT_CODE=1
else
  echo "PASS: No .html wrappers found."
fi

# Check 4: Duplicate screenshots (md5sum)
echo ""
echo "Checking for duplicate screenshots..."
SCREENSHOTS=$(find "${LATEST_FOLDER}" -maxdepth 1 -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \))

if [[ -n "${SCREENSHOTS}" ]]; then
  DUPES=$(echo "${SCREENSHOTS}" | xargs md5sum 2>/dev/null | sort | uniq -d -w32)
  if [[ -n "${DUPES}" ]]; then
    echo "FAIL: Duplicate screenshots detected (same md5sum):"
    echo "${DUPES}"
    EXIT_CODE=1
  else
    echo "PASS: No duplicate screenshots found."
  fi
else
  echo "INFO: No screenshots in latest folder."
fi

echo ""
if [[ "${EXIT_CODE}" -eq 0 ]]; then
  echo "=== ALL CHECKS PASSED ==="
else
  echo "=== SOME CHECKS FAILED ==="
fi

exit "${EXIT_CODE}"
