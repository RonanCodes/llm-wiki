# LLM Wiki

## What This Is

A personal knowledge base system powered by LLMs, inspired by [Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The LLM incrementally builds and maintains a persistent wiki of interlinked markdown files — not RAG, not re-deriving knowledge each query, but a compounding artifact that gets richer over time.

## Project Status

**Phase 1 complete.** Core vault engine built — 20 skills covering vault management, ingestion (7 source types), query, lint, and promote.

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

- `docs/vision.md` — what we're building, why, core concept
- `docs/architecture.md` — technical architecture, vault structure
- `docs/workflow.md` — daily usage guide (what's manual vs automated)
- `docs/dependencies.md` — all tools with install methods
- `docs/decisions.md` — decisions made, open questions
- `docs/karpathy-research.md` — Karpathy's gist, tweets, community findings
- `docs/ralph-loop-research.md` — Ralph Wiggum autonomous coding technique

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
├── vaults/                           <- GITIGNORED — each vault is its own git repo
├── .reference/                       <- GITIGNORED — cloned repos for study
├── docs/                             <- research, architecture, decisions
├── ralph.sh                          <- Ralph loop runner script
├── prd.json                          <- current Ralph PRD
├── progress.txt                      <- Ralph progress log
└── CLAUDE.md                         <- this file
```

## Conventions

- **Vaults are data, not applications.** Keep logic centralized in `.claude/skills/`.
- **Each vault is its own git repo**, gitignored from this repo.
- **Vault-specific conventions** go in each vault's own CLAUDE.md (thin config, not skills).
- **Private skills** go in `.private/.claude/skills/` (gitignored, own git repo). Load with `--add-dir .private`.
- **Every wiki page** must have YAML frontmatter with: title, dates, page-type, domain, tags, sources, related.
- **Every wiki page** must link back to its raw source via frontmatter `sources` field AND inline `## Sources` section.
- **Domain tags** are inherited from the vault default and can be extended per-page.
- **Cross-references** use Obsidian-compatible wikilinks: `[[page-name]]`.
- **Commit messages** use emoji conventional commit format: `✨ feat:`, `🐛 fix:`, `📝 docs:`, etc.

## Pulling Engine Updates

If you cloned this repo and want to stay up to date:

```bash
git remote add upstream https://github.com/RonanCodes/llm-wiki.git
git pull upstream main
```

Your private stuff (`.private/`, `vaults/`) is gitignored and unaffected by pulls.
