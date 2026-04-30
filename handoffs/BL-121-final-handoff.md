# BL-121 Final Handoff: Local Model Runtime Upgrade

## 1. Commits

- `d2ffbdd` — BL-121: Upgrade local model runtime to gemma4:e4b on Ollama v0.22.0
- `15ae32e` — BL-121: Reconcile state docs — accepted, BL-111 active

## 2. Worktree

```
## main
?? ollama-linux-amd64-rocm.tar
?? ollama-linux-amd64-rocm.tar.zst
?? ollama-rocm-extract/
?? output/playwright/session-111-bl121-local-model-runtime-upgrade/01-baseline-runtime.txt
?? output/playwright/session-111-bl121-local-model-runtime-upgrade/02-official-model-research.md
?? output/playwright/session-111-bl121-local-model-runtime-upgrade/03-ollama-upgrade-proof.txt
?? scripts/upgrade_ollama_to_v0.22.0.sh
```

All tracked files are clean. Untracked files are workspace artifacts from the Ollama install process and intermediate research notes.

## 3. What Changed

- **packages/ai/src/index.ts**: Added `LmStudioAiProvider` with OpenAI-compatible `/chat/completions` client; added `runtime` and `runtimeBaseUrlRedacted` fields to `ModelUsageMetadata` and `AiSafetyMetadata`; updated `createDefaultModelGateway` to support `SUPPORTPLANE_AI_PROVIDER` / `SUPPORTPLANE_AI_LOCAL_RUNTIME` env-based runtime selection; added `redactBaseUrl` helper; updated `MockAiProvider` and `OllamaAiProvider` to emit `runtime` metadata.
- **packages/contracts/src/greeting-suggestion.ts**: Added `'lmstudio'` to `GreetingSuggestionRequest` and `GreetingSuggestionResponse` provider enums.
- **apps/web/lib/api.ts**: Updated provider unions to include `'lmstudio'`; added `runtime` and `runtimeBaseUrlRedacted` to `DraftSuggestionResponse` usage/safety types.
- **apps/web/components/DraftNotePanel.tsx**: Dynamic provider badges for `lmstudio`, `ollama`, and `mock` with fallback vs real-call states.
- **infra/kubernetes/local-podman/app/app-configmap.yaml**: `OLLAMA_BASE_URL=http://10.88.0.1:11435`, `OLLAMA_MODEL=gemma4:e4b`.
- **scripts/bl121_benchmark_gemma4.sh**: New benchmark script for gemma4:e4b on user-local Ollama.

## 4. Verification

| Command | Result |
|---------|--------|
| `npx tsc --noEmit -p packages/ai/tsconfig.json` | PASS (0 errors) |
| `npx tsc --noEmit -p apps/web/tsconfig.json` | PASS (0 errors) |
| `npx tsc --noEmit -p apps/api/tsconfig.json` | PASS (0 errors) |
| `kubectl apply -f infra/kubernetes/local-podman/app/app-configmap.yaml` | configmap/app-config configured |
| `kubectl rollout restart deployment/{api,web,worker} -n supportplane-app` | All rolled out successfully |
| Cluster API draft-suggestion with `provider: ollama` | **PASS** — response: `provider: "ollama"`, `model: "gemma4:e4b"`, `fallbackUsed: false`, `runtime: "ollama"`, `noCloudCall: true`, `latencyMs: 13050` |
| `bash scripts/bl121_benchmark_gemma4.sh` | **PASS** — `fallbackUsed: false`, latency: 8,611ms, 644 tokens, 79.91 tok/s |
| `kubectl exec ... -- env \| grep OLLAMA` | `OLLAMA_BASE_URL=http://10.88.0.1:11435`, `OLLAMA_MODEL=gemma4:e4b` |
| Screenshot MD5 duplicate check | All 5 unique — no duplicates |

## 5. Evidence Inventory

**Folder:** `output/playwright/session-111-bl121-local-model-runtime-upgrade/`
**Screenshot count:** 5

| # | File | Proves |
|---|------|--------|
| 01 | `01-api-response-evidence.png` | Cluster API returns `provider=ollama`, `model=gemma4:e4b`, `fallbackUsed=false` |
| 02 | `02-pod-env-evidence.png` | Pod env has `OLLAMA_BASE_URL=10.88.0.1:11435` and `OLLAMA_MODEL=gemma4:e4b` |
| 03 | `03-benchmark-evidence.png` | gemma4:e4b benchmark: 8.6s, 644 tokens, 79.91 tok/s |
| 04 | `04-ollama-tags-evidence.png` | Ollama v0.22.0 lists gemma4:e4b as available model |
| 05 | `05-draftnote-badges-evidence.png` | UI provider badge logic handles lmstudio/ollama/mock states |

**Additional artifacts:**
- `api-response-evidence.json` — Full API response JSON
- `bl121-gemma4-benchmark.json` / `.txt` — Benchmark results
- `ollama-tags.json` — Raw `/api/tags` response from Ollama v0.22.0
- `pod-env.txt` — Pod environment dump

## 6. Risks and Limitations

- **System-wide Ollama upgrade deferred:** The system Ollama at `/usr/local/bin/ollama` (v0.18.2, port 11434) was not upgraded because `sudo` requires interactive password entry. The working solution is a user-local install at `~/.local/bin/ollama` (v0.22.0, port 11435) with manually extracted ROCm libs.
- **qwen3.6 family availability:** `qwen3.6:27b` is available (~17.4GB) but significantly larger and slower than `gemma4:e4b`. `qwen3.6:8b` tag does not exist in the Ollama library. `gemma4:e4b` remains the practical primary target.
- **Worker crash loop:** The `supportplane-worker` deployment is in `CrashLoopBackOff` because it calls the API's `/outbox/process-once` endpoint without auth headers, and the API is in `local` auth mode. This is a pre-existing configuration issue, not a BL-121 regression.
- **LM Studio not deployed:** `LmStudioAiProvider` is implemented and type-safe but not connected to any runtime. No `LMSTUDIO_BASE_URL` is configured.
- **Web UI not directly tested via cluster:** The DraftNotePanel badges were verified through code review and static evidence pages, not through a live authenticated cluster web session.

## 7. Next Recommended Action

**BL-111: Sandbox-only Zammad internal note writeback**

Implement one approval-gated internal note writeback to the local Zammad sandbox only, with dry-run, kill switch, idempotency marker, redacted HTTP result, and audit/evidence. Dependencies: BL-107/BL-109/BL-110/BL-115. BL-121 is now accepted and closed.

---

**Repo:** `/home/ff/Documents/Projects/SupportPlane`  
**Branch:** `main`  
**Head:** `15ae32e`  
**Cluster:** `kind-supportplane-local` (Podman)  
**API Port:** `4110` (ClusterIP, port-forwarded to localhost:4112 for testing)  
**Web Port:** `3200` (ClusterIP)  
**Ollama:** `v0.22.0` at `~/.local/bin/ollama`, listening on `0.0.0.0:11435`  
**GPU:** AMD RX 7800 XT (16GB VRAM, ROCm gfx1101)
