---
name: vault-create
description: Create a new LLM Wiki vault with proper directory structure, index, log, and conventions. Use when user wants to create a vault, start a new wiki, or set up a new knowledge base.
argument-hint: <vault-name> [--domain <domain>]
allowed-tools: Bash(mkdir *) Bash(git *) Bash(python3 *) Bash(cp *) Bash(ls *) Bash(open *) Bash(date *) Read Write
---

# Create Vault

Scaffold a new LLM Wiki vault as a separate git repo.

## Usage

```
/vault-create                                    # interactive — interviews you
/vault-create my-research --domain ai-research   # direct — skips interview
```

## Vault Naming Convention

All vaults are prefixed with `llm-wiki-` so they're easy to identify in Obsidian's vault switcher alongside non-LLM Wiki vaults.

- User says "research" → vault name becomes `llm-wiki-research`
- User says "project-alpha" → vault name becomes `llm-wiki-project-alpha`
- User says "personal" → vault name becomes `llm-wiki-personal`

If the user provides a name that already starts with `llm-wiki-`, don't double-prefix.

## Vault Archetypes

Three archetypes emerge in practice. Pick one when scaffolding a new vault. It shapes the `CLAUDE.md` body, the domain-tag pattern, and how other vaults link into this one. If unsure, ask the user which archetype fits.

### 1. Hub vault (pure reusable knowledge)

Examples: `research` (dev stack + tools), `marketing` (platform playbooks + creator research), `personal-work` (LinkedIn / CV / bio / brand artefacts), `skill-lab` (skill design patterns).

- One coherent domain, high purity. Content is reference material, not applied work.
- Grows from ingests + syntheses.
- Referenced BY many other vaults via cross-vault wikilinks. Other vaults add links here; this vault rarely links outward.
- Entity pages are cheap to create and become stable anchors.
- Signs it's a hub: 3+ other vaults will cite it; content would dilute signal if mixed with project-specific work.

**CLAUDE.md flavour:** add a "Keep this pure" section. Applied work (project plans, specific campaigns, specific builds) belongs in spoke/activity vaults and cross-vault-links into this one. This vault catalogues knowledge; it does not host project plans.

### 2. Spoke vault (applied project work)

Examples: `side-projects` (weekly builds, each with a `project-<slug>` domain tag), future graduated-product vaults (e.g. `simplicity-labs` once it earns its own).

- Mixed content: sources, plans, comparisons, retros, decisions, tied to specific projects.
- Heavy cross-vault-linking OUT into hubs via plain markdown links: `[research:remotion](obsidian://open?vault=llm-wiki-research&file=wiki%2Fconcepts%2Fremotion)`, `[marketing:linkedin-playbook](obsidian://open?vault=llm-wiki-marketing&file=wiki%2Fconcepts%2Flinkedin-playbook)`, etc. (NOT the `[[wikilink]]` form.)
- Each project within the vault carries a `project-<slug>` domain tag so the vault can be filtered per project.
- A project may start as one entity inside a bigger spoke vault and later graduate out via `/promote` when it becomes a real product.
- Signs it's a spoke: pages are specific to one project or a family of projects; reusable knowledge surfaces get extracted into hubs rather than kept here.

**CLAUDE.md flavour:** add a "Per-project domain tag" rule (every project page carries `project-<slug>`), a "Graduation rule" (when a project earns its own vault via `/promote`), and a "Cross-vault link to hubs; don't duplicate" directive.

### 3. Activity vault (flow or pipeline-scoped)

Examples: `career-moves` (recruiter chats → interviews → offers, pipeline-style).

- Pipeline-style: content moves through status stages over time.
- Long-lived but process-driven, not project-driven.
- Cross-vault-links to hubs for reference material (bio in `personal-work`, tech stack notes in `research`).
- Signs it's an activity vault: the content is "what happened in conversation X" or "what's the status of Y", not "what is Z".

**CLAUDE.md flavour:** document status/stage fields in the frontmatter spec; index.md grouped by status (e.g. Active / Archived). Add a rule that ephemeral/stage detail stays here, while any reusable learning extracted from an interaction gets promoted to the relevant hub.

