---
name: slides
description: Deprecated — /slides has moved to /generate slides. This shim prints a short redirect and forwards to the new handler. Use when a user types the old /slides command.
argument-hint: "<topic>" [--vault <name>]
allowed-tools: Read
---

# Slides (deprecated)

This skill is a thin deprecation shim. The real logic now lives in `.claude/skills/generate-slides/` and is routed via `/generate`.

## What To Do

When `/slides <topic>` is invoked, print this message:

```
⚠️  /slides has been renamed /generate slides

Run:   /generate slides <topic> [--vault <name>]

The new handler lives under .claude/skills/generate-slides/ and writes
to vaults/<vault>/artifacts/slides/ (not into the wiki) — same
provenance contract as generate-book and generate-pdf.
```

Then hand off — read `.claude/skills/generate-slides/SKILL.md` and execute it with the same arguments the user passed to `/slides`. The user doesn't need to re-type the command.

## Why the Move

- Slides are an **artifact**, not a wiki page. The old skill wrote Marp markdown into `wiki/slides-<topic>.md`, mixing generated content with source-of-truth pages.
- All artifact generators now share: `/generate <type>` dispatch, `artifacts/<type>/` storage, `.meta.yaml` sidecar with source-hash provenance, shared helpers under `.claude/skills/generate/lib/`.
- See `sites/docs/src/content/docs/reference/artifacts.md` for the full convention.

## Migration

Existing `wiki/slides-*.md` files from the old skill remain where they are — they're not auto-moved. Either leave them (they'll still render in Obsidian via the Marp Slides plugin) or delete them after re-generating via `/generate slides`.

## See Also

- `.claude/skills/generate/SKILL.md` — the router.
- `.claude/skills/generate-slides/SKILL.md` — where the logic lives now.
