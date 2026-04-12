# Karpathy Research & Community Findings

## Source Material

### The Gist (April 4, 2026)
- **URL:** https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- **Title:** "LLM Wiki — A pattern for building personal knowledge bases using LLMs"
- **Format:** An "idea file" — intentionally abstract, designed to be given to an LLM agent which then builds the specifics
- **30+ comments** from developers implementing variations

### The Viral Tweet (April 2, 2026)
- **URL:** https://x.com/karpathy/status/2039805659525644595
- **Stats:** 55,355 likes, 6,571 retweets, 2,709 replies
- **Content:** First description of the pattern — raw data collected, compiled by LLM into .md wiki, operated on via CLIs, viewable in Obsidian

### The Follow-up Tweet (April 4, 2026)
- **URL:** https://x.com/karpathy/status/2040470801506541998
- **Stats:** 25,797 likes, 2,683 retweets, 1,020 replies
- **Content:** Links to the gist, introduces the "idea file" concept — share the idea, the other person's agent builds it

## Key Insights from Karpathy

1. **One wiki per research topic** — "various topics of research interest" (plural). His example: ~100 articles, ~400K words on "some recent research" — one topic, not everything.
2. **Index.md works at moderate scale** — "the LLM has been pretty good about auto-maintaining index files... at this ~small scale" (~100 sources, ~hundreds of pages). No need for RAG/embeddings at this scale.
3. **File answers back into the wiki** — "I end up filing the outputs back into the wiki to enhance it for further queries. So my own explorations and queries always add up."
4. **Obsidian as the IDE** — "The LLM makes edits based on our conversation, and I browse the results in real time — following links, checking the graph view, reading the updated pages. Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase."
5. **Don't over-plan** — gist is "intentionally abstract/vague because there are so many directions to take this in."

## Notable Community Implementations & Ideas

### Multi-domain / cross-project patterns
- **Comment #354:** "Running this pattern in production across multiple related knowledge domains." Key learnings:
  - Give the index a token budget (L0-L3 progressive disclosure)
  - Every task produces two outputs: the deliverable + wiki updates
  - Design for cross-domain from day one with domain tags
  - Human owns verification — build source citation into schema
- **Comment #364:** "If knowledge spans multiple projects — add a domain tag to frontmatter now. Shared entities become the most valuable nodes. Retrofitting this is painful."
- **Comment #334:** "Two wiki layers: KB (machine-managed reference) and Drafts (writing workspace). Intent classifier routes entries."

### .brain folder pattern
- `.brain/` at project root with `index.md`, `architecture.md`, `decisions.md`, `changelog.md`, `deployment.md`
- "Turns every AI session from 'let me re-explain my project' into 'read .brain and get to work.'"

### Domain-based state management
- `state.md` per domain as current operational synthesis
- Separates intake, routing, consolidation, summarization
- Morning `brief.md` collected from all `state.md` files

### Existing projects from comments
- **sage-wiki** — single Go binary, cross-platform, end-to-end implementation
- **axiom-wiki**, **CowAgent**, **OmegaWiki**, **memory-toolkit** — various implementations
- **mnemon** — knowledge extraction pipeline with personalization layer
- **vibe-sensei** — trading wiki with guardian context injection
- Multiple CLI implementations in progress

### Tooling recommendations from community
- **qmd** (github.com/tobi/qmd) — local search engine for markdown, hybrid BM25/vector, CLI + MCP server
- **Obsidian Web Clipper** — browser extension to convert articles to markdown
- **Marp** — markdown slide decks
- **Dataview** — Obsidian plugin for queries over frontmatter

## Sentiment Analysis: What Karpathy Would Recommend

Based on his tweets, gist, and the way he frames the pattern:

1. **Start simple, one topic** — he built his first for a specific research area, not a life-organizing system
2. **Let the LLM figure out structure** — "your LLM can figure out the rest"
3. **Separate wikis per domain** — implicit in "various topics" and the gist listing distinct use cases
4. **Stay involved during ingest** — "I prefer to ingest sources one at a time and stay involved"
5. **Tools are optional and emergent** — "I vibe coded a small and naive search engine... as the need arises"
6. **Don't build for scale you don't have** — index.md is enough until it isn't
