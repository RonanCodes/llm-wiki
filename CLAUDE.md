# LLM Wiki

## What This Is

A personal knowledge base system powered by LLMs, inspired by [Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The LLM incrementally builds and maintains a persistent wiki of interlinked markdown files — not RAG, not re-deriving knowledge each query, but a compounding artifact that gets richer over time.

## Shared Skills

This project works best with shared skills from [`RonanCodes/ronan-skills`](https://github.com/RonanCodes/ronan-skills): ralph, frontend-design, create-skill, doc-standards.

On every new session, first check if `.claude/skip-plugin-check` exists — if so, skip this entirely.

Otherwise, check if the skills `ralph`, `frontend-design`, `create-skill`, `doc-standards` are available (check the skill list). If ANY are missing, use AskUserQuestion to prompt:

**Question:** "This project uses shared skills (ralph, frontend-design, create-skill, doc-standards) that aren't installed yet. How would you like to set them up?"

**Options:**

1. **Install globally via npx** (recommended) — One-time install, available everywhere:
   - `npx skills add RonanCodes/ronan-skills/src/ralph -g`
   - `npx skills add RonanCodes/ronan-skills/src/frontend-design -g`
   - `npx skills add RonanCodes/ronan-skills/src/create-skill -g`
   - `npx skills add RonanCodes/ronan-skills/src/doc-standards -g`

2. **Install into this project only** — Same command without `-g`:
   - `npx skills add RonanCodes/ronan-skills/src/ralph`
   - (repeat for each skill)

3. **Clone + symlink** (stays up to date) — For contributors who want `git pull` updates:
   - `git clone https://github.com/RonanCodes/ronan-skills.git <dev-folder>/ronan-skills`
   - For each skill: `ln -s <dev-folder>/ronan-skills/src/<name> ~/.claude/skills/<name>`

4. **Skip for now** — Continue without shared skills

5. **Don't ask again** — Create `.claude/skip-plugin-check` file to suppress this prompt

## Quick Start (new session)

If this is a fresh Claude Code session, here's what you can do:

1. **First time on this machine?** Run `/setup` — checks tools, verifies skills, and installs dependencies.
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
├── .ralph/                           <- GITIGNORED — Ralph working files (prd.json, progress.txt, archive/)
├── .github/workflows/deploy.yml      <- GitHub Actions: build + deploy to Pages
└── CLAUDE.md                         <- this file
```

## Vault Routing

When the user discusses topics, route content to the correct vault. Vaults fall into three archetypes (see `.claude/skills/vault-create/SKILL.md` § Vault Archetypes for the full taxonomy):

- **Hub** = pure reusable knowledge (one coherent domain, grows from ingests + syntheses, referenced by many other vaults)
- **Spoke** = applied project work (mixed content tied to specific projects; cross-vault-links OUT into hubs)
- **Activity** = pipeline or flow-scoped (content moves through status stages over time)

| Topic | Vault | Archetype | Why |
|-------|-------|-----------|-----|
| Skill ideas, skill design, skill provenance, patterns, workflows, hooks, source profiles | `llm-wiki-skill-lab` | Hub | Catalogues skill lifecycle from idea to implementation |
| Tech stack decisions, tool evaluations, framework comparisons, deployment strategies, general dev research | `llm-wiki-research` | Hub | General-purpose dev research and decision-making |
| Marketing playbooks, platform research (LinkedIn, TikTok, Instagram, YouTube), creator tactics, content-format studies | `llm-wiki-marketing` | Hub | Pure reusable marketing knowledge; specific campaigns live in the spoke vault they serve |
| LinkedIn profile artefacts, CV, bio, cover banners, brand palette, personal positioning | `llm-wiki-personal-work` | Hub | Canonical self-entity; other vaults link in for bio/headline reuse |
| Recruiter chats, company dossiers, interview prep, offers, salary research | `llm-wiki-career-moves` | Activity | Pipeline-style: chats, interviews, offers; status-stamped |
| Trend scans (HN/Reddit/X/LinkedIn), theme lifecycle tracking, idea candidates for 12-in-12 | `llm-wiki-trend-radar` | Activity | Pipeline: spotted → shortlisted → picked/dropped/graduated |
| Weekly builds, MVPs, connections-helper and future app-a-week projects | `llm-wiki-side-projects` | Spoke | Per-project `project-<slug>` domain tag; `/promote` out when a project graduates |
| Simplicity x Taskforce partnership (e-commerce co-pilot) | `llm-wiki-simplicity-taskforce-partnership` | Spoke | Dedicated spoke for the venture; links into research + marketing hubs |
| Startup strategy knowledge (pitching, ICP, moats, PMF, GTM, fundraising) | `llm-wiki-startup-strategy` | Hub | Feeds quizzes, grill sessions, cheat sheets for hackathons and pitches |
| LLM Wiki project knowledge, architecture decisions, development context | `llm-wiki` (engine repo) | Meta | The engine itself; not a vault, stays in this repo |

**Rule of thumb:**

- Pure reusable knowledge (a technique, a platform playbook, a tool evaluation, a brand asset) goes to the relevant Hub.
- Applied work on one project (plans, specific campaigns, retros, decisions) goes to a Spoke; cross-vault-link into the Hub for any reference material.
- Pipeline state over time (this conversation, that interview, this week's status) goes to an Activity vault.
- If unsure, ask. New vaults should follow the archetype taxonomy; see `.claude/skills/vault-create/SKILL.md` for when to split vs when to keep as a concept page in an existing vault.

## Conventions

- **Vaults are data, not applications.** Keep logic centralized in `.claude/skills/`.
- **Each vault is its own git repo**, gitignored from this repo. All vault names prefixed with `llm-wiki-` (e.g. `llm-wiki-research`, `llm-wiki-personal`).
- **Vault-specific conventions** go in each vault's own CLAUDE.md (thin config, not skills).
- **Private skills**: either use `.private/` overlay OR add `.local` to the skill name (e.g. `my-company.local/SKILL.md`) — both are gitignored.
- **Shared skills** (ralph, frontend-design, etc.) come from [`RonanCodes/ronan-skills`](https://github.com/RonanCodes/ronan-skills). Install via `npx skills add` or clone + symlink.
- **Tool dependencies** are listed in `tools.json` — the `/setup` skill reads this.
- **Every wiki page** must have YAML frontmatter with: title, dates, page-type, domain, tags, sources, related.
- **Every wiki page** must link back to its raw source via frontmatter `sources` field AND inline `## Sources` section.
- **Domain tags** are inherited from the vault default and can be extended per-page.
- **Cross-references** use Obsidian-compatible wikilinks: `[[page-name]]`.
- **Cross-vault references** use a plain markdown link where the visible text is the cross-vault ref and the target is an `obsidian://open` URL. Form:
  ```
  [vault-short:page-slug](obsidian://open?vault=llm-wiki-<vault-short>&file=<url-encoded-path-without-.md>)
  ```
  Example: `[personal-work:linkedin-profile-ronan-connolly](obsidian://open?vault=llm-wiki-personal-work&file=wiki%2Fsources%2Flinkedin-profile-ronan-connolly)`. Vault short name drops the `llm-wiki-` prefix. Visible text IS the reference (colon notation flags the vault boundary); target makes it click-through to the other vault. Grep-able via `\[[a-z0-9-]+:[a-z0-9-]+\]\(obsidian://`. Do **not** use `[[wikilink]]` form for cross-vault refs; it renders as unresolved and adds friction for readers. Use the `cross-vault-link-audit` skill to migrate legacy `[[vault-short:page]]` wikilinks and to detect broken paths after file moves.
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
