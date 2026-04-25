---
name: wiki-templates
description: Page type templates and frontmatter conventions for LLM Wiki pages. Reference skill loaded by ingest, query, and lint skills to ensure consistent wiki structure.
user-invocable: false
---

# Wiki Page Templates

Standard templates for all wiki page types. Every page created or updated in a vault MUST follow these conventions.

## Universal Frontmatter (all page types)

Every wiki page has this base frontmatter:

```yaml
---
title: "Page Title"
date-created: YYYY-MM-DD
date-modified: YYYY-MM-DD
page-type: source-note | entity | concept | comparison | summary
domain:
  - vault-default-domain
tags:
  - relevant-tag
sources:
  - raw/filename.md
  - https://original-url.com
related:
  - "[[related-page-name]]"
---
```

**Rules:**
- `domain` always includes the vault's default domain tag. Add more if content spans domains.
- `sources` lists paths to raw/ files AND/OR original URLs. Never empty — every page traces to a source.
- `related` lists wikilinks to related pages in the wiki.
- `date-modified` updates whenever the page content changes.

## Wikilinks

**Same-vault:** `[[page-name]]` — standard Obsidian syntax. Use in the `related` frontmatter field and inline in prose when mentioning any entity/concept with its own page.

**Cross-vault:** plain markdown link where the visible text is the cross-vault ref and the target is an `obsidian://open` URL. The visible text stays grep-able and visually flags the boundary (colon notation); the URL makes it click-through to the other vault.

**Form:**
```
[vault-short:page-slug](obsidian://open?vault=llm-wiki-<vault-short>&file=<url-encoded-path-without-.md>)
```

Rules:
- `vault-short` drops the `llm-wiki-` prefix (`llm-wiki-personal-work` → `personal-work`).
- `page-slug` is the filename without the `.md` extension.
- File path is URL-encoded: `/` → `%2F`, spaces → `%20`. Omit the `.md` extension from the URL.

```yaml
related:
  - "[[recruiter-paloma]]"                              # same-vault (wikilink is fine)
  - "[personal-work:linkedin-profile-ronan-connolly](obsidian://open?vault=llm-wiki-personal-work&file=wiki%2Fsources%2Flinkedin-profile-ronan-connolly)"  # cross-vault
  - "[personal-work:ronan-connolly](obsidian://open?vault=llm-wiki-personal-work&file=wiki%2Fentities%2Fronan-connolly)"
```

Inline example from a `career-moves` page:

```markdown
Per Paloma's feedback, simplify headline in [personal-work:linkedin-profile-ronan-connolly](obsidian://open?vault=llm-wiki-personal-work&file=wiki%2Fsources%2Flinkedin-profile-ronan-connolly).
```

**Do NOT use the `[[vault-short:page]]` wikilink form.** It renders as a red unresolved link in Obsidian ("not created yet, click to create"), which is bad UX. Legacy wikilinks exist in older content and should be migrated via the `cross-vault-link-audit` skill.

**Grep for cross-vault refs** via `\[[a-z0-9-]+:[a-z0-9-]+\]\(obsidian://`. Skills can resolve the target by parsing the URL and reading the target vault.

---

## Progressive Index

The vault's `wiki/index.md` is structured in tiers so skills load only what they need. Token budgets are guidelines, not hard limits — `/lint` warns when exceeded and suggests sharding once a vault outgrows a single file.

| Tier | Section / file | Token budget | Contents |
|------|----------------|--------------|----------|
| L0 | `## Purpose` (top of `index.md`) | ~500 | What this vault is for, primary domain, stable anchor entities. Always loaded. |
| L1 | `## Topic Map` (middle of `index.md`) | ~2000 | Flat list of entity/concept pages, one line each: `[[page-name]] — one-line summary`. Loaded for query/lint. |
| L2 | `## Full Index` (bottom of `index.md`) | ~8000 | Detailed tables grouped by page-type (Sources, Entities, Concepts, Comparisons). Loaded only when L0+L1 are insufficient. |
| L3 | Individual pages | unbounded | Page bodies, read on demand. |

