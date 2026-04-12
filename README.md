# LLM Wiki

A personal knowledge base system powered by LLMs. Claude Code builds and maintains your wiki. Obsidian is where you read it. Inspired by [Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f).

```
You (terminal)                    You (Obsidian)
    |                                 |
    |-- /ingest <source>              |-- Browse wiki pages
    |-- /query "question"             |-- Graph view
    |-- /lint                         |-- Backlinks
    |-- /promote                      |-- Search
    |                                 |
    '-- Claude Code --writes--> vaults/<name>/wiki/*.md
```

## The Idea

Most people's experience with LLMs and documents is **stateless**. RAG systems re-derive knowledge from scratch on every query. Nothing compounds.

LLM Wiki is different. When you add a source, the LLM **reads it, extracts key information, and integrates it into a persistent wiki** -- updating entity pages, revising summaries, noting contradictions, maintaining cross-references. The knowledge is compiled once and kept current, not re-derived on every query.

**The wiki is a compounding artifact.** It gets richer with every source you add and every question you ask.

## Getting Started

### Prerequisites

- [Claude Code](https://docs.anthropic.com/en/docs/claude-code) (the CLI)
- [Obsidian](https://obsidian.md) (the wiki viewer)
- Git

### Setup

```bash
git clone https://github.com/RonanCodes/llm-wiki.git
cd llm-wiki
```

Open Claude Code in the repo and run:

```
/setup
```

This checks your environment and installs core dependencies.

### Create Your First Vault

```
/vault-create my-research --domain ai-research
```

This creates a vault at `vaults/my-research/` with the full wiki structure. Open it in Obsidian.

### Or Import an Existing Vault

```
/vault-import ~/path/to/obsidian-vault --name my-vault
```

Brings in an existing Obsidian vault or markdown folder. Adds the llm-wiki structure (index, log, frontmatter) on top.

### Ingest Sources

```
/ingest https://some-article.com --vault my-research
/ingest path/to/paper.pdf --vault my-research
/ingest https://youtube.com/watch?v=abc --vault my-research
/ingest https://x.com/user/status/123 --vault my-research
```

The LLM reads the source, creates wiki pages (summaries, entities, concepts), updates the index, and auto-commits.

### Ask Questions

```
/query "What deployment patterns have we seen?" --vault my-research
/query "Compare framework A vs B" --vault my-research --save
```

Synthesized answers with citations. `--save` files the answer back into the wiki so your explorations compound.

### Health Check

```
/lint --vault my-research
/lint --vault my-research --fix
```

Finds orphan pages, broken links, missing frontmatter, contradictions. `--fix` auto-repairs what it can.

### Graduate Knowledge

```
/promote my-research --to meta
```

When finishing a project, graduate reusable learnings to your meta vault. Tech patterns, strategy insights, vendor evaluations -- anything useful across projects.

## Supported Source Types

| Source | Example | Dependencies |
|--------|---------|-------------|
| Web articles | `https://blog.example.com/post` | None (curl) |
| PDFs | `path/to/paper.pdf` | poppler (auto-installed) |
| Office docs | `path/to/report.docx` | pandoc (auto-installed) |
| YouTube | `https://youtube.com/watch?v=...` | yt-dlp (auto-installed) |
| Tweets | `https://x.com/user/status/...` | None (curl) |
| GitHub Gists | `https://gist.github.com/user/...` | None (curl) |
| Text/notes | Pasted text or local `.md` files | None |

Dependencies are lazy-installed on first use. You never need to install everything upfront.

## Architecture

**One engine, many vaults.**

- **Engine**: Claude Code skills in `.claude/skills/` -- this repo
- **Vaults**: Separate git repos of markdown files -- your knowledge, your data
- **Viewer**: Obsidian -- browse, graph view, backlinks, search

```
llm-wiki/                     <-- this repo (public, the engine)
|-- .claude/skills/            <-- 20 skills (ingest, query, lint, etc.)
|-- .private/                  <-- gitignored (your private skills)
|-- vaults/                    <-- gitignored (your vaults, separate repos)
'-- docs/                      <-- research, architecture, roadmap
```

Each vault:

```
vaults/my-research/            <-- separate git repo, opened in Obsidian
|-- raw/                       <-- immutable source documents
|-- wiki/
|   |-- index.md               <-- catalog of all pages
|   |-- sources/               <-- source summaries
|   |-- entities/              <-- people, orgs, tools
|   |-- concepts/              <-- ideas, patterns, techniques
|   '-- comparisons/           <-- synthesis pages
|-- log.md                     <-- activity log
'-- CLAUDE.md                  <-- vault conventions
```

## Private Skills

For skills you don't want in the public repo (employer-specific, client work):

```
.private/.claude/skills/my-private-skill/SKILL.md
```

The `.private/` directory is gitignored. Initialize it as its own git repo for versioning. Load with `--add-dir .private` when launching Claude Code.

## Staying Updated

```bash
git remote add upstream https://github.com/RonanCodes/llm-wiki.git
git pull upstream main
```

Your vaults and private skills are gitignored -- pulls only update the engine.

## Roadmap

See [docs/roadmap.md](docs/roadmap.md) for the full plan with mermaid diagrams.

- **Phase 0-1**: ✅ Foundation + vault engine (20 skills)
- **Phase 2**: Tooling (qmd search, Marp slides, image handling)
- **Phase 3**: Local web app (Next.js, mobile PWA)
- **Phase 4**: Deployment (Docker, Hetzner VPS, auto-deploy)
- **Phase 5**: SaaS (auth, billing, multi-tenant)

## Credits

- Pattern by [Andrej Karpathy](https://x.com/karpathy/status/2039805659525644595) (55K likes)
- Build technique: [Ralph Wiggum loop](https://ghuntley.com/ralph/) by Geoffrey Huntley
- Skills inspired by [Matt Pocock](https://github.com/mattpocock/skills) and [Snarktank](https://github.com/snarktank/ralph)

## License

MIT
