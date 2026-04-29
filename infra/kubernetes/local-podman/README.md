# Local Podman Kubernetes Skeleton

**Status:** planning skeleton only. This directory does not deploy a cluster yet.

Future layout may include:

```text
infra/kubernetes/local-podman/
  README.md
  namespaces.yaml
  kustomization.yaml
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

The next implementation slice should first verify the local Kubernetes approach on this host, likely Kind with Podman provider or Minikube with Podman driver. Only after the cluster path is proven should this directory gain deployable manifests.

Non-claims:

- No Kubernetes cluster is created by this skeleton.
- No manifest here is claimed to be valid or deployed.
- No real Zammad writeback, real secrets, real AI provider, or production deployment is enabled.
