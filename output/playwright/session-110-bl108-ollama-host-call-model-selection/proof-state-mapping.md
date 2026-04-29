# BL-108 Proof State Mapping

**Folder:** `output/playwright/session-110-bl108-ollama-host-call-model-selection/`
**Screenshot count:** 8
**Duplicate count:** 0

| # | Screenshot | What it proves |
|---|-----------|----------------|
| 01 | cluster-api-health-current-head.png | Cluster API health returns ok with git head, storeMode=postgres, authMode=local |
| 02 | session-selected-zammad-loaded.png | UI shows real Zammad sandbox read still works with session selected and ticket context |
| 03 | ollama-full-page.png | Full page showing generated Ollama draft, "Ollama local / real host call" label, and metadata panel with fallbackUsed=false |
| 04 | audit-trail-ollama-draft-event.png | Audit trail contains ai_draft_generated event with provider=ollama, fallbackUsed=false, noCloudCall=true |
| 05 | ai-context-quality-panel.png | AI Context Quality panel showing loaded ticket context for selected session |
| 06 | writeback-blocked-delivery-policy.png | Delivery Policy panel shows "Real network calls: Locked OFF" and writeback blocked |
| 07 | backlog-md-bl108-partial.png | BACKLOG.md showing BL-108 status before acceptance (to be updated after commit) |
| 08 | next-actions-md.png | NEXT_ACTIONS.md showing active queue with BL-108 and BL-111 |

## CLI Artifacts

| Artifact | What it proves |
|----------|---------------|
| baseline-runtime.txt | Host Ollama, GPU, cluster state at start |
| model-candidate-inventory.txt | Available models, pull attempts, selected candidate |
| ollama-model-benchmark.json / .txt | Host benchmark of llama3.1:8b and qwen2.5:7b |
| ollama-cluster-connectivity-proof.txt | Cluster pod to host Ollama reachability via 10.88.0.1:11434 |
| supportplane-api-ollama-real-call-proof.txt | Real API call with fallbackUsed=false, provider=ollama, providerMode=local |
| ollama-no-secret-leak-proof.txt | No secrets in API response or logs |
| validation-gate.txt | Lint, typecheck, tests, state docs all passed |
| cluster-redeploy-proof.txt | (embedded in commands below) Images rebuilt, deployments restarted, health ok |

## Commands Run

```bash
# Rebuild and redeploy
bash scripts/build_and_load_local_k8s_images.sh
kubectl apply -f infra/kubernetes/local-podman/app/app-configmap.yaml
kubectl rollout restart deployment/supportplane-api -n supportplane-app
kubectl rollout status deployment/supportplane-api -n supportplane-app --timeout=120s

# Health check
curl -s http://localhost:4210/health

# Real Ollama call from cluster API
curl -sS -b cookie.txt -X POST http://localhost:4210/support-sessions/{id}/draft-suggestion \
  -d '{"operatorInstructions":"Summarize the VPN issue in 2 sentences.","modelSelection":{"provider":"ollama","model":"llama3.1:8b"}}'
```
