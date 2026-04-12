---
title: "How It Works"
description: "Three layers, four operations, one engine operating on many vaults."
---

## Three Layers

Every vault follows Karpathy's three-layer architecture:

| Layer | Contents | Who Owns It |
|-------|----------|-------------|
| **Raw sources** | Articles, PDFs, videos, tweets, gists in `raw/` | Immutable -- LLM reads but never modifies |
| **The wiki** | LLM-generated markdown in `wiki/` -- source-notes, entities, concepts, comparisons | LLM owns entirely |
| **The schema** | `CLAUDE.md` -- conventions, domain tags, page structure rules | Human defines, LLM follows |

The raw layer is the source of truth. The wiki layer is the LLM's compiled understanding. The schema layer governs how the wiki is structured.

## Four Operations

| Operation | Command | What It Does |
|-----------|---------|-------------|
| **Ingest** | `/ingest <source>` | Process a source into wiki pages (3-7 pages per source) |
| **Query** | `/query "question"` | Ask questions, get cited answers, `--save` to compound |
| **Lint** | `/lint` | Health-check wiki (8 checks, `--fix` auto-repair) |
| **Promote** | `/promote <vault>` | Graduate reusable knowledge between vaults |

These four operations form a cycle. Ingest brings knowledge in. Query explores and synthesizes. Lint maintains quality. Promote distributes reusable learnings across vaults.

## One Engine, Many Vaults

The engine (this repo with 25 Claude Code skills) operates on separate vault directories. Each vault is its own git repo.

```
llm-wiki/                     # The engine (public, shared)
├── .claude/skills/           # 25 skills
├── vaults/                   # Gitignored -- your private data
│   ├── meta/                 # Long-lived cross-project knowledge
│   ├── project-alpha/        # Per-project, archived when done
│   └── personal/             # Private vault
```

**Vaults are data, not applications.** No skills, no logic -- just markdown, raw sources, and a thin `CLAUDE.md` for conventions. The engine operates on them.

**Each vault is its own git repo.** This gives you independent lifecycles, different privacy levels, clean history, and size independence. Karpathy himself uses separate wikis per research area.

## The Compounding Effect

The system compounds in three ways:

1. **Ingest compounds** -- each new source enriches existing entity and concept pages
2. **Query compounds** -- saved answers (`--save`) become first-class wiki pages
3. **Promote compounds** -- reusable knowledge from finished projects enriches the meta vault

This is the core insight: the wiki is a persistent, growing artifact -- not re-derived each query like RAG.
