#!/usr/bin/env bash
# ensure-pandoc.sh — lazy-install pandoc + (optionally) a LaTeX engine.
# Called by every generate-* handler that renders PDFs.
#
# Usage:
#   source /path/to/ensure-pandoc.sh            # installs pandoc, picks engine
#   ensure_pandoc              # must exist on PATH afterwards
#   ensure_latex_engine        # sets PDF_ENGINE=xelatex or falls back
#                              # exports USE_HTML_FALLBACK=1 if no engine
#
# Exits non-zero only when pandoc itself cannot be installed and no manual
# path is clear to the user. A missing LaTeX engine is a fallback case,
# not a failure — handlers can still emit HTML.

set -euo pipefail

ensure_pandoc() {
  if command -v pandoc >/dev/null 2>&1; then
    return 0
  fi

  echo "pandoc not found — installing..."
  if command -v brew >/dev/null 2>&1; then
    brew install pandoc
  elif command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update && sudo apt-get install -y pandoc
  else
    cat >&2 <<'EOF'
ERROR: pandoc is required but no supported package manager was found.
Install manually:
  macOS:    https://pandoc.org/installing.html  (or install Homebrew first)
  Linux:    your-package-manager install pandoc
  Windows:  choco install pandoc  (or download the .msi)
EOF
    return 1
  fi
}

ensure_latex_engine() {
  if command -v xelatex >/dev/null 2>&1; then
    export PDF_ENGINE=xelatex
    export USE_HTML_FALLBACK=0
    return 0
  fi
  if command -v pdflatex >/dev/null 2>&1; then
    export PDF_ENGINE=pdflatex
    export USE_HTML_FALLBACK=0
    return 0
  fi

  echo "No LaTeX engine found — attempting BasicTeX install..."
  if command -v brew >/dev/null 2>&1; then
    if brew install --cask basictex 2>/dev/null; then
      # BasicTeX installs to /Library/TeX/texbin; make sure it's on PATH for this session
      export PATH="/Library/TeX/texbin:$PATH"
      if command -v xelatex >/dev/null 2>&1; then
        export PDF_ENGINE=xelatex
        export USE_HTML_FALLBACK=0
        return 0
      fi
    fi
  fi

  echo "Falling back to HTML output. Install a LaTeX engine later for PDF:" >&2
  echo "  macOS:  brew install --cask basictex" >&2
  echo "  Linux:  apt install texlive-xetex" >&2
  export PDF_ENGINE=""
  export USE_HTML_FALLBACK=1
  return 0
}
