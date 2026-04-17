#!/usr/bin/env bash
# render-pdf.sh — shared Pandoc invocation for every generate-* handler
# that produces PDF output. Handles engine selection, HTML fallback,
# error surfacing, and template lookup.
#
# Usage:
#   render-pdf.sh <bundle.md> <output.pdf> [--toc] [--template <path>]
#
# Environment (populated by ensure-pandoc.sh):
#   PDF_ENGINE            — xelatex | pdflatex | (empty → HTML fallback)
#   USE_HTML_FALLBACK     — 1 if no LaTeX engine; write .html instead
#
# Exit codes:
#   0   success
#   2   pandoc rendering failed (tail of stderr printed)
#   3   missing input bundle
#   4   pandoc not installed (caller should have ensure_pandoc'd)

set -euo pipefail

BUNDLE="${1:-}"
OUTPUT="${2:-}"
shift 2 || true

TOC_FLAG=""
TEMPLATE_ARG=""

while [ $# -gt 0 ]; do
  case "$1" in
    --toc)
      TOC_FLAG="--toc --toc-depth=3"
      shift
      ;;
    --template)
      if [ -n "${2:-}" ] && [ -f "$2" ]; then
        TEMPLATE_ARG="--template=$2"
      fi
      shift 2
      ;;
    *)
      echo "render-pdf: unknown flag: $1" >&2
      shift
      ;;
  esac
done

if [ -z "$BUNDLE" ] || [ ! -f "$BUNDLE" ]; then
  echo "render-pdf: bundle missing or unreadable: $BUNDLE" >&2
  exit 3
fi
if [ -z "$OUTPUT" ]; then
  echo "render-pdf: output path required" >&2
  exit 3
fi

command -v pandoc >/dev/null 2>&1 || {
  echo "render-pdf: pandoc not installed — call ensure_pandoc first" >&2
  exit 4
}

mkdir -p "$(dirname "$OUTPUT")"

ERR_LOG="$(mktemp -t render-pdf.XXXXXX.log)"
trap 'rm -f "$ERR_LOG"' EXIT

COMMON_ARGS=(
  -V mainfont="Helvetica"
  -V sansfont="Helvetica"
  -V monofont="Menlo"
  -V geometry:margin=1in
)

if [ "${USE_HTML_FALLBACK:-0}" = "1" ] || [ -z "${PDF_ENGINE:-}" ]; then
  HTML_OUT="${OUTPUT%.pdf}.html"
  if pandoc "$BUNDLE" --standalone $TOC_FLAG $TEMPLATE_ARG -o "$HTML_OUT" 2> "$ERR_LOG"; then
    echo "Rendered HTML (no LaTeX engine): $HTML_OUT"
    echo "Install a LaTeX engine for PDF: brew install --cask basictex"
    exit 0
  else
    echo "pandoc failed. Last 20 lines:" >&2
    tail -20 "$ERR_LOG" >&2
    exit 2
  fi
fi

if pandoc "$BUNDLE" \
     --pdf-engine="$PDF_ENGINE" \
     $TOC_FLAG \
     $TEMPLATE_ARG \
     "${COMMON_ARGS[@]}" \
     -o "$OUTPUT" 2> "$ERR_LOG"; then
  exit 0
fi

echo "pandoc failed. Last 20 lines of stderr:" >&2
tail -20 "$ERR_LOG" >&2
cat >&2 <<'EOF'

Common fixes:
  - Missing LaTeX package:   tlmgr install <package>
  - Unicode error:           set PDF_ENGINE=xelatex
  - Image not found:         check relative paths in source pages
  - Font not found:          install font or drop -V mainfont=...
EOF
exit 2
