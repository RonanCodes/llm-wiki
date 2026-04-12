---
title: "Daily Workflow"
description: "How to use LLM Wiki day-to-day — what you do vs what Claude does."
---

## The Cycle

1. **Find sources** — articles, PDFs, YouTube videos, tweets, gists
2. **Clip / save** — Obsidian Web Clipper or drop files into `raw/`
3. **Ingest** — `/ingest source --vault name` → Claude creates wiki pages
4. **Browse** — open Obsidian, graph view, follow backlinks
5. **Query** — `/query "question"` → synthesized answers with citations
6. **Lint** — `/lint` → health-check, fix issues
7. **Repeat** — every source and question makes the wiki richer

## What You Do

- **Curate sources** — find articles, papers, videos worth reading
- **Clip and collect** — save sources into `raw/` via Web Clipper or file drops
- **Direct the analysis** — ask good questions, guide what to emphasize
- **Browse and think** — read the wiki in Obsidian, follow connections
- **Decide what's important** — you're the editor-in-chief

## What Claude Does

- **Extract and summarize** — reads sources, pulls out key information
- **Create wiki pages** — source-notes, entity pages, concept pages
- **Cross-reference** — maintains wikilinks between pages
- **Keep the wiki current** — updates index, logs activity, flags contradictions
- **Synthesize answers** — pulls from multiple pages for complex questions
- **Maintain quality** — lint checks, suggests gaps, recommends new sources

## Tips

- **Ingest one source at a time** and stay involved — read the summaries, check updates, guide emphasis (Karpathy's recommendation)
- **File good query answers back** into the wiki with `--save` — explorations should compound
- **Run lint periodically** — especially after batch-ingesting multiple sources
- **Use domain tags** from day one — shared entities across vaults become the most valuable nodes
- The wiki is just a git repo — version history, branching, and rollback for free

## Graduating Knowledge

When finishing a project:

```bash
/promote my-project --to meta
```

Claude reads the project vault, identifies reusable learnings (tech patterns, strategy, vendor evaluations), and files them into your meta vault. Project-specific details stay behind.
