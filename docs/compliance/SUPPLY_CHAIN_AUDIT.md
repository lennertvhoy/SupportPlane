# Supply Chain Audit — Readiness / Precheck

> **Status:** Readiness / Precheck — NOT a certified supply-chain security assessment.  
> **Scope:** npm dependencies, container images, build toolchain.  
> **As of:** 2026-05-04

## 1. Dependency Inventory

| Layer            | Manager          | Lockfile                       | Workspace                    |
| ---------------- | ---------------- | ------------------------------ | ---------------------------- |
| Node.js packages | npm (v10+)       | `package-lock.json` committed  | Yes — `apps/*`, `packages/*` |
| Container images | Podman           | N/A (Dockerfile/Containerfile) | Local builds only            |
| OS packages      | Fedora 43 (host) | N/A                            | N/A                          |

### 1.1 Top-Level Dependency Categories

| Category          | Examples                                | Count (approx) |
| ----------------- | --------------------------------------- | -------------- |
| Runtime framework | NestJS, Next.js, React                  | 3              |
| Database / ORM    | Prisma 7, PostgreSQL client             | 2              |
| AI / ML           | Ollama SDK (local), `pdfmake`           | 2              |
| Messaging         | NATS client                             | 1              |
| Object storage    | AWS SDK v3 (MinIO-compatible)           | 1              |
| Auth              | `passport`, `keycloak-connect` patterns | 2              |
| Testing           | Node native test runner, `supertest`    | 2              |
| Build / Dev       | TypeScript 5.7+, ESLint 9, Prettier     | 3              |

> **Note:** Exact dependency counts require `npm ls --all`. This table is illustrative.

## 2. SBOM Status

| SBOM Format               | Generated? | Tool | Location |
| ------------------------- | ---------- | ---- | -------- |
| CycloneDX                 | No         | —    | —        |
| SPDX                      | No         | —    | —        |
| npm `sbom` (experimental) | Not run    | —    | —        |

**Gap:** No SBOM exists. This blocks formal supply-chain transparency and vulnerability correlation.

## 3. License Audit

| Aspect                      | Status   | Evidence                                                                                            |
| --------------------------- | -------- | --------------------------------------------------------------------------------------------------- |
| License compatibility check | Not done | —                                                                                                   |
| `LICENSE` file at repo root | Yes      | `/LICENSE` exists                                                                                   |
| Per-package license headers | No       | —                                                                                                   |
| Third-party notice file     | No       | —                                                                                                   |
| Copyleft dependency scan    | Not done | Prisma (Apache 2.0), NestJS (MIT), Next.js (MIT) are permissive; deep transitive scan not performed |

**Gap:** No automated license gate; no `FOSSA` or `license-checker` integration.

## 4. Container Hardening

| Image                                     | Base                                    | Non-root User | Distroless | Scan    | Size    |
| ----------------------------------------- | --------------------------------------- | ------------- | ---------- | ------- | ------- |
| `localhost/supportplane-api:local-k8s`    | Node.js 22 (assumed from Containerfile) | Unknown       | No         | No scan | Unknown |
| `localhost/supportplane-web:local-k8s`    | Node.js 22                              | Unknown       | No         | No scan | Unknown |
| `localhost/supportplane-worker:local-k8s` | Node.js 22                              | Unknown       | No         | No scan | Unknown |

### 4.1 Hardening Recommendations

| Recommendation                                          | Priority | Effort |
| ------------------------------------------------------- | -------- | ------ |
| Use non-root `USER` in Containerfiles                   | P1       | Low    |
| Pin base image digest (`node:22-alpine@sha256:...`)     | P1       | Low    |
| Run `npm ci --only=production` to reduce layer size     | P1       | Low    |
| Add `.dockerignore` / containerignore for build context | P1       | Low    |
| Scan images with Trivy or Grype                         | P2       | Medium |
| Consider distroless or hardened base (Chainguard)       | P2       | Medium |
| Sign images with Sigstore/cosign                        | P3       | Medium |

## 5. Vulnerability Management

| Practice                          | Status        | Tool                                     |
| --------------------------------- | ------------- | ---------------------------------------- |
| Dependency vulnerability scanning | Not automated | —                                        |
| Dependabot / Renovate             | Not enabled   | —                                        |
| CVE tracking dashboard            | No            | —                                        |
| Patch cadence                     | Ad hoc        | —                                        |
| Zero-trust build                  | No            | GitHub Actions not used for image builds |

**Gap:** No continuous vulnerability monitoring.

## 6. Build Integrity

| Control                     | Status  | Evidence                                                                                     |
| --------------------------- | ------- | -------------------------------------------------------------------------------------------- |
| Reproducible builds         | Partial | `package-lock.json` pins versions; no `npm ci` provenance                                    |
| Build environment isolation | Partial | Local Podman builds; no ephemeral CI builder                                                 |
| Source provenance           | Partial | Git commits tagged; no SLSA attestation                                                      |
| Secret injection            | Safe    | Build-time args do not include secrets; secrets mounted at runtime via K8s secrets / OpenBao |

## 7. Recommended Actions

1. **Generate SBOM** — Run `npm sbom` or `cyclonedx-npm` and commit baseline to `docs/compliance/sbom/`.
2. **License scan** — Run `license-checker --json` and inventory copyleft/transitive obligations.
3. **Container hardening** — Add non-root user, pinned digest, production-only install to all Containerfiles.
4. **Enable Dependabot** — For automated security update PRs.
5. **Image scanning** — Add Trivy scan to build scripts or CI workflow.
6. **Document SBOM update cadence** — Tie to each release slice.

---

_This audit is a readiness precheck, not a certified supply-chain security assessment._
