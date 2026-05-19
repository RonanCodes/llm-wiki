## Codebase Patterns (llm-wiki)

## Canon DB flip: D1 to Neon (2026-05-19)

The canon default DB for SaaS-shape multi-tenant apps is now **Neon Postgres**, not D1 (Cloudflare SQLite). Locked via factory's Phase 3 PRD and a night-shift that pivoted mid-build after hitting D1 multi-writer and pgvector gaps. Five concept files in `vaults/llm-wiki-research/wiki/concepts/` were updated in issue #4 (2026-05-20):

- `ideal-tech-setup.md`: DB section, mermaid diagram, stack table, cost target
- `stack-decision-map.md`: DB slot row, flowchart reading guide
- `ai-agent-stack.md`: Layer 3 (shared memory), Layer 4 (RAG pgvector), cost profile
- `agent-native-stack-design.md`: scoring table, sources
- `db-pick-decision-rule.md`: new page, full decision matrix + factory case study

Rule: Neon for multi-tenant SaaS. D1 for embedded / edge-cache / CLI / local-first. Connection via `@neondatabase/serverless` HTTP driver (no Hyperdrive needed). See `vaults/llm-wiki-research/wiki/concepts/db-pick-decision-rule.md`.



This is the durable knowledge surface for the local factory running on this repo. Read at every iteration start; the orchestrator harvests new learnings into this file at session close. Worker-scratch files under `.ralph/sessions/` are ephemeral.

llm-wiki is a vault repo: each `vaults/llm-wiki-<short>/` is its own git submodule with its own commit history, ROADMAP, log, and `wiki/` content. The local factory rules apply to the umbrella llm-wiki repo; per-vault skills (ingest-session, ingest-text, rough-notes) live inside the vault submodules.

### Local factory hooks

- This repo participates in the **local factory** (`/ro:ralph`, `/ro:planner-worker`, `/ro:matt-pocock-coding-workflow`, `/ro:night-shift`, `/ro:day-shift`). See `~/Dev/ronan-skills/skills/ralph/SKILL.md` § "Run artefacts (the canonical shape)".
- Artefact shape:
  - `.ralph/patterns.md` (this file) — committed, durable, harvested at session close.
  - `.ralph/<phase>.session.md` — committed, per-session aggregate.
  - `.ralph/sessions/<session-id>/<worker-id>.md` — gitignored worker scratch.
  - `.ralph/<phase>.json` (PRD) — committed.
- The **bridge.json** in this repo root is the contract for the `/ro:wiki` cross-repo skill (separate concern; do not modify in this PR).
- The companion **remote factory** is the Factory app (tracked separately) that will run equivalent loops as a cloud service.

Cross-PRD learnings harvested from previous Ralph runs follow.

## Repo Structure
- Engine repo at `/Users/ronan/Dev/ai-projects/llm-wiki/`. Vaults live as siblings under `vaults/llm-wiki-*/`, each its own git repo (gitignored from the engine repo).
- Skills live in `.claude/skills/<name>/SKILL.md` (engine-shared) or `~/Dev/ronan-skills/skills/<name>/` (`/ro:*` user-global).
- NEVER edit `~/.claude/plugins/cache/` — it's a build artifact. Edit the source repo and let the plugin sync.

## Skill Authoring
- Skills use SKILL.md format with YAML frontmatter (`name`, `description`, `argument-hint`, `allowed-tools`).
- NEVER set `disable-model-invocation: true` — the user invokes via natural language and slash commands.
- `allowed-tools` should be specific (`Bash(git *)` not bare `Bash`).
- Description should be aggressive about routing — "PREFER over X", concrete trigger phrases — so model picks the skill over fallback grep/curl/etc.

## Wiki Conventions
- Frontmatter required on every wiki page: title, date-created, date-modified, page-type, domain, tags, sources, related.
- Cross-vault links use plain markdown link form: `[short:slug](obsidian://open?vault=llm-wiki-<short>&file=<encoded>)`. NEVER `[[wikilink]]` form across vaults — renders as broken in Obsidian.
- Within a vault, use `[[page-name]]` wikilinks freely.
- `index.md` uses three-tier structure: Purpose (L0, ≤500 tok), Topic Map (L1, ≤2000), Full Index (L2, ≤8000).

## Generation Pipeline
- All `/generate <X>` handlers call `verify-quick.sh` as their final step (close-the-loop).
- Bundles for word-count check land at `<artifact>.bundle.md` (sibling of artifact).
- Mermaid render via `.claude/skills/generate/lib/render-mermaid.sh` requires Chrome 131 for puppeteer 23.x — pre-install via `npx puppeteer@23.11.1 browsers install chrome-headless-shell@131.0.6778.204`.
- Cover generation via `Skill(ro:generate-image)` reading `themes/<theme>/cover-prompt.md`. GEMINI_API_KEY in `~/.claude/.env`.
- Playwright (chromium) handles HTML→PDF; LaTeX is fallback only.

## Commit + Push Cadence
- Conventional + emoji format: `✨ feat`, `🐛 fix`, `📝 docs`, `🧪 test`, `🧹 chore`, `♻️ refactor`, `🚀 deploy`, `🔧 config`, `⚡ perf`, `🔒 security`.
- NO `Co-Authored-By` line.
- On Mon-Fri, commit timestamps must be outside 08:30-18:00. Set `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE`. Sat-Sun: no restriction.
- On Ralph autonomous loops: `git push` after every story commit (not only at phase end). Vault repos may have no remote — push is best-effort, log if fails.

## Style (User-Facing Copy)
- NO em-dashes (—) or en-dashes (–) ever. Use commas, colons, full stops.
- NO AI-tells: delve, leverage, robust, seamless, tapestry, "in today's fast-paced world", "elevate", "unlock", "streamline" as filler, "not only X but also Y".
- Plain phrasing wins.

## Artifact Sidecar Shape
Every generated artifact gets `<name>.meta.yaml` next to it with: generator (skill@version), generated-at, template, theme (for books), topic, generated-from (paths), source-hash (sha256), version, change-note, replaces. After verify-quick patches in a `quality:` block.

## Cwd Persistence
- Bash tool does NOT persist cwd across calls. Always use absolute paths or `git -C <path>`.
- `cd vaults/X && command` only affects the single tool call.
