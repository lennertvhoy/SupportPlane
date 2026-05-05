#!/usr/bin/env bash
# =============================================================================
# License Check Script — BL-155 / BL-159
# Runs license-checker and produces an inventory with policy evaluation.
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUTPUT_DIR="${OUTPUT_DIR:-.}"

# Disallowed licenses — fail if found
DISALLOWED="(GPL-2.0|GPL-3.0|AGPL-3.0|SSPL-1.0|Proprietary|Commercial)"
# Licenses that require manual review
REVIEW_REQUIRED="(MPL|EPL|CC-BY-NC|WTFPL)"

# Explicitly allowed packages with documented copyleft runtime deps.
# These are native platform-specific runtime libraries (dynamic linking).
ALLOWLIST_PACKAGES="@img/sharp-libvips-linux-x64 @img/sharp-libvips-linuxmusl-x64 @img/sharp-libvips-linux-arm64 @img/sharp-libvips-darwin-arm64 @img/sharp-libvips-darwin-x64 @img/sharp-libvips-linux-arm @img/sharp-libvips-win32-ia32 @img/sharp-libvips-win32-x64"

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

echo "=== License Inventory ==="
echo "Output: ${OUTPUT_DIR}"
echo ""

cd "${REPO_ROOT}"

if ! command -v license-checker &>/dev/null; then
  echo "WARNING: license-checker not found. Run: npm install -D license-checker"
  echo "         License check will be skipped in local runs."
  echo "{\"tool\":\"license-checker\",\"status\":\"not_installed\"}" > "${OUTPUT_DIR}/license-report.json"
  exit 0
fi

# Generate JSON report
license-checker --json --start "${REPO_ROOT}" > "${OUTPUT_DIR}/license-report.json" 2>/dev/null

# Generate summary
license-checker --summary --start "${REPO_ROOT}" > "${OUTPUT_DIR}/license-summary.txt" 2>/dev/null

# Policy evaluation
python3 -c "
import json, sys, re

with open('${OUTPUT_DIR}/license-report.json') as f:
    data = json.load(f)

disallowed_pattern = re.compile(r'${DISALLOWED}', re.IGNORECASE)
review_pattern = re.compile(r'${REVIEW_REQUIRED}', re.IGNORECASE)

allowlist = set('${ALLOWLIST_PACKAGES}'.split())

disallowed = []
review = []
unknown = []

for pkg, info in data.items():
    lic = info.get('licenses', 'UNKNOWN')
    if isinstance(lic, list):
        lic = '; '.join(lic)
    # Handle scoped packages like @scope/name@version
    parts = pkg.rsplit('@', 1)
    pkg_name = parts[0] if len(parts) > 1 else pkg
    if lic == 'UNKNOWN':
        unknown.append(pkg)
    elif disallowed_pattern.search(lic):
        if pkg_name in allowlist:
            print(f'ALLOWLISTED (runtime native dep): {pkg}: {lic}')
        else:
            disallowed.append((pkg, lic))
    elif review_pattern.search(lic):
        review.append((pkg, lic))

print('=== License Policy Evaluation ===')
print(f'Total packages: {len(data)}')
print(f'Unknown licenses: {len(unknown)}')
print(f'Review required: {len(review)}')
print(f'Disallowed: {len(disallowed)}')
print('')

if disallowed:
    print('DISALLOWED findings:')
    for pkg, lic in disallowed:
        print(f'  - {pkg}: {lic}')
    print('')

if review:
    print('REVIEW REQUIRED findings:')
    for pkg, lic in review:
        print(f'  - {pkg}: {lic}')
    print('')

if unknown:
    print('UNKNOWN license packages (sample):')
    for pkg in unknown[:10]:
        print(f'  - {pkg}')
    print('')

if disallowed:
    print('FAIL: Disallowed licenses found.')
    sys.exit(1)
else:
    print('PASS: No disallowed licenses found.')
    sys.exit(0)
" || LICENSE_EXIT=$?

if [[ "${LICENSE_EXIT:-0}" -ne 0 ]]; then
  exit "${LICENSE_EXIT}"
fi

echo ""
echo "Artifacts:"
echo "  - ${OUTPUT_DIR}/license-report.json"
echo "  - ${OUTPUT_DIR}/license-summary.txt"
