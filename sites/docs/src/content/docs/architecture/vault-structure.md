---
title: "Vault Structure"
description: "Directory layout, page types, and frontmatter conventions for LLM Wiki vaults."
---

## Directory Layout

Every vault created by `/vault-create` follows this structure:

```
vaults/<name>/
├── raw/                    # Immutable source documents
│   └── assets/             # Downloaded images, attachments
├── wiki/                   # LLM-generated markdown
│   ├── index.md            # Catalog of all pages
│   ├── sources/            # One page per ingested source
│   ├── entities/           # People, orgs, tools, frameworks
│   ├── concepts/           # Ideas, patterns, techniques
│   └── comparisons/        # Synthesis comparing multiple things
├── log.md                  # Chronological activity log
└── CLAUDE.md               # Vault conventions (thin config)
```

## Five Page Types

| Type | Location | Purpose | Example |
|------|----------|---------|---------|
| **source-note** | `wiki/sources/` | Summary of one ingested source | `karpathy-llm-wiki-gist.md` |
| **entity** | `wiki/entities/` | Person, org, tool, or framework | `andrej-karpathy.md` |
| **concept** | `wiki/concepts/` | Idea, pattern, or technique | `llm-knowledge-bases.md` |
| **comparison** | `wiki/comparisons/` | Synthesis comparing approaches | `rag-vs-persistent-wiki.md` |
| **summary** | `wiki/` (top level) | High-level overview across sources | `ai-research-analysis.md` |

## Universal Frontmatter

Every wiki page has this base frontmatter:

```yaml
---
title: "Page Title"
date-created: 2026-04-12
date-modified: 2026-04-12
page-type: source-note | entity | concept | comparison | summary
domain:
  - ai-research
tags:
  - relevant-tag
sources:
  - raw/filename.md
  - https://original-url.com
related:
  - "[[related-page-name]]"
---
```

## Type-Specific Fields

| Field | Used By | Description |
|-------|---------|-------------|
| `source-url` | source-note | Original URL of the source |
| `source-type` | source-note | article, paper, video, tweet, gist, pdf, book |
| `author` | source-note | Author name |
| `date-accessed` | source-note | When the source was fetched |
| `raw-file` | source-note | Path to raw/ file |
| `entity-type` | entity | person, organization, tool, framework, service |
| `aliases` | entity | Alternative names or abbreviations |
| `promoted-from` | promoted pages | Source vault name for traceability |

## Special Files

| File | Purpose |
|------|---------|
| `wiki/index.md` | Catalog of all pages with one-line summaries, organized by type |
| `log.md` | Append-only activity log. Entries: `## [YYYY-MM-DD] type \| Title` |
| `CLAUDE.md` | Thin config: vault name, domain, conventions. No logic. |

## Frontmatter Rules

- `domain` always includes the vault's default domain tag
- `sources` is never empty -- every page traces back to a source
- `related` lists wikilinks to connected pages
- `date-modified` updates whenever content changes
- Filenames are kebab-case: `andrej-karpathy.md`, not `Andrej Karpathy.md`
