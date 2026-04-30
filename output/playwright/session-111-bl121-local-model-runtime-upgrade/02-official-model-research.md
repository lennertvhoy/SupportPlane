# Official Model Research — BL-121

**Date:** 2026-04-29
**Source:** Ollama library (https://ollama.com/library), web search, direct runtime verification

## Current Runtime Truth

- Host Ollama version: 0.18.2
- Host GPU: AMD RX 7700 XT / 7800 XT (16GB VRAM)
- Installed models: llama3.1:8b (4.9GB), qwen2.5:7b (4.7GB), statedd-devstral:latest (15GB), devstral-small-2:24b (15GB)
- Disk available: ~1.1TB

## Ollama Version Status

- Latest release (GitHub): v0.22.0 (published 2026-04-28)
- Current host: 0.18.2
- Delta: 0.18.2 → 0.22.0 required for Gemma 4 and Qwen3.6 families
- Direct test: `ollama pull gemma4:e4b` on 0.18.2 returns:
  > "The model you are attempting to pull requires a newer version of Ollama."

## Verified Model Tags (from ollama.com/library, April 2026)

### Gemma 4 family
- `gemma4:e4b` — ~4GB, 4B active/dense, fits 6GB+ VRAM
- `gemma4:26b` — ~17GB, MoE 26B (4B active), requires 16GB+ VRAM
- `gemma4:31b` — ~19GB, dense 31B, requires 16GB+ VRAM (may CPU-spill slightly on 16GB)

### Qwen 3.6 family
- `qwen3.6:27b` — ~?GB, 27B dense
- `qwen3.6:35b` — ~?GB, 35B (likely MoE or dense)
- Tags confirmed on https://ollama.com/library/qwen3.6 (vision, tools, thinking, 27b, 35b)

### Qwen 3.5 family (fallback/alternative)
- `qwen3.5:9b` — ~6.6GB, dense, fits 8GB+ VRAM
- `qwen3.5:35b-a3b` — ~23GB, MoE (3B active), requires 16GB+ VRAM (may CPU-spill)

### Baseline / already installed
- `llama3.1:8b` — 4.9GB, 8B dense, proven working
- `qwen2.5:7b` — 4.7GB, 7.6B dense, proven working

## 16GB VRAM Feasibility Assessment

| Model | Size | Likely fit on 16GB | Notes |
|---|---|---|---|
| gemma4:e4b | ~4GB | ✅ Easy fit | Smallest credible Gemma 4 |
| qwen3.5:9b | ~6.6GB | ✅ Easy fit | Good quality/density trade-off |
| llama3.1:8b | 4.9GB | ✅ Easy fit | Current baseline |
| qwen2.5:7b | 4.7GB | ✅ Easy fit | Current baseline |
| gemma4:26b | ~17GB | ⚠️ Maybe with slight CPU spill | MoE, only 4B active params |
| gemma4:31b | ~19GB | ❌ Likely CPU-spill | Dense 31B, may be too large |
| qwen3.6:27b | Unknown | ⚠️ Needs test | Likely 15-18GB |
| qwen3.6:35b | Unknown | ❌ Likely too large | 35B, expect 20GB+ |
| qwen3.5:35b-a3b | ~23GB | ❌ Likely CPU-spill | MoE but model file is large |

## Candidate Selection Priority

1. **Primary:** `gemma4:e4b` — smallest Gemma 4, verified tag, should work after Ollama upgrade
2. **Secondary:** `qwen3.6:27b` — if size/VRAM acceptable after upgrade
3. **Tertiary:** `qwen3.5:9b` — proven family, slightly larger than baseline, good quality
4. **No-go (documented):** `gemma4:31b`, `qwen3.6:35b`, `qwen3.5:35b-a3b` — too large for clean 16GB VRAM

## Risks

- Some sources report Gemma 4 27B HTTP 500 errors under Ollama in unattended benchmark sessions (model lifecycle issues). This may affect `gemma4:26b` too.
- `gemma4:e4b` is the safest first candidate because it is small and should load reliably.
- AMD ROCm support in Ollama is present but not as mature as CUDA; GPU utilization must be verified per model.

## LM Studio Assessment

- Not installed on host.
- Could be assessed as fallback if Ollama upgrade fails or if model performance is poor.
- Defer LM Studio unless Ollama path is blocked.