### When to split a new vault

- Knowledge cross-cuts 3+ existing vaults → hub candidate.
- Different cadence or mental mode than existing vaults (dev thinking vs marketing thinking vs interviewing thinking) → own vault.
- Expected volume is significant (user says "lots of info on X, Y, Z") → own vault.
- Process that accumulates and archives over time → activity candidate.

### When NOT to split

- Natural extension of an existing vault's purpose.
- Low expected volume (under ~10 pages).
- Only one other vault will ever cite it. Keep as concept/entity pages in that single consuming vault.

### Cross-vault linking pattern

- Spoke / activity vaults link INTO hubs using the plain markdown link form: `[research:remotion](obsidian://open?vault=llm-wiki-research&file=wiki%2Fconcepts%2Fremotion)`, `[marketing:linkedin-playbook](obsidian://open?vault=llm-wiki-marketing&file=wiki%2Fconcepts%2Flinkedin-playbook)`, etc. Visible text = `vault-short:page-slug`, target = `obsidian://open?vault=llm-wiki-<short>&file=<url-encoded-path-without-.md>`.
- Hub vaults add a "Used by" or "Projects using this" section listing spokes that reference them, once they have at least one real reference. This makes the hub navigable in both directions.
- Do NOT use `[[vault-short:page]]` wikilink form for cross-vault — Obsidian renders it as an unresolved red link which is bad UX. The markdown-link form is click-through and still visually flags the boundary via the colon-notation and external-link icon.
- Run the `cross-vault-link-audit` skill periodically (and after any file move) to catch broken targets and migrate any legacy wikilinks.

## Step 0: Interview (if no arguments provided)

If the user runs `/vault-create` with no arguments, interview them to figure out the right vault setup. Use AskUserQuestion for each question.

**Question 1: What's the vault for?**
- Personal knowledge (health, goals, journal, self-improvement)
- Research deep-dive (one topic over weeks/months)
- Project knowledge (tech decisions, architecture, domain context for a specific project)
- Reading a book (characters, themes, plot threads, chapter notes)
- Business/competitive analysis (market research, competitor tracking)
- Learning/courses (structured learning on a topic)
- Other (ask them to describe)

**Question 2: What domain or topic?**
Ask for a short domain tag, e.g. `ai-research`, `personal`, `fintech-project`, `book-dune`, `go-to-market`.

**Question 3: What's the vault name?**
Suggest a kebab-case name based on their answers. Let them override.
- Personal → `personal`
- Research → `<topic>-research` (e.g. `llm-research`)
- Project → `project-<name>` (e.g. `project-acme`)
- Book → `book-<title>` (e.g. `book-dune`)

**Question 4: Do you have existing files to import?**
- Yes → suggest using `/vault-import` instead
- No → proceed with empty vault

After the interview, proceed to Step 1 with the gathered info.

## Steps

1. **Parse arguments** from `$ARGUMENTS`:
   - First argument: vault name (required, kebab-case)
   - `--domain <domain>`: optional domain tag (e.g. `ai-research`, `personal`, `work-project-x`)
   - **Apply prefix**: if the name doesn't start with `llm-wiki-`, prepend it. E.g. `research` → `llm-wiki-research`

2. **Create vault directory structure** at `vaults/<name>/`:

```
vaults/<name>/
├── raw/                    # Immutable source documents
│   └── assets/             # Downloaded images, attachments
├── wiki/                   # LLM-generated markdown (the wiki)
│   ├── index.md            # Catalog of all pages
│   ├── concepts/           # Concept pages (ideas, patterns, techniques)
│   ├── entities/           # Entity pages (people, orgs, tools, frameworks)
│   ├── sources/            # Source summaries (one per ingested source)
│   └── comparisons/        # Comparison and synthesis pages
├── artifacts/              # GITIGNORED — generated outputs (books, pdfs, slides, …)
├── log.md                  # Chronological activity log
├── ROADMAP.md              # In-progress, next-up, blocked, recently completed
├── CLAUDE.md               # Vault conventions (thin config)
├── README.md               # Overview for GitHub (what's inside, stats, purpose)
└── .gitignore              # Ignore Obsidian ephemeral state, .DS_Store, artifacts/
```

