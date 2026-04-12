---
title: "Page Templates"
description: "Five page types with frontmatter specs and structural conventions."
---

Every wiki page follows one of five templates. The `wiki-templates` skill (loaded automatically by ingest, query, and lint) enforces these conventions.

## Universal Frontmatter

All page types share this base:

```yaml
---
title: "Page Title"
date-created: 2026-04-12
date-modified: 2026-04-12
page-type: source-note | entity | concept | comparison | summary
domain:
  - vault-default-domain
tags:
  - relevant-tag
sources:
  - raw/filename.md
related:
  - "[[related-page]]"
---
```

## 1. Source Note

**Location:** `wiki/sources/<source-name>.md`

**Extra fields:** `source-url`, `source-type`, `author`, `date-accessed`, `raw-file`

**Structure:** Overview, Key Takeaways, Detailed Notes, Quotes, Sources

```yaml
source-url: https://example.com/article
source-type: article  # article|paper|video|tweet|gist|pdf|book
author: "Author Name"
date-accessed: 2026-04-12
raw-file: raw/article-name.md
```

## 2. Entity

**Location:** `wiki/entities/<entity-name>.md`

**Extra fields:** `entity-type`, `aliases`

**Structure:** Overview, Key Facts, Relevance, Mentions, Sources

```yaml
entity-type: person  # person|organization|tool|framework|service
aliases:
  - "Karpathy"
```

## 3. Concept

**Location:** `wiki/concepts/<concept-name>.md`

**Extra fields:** none beyond universal

**Structure:** Definition, How It Works, Examples, Related Concepts, Sources

## 4. Comparison

**Location:** `wiki/comparisons/<comparison-name>.md`

**Extra fields:** none beyond universal

**Structure:** Summary, Comparison Table, Analysis, Verdict, Sources

## 5. Summary

**Location:** `wiki/<summary-name>.md` (top level of wiki/)

**Extra fields:** none beyond universal

**Structure:** Overview, Key Themes, Open Questions, Sources

## Cross-Referencing Rules

- Link entities and concepts on first mention: `[[entity-name]]`
- Use canonical page name as link text: `[[andrej-karpathy|Karpathy]]`
- Update `related` frontmatter when adding links
- Don't over-link -- first mention per page only
- Filenames are always kebab-case: `andrej-karpathy.md`
