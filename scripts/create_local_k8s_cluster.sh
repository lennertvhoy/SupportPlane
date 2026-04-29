#!/usr/bin/env bash
set -euo pipefail

CLUSTER_NAME="${SUPPORTPLANE_LOCAL_CLUSTER_NAME:-supportplane-local}"
PROVIDER="${KIND_EXPERIMENTAL_PROVIDER:-podman}"
NODE_IMAGE="${SUPPORTPLANE_KIND_NODE_IMAGE:-kindest/node:v1.31.4}"
CONTEXT="kind-${CLUSTER_NAME}"

echo "SupportPlane local Kubernetes cluster creation"
echo "Cluster name: ${CLUSTER_NAME}"
echo "Provider: Kind with ${PROVIDER}"
echo "Node image: ${NODE_IMAGE}"
echo "Status: creates or reuses the local sandbox cluster only."
echo

require_cmd() {
  local name="$1"
  if ! command -v "$name" >/dev/null 2>&1; then
    echo "missing required command: $name" >&2
    exit 1
  fi
}

require_cmd podman
require_cmd kubectl
require_cmd kind

if [[ "$PROVIDER" != "podman" ]]; then
  echo "refusing to create BL-103 cluster with non-Podman Kind provider: ${PROVIDER}" >&2
  echo "Set KIND_EXPERIMENTAL_PROVIDER=podman or unset it before running." >&2
  exit 1
fi

export KIND_EXPERIMENTAL_PROVIDER=podman

if kind get clusters | grep -Fxq "$CLUSTER_NAME"; then
  echo "Reusing existing Kind/Podman cluster: ${CLUSTER_NAME}"
else
  echo "+ KIND_EXPERIMENTAL_PROVIDER=podman kind create cluster --name ${CLUSTER_NAME} --image ${NODE_IMAGE}"
  kind create cluster --name "$CLUSTER_NAME" --image "$NODE_IMAGE"
fi

echo
echo "+ kubectl config use-context ${CONTEXT}"
kubectl config use-context "$CONTEXT"

echo
echo "+ kubectl cluster-info --context ${CONTEXT}"
kubectl cluster-info --context "$CONTEXT"

echo
echo "+ kubectl get nodes -o wide"
kubectl get nodes -o wide

echo
echo "Next proof commands:"
echo "  kubectl apply -k infra/kubernetes/local-podman"
echo "  kubectl get namespaces"
echo "  kubectl get all -A"
echo "  kubectl auth can-i get pods -A"
echo "  KIND_EXPERIMENTAL_PROVIDER=podman kind get clusters"
echo "  podman ps --format '{{.Names}} {{.Image}} {{.Status}}'"
echo
echo "Non-goals: this script does not deploy SupportPlane app services, Zammad, Ollama, OpenBao, NATS, Mailpit, MinIO, or observability."
