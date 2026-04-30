#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="${SUPPORTPLANE_LOCAL_CLUSTER_NAME:-supportplane-local}"
PROVIDER="${KIND_EXPERIMENTAL_PROVIDER:-podman}"

echo "SupportPlane local K8s image build and load"
echo "Cluster: ${CLUSTER_NAME}"
echo "Provider: Kind with ${PROVIDER}"
echo "Strategy: podman build -> podman save -> kind load image-archive"
echo

require_cmd() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "missing required command: $name" >&2
    exit 1
  fi
}

require_cmd podman
require_cmd kind

export KIND_EXPERIMENTAL_PROVIDER=podman

# Verify cluster exists
if ! kind get clusters | grep -Fxq "$CLUSTER_NAME"; then
  echo "Kind cluster '${CLUSTER_NAME}' not found. Run scripts/create_local_k8s_cluster.sh first." >&2
  exit 1
fi

TMPDIR="$(mktemp -d /tmp/supportplane-k8s-images.XXXXXX)"
trap 'rm -rf "$TMPDIR"' EXIT

echo "Temporary archive directory: ${TMPDIR}"
echo

build_and_load() {
  local app="$1"
  local tag="$2"
  local containerfile="$3"
  local git_head=""
  local git_branch=""
  git_head="$(git rev-parse HEAD 2>/dev/null || echo '')"
  git_branch="$(git branch --show-current 2>/dev/null || echo '')"

  echo "--- Building ${app} ---"
  if [ "$app" = "api" ]; then
    podman build -f "${containerfile}" -t "${tag}" --build-arg GIT_HEAD="${git_head}" --build-arg GIT_BRANCH="${git_branch}" .
  else
    podman build -f "${containerfile}" -t "${tag}" .
  fi
  local image_id
  image_id="$(podman inspect --format='{{.Id}}' "${tag}")"
  echo "Image ID: ${image_id}"

  local tar_file="${TMPDIR}/${app//\//-}.tar"
  echo "Saving archive: ${tar_file}"
  podman save -o "${tar_file}" "${tag}"

  echo "Loading archive into Kind cluster..."
  kind load image-archive "${tar_file}" --name "$CLUSTER_NAME"

  echo "Verifying image in cluster node..."
  podman exec "${CLUSTER_NAME}-control-plane" crictl images | grep "${tag}" || echo "  (crictl grep did not find image; may need retry)"
  echo
}

cd "$(dirname "$0")/.."

build_and_load "api" "localhost/supportplane-api:local-k8s" "apps/api/Containerfile.local"
build_and_load "web" "localhost/supportplane-web:local-k8s" "apps/web/Containerfile.local"
build_and_load "worker" "localhost/supportplane-worker:local-k8s" "apps/worker/Containerfile.local"

echo "--- Podman images ---"
podman images | grep supportplane || true
echo

echo "--- Cluster node crictl images ---"
podman exec "${CLUSTER_NAME}-control-plane" crictl images | grep supportplane || true
echo

echo "All images built and loaded."
echo "Temporary archives cleaned: ${TMPDIR}"
