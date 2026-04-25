---
name: context-pack
description: Algorithm for assembling a small, deterministic set of relevant wiki pages to load before any /query, /ingest, or synthesis operation. Reference skill loaded by query and ingest to surface guardian context (related entities, prior decisions, near-duplicate prior work) without manual page-picking.
user-invocable: false
---

# Context Pack

Given a seed (a question, an incoming source, or an existing page), select 3-5 wiki pages most likely to inform the LLM's response. Other skills load this and read the selected pages before doing their main work.

This is the "guardian context injection" pattern — instead of trusting the LLM to remember to look around, the algorithm forces a pass over related material first. Two effects:

1. **Better answers and ingests** — the LLM sees prior decisions, related entities, and existing concepts before generating new content.
2. **Fewer near-duplicates** — if a similar page already exists, the pack surfaces it, and the caller can extend that page rather than create a new one.

## When to load this skill

- `/query` Step 3 (Identify Relevant Pages) — replaces ad-hoc title-matching.
- `/ingest` post-extraction — before deciding where to file a new page, check whether an extension to an existing page is the right move.
- Any synthesis skill (`/promote`, `/generate-*`) that needs to ground output in existing wiki content.

Do NOT load for trivial reads (single-page lookups, lint health checks) — the pack adds latency that isn't justified.

## The algorithm

### Step 1 — Extract seed signals

A seed is one of:
- A question string (from `/query`)
- An incoming source-note title + tags + extracted entity names (from `/ingest`)
- An existing page path (from `/promote` or generators)

From the seed, extract:
- **Tags** — explicit if available, otherwise infer 2-4 from the seed text.
- **Domains** — the vault's default + any additional inferred from the seed.
- **Named entities** — capitalised proper nouns and slug-shaped terms (`some-tool`, `another-thing`).
- **Page-type hint** — entity / concept / comparison / source-note / summary, if obvious from the seed.

### Step 2 — Score candidate pages

Walk every page in `vaults/<vault>/wiki/**/*.md` (skip `index*.md`). For each, score:

| Signal | Score |
|--------|-------|
| Shared tag | +3 per tag |
| Shared domain | +2 per domain |
| Wikilink to/from a seed-named entity | +1 per link |
| Same `page-type` as the seed-type hint | +1 |
| qmd top-3 hit when searching seed text (if qmd installed) | +5 |
| Title token Jaccard ≥0.5 with seed | +4 |

Pages with score < 3 are dropped. Score ties broken by `date-modified` descending (recent first).

### Step 3 — Cap and label

Keep top **5 pages** by default. The caller can request a different limit (`/query` typically asks for 5; `/ingest` for 3).

Return as a small table:
```
| Path | Score | Why |
|------|-------|-----|
| wiki/concepts/llm-knowledge-bases.md | 14 | shared tags: llm, wiki; same page-type: concept; qmd top-1 |
| wiki/entities/andrej-karpathy.md     |  9 | shared tag: ai-research; wikilink target |
| wiki/comparisons/rag-vs-wiki.md      |  7 | shared domain: ai-research; same page-type: comparison |
```

The "Why" column is the audit trail — the caller (and the user reading the report) can see why each page was picked.

### Step 4 — Caller reads + uses

The calling skill reads each page in the pack, then proceeds with its main work. The pack is **load-and-go** — it doesn't get filed back, doesn't get committed, doesn't show up in user-facing output unless the caller chooses to expose it.

## Implementation notes for callers

- **Read pages with `Read`, not bulk `cat`** — keeps content properly indexed in the LLM's context window.
- **Dedupe against pages the caller is already going to read.** If the seed page appears in its own pack, drop it.
- **At small vault scale (under ~30 pages), the pack will be most of the wiki.** That's fine — the algorithm is still cheap and the read cost is bounded by vault size.
- **When qmd is installed, prefer it for the top-3 candidates.** qmd's hybrid ranking beats lexical-only scoring on content-similar pages that don't share tags. The +5 score weight reflects this.

## Rejected designs (and why)

- **Embedding-based retrieval as primary.** Adds an offline indexing step and a vector store dependency. qmd already does hybrid BM25 + vector under the hood, so the wins of doing this ourselves are small.
- **Auto-injecting cross-vault pages.** Considered for hub vaults but rejected for v1 — cross-vault `obsidian://` links aren't tracked centrally, scanning every vault per query would be slow, and false-positive risk is real. Re-visit when `/query --all-vaults` (Tier 2.3) is in use.
- **LLM-judged candidate scoring.** Asking the LLM "which pages relate to this question?" produces good answers but is non-deterministic and expensive. The deterministic score table above is good enough and auditable.

## Future extensions

- Cross-vault candidate sourcing once `/query --all-vaults` is exercised.
- A `--explain` flag for `/query` that surfaces the pack table in the response so the user sees what was loaded.
- Backlink-graph traversal (1-hop neighbours of a seed page) as an additional signal.

These are tracked under Tier 2.5 / Tier 3 if and when needed. Don't pre-build.
