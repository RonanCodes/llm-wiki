---
title: "Karpathy's LLM Wiki Pattern"
description: "The original idea: gist summary, key insights, community response."
---

In April 2026, Andrej Karpathy published an "idea file" describing a pattern for building personal knowledge bases using LLMs. The tweet got 55K likes. The gist spawned 30+ implementations.

## The Sources

| Source | Date | Stats |
|--------|------|-------|
| [Viral tweet](https://x.com/karpathy/status/2039805659525644595) | Apr 2, 2026 | 55,355 likes, 6,571 retweets |
| [Follow-up tweet](https://x.com/karpathy/status/2040470801506541998) | Apr 4, 2026 | 25,797 likes, 2,683 retweets |
| [The gist (idea file)](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) | Apr 4, 2026 | 30+ comments with implementations |

## The Pattern in Brief

Instead of RAG (re-deriving knowledge from raw documents every query), the LLM incrementally builds and maintains a persistent wiki of interlinked markdown files. Three layers: raw sources, the wiki, the schema (CLAUDE.md). Four operations: ingest, query, lint, promote. The wiki compounds over time.

## Key Insights from Karpathy

1. **One wiki per research topic** -- "various topics of research interest" (plural). His example: ~100 articles, ~400K words on "some recent research."
2. **index.md works at moderate scale** -- "the LLM has been pretty good about auto-maintaining index files... at this ~small scale." No need for RAG/embeddings until ~200+ pages.
3. **File answers back into the wiki** -- "I end up filing the outputs back into the wiki to enhance it for further queries. So my own explorations and queries always add up."
4. **Obsidian as the IDE** -- "The LLM makes edits based on our conversation, and I browse the results in real time. Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase."
5. **Stay involved during ingest** -- "I prefer to ingest sources one at a time and stay involved."
6. **Don't over-plan** -- the gist is "intentionally abstract/vague because there are so many directions to take this in."

## Community Response

### Notable Implementations

- **sage-wiki** -- single Go binary, cross-platform, end-to-end
- **axiom-wiki**, **CowAgent**, **OmegaWiki**, **memory-toolkit** -- various approaches
- **mnemon** -- knowledge extraction pipeline with personalization layer
- **vibe-sensei** -- trading wiki with guardian context injection

### Key Community Ideas

- **Progressive index** -- L0-L3 token budget for index.md (comment #354)
- **Domain tags from day one** -- "Retrofitting this is painful" (comment #364)
- **Two wiki layers** -- KB (machine-managed reference) + Drafts (writing workspace) (comment #334)
- **.brain folder pattern** -- project-root knowledge that persists across AI sessions

### Tooling Recommendations

- **qmd** (Tobi Lutke) -- local markdown search, hybrid BM25/vector
- **Obsidian Web Clipper** -- browser extension for article capture
- **Marp** -- markdown slide decks
- **Dataview** -- Obsidian frontmatter queries

## What Karpathy Would Recommend

Based on his tweets and gist: start simple with one topic. Let the LLM figure out structure. Use separate wikis per domain. Stay involved during ingest. Add tools only as the need arises. Don't build for scale you don't have yet.
