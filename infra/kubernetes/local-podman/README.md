# Local Podman Kubernetes Foundation

**Status:** BL-103 implementation target. This directory contains only the
verified local namespace foundation for the future self-hosted sandbox.

The local sandbox cluster is named `supportplane-local` and uses Kind with the
Podman provider. BL-103 verified `kindest/node:v1.31.4` on this Fedora/Podman
host; the Kind v0.27.0 default `kindest/node:v1.32.2` started but left
`kube-proxy` crash-looping with `failed complete: too many open files`. These
manifests intentionally create only the namespace boundary for future phases:

- `supportplane-app`
- `supportplane-data`
- `supportplane-integrations`
- `supportplane-observability`

Apply the namespace foundation after the cluster exists:

```bash
bash scripts/check_local_k8s_prereqs.sh
bash scripts/create_local_k8s_cluster.sh
kubectl apply -k infra/kubernetes/local-podman
kubectl get namespaces
```

Current layout:

```text
infra/kubernetes/local-podman/
  README.md
  namespaces.yaml
  kustomization.yaml
```

Future layout may add these directories after separate backlog items implement
and verify them:

```text
infra/kubernetes/local-podman/
  app/
  postgres/
  zammad/
  ollama/
  openbao/
  nats/
  mailpit/
  minio/
  observability/
```

Verification commands for BL-103:

```bash
kubectl config current-context
kubectl cluster-info
kubectl get nodes -o wide
kubectl get namespaces
kubectl get all -A
kubectl auth can-i get pods -A
KIND_EXPERIMENTAL_PROVIDER=podman kind get clusters
podman ps --format '{{.Names}} {{.Image}} {{.Status}}'
```

Local image strategy for Kind/Podman:

- Build local images with Podman, for example `podman build -t localhost/supportplane-api:local apps/api`.
- Save the Podman-built image to an OCI/Docker archive with `podman save -o /tmp/<image>.tar <image>`.
- Load the archive into the Kind node with `KIND_EXPERIMENTAL_PROVIDER=podman kind load image-archive /tmp/<image>.tar --name supportplane-local`.
- BL-103 proves this path only with a tiny smoke image. API/Web/Worker images remain BL-104 work.

Verified BL-103 result:

- `supportplane-local` exists as a Kind cluster backed by a Podman container named `supportplane-local-control-plane`.
- `kubectl` context is `kind-supportplane-local`.
- The single control-plane node reported `Ready`.
- CoreDNS, kube-proxy, and local-path-provisioner reported running after the verified node image was used.
- The four namespaces in `namespaces.yaml` were applied and listed as `Active`.
- A disposable `localhost/supportplane-k8s-smoke:bl103` image was built by Podman, saved to an archive, loaded into the Kind node, and observed with `crictl images`.
- No app service, database, ticketing, AI, credential, broker, email, object-storage, or observability workload is deployed by this directory.

Non-claims:

- These manifests do not deploy SupportPlane API, Web, Worker, or PostgreSQL.
- These manifests do not deploy Zammad, Ollama, OpenBao, NATS, Mailpit, MinIO, or observability.
- No real Zammad writeback, real secrets, real AI provider, or production deployment is enabled.
- This is a local sandbox foundation only, not a production cluster.
