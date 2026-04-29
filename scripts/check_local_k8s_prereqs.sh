#!/usr/bin/env bash
set -euo pipefail

echo "SupportPlane local Kubernetes prerequisite check"
echo "Status: informational only; this script does not install, create, or mutate anything."
echo

check_cmd() {
  local name="$1"
  if command -v "$name" >/dev/null 2>&1; then
    local path
    path="$(command -v "$name")"
    local version
    version="$("$name" --version 2>/dev/null | head -n 1 || true)"
    echo "found: $name at $path ${version:+- $version}"
  else
    echo "missing: $name"
  fi
}

check_cmd podman
check_cmd kubectl
check_cmd kind
check_cmd minikube
check_cmd helm
check_cmd kustomize

echo
echo "No cluster was created. Local Kubernetes implementation is not implemented yet."
