---
title: "Roadmap"
description: "What's built, what's next."
---

**The MVP is complete.** Phases 0-2 are shipped. The system is fully usable today.

## What's Built

| Phase | Name | Status | Highlights |
|-------|------|--------|------------|
| **0** | Foundation | ✅ | Git repo, Ralph loop, setup skill, docs |
| **1** | Vault Engine | ✅ | 25 skills: vault management, 7 ingest types, query, lint, promote |
| **1.5** | Import & Private | ✅ | `/vault-import`, `.private/` overlay |
| **2** | Tooling | ✅ | qmd search, Marp slides, image handling, Dataview, install script |

## Phase 0: Foundation

Git init, tooling, Ralph loop, docs.

- Public repo at github.com/RonanCodes/llm-wiki
- `/ralph` skill + `ralph.sh` for autonomous builds
- `/setup` for first-time bootstrap
- Workflow and dependency docs

## Phase 1: Vault Engine

Core vault system -- 25 skills.

- `/vault-create`, `/vault-status`, `/vault-import`, `/vault-archive`
- `wiki-templates` -- 5 page types with frontmatter specs
- `/ingest` router + 7 sub-skills (web, PDF, Office, YouTube, tweet, gist, text)
- `/query` with `--save` to compound knowledge
- `/lint` with 8 checks and `--fix` auto-repair
- `/promote` for cross-vault knowledge transfer
- `.private/` overlay for private skills

## Phase 2: Tooling (MVP Complete)

Ecosystem tools from Karpathy's recommendations.

- `/search` -- qmd hybrid BM25/vector search + grep fallback + MCP server
- `/slides` -- Marp presentation generation from wiki content
- Image handling -- download images locally during ingest
- Dataview compatibility -- queries, dashboard template, field reference
- `install.sh` -- interactive macOS installer
- Astro landing site + Starlight docs

## What's Next

Community feedback will drive priorities. Some ideas being explored:

- **Local web app** -- Next.js dashboard with chat interface for non-CLI users
- **More source types** -- Slack threads, meeting transcripts, Kindle highlights
- **Better search** -- deeper qmd integration, semantic queries
- **Collaboration** -- shared vaults, team workflows

## Key Metrics

| Metric | Current |
|--------|---------|
| Skills built | 25 |
| Source types | 7 |
| Core operations | 4 (ingest, query, lint, promote) |
| Page types | 5 (source-note, entity, concept, comparison, summary) |
| Core external deps | 0 (curl only) |
| Optional external deps | 5 (yt-dlp, poppler, pandoc, qmd, marp) |
