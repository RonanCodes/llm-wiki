---
name: vault-create
description: Create a new LLM Wiki vault with proper directory structure, index, log, and conventions. Use when user wants to create a vault, start a new wiki, or set up a new knowledge base.
argument-hint: <vault-name> [--domain <domain>]
allowed-tools: Bash(mkdir *) Bash(git init *) Bash(git add *) Bash(git commit *) Write
---

# Create Vault

Scaffold a new LLM Wiki vault as a separate git repo.

## Usage

```
/vault-create                                    # interactive — interviews you
/vault-create my-research --domain ai-research   # direct — skips interview
```

## Vault Naming Convention

All vaults are prefixed with `llm-wiki-` so they're easy to identify in Obsidian's vault switcher alongside non-LLM Wiki vaults.

- User says "research" → vault name becomes `llm-wiki-research`
- User says "project-alpha" → vault name becomes `llm-wiki-project-alpha`
- User says "personal" → vault name becomes `llm-wiki-personal`

If the user provides a name that already starts with `llm-wiki-`, don't double-prefix.

## Step 0: Interview (if no arguments provided)

If the user runs `/vault-create` with no arguments, interview them to figure out the right vault setup. Use AskUserQuestion for each question.

**Question 1: What's the vault for?**
- Personal knowledge (health, goals, journal, self-improvement)
- Research deep-dive (one topic over weeks/months)
- Project knowledge (tech decisions, architecture, domain context for a specific project)
- Reading a book (characters, themes, plot threads, chapter notes)
- Business/competitive analysis (market research, competitor tracking)
- Learning/courses (structured learning on a topic)
- Other (ask them to describe)

**Question 2: What domain or topic?**
Ask for a short domain tag, e.g. `ai-research`, `personal`, `fintech-project`, `book-dune`, `go-to-market`.

**Question 3: What's the vault name?**
Suggest a kebab-case name based on their answers. Let them override.
- Personal → `personal`
- Research → `<topic>-research` (e.g. `llm-research`)
- Project → `project-<name>` (e.g. `project-acme`)
- Book → `book-<title>` (e.g. `book-dune`)

**Question 4: Do you have existing files to import?**
- Yes → suggest using `/vault-import` instead
- No → proceed with empty vault

After the interview, proceed to Step 1 with the gathered info.

## Steps

1. **Parse arguments** from `$ARGUMENTS`:
   - First argument: vault name (required, kebab-case)
   - `--domain <domain>`: optional domain tag (e.g. `ai-research`, `personal`, `work-project-x`)
   - **Apply prefix**: if the name doesn't start with `llm-wiki-`, prepend it. E.g. `research` → `llm-wiki-research`

2. **Create vault directory structure** at `vaults/<name>/`:

```
vaults/<name>/
├── raw/                    # Immutable source documents
│   └── assets/             # Downloaded images, attachments
├── wiki/                   # LLM-generated markdown (the wiki)
│   ├── index.md            # Catalog of all pages
│   ├── concepts/           # Concept pages (ideas, patterns, techniques)
│   ├── entities/           # Entity pages (people, orgs, tools, frameworks)
│   ├── sources/            # Source summaries (one per ingested source)
│   └── comparisons/        # Comparison and synthesis pages
├── log.md                  # Chronological activity log
└── CLAUDE.md               # Vault conventions (thin config)
```

3. **Create `wiki/index.md`** with this template:

```markdown
# <Vault Name> — Wiki Index

## Sources
| Page | Summary | Domain | Date Added |
|------|---------|--------|------------|

## Entities
| Page | Summary | Type | Domain | Date Added |
|------|---------|------|--------|------------|

## Concepts
| Page | Summary | Domain | Date Added |
|------|---------|--------|------------|

## Comparisons
| Page | Summary | Domain | Date Added |
|------|---------|--------|------------|
```

4. **Create `log.md`** with this template:

```markdown
# <Vault Name> — Activity Log

Chronological record of all vault activity. Each entry is parseable:
`grep "^## \[" log.md | tail -5` gives the last 5 entries.

## [<today's date>] init | Vault created
- Vault initialized with domain: <domain or "unset">
- Structure: raw/, wiki/ (concepts, entities, sources, comparisons)
---
```

5. **Create `CLAUDE.md`** with this template:

```markdown
# <Vault Name>

## Vault Info
- **Domain**: <domain or "general">
- **Created**: <today's date>

## Conventions

### Default Domain Tag
All pages in this vault inherit the domain tag: `<domain>`.
Additional domain tags can be added per-page when content spans multiple domains.

### Frontmatter Requirements
Every wiki page MUST have YAML frontmatter with at minimum:
- `title`: Page title
- `date-created`: YYYY-MM-DD
- `date-modified`: YYYY-MM-DD
- `page-type`: one of summary, entity, concept, comparison, source-note
- `domain`: list of domain tags (always includes vault default)
- `tags`: additional categorization tags
- `sources`: list of raw file paths (raw/filename.md) and/or original URLs
- `related`: list of wikilinks to related pages

### Source Linking
Every wiki page MUST link back to its raw source material:
1. In frontmatter `sources` field: path to raw/ file and/or original URL
2. In a `## Sources` section at the bottom of the page with readable links

### Cross-References
Use Obsidian-compatible wikilinks: `[[page-name]]`
When mentioning an entity or concept that has its own page, always link it.

### Page Organization
- Source summaries go in `wiki/sources/`
- Entity pages (people, orgs, tools) go in `wiki/entities/`
- Concept pages (ideas, patterns, techniques) go in `wiki/concepts/`
- Comparisons and synthesis go in `wiki/comparisons/`

### Naming Convention
Filenames: kebab-case, descriptive. Example: `wiki/entities/andrej-karpathy.md`
```

6. **Initialize git repo**:

```bash
cd vaults/<name>
git init
git add .
git commit -m "✨ feat: initialize <name> vault"
```

7. **Register in Obsidian** (ask user first):

Register the vault in Obsidian's vault registry so it appears in the vault switcher:

```bash
python3 -c "
import json, time, hashlib
path = '$HOME/Library/Application Support/obsidian/obsidian.json'
with open(path) as f:
    data = json.load(f)
vault_path = '$(pwd)/vaults/<name>'
vault_id = hashlib.md5(vault_path.encode()).hexdigest()[:16]
data['vaults'][vault_id] = {'path': vault_path, 'ts': int(time.time() * 1000)}
with open(path, 'w') as f:
    json.dump(data, f)
"
```

Then open it:
```bash
open "obsidian://open?vault=<name>"
```

Works on macOS. **Important:** Tell the user they need to fully quit Obsidian (Cmd+Q, not just close the window) and reopen it for the new vault to appear in the vault switcher. Obsidian only reads its config on startup.

8. **Report success** with next steps:
   - Vault is open in Obsidian (or tell them to open it)
   - Ingest first source: `/ingest <source> --vault <name>`
