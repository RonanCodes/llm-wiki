---
title: "Query"
description: "Ask questions against your wiki and get cited answers that compound."
---

The `/query` skill lets you ask questions against a vault's wiki and get synthesized answers with citations. Add `--save` to file answers back into the wiki -- your explorations compound.

## Usage

```
/query "What deployment patterns have we seen?" --vault my-research
/query "Compare framework A vs B" --vault my-research --save
/query "Who are the key people in this space?" --vault my-research
```

| Flag | Description |
|------|-------------|
| `--vault <name>` | Target vault (uses sole vault if only one exists) |
| `--save` | File the answer back into the wiki as a new page |

## How It Works

1. **Read the index** -- `wiki/index.md` is the primary discovery mechanism
2. **Identify relevant pages** -- source-notes, entities, concepts, comparisons that relate to the question
3. **Read pages** -- typically 3-10 pages depending on complexity
4. **Synthesize** -- provide a cited answer using `[[wikilinks]]`
5. **Save (if `--save`)** -- create a comparison or summary page with full frontmatter

## What a Good Answer Looks Like

- Directly answers the question with specifics from the wiki
- Cites sources: "According to [[source-name]], ..."
- Notes gaps if the wiki doesn't fully cover the topic
- Suggests follow-ups -- related questions, sources worth ingesting

## The `--save` Flag

When `--save` is set, the answer becomes a wiki page:

- **Comparison questions** create pages in `wiki/comparisons/`
- **General synthesis** creates summary pages in `wiki/`
- The page gets full frontmatter (`page-type`, `sources`, `domain`, `related`)
- Index and log are updated, vault is auto-committed

This is the compounding mechanism Karpathy describes: *"I end up filing the outputs back into the wiki to enhance it for further queries. So my own explorations and queries always add up."*

## Tips

- If the wiki is too small to answer meaningfully, query will say so and suggest sources to ingest
- For complex questions, break them into focused sub-questions
- Use `--save` liberally -- saved answers become first-class wiki pages that future queries can reference
- At large scale (~200+ pages), pair with `/search` for better page discovery
