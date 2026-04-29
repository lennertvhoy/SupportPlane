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
if command -v podman >/dev/null 2>&1; then
  echo "Podman host details:"
  podman info --format '  host.os={{.Host.OS}} arch={{.Host.Arch}} kernel={{.Host.Kernel}} cgroup={{.Host.CgroupManager}} cgroupVersion={{.Host.CgroupsVersion}} rootless={{.Host.Security.Rootless}} network={{.Host.RootlessNetworkCmd}}' 2>/dev/null || echo "  unavailable: podman info failed"
  podman system connection list 2>/dev/null | sed 's/^/  /' || true
else
  echo "Podman host details: unavailable because podman is missing"
fi

echo
if command -v kubectl >/dev/null 2>&1; then
  echo "kubectl current context:"
  kubectl config current-context 2>/dev/null | sed 's/^/  /' || echo "  not currently set"
else
  echo "kubectl current context: unavailable because kubectl is missing"
fi

echo
if command -v kind >/dev/null 2>&1; then
  echo "Kind clusters visible with KIND_EXPERIMENTAL_PROVIDER=podman:"
  KIND_EXPERIMENTAL_PROVIDER=podman kind get clusters 2>/dev/null | sed 's/^/  /' || echo "  none or kind provider check failed"
else
  echo "Kind clusters: unavailable because kind is missing"
fi

echo
if command -v minikube >/dev/null 2>&1; then
  echo "Minikube profiles:"
  minikube profile list 2>/dev/null | sed 's/^/  /' || echo "  none or minikube profile check failed"
else
  echo "Minikube profiles: unavailable because minikube is missing"
fi

echo
echo "No cluster was created. This prerequisite check is read-only."
