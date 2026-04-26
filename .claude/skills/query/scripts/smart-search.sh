#!/usr/bin/env bash
# smart-search.sh — qmd search with auto-escalation to qmd query
#
# Runs BM25 (qmd search) first. If results look insufficient by deterministic
# rules, escalates to hybrid (qmd query) and replaces the results.
#
# Escalation triggers:
#   1. Zero BM25 hits
#   2. Top BM25 score < 70%
#   3. Top 3 BM25 scores bunched within 3 percentage points
#
# Usage:
#   bash smart-search.sh "<query>"
#
# Output: qmd-formatted results on stdout. Escalation note on stderr (so it
# doesn't pollute the result body but the LLM still sees it).

set -euo pipefail

QUERY="${1:-}"
if [[ -z "$QUERY" ]]; then
  echo "Usage: smart-search.sh \"<query>\"" >&2
  exit 2
fi

if ! command -v qmd >/dev/null 2>&1; then
  echo "ERROR: qmd not installed. Install via: npm install -g @tobilu/qmd" >&2
  exit 1
fi

# --- Step 1: BM25 ---
BM25_OUT=$(qmd search "$QUERY" 2>&1 || true)

# Extract scores. qmd output format: lines like "Score:  92%"
SCORES=$(echo "$BM25_OUT" | grep -E "^Score:\s+[0-9]+%" | awk '{print $2}' | tr -d '%' || true)
NUM_HITS=$(echo "$SCORES" | grep -c "^[0-9]" || true)
TOP_SCORE=$(echo "$SCORES" | head -1)

# --- Step 2: Decide whether to escalate ---
ESCALATE=false
REASON=""

if [[ "$NUM_HITS" -eq 0 ]]; then
  ESCALATE=true
  REASON="no BM25 hits"
elif [[ "$TOP_SCORE" -lt 70 ]]; then
  ESCALATE=true
  REASON="top BM25 score ${TOP_SCORE}% below 70% threshold"
elif [[ "$NUM_HITS" -ge 3 ]]; then
  TOP3_MAX=$(echo "$SCORES" | head -3 | sort -rn | head -1)
  TOP3_MIN=$(echo "$SCORES" | head -3 | sort -n | head -1)
  SPREAD=$((TOP3_MAX - TOP3_MIN))
  if [[ "$SPREAD" -lt 3 ]]; then
    ESCALATE=true
    REASON="top 3 BM25 scores bunched within ${SPREAD} points (${TOP3_MIN}-${TOP3_MAX}%) — ranking can't discriminate"
  fi
fi

# --- Step 3: Output ---
if $ESCALATE; then
  echo "↑ Escalated to hybrid: ${REASON}" >&2

  # Check if hybrid path is ready (embeddings exist).
  # qmd status prints e.g. "Vectors:  941 embedded" — gate on a non-zero vector count.
  VECTOR_COUNT=$(qmd status 2>&1 | grep -E "^\s+Vectors:" | awk '{print $2}' || echo "0")
  if [[ -z "$VECTOR_COUNT" || "$VECTOR_COUNT" == "0" ]]; then
    echo "⚠ Hybrid not ready (no embeddings yet). Run 'qmd embed' once. Returning BM25 results." >&2
    echo "$BM25_OUT"
    exit 0
  fi

  HYBRID_OUT=$(qmd query "$QUERY" 2>&1 || true)
  # If hybrid errored or returned empty, fall back to BM25
  if [[ -z "$HYBRID_OUT" || "$HYBRID_OUT" == *"Error"* ]]; then
    echo "⚠ Hybrid failed or returned empty. Falling back to BM25." >&2
    echo "$BM25_OUT"
  else
    echo "$HYBRID_OUT"
  fi
else
  echo "✓ BM25 sufficient (top: ${TOP_SCORE}%, ${NUM_HITS} hits)" >&2
  echo "$BM25_OUT"
fi
