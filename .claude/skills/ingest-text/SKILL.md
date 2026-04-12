---
name: ingest-text
description: Process pasted text, notes, or local markdown files for wiki ingestion. No external dependencies.
user-invocable: false
allowed-tools: Read
---

# Ingest Text

Process pasted text or local markdown files directly.

## For Pasted Text

1. The text is provided directly as the source argument to `/ingest`
2. Save to vault's `raw/<topic-slug>-notes.md` with YAML header:
```yaml
---
title: "<topic>"
date-fetched: <today>
source-type: notes
---
```
3. Pass to ingest router for wiki page creation

## For Local Markdown Files

1. Read the file at the provided path
2. Copy to vault's `raw/` if not already there
3. Check if the file has YAML frontmatter — if so, extract metadata
4. Pass content to ingest router for wiki page creation

## Notes

- This is the simplest ingest path — no extraction needed
- For markdown files already in vault's `raw/`, just read them directly
- The user may paste partial notes, meeting transcripts, or quick thoughts
- Extract what structure you can, but don't force structure on unstructured notes

## Dependencies

None.
