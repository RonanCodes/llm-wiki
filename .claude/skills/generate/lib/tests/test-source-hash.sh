#!/usr/bin/env bash
# test-source-hash.sh — unit tests for .claude/skills/generate/lib/source-hash.sh
#
# Covers phase-2e US-001 acceptance criteria:
#   - stable hash over a fixed fixture
#   - whitespace-only change does NOT change the hash
#   - content change DOES change the hash
#   - path-order independence
#   - missing file → non-zero exit
#   - no inputs → non-zero exit
#
# Run:  bash .claude/skills/generate/lib/tests/test-source-hash.sh
# Exit: 0 if all pass, 1 on any failure. No test framework required.

set -euo pipefail

HERE=$(cd "$(dirname "$0")" && pwd)
HELPER="$HERE/../source-hash.sh"
FIX="$HERE/fixtures"

fail=0
pass=0

check() {
  local name=$1 expected=$2 actual=$3
  if [ "$expected" = "$actual" ]; then
    printf '  \033[32mPASS\033[0m  %s\n' "$name"
    pass=$((pass + 1))
  else
    printf '  \033[31mFAIL\033[0m  %s\n' "$name"
    printf '         expected: %s\n' "$expected"
    printf '         actual:   %s\n' "$actual"
    fail=$((fail + 1))
  fi
}

check_ne() {
  local name=$1 a=$2 b=$3
  if [ "$a" != "$b" ]; then
    printf '  \033[32mPASS\033[0m  %s\n' "$name"
    pass=$((pass + 1))
  else
    printf '  \033[31mFAIL\033[0m  %s  (both: %s)\n' "$name" "$a"
    fail=$((fail + 1))
  fi
}

check_exit() {
  local name=$1 expected=$2 actual=$3
  if [ "$expected" = "$actual" ]; then
    printf '  \033[32mPASS\033[0m  %s  (exit %s)\n' "$name" "$actual"
    pass=$((pass + 1))
  else
    printf '  \033[31mFAIL\033[0m  %s  expected exit %s, got %s\n' "$name" "$expected" "$actual"
    fail=$((fail + 1))
  fi
}

echo "source-hash tests"
echo "-----------------"

# --- baseline hash of 3-file fixture ---
BASE=$(bash "$HELPER" "$FIX/a.md" "$FIX/b.md" "$FIX/c.md")
[ -n "$BASE" ] && [ ${#BASE} -eq 64 ] \
  && check "baseline: 64-char hex digest" "ok" "ok" \
  || check "baseline: 64-char hex digest" "64 hex chars" "$BASE (len ${#BASE})"

# --- idempotence: same inputs → same hash ---
AGAIN=$(bash "$HELPER" "$FIX/a.md" "$FIX/b.md" "$FIX/c.md")
check "idempotent across runs" "$BASE" "$AGAIN"

# --- path-order independence ---
REORDERED=$(bash "$HELPER" "$FIX/c.md" "$FIX/a.md" "$FIX/b.md")
check "order-independent" "$BASE" "$REORDERED"

# --- stdin mode ---
STDIN_HASH=$(printf '%s\n%s\n%s\n' "$FIX/a.md" "$FIX/b.md" "$FIX/c.md" | bash "$HELPER")
check "stdin mode matches argv mode" "$BASE" "$STDIN_HASH"

# --- whitespace-only change does NOT change the hash ---
# "Whitespace-only" means line endings, trailing whitespace, and blank-line runs.
# Internal whitespace (between words, inside code blocks) is semantic — changing
# it MUST change the hash, so we don't test that here.
SCRATCH=$(mktemp -d)
trap 'rm -rf "$SCRATCH"' EXIT
cp "$FIX/a.md" "$SCRATCH/a.md"
cp "$FIX/b.md" "$SCRATCH/b.md"
cp "$FIX/c.md" "$SCRATCH/c.md"
# append trailing blank lines on b.md
printf '\n\n\n' >> "$SCRATCH/b.md"
# append trailing whitespace to every line of a.md (tab + spaces at EOL)
awk '{print $0 "   \t "}' "$FIX/a.md" > "$SCRATCH/a.md"
# convert c.md to CRLF line endings
awk '{printf "%s\r\n", $0}' "$FIX/c.md" > "$SCRATCH/c.md"
WS_HASH=$(bash "$HELPER" "$SCRATCH/a.md" "$SCRATCH/b.md" "$SCRATCH/c.md")
check "whitespace-only change → stable hash" "$BASE" "$WS_HASH"

# --- internal whitespace change IS treated as content ---
cp "$FIX/b.md" "$SCRATCH/b.md"
sed -i.bak $'s/quadratic in/quadratic  in/' "$SCRATCH/b.md" && rm "$SCRATCH/b.md.bak"
INTERNAL_WS_HASH=$(bash "$HELPER" "$FIX/a.md" "$SCRATCH/b.md" "$FIX/c.md")
check_ne "internal whitespace change → different hash (semantic)" "$BASE" "$INTERNAL_WS_HASH"

# --- content change DOES change the hash ---
cp "$FIX/a.md" "$SCRATCH/a.md"
echo "New semantic sentence here." >> "$SCRATCH/a.md"
CONTENT_HASH=$(bash "$HELPER" "$SCRATCH/a.md" "$SCRATCH/b.md" "$SCRATCH/c.md")
check_ne "content change → different hash" "$BASE" "$CONTENT_HASH"

# --- missing file → non-zero exit ---
set +e
bash "$HELPER" "$FIX/a.md" "$FIX/does-not-exist.md" >/dev/null 2>&1
code=$?
set -e
check_exit "missing file → non-zero exit" "3" "$code"

# --- no inputs → non-zero exit ---
set +e
echo "" | bash "$HELPER" >/dev/null 2>&1
code=$?
set -e
check_exit "empty input → non-zero exit" "2" "$code"

# --- summary ---
echo "-----------------"
printf 'Passed: %d  Failed: %d\n' "$pass" "$fail"
[ "$fail" -eq 0 ]
