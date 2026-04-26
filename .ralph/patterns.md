# Ralph Codebase Patterns

Cross-PRD learnings shared across every Ralph run in this repo. Read on every iteration; add only when a pattern is general enough to benefit any future story.

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
