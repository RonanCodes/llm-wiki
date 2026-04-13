---
name: setup
description: First-time setup for the llm-wiki system. Checks tools, skills, and Obsidian. Use when setting up llm-wiki on a new machine.
disable-model-invocation: true
allowed-tools: Bash(brew *) Bash(which *) Bash(npm *) Bash(pnpm *) Bash(ls *) Read Glob
---

# LLM Wiki Setup

First-time bootstrap. Checks your environment and guides you through setup.

## Usage

```
/setup
```

## Step 1: Check Required Tools

Read `tools.json` and check each required tool:

```bash
git --version 2>/dev/null    || echo "MISSING: git — brew install git"
node --version 2>/dev/null   || echo "MISSING: node — brew install node"
claude --version 2>/dev/null || echo "MISSING: claude — npm i -g @anthropic-ai/claude-code"
```

Offer to install any missing tools.

## Step 2: Check Optional Tools

From `tools.json`, check optional tools (these lazy-install on first use):

```bash
which yt-dlp 2>/dev/null     && echo "✓ yt-dlp" || echo "→ yt-dlp: installs on first YouTube ingest"
which pdftotext 2>/dev/null  && echo "✓ poppler" || echo "→ poppler: installs on first PDF ingest"
which pandoc 2>/dev/null     && echo "✓ pandoc" || echo "→ pandoc: installs on first Office doc ingest"
which qmd 2>/dev/null        && echo "✓ qmd" || echo "→ qmd: installs when wiki exceeds ~200 pages"
```

## Step 3: Check Bundled Skills

Verify skills exist in `.claude/skills/`:

```bash
ls .claude/skills/ | wc -l
```

Report count and list any expected skills that are missing.

## Step 4: Check Shared Skills (RonanCodes/ronan-skills)

This project uses shared skills (ralph, frontend-design, create-skill, doc-standards) from a separate repo.

Check if the shared skills are available (via ~/.claude/skills/ or .claude/skills/):

If not found, offer the user these options:

**Option A: Install globally via npx (recommended)**
```bash
npx skills add RonanCodes/ronan-skills/src/ralph -g
npx skills add RonanCodes/ronan-skills/src/frontend-design -g
npx skills add RonanCodes/ronan-skills/src/create-skill -g
npx skills add RonanCodes/ronan-skills/src/doc-standards -g
```

**Option B: Install into this project only**
```bash
npx skills add RonanCodes/ronan-skills/src/ralph
npx skills add RonanCodes/ronan-skills/src/frontend-design
npx skills add RonanCodes/ronan-skills/src/create-skill
npx skills add RonanCodes/ronan-skills/src/doc-standards
```

**Option C: Clone + symlink (stays up to date)**
1. Ask the user where they'd like to clone it
2. `git clone https://github.com/RonanCodes/ronan-skills.git <their-path>/ronan-skills`
3. For each skill: `ln -s <their-path>/ronan-skills/src/<name> ~/.claude/skills/<name>`

## Step 5: Check Obsidian

```bash
[ -d "/Applications/Obsidian.app" ] && echo "✓ Obsidian" || echo "→ Obsidian: download from https://obsidian.md"
```

## Step 6: Check .private/ Directory

```bash
[ -d ".private" ] && echo "✓ .private/" || echo "→ No .private/ (optional — for private skills, add .local to skill name to auto-gitignore)"
```

## Step 7: Report

```
═══════════════════════════════════════
  LLM Wiki — Setup Report
═══════════════════════════════════════

  Required tools:    3/3 installed
  Optional tools:    2/5 installed (rest auto-install on use)
  Bundled skills:    22 present
  Shared skills:     installed via marketplace
  Obsidian:          installed
  Private overlay:   not configured

  Next steps:
  1. Create a vault:  /vault-create my-research --domain ai-research
  2. Open in Obsidian: Open folder → vaults/llm-wiki-my-research
  3. Ingest a source: /ingest <url> --vault llm-wiki-my-research
═══════════════════════════════════════
```

## Private Skills Convention

Skills with `.local` in the name are gitignored automatically:
- `.claude/skills/my-company-workflow.local/SKILL.md` — gitignored
- `.claude/skills/ingest/SKILL.md` — committed (bundled)

This lets you add private skills to the project without them leaking to the public repo.
