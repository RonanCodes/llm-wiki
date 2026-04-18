#!/bin/bash
# Ralph Loop — autonomous coding agent loop for llm-wiki
# Usage: ./ralph.sh [--prd <name>] [max_iterations]
#
#   --prd <name>   Use .ralph/prd-<name>.json (matching progress-<name>.txt).
#                  If omitted, uses .ralph/prd.json / .ralph/progress.txt.
#   max_iterations Defaults to 10.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Parse args — support --prd <name> anywhere in argv, then a positional max_iterations.
PRD_NAME=""
POSITIONAL=()
while [ $# -gt 0 ]; do
  case "$1" in
    --prd)
      if [ -z "${2:-}" ]; then
        echo "Error: --prd requires a name (e.g. --prd phase-2a-foundation)" >&2
        exit 1
      fi
      PRD_NAME="$2"
      shift 2
      ;;
    --prd=*)
      PRD_NAME="${1#--prd=}"
      shift
      ;;
    *)
      POSITIONAL+=("$1")
      shift
      ;;
  esac
done

if [ -n "$PRD_NAME" ]; then
  PRD_FILE="$SCRIPT_DIR/prd-$PRD_NAME.json"
  PROGRESS_FILE="$SCRIPT_DIR/progress-$PRD_NAME.txt"
  RALPH_CMD="/ralph --prd $PRD_NAME"
else
  PRD_FILE="$SCRIPT_DIR/prd.json"
  PROGRESS_FILE="$SCRIPT_DIR/progress.txt"
  RALPH_CMD="/ralph"
fi

MAX_ITERATIONS="${POSITIONAL[0]:-10}"

# Check PRD file exists
if [ ! -f "$PRD_FILE" ]; then
  echo "Error: PRD file not found at $PRD_FILE" >&2
  if [ -n "$PRD_NAME" ]; then
    echo "Expected: .ralph/prd-$PRD_NAME.json" >&2
  fi
  echo "Create one with /ralph --plan-only or manually." >&2
  exit 1
fi

# Initialize progress file if needed
if [ ! -f "$PROGRESS_FILE" ]; then
  echo "# Ralph Progress Log${PRD_NAME:+ — $PRD_NAME}" > "$PROGRESS_FILE"
  echo "Started: $(date)" >> "$PROGRESS_FILE"
  echo "---" >> "$PROGRESS_FILE"
fi

echo "Starting Ralph Loop"
echo "  PRD:       $PRD_FILE"
echo "  Progress:  $PROGRESS_FILE"
echo "  Command:   $RALPH_CMD"
echo "  Max iters: $MAX_ITERATIONS"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
  echo "==============================================================="
  echo "  Ralph Iteration $i of $MAX_ITERATIONS${PRD_NAME:+ ($PRD_NAME)}"
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

  # Run Claude Code with the ralph skill (named or default)
  OUTPUT=$(claude --dangerously-skip-permissions --print "$RALPH_CMD" 2>&1 | tee /dev/stderr) || true

  echo ""
  echo "Iteration $i complete. Continuing..."
  sleep 2
done

echo ""
echo "Ralph reached max iterations ($MAX_ITERATIONS)."
echo "Check $PROGRESS_FILE for status."
exit 1
