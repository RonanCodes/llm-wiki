---
name: setup
description: First-time setup for the llm-wiki system. Checks and installs core dependencies, verifies environment, and guides initial configuration. Use when setting up llm-wiki on a new machine.
disable-model-invocation: true
allowed-tools: Bash(brew *) Bash(which *) Bash(npm *) Bash(pnpm *)
---

# LLM Wiki Setup

First-time bootstrap for a new machine. Checks environment, installs core deps, guides configuration.

## Steps

1. **Check environment:**

```bash
echo "=== Environment Check ==="
echo "OS: $(uname -s)"
echo "Shell: $SHELL"
echo "Node: $(node --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "Git: $(git --version 2>/dev/null || echo 'NOT INSTALLED')"
echo "Homebrew: $(brew --version 2>/dev/null | head -1 || echo 'NOT INSTALLED')"
echo "Claude Code: $(claude --version 2>/dev/null || echo 'NOT INSTALLED')"
```

2. **Install core dependencies** (only what's missing):
   - `node` (v24 LTS) — via brew or nvm
   - `git` — via brew (likely already installed)
   - `pnpm` — via `npm install -g pnpm`

3. **Skip optional tools** — these are installed lazily by their respective skills:
   - `yt-dlp` — installed by ingest-youtube on first use
   - `poppler` — installed by ingest-pdf on first use
   - `pandoc` — installed by ingest-office on first use
   - `qmd` — installed by search skill when needed
   - `@marp-team/marp-cli` — installed by slides skill when needed

   Print a summary of optional tools and what triggers their install.

4. **Verify Obsidian** — check if Obsidian is installed. If not, suggest installing it (it's the wiki viewer). Not a hard dependency.

5. **Print next steps:**
   - Create your first vault: `/vault-create my-research`
   - Open the vault directory in Obsidian
   - Ingest your first source: `/ingest <url> --vault my-research`

## Reference

See `docs/dependencies.md` for the full dependency manifest.
