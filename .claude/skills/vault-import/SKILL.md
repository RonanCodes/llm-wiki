---
name: vault-import
description: Import an existing Obsidian vault, markdown folder, or git repo as an llm-wiki vault. Moves content into vaults/, adds missing structure (index, log, CLAUDE.md, frontmatter). Use when user wants to import, adopt, migrate, or bring in an existing knowledge base.
argument-hint: <path-or-repo-url> [--name <vault-name>] [--domain <domain>]
allowed-tools: Bash(git *) Bash(mv *) Bash(cp *) Bash(mkdir *) Bash(find *) Read Write Edit Glob Grep
---

# Import Vault

Import an existing collection of markdown files, Obsidian vault, or git repo into the llm-wiki system.

## Usage

```
/vault-import ~/Documents/my-notes --name my-research --domain ai-research
/vault-import ~/obsidian-vault --name personal
/vault-import https://github.com/user/knowledge-repo.git --name imported
/vault-import ./some-folder
```

## Step 1: Parse Arguments

- First argument: path to existing folder OR git repo URL
- `--name <name>`: vault name (default: derive from folder name, kebab-case). Prefix with `llm-wiki-` if not already prefixed.
- `--domain <domain>`: default domain tag for the vault

## Step 2: Bring Content In

### From a local folder:
```bash
# Move the folder into vaults/
mv "<source-path>" "vaults/<name>"
```

Or if the user wants to keep the original:
```bash
# Copy instead
cp -r "<source-path>" "vaults/<name>"
```

Ask the user: **move or copy?** Moving is cleaner (single source of truth). Copying is safer (original untouched).

### From a git repo URL:
```bash
git clone "<repo-url>" "vaults/<name>"
```

### If already a git repo:
Preserve the existing git history — don't re-init. The vault keeps its full history.

### If NOT a git repo:
```bash
cd "vaults/<name>"
git init
```

## Step 3: Analyze Existing Structure

Scan what's already there:

```bash
VAULT="vaults/<name>"

# Count markdown files
find "$VAULT" -name "*.md" -type f | wc -l

# Check for existing structure
ls "$VAULT/raw" 2>/dev/null && echo "Has raw/"
ls "$VAULT/wiki" 2>/dev/null && echo "Has wiki/"
test -f "$VAULT/CLAUDE.md" && echo "Has CLAUDE.md"
test -f "$VAULT/index.md" && echo "Has root index.md"

# Check for Obsidian config
ls "$VAULT/.obsidian" 2>/dev/null && echo "Obsidian vault detected"

# Find all markdown files and their locations
find "$VAULT" -name "*.md" -type f | head -30
```

Report to the user what was found.

## Step 4: Add llm-wiki Structure

Add missing components without breaking what's already there:

### 4a. Create missing directories
```bash
mkdir -p "$VAULT/raw"
mkdir -p "$VAULT/raw/assets"
mkdir -p "$VAULT/wiki/sources"
mkdir -p "$VAULT/wiki/entities"
mkdir -p "$VAULT/wiki/concepts"
mkdir -p "$VAULT/wiki/comparisons"
```

### 4b. Classify existing files

For each existing markdown file, determine where it belongs:
- Files that look like source material (articles, papers, notes) → suggest moving to `raw/`
- Files that look like wiki pages (structured, has links) → suggest moving to appropriate `wiki/` subdirectory
- Files with people/org/tool names → suggest `wiki/entities/`
- Files about ideas/patterns → suggest `wiki/concepts/`

**Don't auto-move.** Present a plan to the user and ask for confirmation. Example:

```
Found 45 markdown files. Suggested organization:

Move to raw/ (source material):
  - meeting-notes-2026-03.md
  - article-react-patterns.md

Move to wiki/entities/:
  - john-smith.md
  - acme-corp.md

Move to wiki/concepts/:
  - microservices-patterns.md
  - caching-strategies.md

Keep in place (already organized or unsure):
  - README.md
  - daily-log.md

Proceed? (y/n/customize)
```

### 4c. Add frontmatter to pages missing it

For each markdown file that becomes a wiki page, check if it has YAML frontmatter. If not, add it:

```yaml
---
title: "<derived from filename or first heading>"
date-created: <file creation date or today>
date-modified: <file modification date or today>
page-type: <inferred from content/location>
domain:
  - <vault-domain>
tags: []
sources: []
related: []
---
```

Use the file's first `# Heading` as the title if no frontmatter exists.

### 4d. Create wiki/index.md

Scan all wiki pages and build the index catalog:

```markdown
# <Vault Name> — Wiki Index

## Sources
| Page | Summary | Domain | Date Added |
|------|---------|--------|------------|
| [[source-1]] | ... | domain | date |

## Entities
...

## Concepts
...
```

### 4e. Create log.md

```markdown
# <Vault Name> — Activity Log

## [YYYY-MM-DD] import | Vault imported from <source-path>
- Original location: <source-path>
- Files found: X markdown files
- Pages classified: Y wiki pages
- Frontmatter added to: Z pages
---
```

### 4f. Create CLAUDE.md

Generate vault conventions file per the vault-create template. Include:
- Vault name, domain
- Frontmatter requirements
- Source linking conventions
- Cross-reference conventions
- Note that this was imported (original structure may not perfectly match conventions)

## Step 5: Handle Obsidian Config

If `.obsidian/` directory exists:
- Keep it — it's Obsidian's settings, themes, plugins
- Don't modify it
- Note to user that their Obsidian settings are preserved

## Step 6: Commit

```bash
cd "vaults/<name>"
git add .
git commit -m "✨ feat: import vault with llm-wiki structure"
```

## Step 7: Report

Show the user:
- Vault location: `vaults/<name>/`
- Files imported: count
- Pages classified: breakdown by type
- Frontmatter added: count
- What still needs manual review
- Next steps: open in Obsidian, run `/lint` to check health, start ingesting new sources

## Notes

- This skill is intentionally interactive — it presents a plan and asks before moving files
- Existing git history is preserved when importing git repos
- `.obsidian/` config is left untouched
- Files that can't be classified are left in place — the user can organize them later
- After import, running `/lint --vault <name> --fix` will catch anything the import missed