3. **Create `wiki/index.md`** with this progressive-tier template (see `wiki-templates` § Progressive Index for the full spec):

```markdown
# <Vault Name> — Wiki Index

<!-- Three-tier structure. Skills load progressively: L0 always, L1 for synthesis, L2 for structural passes. Token budgets are guidelines — /lint warns when exceeded and suggests sharding into index-l1.md / index-l2.md once total exceeds ~10K tokens. -->

## Purpose (L0)

<!-- Target ≤500 tokens. What this vault is for, primary domain, stable anchor entities once they exist. Always loaded by every skill. -->

<One-paragraph statement of vault purpose. Default domain: `<domain>`.>

## Topic Map (L1)

<!-- Target ≤2000 tokens. One line per entity or concept page. Sorted by domain. /ingest appends here as new pages are created. -->

_(empty; populated as pages are added)_

## Full Index (L2)

<!-- Target ≤8000 tokens. Detailed tables grouped by page-type. Loaded only when L0+L1 are insufficient. -->

### Sources
| Page | Summary | Domain | Date Added |
|------|---------|--------|------------|

### Entities
| Page | Summary | Type | Domain | Date Added |
|------|---------|------|--------|------------|

### Concepts
| Page | Summary | Domain | Date Added |
|------|---------|--------|------------|

### Comparisons
| Page | Summary | Domain | Date Added |
|------|---------|--------|------------|
```

4. **Create `log.md`** with this template:

```markdown
# <Vault Name> — Activity Log

Chronological record of all vault activity. Each entry is parseable:
`grep "^## \[" log.md | tail -5` gives the last 5 entries.

## [<today's date>] init | Vault created
- Vault initialized with domain: <domain or "unset">
- Structure: raw/, wiki/ (concepts, entities, sources, comparisons)
---
```

5. **Create `ROADMAP.md`** with this template:

```markdown
# Roadmap — <Vault Name>

_Maintained by hand + auto-updated by `/ingest session`. Read at session start via `/pickup <vault-short>`._

_Last updated: <today's date>_

## In progress
<!-- Things actively being worked on. Move to "Recently completed" when done. Checkboxes so status is legible at a glance. -->

- _(empty; nothing in flight yet)_

## Next up
<!-- Priority-ordered open tasks / decisions / explorations. Top item is what /pickup suggests. -->

1. _(empty; no queued work yet)_

## Blocked / waiting on
<!-- Include the reason and what unblocks. Revisit every session. -->

- _(empty)_

## Recently completed (rolling last 10)
<!-- /ingest session appends here on close. Pruned to 10 most recent. Keep it terse. -->

- <today's date>: vault initialized
---
```

The ROADMAP is deliberately thin — it is a session-bridge document, not a planning doc. Detail lives in entity pages and plan concepts. ROADMAP entries should be one line each with links to where the full context lives.

6. **Create `CLAUDE.md`** with this template:

```markdown
# <Vault Name>

## Vault Info
- **Domain**: <domain or "general">
- **Created**: <today's date>

## Conventions

### Default Domain Tag
All pages in this vault inherit the domain tag: `<domain>`.
Additional domain tags can be added per-page when content spans multiple domains.

### Frontmatter Requirements
Every wiki page MUST have YAML frontmatter with at minimum:
- `title`: Page title
- `date-created`: YYYY-MM-DD
- `date-modified`: YYYY-MM-DD
- `page-type`: one of summary, entity, concept, comparison, source-note
- `domain`: list of domain tags (always includes vault default)
- `tags`: additional categorization tags
- `sources`: list of raw file paths (raw/filename.md) and/or original URLs
- `related`: list of wikilinks to related pages

### Source Linking
Every wiki page MUST link back to its raw source material:
1. In frontmatter `sources` field: path to raw/ file and/or original URL
2. In a `## Sources` section at the bottom of the page with readable links

