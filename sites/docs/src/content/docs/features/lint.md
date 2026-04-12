---
title: "Lint"
description: "Health-check your wiki with 8 checks, auto-fix, and severity-grouped reporting."
---

The `/lint` skill runs 8 health checks against your wiki and outputs a severity-grouped report. Add `--fix` to auto-repair what's fixable.

## Usage

```
/lint --vault my-research
/lint --vault my-research --fix
```

| Flag | Description |
|------|-------------|
| `--vault <name>` | Target vault |
| `--fix` | Auto-fix what's fixable (missing frontmatter, stubs, domain tags, index) |

## The 8 Checks

| # | Check | Severity | Auto-fixable |
|---|-------|----------|-------------|
| 1 | **Frontmatter completeness** -- title, dates, page-type, domain, sources, related | Critical | Yes |
| 2 | **Orphan pages** -- no inbound links from any other page | Warning | No |
| 3 | **Broken wikilinks** -- `[[target]]` references where target doesn't exist | Critical | Yes (creates stubs) |
| 4 | **Missing source links** -- pages without `sources` frontmatter or `## Sources` section | Critical | Yes |
| 5 | **Missing domain tags** -- pages without the vault's default domain | Warning | Yes |
| 6 | **Concepts without pages** -- frequently mentioned terms that lack a concept page | Info | Yes (creates stubs) |
| 7 | **Stale content** -- `date-modified` significantly older than related pages | Warning | No |
| 8 | **Index completeness** -- pages missing from index, or index entries for deleted pages | Warning | Yes |

## Report Format

The report is grouped by severity:

```markdown
## Wiki Lint Report -- my-research

### Summary
- Total pages: 42
- Issues found: 7 (4 auto-fixable)

### Critical (broken links, missing sources)
- [[missing-page]] referenced by [[page-1]], [[page-2]] but doesn't exist
- wiki/sources/article.md has empty sources frontmatter

### Warning (orphans, missing metadata)
- wiki/entities/old-tool.md is orphaned (no inbound links)
- wiki/concepts/some-idea.md missing domain tag

### Info (suggestions)
- "machine learning" mentioned 8 times but has no concept page
- Consider ingesting more sources on <topic>
```

## What `--fix` Does

When `--fix` is set, lint auto-repairs:
- Adds missing frontmatter fields with vault defaults
- Creates stub pages for broken wikilinks
- Adds vault default domain to pages missing it
- Creates stub concept pages for frequently mentioned terms
- Syncs `wiki/index.md` with actual pages on disk
- Auto-commits all fixes with a summary

## After Linting

Lint suggests next actions based on gaps found:
- New questions to investigate
- Sources to ingest for thin coverage areas
- Cross-references that should exist between pages
