#!/usr/bin/env bash
# source-hash.sh — deterministic SHA-256 hash of the canonical content
# of a set of wiki pages. Used by every generate-* handler to stamp
# .meta.yaml sidecars and by /verify-artifact + /lint --artifacts to
# detect drift.
#
# Usage:
#   source-hash.sh <path>...        # explicit list of wiki page paths
#   source-hash.sh < paths.txt      # one path per line on stdin (SAFER)
#
# Output: 64-char hex digest on stdout. Exit 0 on success, non-zero if
# any listed file is missing or unreadable.
#
# Calling convention — prefer stdin when paths may contain spaces:
#
#   # ✅ Safest — bulletproof against upstream word-splitting bugs.
#   # Works with any shell, any path. Use this in new code.
#   HASH=$(printf '%s\n' "${PAGES[@]}" | .claude/skills/generate/lib/source-hash.sh)
#
#   # ✅ Correct IF PAGES is a true bash array (e.g. built with `mapfile -t`).
#   # Existing callers use this form and it handles spaces fine.
#   HASH=$(.claude/skills/generate/lib/source-hash.sh "${PAGES[@]}")
#
#   # ❌ Broken — unquoted expansion word-splits on every whitespace char
#   # including spaces inside paths. Don't do this.
#   HASH=$(.claude/skills/generate/lib/source-hash.sh ${PAGES[@]})
#
# If argv form ever misbehaves on paths with spaces, the bug is upstream
# (the array was populated via unquoted command substitution, not
# `mapfile -t`). Switching to the stdin form is the fastest workaround.
#
# Canonicalization (must be stable across OS, editor, git checkouts):
#   1. Sort input paths lexicographically — order-independence.
#   2. Read each file.
#   3. Normalise line endings to LF (strip \r).
#   4. Strip trailing whitespace from every line.
#   5. Collapse runs of blank lines to a single blank line.
#   6. Trim leading/trailing blank lines on the whole file.
#   7. Concatenate files with a single "\n---\n" separator between them
#      and a trailing "\n".
#   8. Pipe to sha256.
#
# Design notes:
#   - Pure bash + standard Unix tools — no Python, no brew deps.
#   - `shasum -a 256` is available on macOS and most Linux distros;
#     fall back to `sha256sum` if that's what's installed.
#   - A whitespace-only change must NOT alter the hash (per phase-2e
#     US-001 acceptance criteria). A content change MUST alter it.

set -euo pipefail

# --- collect input paths ---
paths=()
if [ $# -gt 0 ]; then
  for p in "$@"; do paths+=("$p"); done
else
  # read newline-delimited paths from stdin
  while IFS= read -r line; do
    [ -n "$line" ] && paths+=("$line")
  done
fi

if [ ${#paths[@]} -eq 0 ]; then
  echo "source-hash: no input paths" >&2
  exit 2
fi

# --- validate + sort ---
for p in "${paths[@]}"; do
  if [ ! -r "$p" ]; then
    echo "source-hash: cannot read: $p" >&2
    exit 3
  fi
done

# sort lexicographically for order-independence
IFS=$'\n' sorted=($(printf '%s\n' "${paths[@]}" | LC_ALL=C sort))
unset IFS

# --- canonicalize each file, then concat ---
canonicalize() {
  # stdin → stdout: applies normalisation rules 3-6
  # 1. strip \r (LF-normalise)
  # 2. strip trailing whitespace
  # 3. squeeze runs of blank lines to one
  # 4. strip leading/trailing blank lines
  tr -d '\r' \
    | sed -E 's/[[:space:]]+$//' \
    | awk 'BEGIN{blank=0} /^$/{blank++; next} {if(blank&&NR>1)print ""; blank=0; print}' \
    | awk 'NF{p=1} p'
}

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT

first=1
for p in "${sorted[@]}"; do
  if [ $first -eq 1 ]; then
    first=0
  else
    printf '\n---\n' >> "$tmp"
  fi
  canonicalize < "$p" >> "$tmp"
done
printf '\n' >> "$tmp"

# --- hash ---
if command -v shasum >/dev/null 2>&1; then
  shasum -a 256 < "$tmp" | awk '{print $1}'
elif command -v sha256sum >/dev/null 2>&1; then
  sha256sum < "$tmp" | awk '{print $1}'
else
  echo "source-hash: neither shasum nor sha256sum found" >&2
  exit 4
fi