### Cross-References
Use Obsidian-compatible wikilinks: `[[page-name]]`
When mentioning an entity or concept that has its own page, always link it.

### Page Organization
- Source summaries go in `wiki/sources/`
- Entity pages (people, orgs, tools) go in `wiki/entities/`
- Concept pages (ideas, patterns, techniques) go in `wiki/concepts/`
- Comparisons and synthesis go in `wiki/comparisons/`

### Naming Convention
Filenames: kebab-case, descriptive. Example: `wiki/entities/andrej-karpathy.md`
```

6. **Create `README.md`** with this template:

```markdown
# <Vault Display Name>

<One-line description of what this vault is about.>

## What's Inside

| Folder | Contents |
|--------|----------|
| `wiki/sources/` | Source summaries |
| `wiki/entities/` | People, tools, frameworks |
| `wiki/concepts/` | Ideas, patterns, techniques |
| `wiki/comparisons/` | Side-by-side analyses |
| `raw/` | Immutable source documents |

## Stats

- **Domain**: <domain>
- **Created**: <today's date>
- **Pages**: 0

## How This Works

This vault is powered by [LLM Wiki](https://github.com/RonanCodes/llm-wiki) — Claude Code is the engine, Obsidian is the viewer. Pages are created via `/ingest`, queried via `/query`, and health-checked via `/lint`.

See the [engine repo](https://github.com/RonanCodes/llm-wiki) for setup and usage.
```

7. **Create `.gitignore`**:

```
# macOS
.DS_Store

# Obsidian — keep config, ignore ephemeral state
.obsidian/workspace.json
.obsidian/workspace-mobile.json
.obsidian/.obsidian-git-backup-*
.obsidian/plugins/
.obsidian/themes/
.trash/

# Generated artifacts — derivable from wiki/, regenerate with /generate
artifacts/
```

8. **Initialize git repo** — automatic, no prompt:

Use absolute paths (or `git -C`) because the Bash tool doesn't persist `cd` between calls.

```bash
VAULT_DIR="/absolute/path/to/vaults/<name>"
git -C "$VAULT_DIR" init
git -C "$VAULT_DIR" add .
git -C "$VAULT_DIR" commit -m "✨ feat: initialize <name> vault"
```

**Before committing, report the git identity being used** so the user can see which email the first commit will carry:

```bash
echo "Committing as: $(git -C "$VAULT_DIR" config user.name) <$(git -C "$VAULT_DIR" config user.email)>"
```

If the user flags the identity as wrong, set the vault-local override before re-committing:

```bash
git -C "$VAULT_DIR" config user.email "other@example.com"
```

9. **Register in Obsidian** — automatic, no prompt:

Back up the Obsidian config first (safety net), then register the vault in Obsidian's vault registry so it appears in the vault switcher:

```bash
OBS_CONFIG="$HOME/Library/Application Support/obsidian/obsidian.json"
cp "$OBS_CONFIG" "/tmp/obsidian-json-backup-$(date +%s).json"

python3 -c "
import json, time, hashlib, os
path = os.path.expanduser('~/Library/Application Support/obsidian/obsidian.json')
vault_path = '/absolute/path/to/vaults/<name>'
vault_id = hashlib.md5(vault_path.encode()).hexdigest()[:16]
with open(path) as f: data = json.load(f)
if vault_id not in data.get('vaults', {}):
    data.setdefault('vaults', {})[vault_id] = {'path': vault_path, 'ts': int(time.time() * 1000)}
    with open(path, 'w') as f: json.dump(data, f)
    print(f'Registered: {vault_id} -> {vault_path}')
else:
    print(f'Already registered: {vault_id}')
"
```

Works on macOS. **Tell the user:** they need to fully quit Obsidian (Cmd+Q, not just close the window) and reopen it for the new vault to appear in the switcher. Obsidian only reads its config on startup.

Optionally open the vault (will be a no-op until Obsidian restarts):
```bash
open "obsidian://open?vault=<name>"
```

10. **Report success** with next steps:
   - Vault is open in Obsidian (or tell them to open it)
   - Ingest first source: `/ingest <source> --vault <name>`
