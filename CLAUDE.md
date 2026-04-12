# LLM Wiki

## What This Is

A personal knowledge base system powered by LLMs, inspired by [Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The LLM incrementally builds and maintains a persistent wiki of interlinked markdown files — not RAG, not re-deriving knowledge each query, but a compounding artifact that gets richer over time.

## Project Status

**Phase: Architecture & Planning** — no code written yet. See `docs/` for full plans.

## Key Documents

- `docs/vision.md` — what we're building, why, and the core concept
- `docs/architecture.md` — technical architecture, vault structure, deployment
- `docs/business.md` — open source + SaaS model, pricing, go-to-market
- `docs/decisions.md` — decisions made, open questions, research findings
- `docs/karpathy-research.md` — source material from Karpathy's gist, tweets, and community comments

## Architecture Summary

**One engine, many vaults.**

- **Engine**: Claude Code skills in `.claude/skills/` + a Next.js web app for mobile/browser access
- **Vaults**: Dumb folders of markdown + raw sources. Each vault is its own git repo. No logic in vaults.
- **Operations**: Ingest, Query, Lint, Promote (cross-vault knowledge transfer)

```
llm-wiki/                        <- this repo (public, open source)
├── .claude/skills/               <- the engine (ingest, query, lint, promote)
├── app/                          <- Next.js web app (API + UI)
├── docker-compose.yml
├── Dockerfile
├── docs/                         <- planning docs
├── vaults/.gitkeep               <- users create their own (gitignored)
└── CLAUDE.md                     <- this file
```

## Conventions

- Vaults are data, not applications. Keep logic centralized in `.claude/skills/` and the Next.js app.
- Each vault is its own git repo, gitignored from this repo.
- Vault-specific conventions go in each vault's own CLAUDE.md (thin config, not skills).
