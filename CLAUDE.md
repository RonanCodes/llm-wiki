# LLM Wiki

## What This Is

A personal knowledge base system powered by LLMs, inspired by [Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The LLM incrementally builds and maintains a persistent wiki of interlinked markdown files — not RAG, not re-deriving knowledge each query, but a compounding artifact that gets richer over time.

## Quick Start (new session)

If this is a fresh Claude Code session, here's what you can do:

1. **First time on this machine?** Run `/setup` — checks tools, verifies skills from `skills.json`, recommends missing ones from `skills.local.jsonc`.
2. **Create a vault:** `/vault-create my-research --domain ai-research`
3. **Import existing vault:** `/vault-import ~/path/to/obsidian-vault --name my-vault`
4. **Check vault status:** `/vault-status`
5. **Ingest a source:** `/ingest https://some-article.com --vault my-research`
6. **Ask a question:** `/query "What do we know about X?" --vault my-research`
7. **Health-check:** `/lint --vault my-research`
8. **Graduate knowledge:** `/promote my-research --to meta`

For the full daily workflow, read `docs/workflow.md`.
For the project roadmap and what's built vs planned, read `docs/roadmap.md`.

## Project Status

**Phase 1 complete.** Core vault engine built — 20 skills covering vault management, ingestion (7 source types), query, lint, and promote. See `docs/roadmap.md` for full phase breakdown.

## How It Works

Claude Code is the engine. Obsidian is the viewer. You direct.

```
You (terminal)                    You (Obsidian)
    │                                 │
    ├── /ingest <source>              ├── Browse wiki pages
    ├── /query "question"             ├── Graph view (connections)
    ├── /lint                         ├── Follow backlinks
    ├── /promote                      ├── Search
    │                                 │
    └── Claude Code ──writes──> vaults/<name>/wiki/*.md
```

## Key Documents

### All docs (Starlight, in `sites/docs/src/content/docs/`)
All documentation lives in the Starlight site — single source of truth. Key pages:
- `getting-started/` — quick start, installation, web clipper, daily workflow
- `features/` — ingest, query, lint, promote, search, slides
- `architecture/` — how it works, vault structure, obsidian integration
- `reference/` — commands, source types, page templates, dataview, dependencies
- `research/` — vision, decisions, karpathy's pattern, ralph loop, roadmap

### Website (built by GitHub Actions, deployed to Pages)
- `sites/landing/` — Astro landing site (ronancodes.github.io/llm-wiki)
- `sites/docs/` — Starlight docs (ronancodes.github.io/llm-wiki/docs)
- `docs/` is gitignored — built by CI, not committed

## Repo Structure

```
llm-wiki/                            <- PUBLIC repo (the engine)
├── .claude/skills/                   <- shared skills (the engine logic)
│   ├── ingest/                      <- /ingest — source router
│   ├── ingest-{web,pdf,office,      <- source type handlers (auto-loaded)
│   │   youtube,tweet,gist,text}/
│   ├── query/                       <- /query — ask questions against wiki
│   ├── lint/                        <- /lint — health-check wiki
│   ├── promote/                     <- /promote — graduate knowledge between vaults
│   ├── vault-create/                <- /vault-create — scaffold new vault
│   ├── vault-import/                <- /vault-import — import existing vault/repo
│   ├── vault-status/                <- /vault-status — list vault stats
│   ├── wiki-templates/              <- page type definitions (auto-loaded)
│   ├── ralph/                       <- /ralph — autonomous build loop
│   ├── setup/                       <- /setup — first-time bootstrap
│   ├── create-skill/                <- /create-skill — create new skills
│   ├── read-tweet/                  <- /read-tweet — quick tweet reader
│   ├── read-gist/                   <- /read-gist — quick gist reader
│   └── yt-transcript/               <- /yt-transcript — YouTube transcript
├── .private/                         <- GITIGNORED — private overlay (own git repo)
│   └── .claude/skills/              <- private skills loaded via --add-dir
├── sites/
│   ├── landing/                     <- Astro landing site source
│   └── docs/                        <- Starlight docs site source
├── archive/                          <- archived PRDs from completed phases
├── shared/                           <- shared design tokens (CSS)
├── vaults/                           <- GITIGNORED — each vault is its own git repo
├── .private/                         <- GITIGNORED — private skills, private docs
├── .reference/                       <- GITIGNORED — cloned repos for study
├── docs/                             <- GITIGNORED — build output (CI deploys this)
├── .github/workflows/deploy.yml      <- GitHub Actions: build + deploy to Pages
├── ralph.sh                          <- Ralph loop runner script
├── prd.json                          <- current Ralph PRD
├── progress.txt                      <- Ralph progress log
└── CLAUDE.md                         <- this file
```

## Conventions

- **Vaults are data, not applications.** Keep logic centralized in `.claude/skills/`.
- **Each vault is its own git repo**, gitignored from this repo. All vault names prefixed with `llm-wiki-` (e.g. `llm-wiki-research`, `llm-wiki-personal`).
- **Vault-specific conventions** go in each vault's own CLAUDE.md (thin config, not skills).
- **Private skills** go in `.private/.claude/skills/` (gitignored, own git repo). Load with `--add-dir .private`.
- **Every wiki page** must have YAML frontmatter with: title, dates, page-type, domain, tags, sources, related.
- **Every wiki page** must link back to its raw source via frontmatter `sources` field AND inline `## Sources` section.
- **Domain tags** are inherited from the vault default and can be extended per-page.
- **Cross-references** use Obsidian-compatible wikilinks: `[[page-name]]`.
- **Commit messages** use emoji conventional commit format: `✨ feat:`, `🐛 fix:`, `📝 docs:`, etc.
- **Mermaid diagrams** in every doc that describes a flow, process, or architecture. See `.claude/skills/doc-standards/SKILL.md` for conventions and color theme.
- **Observatory color theme** for diagrams: amber (#e0af40) for user/sources, cyan (#5bbcd6) for engine/skills, green (#7dcea0) for outputs/Obsidian.

## Pulling Engine Updates

If you cloned this repo and want to stay up to date:

```bash
git remote add upstream https://github.com/RonanCodes/llm-wiki.git
git pull upstream main
```

Your private stuff (`.private/`, `vaults/`) is gitignored and unaffected by pulls.