When `index.md` total exceeds ~10K tokens, `/lint` suggests sharding: keep L0 in `index.md`, move L1 to `index-l1.md`, move L2 to `index-l2.md`. Skills then progressively load deeper tiers only when the question warrants. This is the Karpathy-pattern scaling answer (community comment #354 on the gist proposed L0–L3 token budgets).

**Where new pages get filed by `/ingest`:**
- New entity or concept → append a one-line entry to L1, plus the full table row in L2.
- New source-note → L2 only (Sources table).
- New comparison or summary → L1 (one line) + L2 (Comparisons table).

**Read order for `/query` and `/lint`:**
1. Always read L0.
2. Read L1 if the question is about cross-page synthesis or the answer needs more than 1-2 anchor pages.
3. Read L2 only when L0+L1 don't surface enough candidate pages, or when running a structural lint pass.

When sharded into separate files (`index.md`, `index-l1.md`, `index-l2.md`), the same read-order applies. The shard split is a `/lint` recommendation, not an automatic action — the user runs it deliberately.

---

## KB + Drafts Layers

A vault has two writing surfaces:

- **`wiki/`** — the **KB** layer. Machine-managed. Every page has full frontmatter, a clear page-type, lives in the index, and is treated as canonical reference material. Skills like `/query` and `/generate-*` only read from here.
- **`scratchpad/`** — the **Drafts** layer. Human-managed. Rough notes, meeting captures, half-formed thoughts, work-in-progress. No frontmatter requirement, no index entry, no auto-link expectations. The `rough-notes` skill is the canonical writer here.

The split exists so the KB stays clean while you still have a place to think out loud. You should never feel bad about messy notes; you should also never get confused by messy notes appearing in `/query` answers.

**Promotion path: `scratchpad/` → `wiki/`**

When a draft has stabilised enough to be reference material, promote it via `/promote --from-drafts`. The skill:
1. Adds proper frontmatter (title, dates, page-type, domain, tags, sources, related).
2. Moves the file from `scratchpad/<file>.md` to the appropriate `wiki/{sources,entities,concepts,comparisons}/<slug>.md`.
3. Updates `index.md` (L1 and L2 entries per the progressive index spec).
4. Optionally leaves a redirect stub in `scratchpad/` pointing to the new location.

**What does NOT belong in scratchpad/**

- Finished source-notes from external sources — those go straight to `wiki/sources/` via `/ingest`.
- Entity or concept pages — those are KB material from inception.
- Anything you'd want `/query` to find. If it's worth being found, it's worth being in `wiki/`.

**Hygiene**

`/lint` flags scratchpad files unmodified for over 30 days as stale candidates — either promote them or delete. Drafts left to rot defeat the point of the split.

---

## Page Type: source-note

A summary of one ingested source. One source-note per source.

**Location:** `wiki/sources/<source-name>.md`

**Additional frontmatter:**
```yaml
source-url: https://original-url.com
source-type: article | paper | video | tweet | gist | discussion | pdf | book | podcast | presentation
author: "Author Name"
date-accessed: YYYY-MM-DD
raw-file: raw/filename.md
```

**Structure:**
```markdown
# <Source Title>

## Overview
Brief summary of what this source contains and why it matters.

## Key Takeaways
- Takeaway 1
- Takeaway 2
- Takeaway 3

## Detailed Notes
Deeper notes organized by topic. Link to [[entity]] and [[concept]] pages when mentioning them.

## Quotes
> Notable direct quotes with context.

## Sources
- **Raw file:** [filename.md](../raw/filename.md)
- **Original URL:** [source-title](https://original-url.com)
- **Author:** Author Name
- **Accessed:** YYYY-MM-DD
```

### Example: source-note

```yaml
---
title: "LLM Wiki — Karpathy's Idea File"
date-created: 2026-04-12
date-modified: 2026-04-12
page-type: source-note
domain:
  - ai-research
  - knowledge-management
tags:
  - llm
  - knowledge-base
  - obsidian
sources:
  - raw/karpathy-llm-wiki-gist.md
  - https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
related:
  - "[[andrej-karpathy]]"
  - "[[llm-knowledge-bases]]"
  - "[[obsidian-workflows]]"
source-url: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
source-type: gist
author: "Andrej Karpathy"
date-accessed: 2026-04-12
raw-file: raw/karpathy-llm-wiki-gist.md
---

# LLM Wiki — Karpathy's Idea File

## Overview
A pattern for building personal knowledge bases using LLMs. Instead of RAG, the LLM incrementally builds and maintains a persistent wiki of interlinked markdown files.

## Key Takeaways
- The wiki is a persistent, compounding artifact — not re-derived each query
- Three layers: raw sources, the wiki, the schema (CLAUDE.md)
- Four operations: ingest, query, lint, promote
- [[andrej-karpathy]] uses [[obsidian-workflows]] as the viewer

## Sources
- **Raw file:** [karpathy-llm-wiki-gist.md](../raw/karpathy-llm-wiki-gist.md)
- **Original URL:** [GitHub Gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f)
- **Author:** Andrej Karpathy
- **Accessed:** 2026-04-12
```

---

## Page Type: entity

A page about a person, organization, tool, framework, or other named entity.

**Location:** `wiki/entities/<entity-name>.md`

**Additional frontmatter:**
```yaml
entity-type: person | organization | tool | framework | service | dataset | publication
aliases:
  - "Alternative Name"
  - "Abbreviation"
```

**Structure:**
```markdown
# <Entity Name>

## Overview
What/who this entity is and why it's relevant.

## Key Facts
- Fact 1
- Fact 2

## Relevance
How this entity connects to the vault's domain. What role does it play in the knowledge base?

## Mentions
Pages where this entity appears:
- [[source-note-1]] — context of mention
- [[concept-page]] — how it relates

## Sources
- [[source-that-introduced-entity]]
- [External link](https://url)
```

### Example: entity

```yaml
---
title: "Andrej Karpathy"
date-created: 2026-04-12
date-modified: 2026-04-12
page-type: entity
domain:
  - ai-research
tags:
  - ai
  - deep-learning
  - tesla
  - openai
sources:
  - raw/karpathy-llm-wiki-gist.md
  - raw/karpathy-viral-tweet.md
related:
  - "[[llm-knowledge-bases]]"
  - "[[obsidian-workflows]]"
entity-type: person
aliases:
  - "Karpathy"
---

# Andrej Karpathy

## Overview
AI researcher. Previously Director of AI at Tesla, founding team at OpenAI, PhD from Stanford. Creator of the [[llm-knowledge-bases]] pattern.

## Key Facts
- Created the LLM Wiki "idea file" pattern (April 2026)
- Original tweet got 55K likes, 6.5K retweets
- Uses [[obsidian-workflows]] as his wiki viewer

## Sources
- [[karpathy-llm-wiki-gist]] — the original idea file
- [[karpathy-viral-tweet]] — the tweet that started it all
```

---

## Page Type: concept

A page about an idea, pattern, technique, or abstract concept.

**Location:** `wiki/concepts/<concept-name>.md`

**Structure:**
```markdown
# <Concept Name>

## Definition
Clear, concise definition of the concept.

## How It Works
Explanation of the concept, mechanics, or methodology.

## Examples
Concrete examples of the concept in practice.

## Related Concepts
- [[related-concept-1]] — how it relates
- [[related-concept-2]] — how it differs

## Sources
- [[source-note]] — where this concept was discussed
- [External link](https://url)
```

### Example: concept

```yaml
---
title: "LLM Knowledge Bases"
date-created: 2026-04-12
date-modified: 2026-04-12
page-type: concept
domain:
  - ai-research
  - knowledge-management
tags:
  - llm
  - wiki
  - knowledge-base
  - rag-alternative
sources:
  - raw/karpathy-llm-wiki-gist.md
related:
  - "[[andrej-karpathy]]"
  - "[[rag-vs-wiki]]"
  - "[[obsidian-workflows]]"
---

# LLM Knowledge Bases

## Definition
A pattern where LLMs incrementally build and maintain a persistent wiki of interlinked markdown files, rather than re-deriving knowledge from raw documents on every query (as in RAG).

## How It Works
1. **Ingest**: Source documents are processed into wiki pages
2. **Query**: Questions answered by reading the wiki, not raw docs
3. **Lint**: Periodic health checks for contradictions and gaps
4. **Promote**: Cross-project knowledge transferred between wikis

## Related Concepts
- [[rag-vs-wiki]] — comparison of RAG vs persistent wiki approaches
- [[obsidian-workflows]] — the viewer/IDE for browsing wikis

## Sources
- [[karpathy-llm-wiki-gist]] — original pattern description
```

---

## Page Type: comparison

A synthesis page comparing two or more concepts, tools, or approaches.

**Location:** `wiki/comparisons/<comparison-name>.md`

**Structure:**
```markdown
# <Thing A> vs <Thing B>

## Summary
One-paragraph synthesis of the comparison.

## Comparison Table
| Aspect | Thing A | Thing B |
|--------|---------|---------|
| ... | ... | ... |

## Analysis
Deeper analysis of tradeoffs, use cases, and recommendations.

## Verdict
When to use each, and which is recommended for what context.

## Sources
- [[source-1]] — evidence for Thing A
- [[source-2]] — evidence for Thing B
```

### Example: comparison

```yaml
---
title: "RAG vs Persistent Wiki"
date-created: 2026-04-12
date-modified: 2026-04-12
page-type: comparison
domain:
  - ai-research
  - knowledge-management
tags:
  - rag
  - wiki
  - architecture
sources:
  - raw/karpathy-llm-wiki-gist.md
related:
  - "[[llm-knowledge-bases]]"
  - "[[andrej-karpathy]]"
---

# RAG vs Persistent Wiki

## Summary
RAG re-derives knowledge each query from raw chunks. A persistent wiki compiles knowledge once and keeps it current. The wiki compounds; RAG doesn't.

## Comparison Table
| Aspect | RAG | Persistent Wiki |
|--------|-----|-----------------|
| Knowledge accumulation | None — re-derived each time | Compounds with every source |
| Cross-references | Must be found each query | Already maintained |
| Contradictions | Not flagged | Flagged during lint |
| Maintenance cost | Low (just index) | Near-zero (LLM maintains) |
| Setup complexity | Higher (embeddings, vector DB) | Lower (just markdown) |

## Sources
- [[karpathy-llm-wiki-gist]] — original argument for wiki over RAG
```

---

## Page Type: summary

A high-level overview page that synthesizes across multiple sources and pages.

**Location:** `wiki/<summary-name>.md` (top level of wiki/)

**Structure:**
```markdown
# <Topic> — Summary

## Overview
High-level synthesis of the topic.

## Key Themes
- Theme 1 — brief description
- Theme 2 — brief description

## Open Questions
- Question that needs more research
- Unresolved contradiction between sources

## Sources
- [[source-1]]
- [[source-2]]
```

---

## Cross-Referencing Rules

1. **Always link** entities and concepts when first mentioned on a page: `[[entity-name]]`
2. **Use the canonical page name** as the link text. If an entity has aliases, link to the main page: `[[andrej-karpathy|Karpathy]]`
3. **Update the `related` frontmatter** when adding links between pages
4. **Don't over-link** — link on first mention per page, not every occurrence
