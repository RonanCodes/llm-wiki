# LLM Wiki

## What This Is

A personal knowledge base system powered by LLMs, inspired by [Karpathy's LLM Wiki pattern](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f). The LLM incrementally builds and maintains a persistent wiki of interlinked markdown files — not RAG, not re-deriving knowledge each query, but a compounding artifact that gets richer over time.

## Vault-Agnostic Engine (read this before committing)

**This repo (`llm-wiki`) is the public engine. Vaults live in `vaults/` and are gitignored — each vault is its own separate git repo.** Anything committed to THIS repo MUST be vault-agnostic.

What this means in practice:

- Never hardcode a vault name (e.g. `llm-wiki-research`, `llm-wiki-personal-life`) in skills, scripts, docs, configs, workflows, or examples in a way that assumes that vault exists. Take vault name as a parameter (`--vault <name>`), resolve from `cwd`, or list `vaults/*/` at runtime.
- Never commit content, frontmatter, page templates, or examples that only make sense for one user's specific vault. Examples in docs should use placeholder names like `my-research`, `my-vault`, or `<vault-name>`.
- Never reference paths under `vaults/<some-specific-vault>/...` from engine code. The engine reads vault structure conventions (index.md, log.md, ROADMAP.md, wiki/, scratchpad/, artifacts/), not vault-specific contents.
- The "Vault Routing" table below in this CLAUDE.md is the **one exception** — it's personal-config-as-code for this user's setup, and it lives in CLAUDE.md precisely because CLAUDE.md is the seam between engine and operator. Don't replicate that routing into skill logic.
- Private/personal config that isn't vault-agnostic goes in `.private/` (its own git repo, overlaid via `--add-dir`), not in the public engine.

Before staging any change here, ask: "would this still make sense for a stranger who cloned this repo and created their own vault from scratch?" If no, it belongs in `.private/` or in the vault's own repo, not here.

## Wiki Content Routing (read this first)

**For ANY question about content in the vaults, use `/query` — not bash grep.**

This includes finding a page, looking up a source, recalling what was ingested, asking what we know about a topic, checking whether a source has been added, or any phrasing that boils down to "is this in the wiki / where is X / what do we have on Y."

Example triggers (all of these MUST route through `/query`):
- "find the article about X"
- "can you find it" (when "it" refers to wiki content)
- "did we ingest Y"
- "what do we know about Z"
- "where is the page on W"
- "show me what we have on V"
- "search the wiki for U"
- "we digested an article about T, can you find it"

If the question spans multiple vaults, use `/query --all-vaults`. If you only want page discovery without synthesis, use `/search` (qmd-backed).

**Why `/query` and not grep:** `/query` reads the progressive index (L0 → L1 → L2 on demand), uses qmd for hybrid BM25 + vector ranking, applies the context-pack guardian to surface related pages, and produces cited answers with cross-vault links. Bash grep does none of that and produces noisy lexical matches that miss the structure entirely.

When `grep` IS appropriate (the only exceptions):
- Scanning source code, scripts, or non-wiki files (`.claude/skills/`, `sites/`, etc.)
- A skill's documented internal step that explicitly calls for grep
- Quick existence check on a single known filename you already know exists

For wiki-content questions the default is **always** `/query`. Never start with a bash `grep` across `vaults/`.

## Capture Mode (free-form chat as journaling)

**On the first message of a session in this repo,** check whether the user is opening with narrative/life content rather than a code/research/skill task. If so, invoke the `capture-mode` skill before anything else.

Triggers (capture-mode applies):
- "today I…", "I just…", "I've been thinking about…"
- "had a chat with <person>", "saw <person>", recap of a day or week
- Subjective / reflective ("I'm worried about", "I'm proud of", "I noticed that I…")
- Life events: people, milestones, relationships, health, home, money, travel, family
- Anything that reads like a journal opener

Do NOT trigger on:
- Code/dev/build/refactor/test/deploy asks
- Research / lookup / explanation asks
- Slash-command invocations or skill ops
- Vault meta-questions

The `capture-mode` skill handles the rest: a single short confirm on the first message ("Capture mode? routing to journal + life Hub + work spokes if relevant"), silent buffering through the session, and a batched multi-vault write at session close. Aggressive entity extraction (every named person → entity page in `personal-life`). Cancelable any time with "stop capturing" or by pivoting to a code/research task.

If unsure whether the opener is capture-worthy, default to NOT triggering and let the user direct.

## Output Style: Understanding-First

**Every wiki page, README, POC explainer, integration doc, ADR, or any generated artefact whose purpose is for a human to *understand* a topic MUST follow `/ro:understanding-first`.**

The principle (from the user): _outsource the thinking, not the understanding_. Generated docs teach the reader; they don't merely record facts. If the reader finishes the page knowing only what it's *about* — not **why** it exists and **how** it works at a glance — the doc failed.

Minimum contract (see `/ro:understanding-first` for the full spec):

1. Plain-English explainer paragraph leading the page.
2. Every acronym expanded on first use; glossary section if 4+.
3. At least one mermaid diagram of the flow/structure.
4. At least one concrete worked example with real values.
5. Citations for every non-obvious claim (inline + `sources:` frontmatter).
6. "Further reading" section with ≥3 online links for any tech topic.
7. Explicit "Open questions" section — never bury uncertainty in prose.

The skill includes a pre-publish checklist. Walk it before saving.

## AI Insight Summaries

**Every meeting note, interview, discovery call, 1:1, session ingest, and long-form podcast/video transcript MUST get a top-of-doc `> [!summary] AI Insight Summary` callout, generated by the `ai-insight-summary` skill.** The point: a reader who only reads the callout walks away with the load-bearing read of the underlying material plus the open questions, not a restatement of the doc.

Where else to fire it:

- Long synthesis source-notes (>800 words) where the body is dense enough to need an orienting paragraph block.
- Decision pages, comparison pages, audit pages — where the doc has a verdict but the body is a data dump.
- Mid-doc, immediately above a long H2 section that needs its own orienting callout (use a shorter `> [!summary] Section read` variant).

Trigger contract:

- `/ingest` MUST auto-invoke `/ai-insight-summary <path-to-new-source-note> --position after-h1 --open` after creating a source-note whose detected source type is meeting-call, interview, discovery-call, 1-on-1, session, podcast, or long video transcript.
- Manual invocation: `/ai-insight-summary <path-to-doc> [--position top|after-h1|before-heading <h>] [--audience <who>] [--open]`.
- Idempotent: re-firing on a doc that already has a summary either replaces a stale one (older than `date-modified`) or skips with a "summary is current" report.

Format (the shape that works, mirrored from the Creatives Takeover meeting-note read):

```markdown
> [!summary] AI Insight Summary
>
> **What it is.** One paragraph factual read.
> **What's actually happening underneath.** Mechanism / signal beneath the surface text.
> **Where the value / moat / leverage is and isn't.** Calibrated, never one-sided.
> **The honest signal.** Red flags, caveats, asserted-not-evidenced claims.
> **For <reader> specifically.** Decision, action, or non-action.
> **Open questions worth answering.** 3-5 things the doc does NOT settle.
```

Five paragraphs is the common case; six for meetings; three for a mid-doc section callout. **"Open questions" is mandatory** when the doc is research-shaped — it's the anti-overclaiming pressure valve.

Style rules (mirror `/ro:write-copy`): no em-dashes or en-dashes; no AI-tell vocabulary (delve, leverage, robust, seamless, tapestry, landscape, "elevate", "empower", "unlock", "streamline" as filler); no "not only X but also Y" reversals. Specific over abstract — use the numbers and names from the doc. Calibrated over confident — mark inferences as inferences. Plain English beats clever phrasing.

After writing, the skill opens the doc in Obsidian via `obsidian://open` so the user sees the result immediately. Pass `--no-open` to skip.

Full spec: `.claude/skills/ai-insight-summary/SKILL.md`.

## Shared Skills

This project works best with shared skills from [`RonanCodes/ronan-skills`](https://github.com/RonanCodes/ronan-skills): ralph, frontend-design, create-skill, doc-standards, **understanding-first**.

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
9. **Resume a vault:** `/pickup my-research` — session-start briefing (reads vault ROADMAP.md, recent log entries, in-flight entities).

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

When the user discusses topics, route content to the correct vault. Vaults fall into four archetypes (see `.claude/skills/vault-create/SKILL.md` § Vault Archetypes for the full taxonomy):

- **Hub** = pure reusable knowledge (one coherent domain, grows from ingests + syntheses, referenced by many other vaults)
- **Spoke** = applied project work (mixed content tied to specific projects; cross-vault-links OUT into hubs)
- **Activity** = pipeline or flow-scoped (content moves through status stages over time)
- **Bulk** = machine-populated mirror of an external knowledge base (SharePoint, Confluence, large folder, git wiki). Not curated. Refresh-driven. Source-of-truth lives upstream. Managed by `/vault-bulk`, never `/vault-create`.

| Topic | Vault | Archetype | Why |
|-------|-------|-----------|-----|
| Skill ideas, skill design, skill provenance, patterns, workflows, hooks, source profiles | `llm-wiki-skill-lab` | Hub | Catalogues skill lifecycle from idea to implementation |
| Tech stack decisions, tool evaluations, framework comparisons, deployment strategies, dev tooling research, Golden Stack canon | `llm-wiki-research` | Hub | Decision-driven dev research; "is this a decision I'll act on this quarter?" |
| AI/LLM paradigm pieces, model commentary, agent theory, prompting deep-dives, AI essays, creator-economy meta on AI | `llm-wiki-ai-research` | Hub | "Is this shaping how I think about AI?" — pure-knowledge AI hub. Workflows go to skill-lab; stack decisions go to research |
| Marketing playbooks, platform research (LinkedIn, TikTok, Instagram, YouTube), creator tactics, content-format studies | `llm-wiki-marketing` | Hub | Pure reusable marketing knowledge; specific campaigns live in the spoke vault they serve |
| LinkedIn profile artefacts, CV, bio, cover banners, brand palette, personal positioning | `llm-wiki-personal-work` | Hub | Canonical self-entity; other vaults link in for bio/headline reuse |
| Official-work engineering at the current employer (Redacted): enterprise platform architecture, per-layer stack decisions, project engineering context, AI-initiative work | `llm-wiki-redacted` | Spoke | Applied work for one employer; cross-vault-links OUT to research/ai-research hubs and INTO personal-work for the employer self-entity. NOT personal-work (that's positioning/CV), NOT research (that's vendor-neutral canon), NOT side-projects (those mirror this stack but live separately). The `redacted-conclusion` employer entity stays in personal-work; the stack mechanics live here |
| Health protocols, habits, principles, goals, people pages, life-admin reference | `llm-wiki-personal-life` | Hub | Stable life knowledge; sister to personal-journal; feeds quarterly/monthly review artefacts |
| Daily/weekly journal entries, monthly reflections, quarterly reviews, dated personal captures | `llm-wiki-personal-journal` | Activity | Pipeline of dated entries; promotes stable insights to personal-life Hub |
| Recruiter chats, company dossiers, interview prep, offers, salary research | `llm-wiki-career-moves` | Activity | Pipeline-style: chats, interviews, offers; status-stamped |
| Startup programme applications (accelerators, incubators, fellowships, pitch competitions — Antler, YC, Techstars, etc.) | `llm-wiki-startup-programme-applications` | Activity | Pipeline: drafting → submitted → interview → outcome. Distinct from career-moves (employer vs funding). Most apps go in as Simplicity Labs; some solo |
| Hackathons, meetups, conferences, demo days, investor coffees, builder events + ALL professional people-entities met at them (investors, CEOs, founders, builders, designers, sponsors, scouts) | `llm-wiki-events-network` | Activity | Pipeline of events (`upcoming → live → recap → dormant`) + the professional contact graph (`introduced → coffee-scheduled → kept-in-touch → cold`). Distinct from career-moves (employer funnel), startup-programme-applications (funding funnel), personal-life (life-context people only). Ideas picked at an event graduate to side-projects |
| Trend scans (HN/Reddit/X/LinkedIn), theme lifecycle tracking, idea candidates for 12-in-12 | `llm-wiki-trend-radar` | Activity | Pipeline: spotted → shortlisted → picked/dropped/graduated |
| Weekly builds, MVPs, connections-helper and future app-a-week projects | `llm-wiki-side-projects` | Spoke | Per-project `project-<slug>` domain tag; `/promote` out when a project graduates |
| Eoin's football results-analysis / betting app — requirements, data-provider eval, scraping sources, the goal-margin probability model | `llm-wiki-football-analytics` | Spoke | Eoin's idea, Ronan builds. Own vault (not side-projects) given brief volume + distinct domain + separate collaborator. Cross-links OUT to research (stack/golden-stack) and ai-research (AI-parse layer). NOT side-projects (that's Ronan's solo app-a-week builds) |
| Simplicity Labs as a whole — company-level state, shared idea pipeline, correspondence archive, shared work without a named partner | `llm-wiki-simplicity-labs` | Spoke | Shared Skip + Ronan venture vault. Named partnerships split out into their own `simplicity-<partner>-partnership` vault |
| Simplicity x Taskforce partnership (e-commerce co-pilot — Dataforce only) | `llm-wiki-simplicity-taskforce-partnership` | Spoke | Dedicated spoke for the Taskforce partnership and Dataforce product; cross-links into `simplicity-labs` for general venture state and into research + marketing hubs |
| Startup strategy knowledge (pitching, ICP, moats, PMF, GTM, fundraising) | `llm-wiki-startup-strategy` | Hub | Feeds quizzes, grill sessions, cheat sheets for hackathons and pitches |
| Tech-book generation craft — voice profiles, template deconstructions (Dummies / O'Reilly / Head First / Observatory), ingested tech books, side-project ideas around the book pipeline | `llm-wiki-book-craft` | Hub | Lives upstream of `/generate book`; specific generated books stay in the topic's own vault |
| Voice / tone-of-voice extraction, the portable voice profile, exemplar writer voice files (Naval, Watts), per-format voice cards, voice drift tracking | `llm-wiki-voice` | Hub | Voice-as-a-domain. Owned by `/ro:voice-profile` (state at `vaults/llm-wiki-voice/scratchpad/voice-profile-state.json`; export `VOICE_PROFILE_STATE`/`VOICE_PROFILE_OUTPUT` to the vault before running). To continue a paused extraction, run `/ro:voice-profile resume`. Other vaults link IN for voice reuse |
| Bulk mirror of an external knowledge base (SharePoint site, Confluence space, inherited doc folder, git wiki repo) | `llm-wiki-bulk-<source-slug>` | Bulk | One vault per upstream source. Created and refreshed via `/vault-bulk`; never hand-curated. Source-shaped slug (e.g. `llm-wiki-bulk-acme-prod`, `llm-wiki-bulk-acme-engineering`) |
| LLM Wiki project knowledge, architecture decisions, development context | `llm-wiki` (engine repo) | Meta | The engine itself; not a vault, stays in this repo |

**Rule of thumb:**

- Pure reusable knowledge (a technique, a platform playbook, a tool evaluation, a brand asset) goes to the relevant Hub.
- Applied work on one project (plans, specific campaigns, retros, decisions) goes to a Spoke; cross-vault-link into the Hub for any reference material.
- Pipeline state over time (this conversation, that interview, this week's status) goes to an Activity vault.
- A high-volume external KB the user does not curate (SharePoint, Confluence, inherited folder, git wiki) goes in its own Bulk vault. Set up via `/vault-bulk create <slug> --source-type <type>`. Refreshed via `/vault-bulk refresh`. Bulk vaults relax lint rules (orphans are expected) and forbid `/promote` between bulk vaults; promote to a Hub if a single insight is worth graduating.
- If unsure, ask. New vaults should follow the archetype taxonomy; see `.claude/skills/vault-create/SKILL.md` for when to split vs when to keep as a concept page in an existing vault.

## Default flow for feature work (agent-native repos)

In any repo with a `gh` remote, default to the **agent-native Pocock pattern** for non-trivial feature work:

- PRDs and slices live as **GitHub issues**, not `.ralph/` local files. `/ro:write-a-prd` publishes the PRD as a single GH issue using Matt's 7-section template; `/ro:slice-into-issues` publishes each vertical slice as a child GH issue with `## Parent\n\n#<N>` and `## Blocked by` references.
- One label gates the queue: **`ready-for-agent`** (or a project synonym like `Sandcastle`, configured in `docs/agents/triage-labels.md`).
- `/ro:ralph` and `/ro:planner-worker` default to `--source github:ready-for-agent` when a gh remote is present and `.ralph/` is empty. PRs use `Closes #<slice-number>` so slices auto-close on merge; the parent PRD stays open until all children close.
- Domain language lives in **`CONTEXT.md`** at repo root (or `CONTEXT-MAP.md` + per-context files for multi-bounded-context repos). Hard-to-reverse decisions go in `docs/adr/000N-*.md`. Both are written **lazily during `grill-with-docs`** (Matt's symlinked skill, routed via `/grill`).
- Repo-level CLAUDE.md stays **thin**, pointing at `docs/agents/{backlog,triage-labels,domain}.md` for agent-onboarding detail.

To kick off the full pipeline end-to-end, invoke **`/agentic-e2e-flow`** (also responds to "matt pocock flow", "autonomous agent flow", "agentic e2e flow", "the high-level flow", "the big flow", "the whole flow"). The orchestrator is a thin sequencer over swarm → grill → write-a-prd → slice-into-issues → ralph-or-planner-worker → gh-ship, with confirmation gates between phases.

Before clearing context or ending a session, invoke **`/close-session`** (also responds to "wrap up the session", "end of session", "I'm done for the day", "clear my context"). It runs an 8-check durability sweep — uncommitted changes, unpushed commits, open PRs, in-flight branch tracked as issue, chat-only decisions, new domain terms for CONTEXT.md, vault ROADMAP/log staleness, memory entries worth saving — and either resolves each inline or queues it as a GH issue / ADR / wiki page / memory note. Designed so closing a session and clearing context feels safe.

See [skill-lab:agent-native-repo-pocock](obsidian://open?vault=llm-wiki-skill-lab&file=wiki%2Fpatterns%2Fagent-native-repo-pocock) for the full pattern, gap table, and rationale. Repos without a gh remote fall back to the legacy `.ralph/` local-file flow automatically; nothing breaks.

## Conventions

- **Vaults are data, not applications.** Keep logic centralized in `.claude/skills/`.
- **Each vault is its own git repo**, gitignored from this repo. All vault names prefixed with `llm-wiki-` (e.g. `llm-wiki-research`, `llm-wiki-personal`).
- **Engine code in this repo MUST be vault-agnostic.** See "Vault-Agnostic Engine" at the top of this file. Skills, scripts, docs, and examples take vault as a parameter — they never hardcode a specific vault name or reference vault-specific content.
- **Vault-specific conventions** go in each vault's own CLAUDE.md (thin config, not skills).
- **Private skills**: either use `.private/` overlay OR add `.local` to the skill name (e.g. `my-company.local/SKILL.md`) — both are gitignored.
- **Shared skills** (ralph, frontend-design, etc.) come from [`RonanCodes/ronan-skills`](https://github.com/RonanCodes/ronan-skills). Install via `npx skills add` or clone + symlink.
- **Tool dependencies** are listed in `tools.json` — the `/setup` skill reads this.
- **Every vault has a `ROADMAP.md`** at the vault root alongside `log.md` and `index.md`. Four sections: `In progress`, `Next up`, `Blocked / waiting on`, `Recently completed (rolling last 10)`. Thin, link-heavy, one line per item — detail lives in entity pages. This is the session-bridge artifact: `/pickup <vault>` reads it at session start; `/ingest session` maintains it at session end. New vaults get this seeded automatically by `/vault-create`.
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
