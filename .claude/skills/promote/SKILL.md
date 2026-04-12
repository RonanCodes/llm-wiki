---
name: promote
description: Graduate reusable knowledge from one vault to another (typically project vault to meta). Identifies cross-cutting learnings and files them into the target vault. Use when user wants to promote, graduate, transfer, or share knowledge between vaults.
argument-hint: <from-vault> [--to <target-vault>]
disable-model-invocation: true
allowed-tools: Bash(git *) Read Write Edit Glob Grep
---

# Promote Knowledge

Transfer reusable, cross-cutting knowledge from a project vault to another vault (typically meta).

## Usage

```
/promote my-research --to meta
/promote project-alpha                  # defaults to meta vault
```

## When to Use

- When finishing a project — graduate learnings before archiving
- When you notice knowledge in one vault that would be useful across projects
- Periodically during long projects to keep meta vault current

## Step 1: Parse Arguments

- First argument: source vault name
- `--to <vault>`: target vault (default: `meta`)
- Verify both vaults exist in `vaults/`

## Step 2: Read Source Vault

Read the source vault's wiki pages, focusing on:

1. **Read `wiki/index.md`** — get overview of all pages
2. **Read concept pages** (`wiki/concepts/*.md`) — these are most likely to be reusable
3. **Read comparison pages** (`wiki/comparisons/*.md`) — synthesized analysis is highly reusable
4. **Read entity pages** (`wiki/entities/*.md`) — check for entities relevant beyond this project
5. **Skim source-notes** (`wiki/sources/*.md`) — key takeaways may be promotable

## Step 3: Identify Promotable Knowledge

Knowledge is promotable if it's **reusable beyond this specific project**:

**Promote:**
- Tech patterns and architecture decisions (e.g., "Next.js deployment strategies")
- Tool evaluations and comparisons (e.g., "Auth providers comparison")
- Domain concepts that apply broadly (e.g., "LLM knowledge base patterns")
- Key people/orgs that matter across projects
- Strategy and methodology insights

**Don't promote:**
- Project-specific implementation details
- Source-notes for project-specific documents
- Entities only relevant to the project (specific client contacts, etc.)
- Temporary decisions or workarounds

Discuss with the user what should be promoted if unsure.

## Step 4: Create/Update Pages in Target Vault

For each promotable page:

### 4a. Check if target vault already has a page for this topic
```bash
# Check by filename
ls "vaults/<target>/wiki/concepts/<name>.md" 2>/dev/null
ls "vaults/<target>/wiki/entities/<name>.md" 2>/dev/null

# Check by content similarity — search index for related terms
grep -i "<key-terms>" "vaults/<target>/wiki/index.md"
```

### 4b. If page exists in target: merge
- Read both pages
- Add new information from source vault without duplicating
- Update `sources` frontmatter to include both vaults' sources
- Update `date-modified`
- Add to `related` list

### 4c. If page is new: create
- Create page in appropriate directory (concepts/, entities/, comparisons/)
- Use wiki-templates for proper frontmatter
- Set `domain` to target vault's default + source vault's domain
- Set `sources` to reference the original source vault pages
- Add `promoted-from: <source-vault>` to frontmatter for traceability

## Step 5: Update Target Vault Index

Add new entries to `vaults/<target>/wiki/index.md`.

## Step 6: Update Both Logs

**Source vault log.md:**
```markdown
## [YYYY-MM-DD] promote | Knowledge promoted to <target>
- Pages promoted: [[concept-1]], [[entity-1]], [[comparison-1]]
- Target vault: <target>
---
```

**Target vault log.md:**
```markdown
## [YYYY-MM-DD] promote | Knowledge received from <source>
- Pages created: [[concept-1]], [[entity-1]]
- Pages updated: [[existing-concept]]
- Source vault: <source>
---
```

## Step 7: Auto-Commit Both Vaults

```bash
cd "vaults/<source>"
git add .
git commit -m "📝 docs: promote knowledge to <target>"

cd "vaults/<target>"
git add .
git commit -m "✨ feat: receive promoted knowledge from <source>"
```

## Step 8: Report

Show the user:
- Pages promoted (with links)
- Pages merged (existing pages that were enriched)
- Pages skipped (and why — too project-specific, already exists, etc.)
- Suggestions for what else might be worth promoting

## Notes

- Promote creates references, not copies — the source-note in the target vault links back to the original sources
- The `promoted-from` frontmatter field provides traceability
- It's OK to promote the same knowledge multiple times — merging handles deduplication
- When in doubt about whether to promote, ask the user
