---
name: vault-create
description: Create a new LLM Wiki vault with proper directory structure, index, log, and conventions. Use when user wants to create a vault, start a new wiki, or set up a new knowledge base.
argument-hint: <vault-name> [--domain <domain>]
disable-model-invocation: true
allowed-tools: Bash(mkdir *) Bash(git init *) Bash(git add *) Bash(git commit *) Write
---

# Create Vault

Scaffold a new LLM Wiki vault as a separate git repo.

## Usage

```
/vault-create my-research
/vault-create my-research --domain ai-research
```

## Steps

1. **Parse arguments** from `$ARGUMENTS`:
   - First argument: vault name (required, kebab-case)
   - `--domain <domain>`: optional domain tag (e.g. `ai-research`, `personal`, `work-project-x`)

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

7. **Report success** with next steps:
   - Open `vaults/<name>/` as an Obsidian vault
   - Ingest first source: `/ingest <source> --vault <name>`
