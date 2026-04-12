#!/bin/bash
# LLM Wiki — One-line installer for macOS
# Usage: curl -fsSL https://raw.githubusercontent.com/RonanCodes/llm-wiki/main/install.sh | bash
# Or locally: ./install.sh

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo ""
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║          LLM Wiki — Installer            ║${NC}"
echo -e "${BOLD}║  Personal Knowledge Base powered by LLMs ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""

# Helper functions
check() { which "$1" >/dev/null 2>&1; }
ok()    { echo -e "  ${GREEN}✓${NC} $1"; }
skip()  { echo -e "  ${YELLOW}→${NC} $1 (already installed)"; }
fail()  { echo -e "  ${RED}✗${NC} $1"; }
info()  { echo -e "  ${BLUE}ℹ${NC} $1"; }
ask()   {
    echo -e -n "  ${YELLOW}?${NC} $1 [Y/n] "
    read -r response
    [[ -z "$response" || "$response" =~ ^[Yy] ]]
}

# ──────────────────────────────────────────
# Step 1: Homebrew
# ──────────────────────────────────────────
echo -e "${BOLD}Step 1: Homebrew${NC}"
if check brew; then
    skip "Homebrew $(brew --version | head -1 | awk '{print $2}')"
else
    echo -e "  Homebrew is required to install dependencies on macOS."
    if ask "Install Homebrew?"; then
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        ok "Homebrew installed"
    else
        fail "Homebrew is required. Install it from https://brew.sh"
        exit 1
    fi
fi
echo ""

# ──────────────────────────────────────────
# Step 2: Core dependencies
# ──────────────────────────────────────────
echo -e "${BOLD}Step 2: Core Dependencies${NC}"

# Git
if check git; then
    skip "Git $(git --version | awk '{print $3}')"
else
    brew install git
    ok "Git installed"
fi

# Node.js
if check node; then
    skip "Node.js $(node --version)"
else
    if ask "Install Node.js via Homebrew?"; then
        brew install node
        ok "Node.js installed"
    fi
fi

# pnpm
if check pnpm; then
    skip "pnpm $(pnpm --version)"
else
    if ask "Install pnpm?"; then
        npm install -g pnpm
        ok "pnpm installed"
    fi
fi

# Claude Code
if check claude; then
    skip "Claude Code $(claude --version 2>/dev/null || echo '(version check failed)')"
else
    echo -e "  Claude Code is the engine that powers LLM Wiki."
    if ask "Install Claude Code?"; then
        npm install -g @anthropic-ai/claude-code
        ok "Claude Code installed"
    else
        info "Install later: npm install -g @anthropic-ai/claude-code"
    fi
fi
echo ""

# ──────────────────────────────────────────
# Step 3: Obsidian
# ──────────────────────────────────────────
echo -e "${BOLD}Step 3: Obsidian (Wiki Viewer)${NC}"
if [ -d "/Applications/Obsidian.app" ] || check obsidian; then
    skip "Obsidian"
else
    echo -e "  Obsidian is the viewer for browsing your wiki."
    if ask "Install Obsidian via Homebrew?"; then
        brew install --cask obsidian
        ok "Obsidian installed"
    else
        info "Download manually: https://obsidian.md/download"
    fi
fi
echo ""

# ──────────────────────────────────────────
# Step 4: Optional tools
# ──────────────────────────────────────────
echo -e "${BOLD}Step 4: Optional Tools${NC}"
info "These are installed automatically when you first need them."
info "You can also install them now if you prefer."
echo ""

OPTIONAL_TOOLS=(
    "yt-dlp:YouTube transcript extraction:brew install yt-dlp"
    "pdftotext:PDF text extraction:brew install poppler"
    "pandoc:Word/Excel/PowerPoint conversion:brew install pandoc"
)

for tool_info in "${OPTIONAL_TOOLS[@]}"; do
    IFS=':' read -r tool desc install_cmd <<< "$tool_info"
    if check "$tool"; then
        skip "$tool — $desc"
    else
        info "$tool — $desc (install later: $install_cmd)"
    fi
done
echo ""

# ──────────────────────────────────────────
# Step 5: Summary
# ──────────────────────────────────────────
echo -e "${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║            Setup Complete!                ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}Next steps:${NC}"
echo ""
echo -e "  1. Open Claude Code in this directory:"
echo -e "     ${BLUE}cd llm-wiki && claude${NC}"
echo ""
echo -e "  2. Create your first vault:"
echo -e "     ${BLUE}/vault-create my-research --domain ai-research${NC}"
echo ""
echo -e "  3. Open the vault in Obsidian:"
echo -e "     ${BLUE}Open Obsidian → Open folder as vault → vaults/my-research${NC}"
echo ""
echo -e "  4. Ingest your first source:"
echo -e "     ${BLUE}/ingest https://some-article.com --vault my-research${NC}"
echo ""
echo -e "  For the full guide, open:"
echo -e "     ${BLUE}open docs/getting-started.html${NC}"
echo ""
