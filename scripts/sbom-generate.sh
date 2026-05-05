#!/usr/bin/env bash
# =============================================================================
# SBOM Generation Script — BL-155 / BL-159
# Generates CycloneDX and SPDX SBOMs from package-lock.json.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-.}"

print_usage() {
  cat <<EOF
Usage: $0 [OPTIONS]

Options:
  --output-dir PATH     Directory to write SBOMs (default: .)
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

echo "=== SBOM Generation ==="
echo "Output: ${OUTPUT_DIR}"
echo ""

cd "${REPO_ROOT}"

# CycloneDX SBOM
if npm sbom --sbom-format=cyclonedx --sbom-type=application > "${OUTPUT_DIR}/sbom.cyclonedx.json" 2>&1; then
  echo "PASS: CycloneDX SBOM generated."
else
  echo "FAIL: CycloneDX SBOM generation failed."
  exit 1
fi

# SPDX SBOM
if npm sbom --sbom-format=spdx --sbom-type=application > "${OUTPUT_DIR}/sbom.spdx.json" 2>&1; then
  echo "PASS: SPDX SBOM generated."
else
  echo "FAIL: SPDX SBOM generation failed."
  exit 1
fi

# Summary
CYCLO_SIZE=$(wc -c < "${OUTPUT_DIR}/sbom.cyclonedx.json" || echo 0)
SPDX_SIZE=$(wc -c < "${OUTPUT_DIR}/sbom.spdx.json" || echo 0)

echo ""
echo "Artifacts:"
echo "  - ${OUTPUT_DIR}/sbom.cyclonedx.json (${CYCLO_SIZE} bytes)"
echo "  - ${OUTPUT_DIR}/sbom.spdx.json (${SPDX_SIZE} bytes)"
