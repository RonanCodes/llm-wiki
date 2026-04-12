---
title: "Roadmap"
description: "Project phases 0-5: what's complete, what's next, and the full vision."
---

**MVP = Phase 0 + Phase 1 + Phase 2.** All three are complete. Everything after Phase 2 is optional future work. The system is fully usable today.

## Phase Summary

| Phase | Name | Status | Highlights |
|-------|------|--------|------------|
| **0** | Foundation | Complete | Git repo, Ralph loop, setup skill, docs |
| **1** | Vault Engine | Complete | 20 skills: vault management, 7 ingest types, query, lint, promote |
| **1.5** | Import & Private | Complete | `/vault-import`, `.private/` overlay |
| **2** | Tooling | Complete | qmd search, Marp slides, image handling, Dataview, install script |
| **3** | Local Web App | Planned | Next.js dashboard, chat interface, PWA |
| **4** | Deployment | Planned | Docker, Hetzner VPS, auto-deploy, backups |
| **5** | SaaS | Planned | Auth, Stripe billing, multi-tenant vaults |

## Phase 0: Foundation (Complete)

Git init, tooling, Ralph loop, docs.

- Public repo at github.com/RonanCodes/llm-wiki
- `/ralph` skill + `ralph.sh` for autonomous builds
- `/setup` for first-time bootstrap
- Workflow and dependency docs

## Phase 1: Vault Engine (Complete)

Core vault system -- 20 skills built.

- `/vault-create`, `/vault-status`, `/vault-import`, `/vault-archive`
- `wiki-templates` -- 5 page types with frontmatter specs
- `/ingest` router + 7 sub-skills (web, PDF, Office, YouTube, tweet, gist, text)
- `/query` with `--save` to compound knowledge
- `/lint` with 8 checks and `--fix` auto-repair
- `/promote` for cross-vault knowledge transfer
- `.private/` overlay for private skills

## Phase 2: Tooling (Complete -- MVP Done)

Ecosystem tools from Karpathy's recommendations.

- `/search` -- qmd hybrid BM25/vector search + grep fallback + MCP server
- `/slides` -- Marp presentation generation from wiki content
- Image handling -- download images locally during ingest
- Dataview compatibility -- 6 queries, dashboard template, JS queries, field reference
- `install.sh` -- interactive macOS installer
- Starlight docs site

## Phase 3: Local Web App (Planned)

Next.js companion app -- nice UI for vault management. Not needed for CLI + Obsidian power users, but great for DX and onboarding.

- Next.js App Router, shadcn/ui, TypeScript, Tailwind
- API routes: `/api/ingest`, `/api/query`, `/api/vaults`
- Dashboard with vault overview and recent activity
- Chat interface for conversational queries
- PWA for mobile install

## Phase 4: Deployment (Planned)

Self-hosted on Hetzner VPS with auto-deploy.

- Dockerfile (multi-stage, Next.js standalone output)
- docker-compose: app + Caddy (auto HTTPS) + Watchtower (auto-deploy)
- GitHub Actions CI: build image, push to GHCR
- Backups: restic to Backblaze B2

## Phase 5: SaaS (Planned)

Multi-tenant hosted version. Same codebase, different deployment.

- Auth (Clerk or Better Auth)
- Stripe billing: BYO key ~$10/mo, all-in ~$30-50/mo
- Multi-tenant vaults with per-user storage
- GitHub sync (optional)
- Vault export -- always available, no lock-in (it's just markdown)

## Key Metrics

| Metric | Current |
|--------|---------|
| Skills built | 25 |
| Source types | 7 |
| Core operations | 4 (ingest, query, lint, promote) |
| Page types | 5 (source-note, entity, concept, comparison, summary) |
| Core external deps | 0 (curl only) |
| Optional external deps | 5 (yt-dlp, poppler, pandoc, qmd, marp) |
