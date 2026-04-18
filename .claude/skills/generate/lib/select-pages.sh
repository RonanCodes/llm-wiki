#!/usr/bin/env bash
# select-pages.sh — resolve a topic argument to a sorted list of wiki page paths.
#
# Usage:
#   select-pages.sh <vault_dir> <topic>
#
# Where <topic> is one of:
#   all                 → every .md under <vault_dir>/wiki/ except index.md, log.md
#   <folder-path>       → every .md under <vault_dir>/wiki/<folder-path>/
#   <file-path>.md      → that single .md file (absolute or wiki-relative)
#   <tag>               → every .md whose YAML `tags:` list contains <tag>
#
# Output: newline-separated list of file paths, lexicographic sort.
# Exit codes: 0 success (non-empty), 1 empty / not found, 2 bad args.
#
# This is the single source of truth for page selection across generate-* handlers.
# Do NOT copy this logic into handlers — source or call this script.

set -euo pipefail

VAULT_DIR="${1:-}"
TOPIC="${2:-}"

if [ -z "$VAULT_DIR" ] || [ -z "$TOPIC" ]; then
  echo "usage: select-pages.sh <vault_dir> <topic>" >&2
  exit 2
fi

WIKI_DIR="$VAULT_DIR/wiki"
if [ ! -d "$WIKI_DIR" ]; then
  echo "wiki directory not found: $WIKI_DIR" >&2
  exit 2
fi

# --- Resolution ----------------------------------------------------------
MATCHES=()

if [ "$TOPIC" = "all" ]; then
  while IFS= read -r p; do MATCHES+=("$p"); done < <(
    find "$WIKI_DIR" -type f -name '*.md' \
      -not -name 'index.md' -not -name 'log.md' | sort
  )

elif [ -d "$WIKI_DIR/$TOPIC" ]; then
  while IFS= read -r p; do MATCHES+=("$p"); done < <(
    find "$WIKI_DIR/$TOPIC" -type f -name '*.md' | sort
  )

elif [ -f "$WIKI_DIR/$TOPIC" ]; then
  MATCHES+=("$WIKI_DIR/$TOPIC")

elif [ -f "$TOPIC" ]; then
  MATCHES+=("$TOPIC")

else
  # Tag search — scan frontmatter for tag membership.
  while IFS= read -r p; do
    # Grab the YAML frontmatter (between leading `---` and next `---`).
    FRONT=$(awk '/^---$/{n++; next} n==1{print} n==2{exit}' "$p")
    # Match either inline list `tags: [a, b]` or block list `tags:\n  - a\n  - b`.
    if echo "$FRONT" | grep -Eq "^tags:.*\b${TOPIC}\b"; then
      MATCHES+=("$p")
    elif echo "$FRONT" | awk '/^tags:/{f=1; next} f && /^[^ -]/{f=0} f' | grep -Eq "^\s*-\s*${TOPIC}\b"; then
      MATCHES+=("$p")
    fi
  done < <(find "$WIKI_DIR" -type f -name '*.md')

  # Sort the tag matches lexicographically.
  if [ "${#MATCHES[@]}" -gt 0 ]; then
    IFS=$'\n' MATCHES=($(printf '%s\n' "${MATCHES[@]}" | sort)); unset IFS
  fi
fi

# --- Emit ---------------------------------------------------------------
if [ "${#MATCHES[@]}" -eq 0 ]; then
  echo "no pages matched topic: $TOPIC (searched under $WIKI_DIR)" >&2
  exit 1
fi

printf '%s\n' "${MATCHES[@]}"
