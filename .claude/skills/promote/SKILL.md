---
name: promote
description: Graduate knowledge — either between vaults (project vault → hub) or within a vault (scratchpad/ drafts → wiki/). Use when user wants to promote, graduate, transfer, or share knowledge between vaults, or to clean up rough notes into proper wiki pages.
argument-hint: <vault> [--to <target-vault>] | <vault> --from-drafts [<file>]
allowed-tools: Bash(git *) Bash(mv *) Read Write Edit Glob Grep
---

# Promote Knowledge

Two modes:
1. **Vault-to-vault** (`--to <target>`) — graduate reusable knowledge from one vault to another (typically project → hub).
2. **Drafts-to-wiki** (`--from-drafts`) — promote a `scratchpad/` draft into the proper `wiki/` location with frontmatter and an index entry.

## Usage

```
/promote my-research --to meta
/promote project-alpha                                      # defaults to meta vault
/promote my-research --from-drafts                           # interactive — pick a draft to promote
/promote my-research --from-drafts scratchpad/2026-04-23-stx.md   # promote a specific draft
```

## Mode routing

If `--from-drafts` is passed → run **Drafts-to-wiki Mode** (Steps DA–DE below). Skip the cross-vault flow.
Otherwise → run the cross-vault flow (Steps 1–8 below).

---

## Drafts-to-wiki Mode

Used to graduate a `scratchpad/` file into a proper `wiki/` page. See `wiki-templates` § KB + Drafts Layers for the contract this enforces.

### Step DA: Discover candidate drafts

```bash
ls "vaults/<vault>/scratchpad/"*.md 2>/dev/null
```

If a specific file path was passed, skip listing and use that. If no file specified and only one draft exists, use it. Otherwise show the user the list and ask which to promote.

### Step DB: Read the draft and decide page-type

Read the file. Based on content, decide:
- Meeting notes / session captures / dossiers → `page-type: source-note`, target dir `wiki/sources/`
- Person, organisation, tool, framework profile → `page-type: entity`, target dir `wiki/entities/`
- Idea, pattern, technique writeup → `page-type: concept`, target dir `wiki/concepts/`
- Side-by-side comparison or synthesis → `page-type: comparison`, target dir `wiki/comparisons/`

If unclear, ask via AskUserQuestion. Do not guess — promotion is a deliberate operation, not an automatic one.

### Step DC: Normalise to wiki form

Add full frontmatter per the chosen page-type (see `wiki-templates`). Fill in:
- `title` from the draft's H1 or filename
- `date-created` and `date-modified` (today's date)
- `domain` from vault default (read `CLAUDE.md`) plus any inferred from the draft
- `tags` based on content
- `sources` — if the draft references external URLs or raw files, list them; otherwise the source is the draft itself (`scratchpad/<filename>.md`)
- `related` — wikilinks to existing wiki pages mentioned in the draft

If the draft has a "Raw notes" divider (created by `rough-notes cleanup`), keep only the cleaned-up portion above the divider; the raw notes stay in the original file as historical record.

### Step DD: Write to wiki/ and update the index

```bash
SLUG=<derive kebab-case slug from title>
mv "vaults/<vault>/scratchpad/<file>.md" "vaults/<vault>/wiki/<dir>/<SLUG>.md"
# OR if keeping the raw notes in scratchpad: write the cleaned page to wiki/, edit scratchpad/ to leave a stub
```

Update `wiki/index.md` per the progressive index spec:
- Add a one-line entry to L1 (`## Topic Map`).
- Add a row to the appropriate L2 table (Sources / Entities / Concepts / Comparisons).

### Step DE: Append to log + commit

Append to `log.md`:
```markdown
## [YYYY-MM-DD] promote-draft | <draft-name> → wiki/<page>
- Source: scratchpad/<file>.md
- Target: wiki/<dir>/<SLUG>.md (page-type: <type>)
- Index updated: yes
---
```

Commit:
```bash
git -C "vaults/<vault>" add .
git -C "vaults/<vault>" commit -m "✨ feat: promote <slug> from drafts to wiki"
```

Skip the rest of this skill (Steps 1–8) — those are for cross-vault promotion only.

---

## Vault-to-Vault Mode

Transfer reusable, cross-cutting knowledge from one vault to another (typically project → hub).

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
