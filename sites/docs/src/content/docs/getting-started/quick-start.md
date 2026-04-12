---
title: Quick Start
description: Get up and running with LLM Wiki in minutes.
---

## Install

```bash
git clone https://github.com/RonanCodes/llm-wiki.git
cd llm-wiki
./install.sh  # checks deps, installs via Homebrew
```

## Create Your First Vault

Launch Claude Code and create a vault:

```
claude
/vault-create my-research --domain ai-research
```

This creates `vaults/my-research/` with:
- `raw/` — for source documents
- `wiki/` — for LLM-generated pages (sources, entities, concepts, comparisons)
- `index.md` — catalog of all pages
- `log.md` — activity log
- `CLAUDE.md` — vault conventions

## Open in Obsidian

Open Obsidian → **Open folder as vault** → select `vaults/my-research`.

## Ingest Your First Source

```
/ingest https://some-article.com --vault my-research
```

Claude reads the article, creates wiki pages (source summary, entity pages, concept pages), updates the index, and auto-commits.

## Ask Questions

```
/query "What are the key takeaways?" --vault my-research
```

Add `--save` to file the answer back into the wiki — your explorations compound.

## Health Check

```
/lint --vault my-research --fix
```

Finds orphan pages, broken links, missing frontmatter, and auto-fixes what it can.
