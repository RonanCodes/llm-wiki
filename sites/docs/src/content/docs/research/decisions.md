---
title: "Architecture Decisions"
description: "Key decisions made during the design of LLM Wiki, with rationale."
---

A record of the key architecture decisions and why they were made.

## One Engine, Many Vaults

**Decision:** Claude Code is the engine. Skills live in `.claude/`. Vaults are dumb folders of markdown.

**Why:** Centralizing logic means maintaining 1 system instead of N. A vault doesn't need its own skills — the same ingest/query/lint/promote works everywhere.

## Separate Vault Per Domain

**Decision:** One wiki per research topic/project. A meta vault for cross-cutting knowledge.

**Why:** Different privacy levels, independent lifecycles, clean git history, size independence. Karpathy uses separate wikis per research area.

## Each Vault is Its Own Git Repo

**Decision:** Vaults are separate git repos, gitignored from the engine repo.

**Why:** Privacy (personal vault private, work vault shared), lifecycle (archive when project ships), size (PDFs in raw/ don't bloat other vaults).

## Meta Vault for Cross-Project Knowledge

**Decision:** A long-lived vault for tech patterns, strategy playbooks, vendor evaluations.

**Why:** Without this, reusable knowledge gets trapped in project vaults. The `/promote` operation graduates learnings.

**Note:** Start without meta. Create it when you notice re-researching something.

## Domain Tags From Day One

**Decision:** All wiki pages get domain tags in YAML frontmatter.

**Why:** Community consensus: "Add a domain tag to your frontmatter now. Shared entities become the most valuable nodes. Retrofitting this is painful."

## Direct File Access (No MCP)

**Decision:** Claude Code reads/writes files directly. No MCP server between Claude and the vault.

**Why:** Claude Code already has file access. MCP solves a problem that doesn't exist for CLI users. Add qmd for search at scale (~200+ pages).

## Lazy Dependency Install

**Decision:** Each skill installs its own tools on first use (poppler, pandoc, yt-dlp).

**Why:** Users shouldn't install everything upfront. Zero-dep skills (tweet, gist, web, text) work immediately. Heavy deps only install when the source type demands it.

## Open Questions

- **Where does meta vault live?** Inside `vaults/` or elevated alongside the engine?
- **Search at scale** — qmd is the answer, but when exactly to add it is TBD
- **How many vaults to start with?** Recommendation: 2 (one personal, one project). Create meta when needed.
