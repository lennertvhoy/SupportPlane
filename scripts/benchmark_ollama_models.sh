#!/usr/bin/env bash
# SupportPlane Ollama Model Benchmark Script
# Usage: bash scripts/benchmark_ollama_models.sh [baseUrl]
set -euo pipefail

BASE_URL="${1:-http://localhost:11434}"
OUTPUT_DIR="output/playwright/session-110-bl108-ollama-host-call-model-selection"
mkdir -p "$OUTPUT_DIR"

MODELS=("llama3.1:8b" "qwen2.5:7b")
PROMPT='Summarize this support case in 3 bullet points. Customer: Acme BVBA. Ticket: VPN connection issue for remote office TICKET-101. Status: open. Constraints: no writeback, no production data, no cloud AI. Return JSON with keys summary, risk, nextStep.'

RESULTS=()

echo "=== Ollama Model Benchmark ==="
echo "Base URL: $BASE_URL"
echo "Models: ${MODELS[*]}"
echo ""

for MODEL in "${MODELS[@]}"; do
  echo "--- Benchmarking $MODEL ---"
  LOAD_SUCCESS=false
  HTTP_STATUS="unknown"
  LATENCY_MS=""
  EVAL_COUNT=""
  TOKENS_PER_SEC=""
  JSON_PARSEABLE=false
  NO_WRITEBACK=false
  NO_AUTONOMOUS_SEND=false
  NO_CLOUD_CLAIM=false
  NO_SECRET=false
  FALLBACK_USED=true
  ERROR_MSG=""

  # Test model availability
  if ! curl -sS --max-time 10 "$BASE_URL/api/tags" | grep -q "\"$MODEL\""; then
    echo "  Model $MODEL not found in Ollama tags. Skipping direct benchmark."
    ERROR_MSG="Model not installed"
    RESULTS+=("{\"model\":\"$MODEL\",\"loadSuccess\":false,\"httpStatus\":\"$HTTP_STATUS\",\"latencyMs\":null,\"evalCount\":null,\"tokensPerSecond\":null,\"jsonParseable\":false,\"noWriteback\":false,\"noAutonomousSend\":false,\"noCloudClaim\":false,\"noSecret\":false,\"fallbackUsed\":true,\"error\":\"$ERROR_MSG\"}")
    continue
  fi

  # Build JSON payload safely
  PAYLOAD=$(python3 -c "import json; print(json.dumps({'model':'$MODEL','prompt':'$PROMPT','stream':False}))")
  RESP_FILE=$(mktemp)
  START_MS=$(date +%s%3N)
  HTTP_CODE=$(curl -sS -w "%{http_code}" --max-time 120 -X POST "$BASE_URL/api/generate" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD" \
    -o "$RESP_FILE" || true)
  END_MS=$(date +%s%3N)
  LATENCY_MS=$((END_MS - START_MS))
  HTTP_STATUS="$HTTP_CODE"

  if [ "$HTTP_CODE" = "200" ]; then
    LOAD_SUCCESS=true
    FALLBACK_USED=false
    RESPONSE=$(cat "$RESP_FILE")
    EVAL_COUNT=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('eval_count',''))" 2>/dev/null || true)
    EVAL_DURATION=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('eval_duration',''))" 2>/dev/null || true)
    if [ -n "$EVAL_COUNT" ] && [ -n "$EVAL_DURATION" ] && [ "$EVAL_DURATION" != "0" ]; then
      TOKENS_PER_SEC=$(python3 -c "print(round($EVAL_COUNT / ($EVAL_DURATION / 1e9), 2))" 2>/dev/null || true)
    fi

    TEXT=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('response',''))" 2>/dev/null || true)
    TEXT_LOWER=$(echo "$TEXT" | tr '[:upper:]' '[:lower:]')

    # JSON parseable check - try to extract JSON block
    JSON_BLOCK=$(echo "$TEXT" | python3 -c "
import sys, re, json
text = sys.stdin.read()
# Look for json code block
m = re.search(r'\`\`\`json\s*(.*?)\`\`\`', text, re.DOTALL)
if m:
    try:
        json.loads(m.group(1))
        print('OK')
    except:
        pass
# Or try the whole text
try:
    json.loads(text)
    print('OK')
except:
    pass
" 2>/dev/null || true)
    if [ "$JSON_BLOCK" = "OK" ]; then
      JSON_PARSEABLE=true
    fi

    # Constraint checks
    if echo "$TEXT_LOWER" | grep -qE "no writeback|writeback blocked|do not writeback"; then
      NO_WRITEBACK=true
    fi
    if echo "$TEXT_LOWER" | grep -qE "human review|requires human review|not sent|draft|waiting for"; then
      NO_AUTONOMOUS_SEND=true
    fi
    if echo "$TEXT_LOWER" | grep -qE "no cloud|local ai|host-controlled|ollama local"; then
      NO_CLOUD_CLAIM=true
    fi
    if ! echo "$TEXT" | grep -qiE "secret|token|password|apikey|bearer"; then
      NO_SECRET=true
    fi
  else
    ERROR_MSG="HTTP $HTTP_CODE"
    cat "$RESP_FILE" >&2 || true
  fi

  rm -f "$RESP_FILE"

  echo "  Load success: $LOAD_SUCCESS"
  echo "  HTTP status: $HTTP_STATUS"
  echo "  Latency: ${LATENCY_MS}ms"
  echo "  Eval count: $EVAL_COUNT"
  echo "  Tokens/sec: $TOKENS_PER_SEC"
  echo "  JSON parseable: $JSON_PARSEABLE"
  echo "  No writeback: $NO_WRITEBACK"
  echo "  No autonomous send: $NO_AUTONOMOUS_SEND"
  echo "  No cloud claim: $NO_CLOUD_CLAIM"
  echo "  No secret: $NO_SECRET"
  echo "  Fallback used: $FALLBACK_USED"
  echo ""

  RESULTS+=("{\"model\":\"$MODEL\",\"loadSuccess\":$LOAD_SUCCESS,\"httpStatus\":\"$HTTP_STATUS\",\"latencyMs\":$LATENCY_MS,\"evalCount\":\"$EVAL_COUNT\",\"tokensPerSecond\":\"$TOKENS_PER_SEC\",\"jsonParseable\":$JSON_PARSEABLE,\"noWriteback\":$NO_WRITEBACK,\"noAutonomousSend\":$NO_AUTONOMOUS_SEND,\"noCloudClaim\":$NO_CLOUD_CLAIM,\"noSecret\":$NO_SECRET,\"fallbackUsed\":$FALLBACK_USED,\"error\":\"$ERROR_MSG\"}")
done

# Write JSON output
JSON_ARRAY="[$(IFS=,; echo "${RESULTS[*]}")]"
echo "$JSON_ARRAY" > "$OUTPUT_DIR/ollama-model-benchmark.json"
python3 -m json.tool "$OUTPUT_DIR/ollama-model-benchmark.json" > "$OUTPUT_DIR/ollama-model-benchmark.txt" 2>/dev/null || cp "$OUTPUT_DIR/ollama-model-benchmark.json" "$OUTPUT_DIR/ollama-model-benchmark.txt"

echo "Benchmark complete."
echo "JSON: $OUTPUT_DIR/ollama-model-benchmark.json"
echo "TXT:  $OUTPUT_DIR/ollama-model-benchmark.txt"
