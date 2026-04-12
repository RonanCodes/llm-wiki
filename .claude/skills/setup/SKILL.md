---
name: setup
description: First-time setup for the llm-wiki system. Checks tools, verifies skills, recommends missing ones from skills.json. Use when setting up llm-wiki on a new machine or after cloning.
disable-model-invocation: true
allowed-tools: Bash(brew *) Bash(which *) Bash(npm *) Bash(pnpm *) Bash(ls *) Bash(cat *) Read Glob
---

# LLM Wiki Setup

First-time bootstrap for a new machine. Reads `skills.json`, checks your environment, installs core deps, and recommends missing skills.

## Usage

```
/setup
```

Or run the install script directly: `./install.sh`

## Step 1: Read Skills Manifests

Read both manifests:

```bash
cat skills.json                    # project manifest (committed)
cat skills.local.jsonc 2>/dev/null  # personal manifest (gitignored, optional)
```

- `skills.json` — project-level: bundled skills, recommended externals, tool deps
- `skills.local.jsonc` — personal: your extra skills, private overlay skills, tool additions

If `skills.local.jsonc` doesn't exist, mention: "Copy `skills.local.example.jsonc` to `skills.local.jsonc` to add your personal skills."

## Step 2: Check Required Tools

For each tool in `skills.json → tools.required`, run the check command:

```bash
# For each required tool:
git --version 2>/dev/null    || echo "MISSING: git"
node --version 2>/dev/null   || echo "MISSING: node"
claude --version 2>/dev/null || echo "MISSING: claude"
```

If any are missing, offer to install them using the install command from skills.json.

## Step 3: Check Optional Tools

For each tool in `skills.json → tools.optional`, check if installed:

```bash
which yt-dlp 2>/dev/null     && echo "yt-dlp: installed" || echo "yt-dlp: not installed (auto-installs when needed by ingest-youtube)"
which pdftotext 2>/dev/null  && echo "poppler: installed" || echo "poppler: not installed (auto-installs when needed by ingest-pdf)"
which pandoc 2>/dev/null     && echo "pandoc: installed" || echo "pandoc: not installed (auto-installs when needed by ingest-office)"
which qmd 2>/dev/null        && echo "qmd: installed" || echo "qmd: not installed (auto-installs when needed by search)"
which marp 2>/dev/null       && echo "marp: not installed (auto-installs when needed by slides)"
```

Don't install these — just report status. They lazy-install on first use.

## Step 4: Check Bundled Skills

Verify all skills listed in `skills.json → bundled.skills` exist in `.claude/skills/`:

```bash
for skill in vault-create vault-import vault-status ingest query search lint promote slides ralph setup create-skill read-tweet read-gist yt-transcript frontend-design wiki-templates ingest-web ingest-pdf ingest-office ingest-youtube ingest-tweet ingest-gist ingest-text; do
  if [ -f ".claude/skills/$skill/SKILL.md" ]; then
    echo "  ✓ $skill"
  else
    echo "  ✗ $skill — MISSING"
  fi
done
```

If any bundled skills are missing, something went wrong with the clone. Suggest `git checkout -- .claude/skills/`.

## Step 5: Check Recommended External Skills

For each skill in `skills.json → recommended.skills`, check if it exists in `~/.claude/skills/`:

```bash
for skill in write-a-prd grill-me tdd; do
  if [ -d "$HOME/.claude/skills/$skill" ]; then
    echo "  ✓ $skill (installed in ~/.claude/skills/)"
  else
    echo "  → $skill — not installed (optional)"
  fi
done
```

For any missing recommended skills, show:
- What it does (from skills.json description)
- Where it comes from (from skills.json source)
- How to install it

Example output:
```
Recommended skills not installed:
  → write-a-prd (github:mattpocock/skills)
    Create PRDs through user interview and codebase exploration
    Install: git clone the skill to ~/.claude/skills/write-a-prd

  → tdd (github:mattpocock/skills)
    Test-driven development workflow
    Install: git clone the skill to ~/.claude/skills/tdd
```

## Step 5b: Check Personal Skills (from skills.local.jsonc)

If `skills.local.jsonc` exists, read the `personal` array and check each:

```bash
# For each skill in skills.local.jsonc → personal:
# Check if the path exists (expand ~ to $HOME)
[ -d "$HOME/.claude/skills/write-a-prd" ] && echo "  ✓ write-a-prd" || echo "  → write-a-prd — not installed"
```

Also check the `private` array for .private/ overlay skills:

```bash
# For each skill in skills.local.jsonc → private:
[ -f ".private/.claude/skills/my-company-workflows/SKILL.md" ] && echo "  ✓ my-company-workflows" || echo "  → my-company-workflows — not in .private/"
```

And check any extra `tools` defined:

```bash
# For each tool in skills.local.jsonc → tools:
which ollama 2>/dev/null && echo "  ✓ ollama" || echo "  → ollama — not installed"
```

## Step 6: Check Obsidian

```bash
[ -d "/Applications/Obsidian.app" ] && echo "✓ Obsidian installed" || echo "→ Obsidian not found — download from https://obsidian.md"
```

## Step 7: Check .private/ Directory

```bash
[ -d ".private" ] && echo "✓ .private/ directory exists" || echo "→ No .private/ directory (create one for private skills — see .private/README.md pattern)"
```

## Step 8: Report Summary

Print a summary:

```
═══════════════════════════════════════
  LLM Wiki — Setup Report
═══════════════════════════════════════

  Required tools:    3/3 installed
  Optional tools:    2/5 installed (rest auto-install on use)
  Bundled skills:    24/24 present
  Recommended:       1/3 installed
  Obsidian:          installed
  Private overlay:   not configured

  Next steps:
  1. Create a vault:  /vault-create my-research --domain ai-research
  2. Open in Obsidian: Open folder → vaults/my-research
  3. Ingest a source: /ingest <url> --vault my-research
═══════════════════════════════════════
```

## Reference

- Full dependency docs: `docs/dependencies.md`
- Getting started guide: `open docs/getting-started.html`
- Daily workflow: `docs/workflow.md`
- Skills manifest: `skills.json`
