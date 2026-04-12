---
name: lint
description: Health-check an LLM Wiki vault for issues — orphan pages, missing links, contradictions, stale content, frontmatter problems. Use when user wants to lint, check, audit, or health-check their wiki.
argument-hint: [--vault <name>] [--fix]
disable-model-invocation: true
allowed-tools: Bash(git *) Read Write Edit Glob Grep
---

# Lint Wiki

Health-check a vault's wiki for structural and content issues.

## Usage

```
/lint --vault my-research
/lint --vault my-research --fix
```

## Step 1: Parse Arguments

- `--vault <name>` — target vault (if omitted, use sole vault or ask)
- `--fix` — auto-fix what's fixable (missing frontmatter, stub pages, domain tags)

## Step 2: Gather All Pages

```bash
VAULT="vaults/<vault>"
find "$VAULT/wiki" -name "*.md" ! -name "index.md" -type f
```

For each page, read its frontmatter and content.

## Step 3: Run Checks

### 3a. Frontmatter Checks
For each wiki page, verify:
- [ ] Has YAML frontmatter (between `---` markers)
- [ ] Has `title` field
- [ ] Has `date-created` and `date-modified` fields
- [ ] Has `page-type` (one of: source-note, entity, concept, comparison, summary)
- [ ] Has `domain` list (at least the vault default)
- [ ] Has `sources` list (not empty — every page must trace to a source)
- [ ] Has `related` list
- [ ] source-note pages have: `source-url`, `source-type`, `author`, `raw-file`
- [ ] entity pages have: `entity-type`

**Auto-fix (with --fix):** Add missing fields with vault defaults, set `domain` from vault CLAUDE.md.

### 3b. Orphan Pages
Pages with no inbound links from any other page:
```bash
# For each page, check if any other page links to it
FILENAME="page-name"  # without .md extension
grep -rl "\[\[$FILENAME\]\]" "$VAULT/wiki/" --include="*.md"
```
Pages with zero results are orphans.

**Auto-fix:** Cannot auto-fix — report for user review.

### 3c. Broken Wikilinks
Find all `[[link-target]]` references and verify the target page exists:
```bash
grep -roh '\[\[[^]]*\]\]' "$VAULT/wiki/" --include="*.md" | sort -u
```
For each link, check if a matching `.md` file exists.

**Auto-fix (with --fix):** Create stub pages for missing link targets.

### 3d. Missing Source Links
Pages without a `## Sources` section or with empty `sources` frontmatter.

**Auto-fix (with --fix):** Add empty `## Sources` section.

### 3e. Missing Domain Tags
Pages where `domain` frontmatter is empty or missing the vault default.

**Auto-fix (with --fix):** Add vault default domain from CLAUDE.md.

### 3f. Concepts Without Pages
Scan all page content for terms that appear frequently or are clearly important concepts but don't have their own page in `wiki/concepts/`.

**Auto-fix (with --fix):** Create stub concept pages.

### 3g. Stale Content
- `date-modified` significantly older than related pages' modifications
- Source-notes referencing raw files that have been modified after the source-note

**Auto-fix:** Cannot auto-fix — report for user review.

### 3h. Index Completeness
Check `wiki/index.md` against actual pages:
- Pages that exist but aren't in the index
- Index entries for pages that no longer exist

**Auto-fix (with --fix):** Add missing entries, remove stale entries.

## Step 4: Report

Output a markdown report grouped by severity:

```markdown
## Wiki Lint Report — <vault-name>

### Summary
- Total pages: X
- Issues found: Y (Z auto-fixable)

### Critical (broken links, missing sources)
- ❌ [[missing-page]] — referenced by [[page-1]], [[page-2]] but doesn't exist
- ❌ wiki/sources/article.md — no source link (empty sources frontmatter)

### Warning (orphans, missing metadata)
- ⚠️ wiki/entities/old-tool.md — orphan (no inbound links)
- ⚠️ wiki/concepts/some-idea.md — missing domain tag

### Info (suggestions)
- 💡 "machine learning" mentioned 8 times but has no concept page
- 💡 Consider ingesting more sources on <topic> (only 1 source-note)
- 💡 wiki/sources/old-article.md may be stale (not modified in 30+ days)
```

## Step 5: Suggest Next Actions

After the report, suggest:
- New questions to investigate based on gaps
- New sources to look for based on thin coverage areas
- Connections between pages that should be cross-referenced

## Step 6: Auto-Commit (if --fix applied changes)

```bash
cd "vaults/<vault>"
git add .
git commit -m "🧹 chore: lint auto-fix — <summary of fixes>"
```

Append to log.md:
```markdown
## [YYYY-MM-DD] lint | Wiki health check
- Issues found: X
- Auto-fixed: Y
- Remaining: Z
---
```
