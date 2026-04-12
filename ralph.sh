#!/bin/bash
# Ralph Loop — autonomous coding agent loop for llm-wiki
# Usage: ./ralph.sh [max_iterations]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PRD_FILE="$SCRIPT_DIR/prd.json"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
MAX_ITERATIONS="${1:-10}"

# Check prd.json exists
if [ ! -f "$PRD_FILE" ]; then
  echo "Error: prd.json not found at $PRD_FILE"
  echo "Create one with /ralph --plan-only or manually."
  exit 1
fi

# Initialize progress file if needed
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

echo "Starting Ralph Loop — Max iterations: $MAX_ITERATIONS"
echo "PRD: $PRD_FILE"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS"
  echo "==============================================================="

  # Check if all tasks are done
  REMAINING=$(jq '[.userStories[] | select(.passes == false)] | length' "$PRD_FILE")
  if [ "$REMAINING" -eq 0 ]; then
    echo ""
    echo "All tasks complete!"
    exit 0
  fi

  echo "Remaining tasks: $REMAINING"
  echo ""

  # Run Claude Code with the ralph skill
  OUTPUT=$(claude --dangerously-skip-permissions --print "/ralph" 2>&1 | tee /dev/stderr) || true

  echo ""
  echo "Iteration $i complete. Continuing..."
  sleep 2
done

echo ""
echo "Ralph reached max iterations ($MAX_ITERATIONS)."
echo "Check progress.txt for status."
exit 1
