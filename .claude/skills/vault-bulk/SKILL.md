---
name: vault-bulk
description: Bulk-import a large external knowledge base (SharePoint, Confluence, local folder, git repo) into a refresh-aware vault. Use when the user wants to mirror an outside KB into the wiki without curating it page-by-page, or refresh a previous bulk import. Subcommands - create, add-source, import, refresh, status. Vault name convention - `llm-wiki-bulk-<source-slug>`.
argument-hint: <subcommand> [<vault>] [options]
allowed-tools: Bash(mkdir *) Bash(git *) Bash(python3 *) Bash(rsync *) Bash(find *) Bash(date *) Bash(shasum *) Bash(stat *) Bash(cp *) Bash(mv *) Bash(ls *) Bash(open *) Bash(jq *) Bash(yq *) Read Write Edit Skill Agent
---

# Vault Bulk

Mirror a large external knowledge base into an LLM Wiki vault as a faithful, refresh-aware copy. Bulk vaults exist for high-volume sources the user does not want to curate: a SharePoint site, a Confluence space, a folder of inherited docs, a git wiki repo. The source-of-truth lives elsewhere; this vault is a queryable mirror.

## When this skill applies

Use bulk when:

- Volume is large (hundreds+ pages) and growing on a cadence the user does not control.
- The source has its own identity (one SharePoint site, one Confluence space, one git repo).
- The user will not hand-curate; they want raw fidelity plus search.
- The content needs to be re-pullable later when the upstream changes.

Do NOT use bulk for:

- One-off article ingests. Use `/ingest`.
- Mixed/curated knowledge. Use a Hub or Spoke.
- Pipeline content (interviews, journal entries). Use an Activity vault.

## Subcommand surface

```
/vault-bulk create <vault-slug> --source-type <local|git|sharepoint|confluence> [--source <location>]
/vault-bulk add-source <vault> --type <...> --location <...> [--id <source-id>]
/vault-bulk import <vault> [--source <source-id>] [--dry-run]
/vault-bulk refresh <vault> [--source <source-id>] [--dry-run]
/vault-bulk status <vault>
```

Parse `$ARGUMENTS`. First positional token is the subcommand. Route to the corresponding section below. If no subcommand is provided, interview the user via AskUserQuestion to figure out which action they want.

## Naming convention

Bulk vault directory name MUST be `llm-wiki-bulk-<source-slug>` where `<source-slug>` identifies the source, not the topic. Source-shaped because the vault's identity IS its source.

- A SharePoint site at `acme.sharepoint.com/sites/Engineering` -> `llm-wiki-bulk-acme-engineering`
- A Confluence space `PROD` on `acme.atlassian.net` -> `llm-wiki-bulk-acme-prod`
- A local folder of inherited HR docs -> `llm-wiki-bulk-hr-archive`
- A git wiki repo at `github.com/org/handbook` -> `llm-wiki-bulk-org-handbook`

If the user supplies a name without the `llm-wiki-bulk-` prefix, prepend it. If they supply a topic-shaped name, suggest a source-shaped slug and ask before overriding.

## Vault layout

A bulk vault is a Spoke-shaped tree with two additions: a `bulk-source.yaml` manifest at the vault root, and a `raw/` mirror that preserves the source tree verbatim.

```
vaults/llm-wiki-bulk-<source-slug>/
├── bulk-source.yaml                # registry of sources + last-pull state
├── raw/                            # immutable mirror of source content
│   └── <source-id>/                # one directory per registered source
│       ├── <path/as/in/source>/    # tree mirrors source layout
│       └── _attachments/           # binary attachments preserved
├── wiki/
│   ├── index.md                    # progressive index, generated from raw/
│   ├── sources/                    # one source-note per imported page
│   ├── entities/                   # populated lazily if user curates
│   └── concepts/                   # populated lazily if user curates
├── log.md
├── ROADMAP.md                      # auto-generated thin roadmap (rare for bulk)
├── CLAUDE.md
├── README.md
└── .gitignore
```

The `raw/` tree is the load-bearing artefact. The `wiki/sources/` notes are auto-derived from raw/ and may be regenerated. Anything the user adds by hand (annotations, cross-links, concept pages) lives below a `## Notes` divider on each source-note and is preserved across refresh.

## Manifest schema (`bulk-source.yaml`)

```yaml
vault: llm-wiki-bulk-<source-slug>
created: 2026-05-11
sources:
  - id: confluence-prod
    type: confluence
    location: https://acme.atlassian.net/wiki/spaces/PROD
    connector-skill: <employer>:confluence    # or null if local-folder/git
    auth-ref: env:CONFLUENCE_TOKEN            # how to find credentials, never the token itself
    first-pulled-at: 2026-05-11T09:14:22Z
    last-pulled-at: 2026-05-11T09:14:22Z
    last-refresh-summary:
      pulled: 412
      unchanged: 0
      changed: 0
      new: 412
      removed: 0
    include:
      - "**/*"
    exclude:
      - "**/Archive/**"
      - "**/Personal/**"
```

`auth-ref` records where credentials are read from (env var name, OS keychain entry, etc.) but never the secret itself. The actual auth is the connector skill's job.

## Page frontmatter

Every page in `wiki/sources/` carries these fields in addition to the universal frontmatter (see `wiki-templates`):

```yaml
---
title: "<page title from source>"
date-created: 2026-05-11             # when first imported
date-modified: 2026-05-11            # when last refreshed
page-type: source-note
domain:
  - bulk-<source-slug>
tags:
  - bulk-import
sources:
  - raw/<source-id>/<path>.md         # local mirror path (always present)
  - https://<original-url>            # upstream URL (always present when source has URLs)
bulk-source-id: confluence-prod
imported-at: 2026-05-11T09:14:22Z
source-modified-at: 2026-04-30T14:22:00Z   # mtime/version from source, if available
last-refreshed-at: 2026-05-11T09:14:22Z
source-hash: sha256:abcd1234...            # of the raw bytes, for refresh diffing
source-url: https://<original-url>         # canonical upstream URL, repeated for grep
source-local-path: raw/<source-id>/<path>.md
related: []
---
```

Three timestamps because they answer different questions:

- `imported-at` - when did this page first land in the vault (never changes)
- `source-modified-at` - when did the upstream last change (used to detect drift)
- `last-refreshed-at` - when did we last re-pull (used to detect stale mirrors)

`source-hash` is computed from the raw file's bytes. Refresh diffing keys off this hash, not off file mtime.

## Refresh policy

Bulk refresh is **overwrite-raw, preserve-notes**:

1. Re-pull each source from its connector.
2. For every page where `new-hash != stored source-hash`:
   - Overwrite `raw/<source-id>/<path>` with the new bytes.
   - Re-generate `wiki/sources/<page>.md` body above the `## Notes` divider.
   - Update frontmatter: `date-modified`, `source-modified-at`, `last-refreshed-at`, `source-hash`.
   - Preserve everything below `## Notes` verbatim.
   - Preserve any user-added frontmatter keys not in the bulk schema (e.g. `user-tags`, `priority`).
3. For pages present in mirror but absent at source: move to `wiki/sources/.removed-<refresh-date>/` (do NOT delete - the user may want to recover).
4. For new pages at source: create fresh `wiki/sources/<page>.md`.
5. Write a refresh summary into `log.md` and update `last-pulled-at` + `last-refresh-summary` in the manifest.

The `## Notes` divider contract is **load-bearing**. Every source-note ends with:

```markdown
... (auto-generated body) ...

## Notes

<!-- Anything below this divider is user-added and preserved across refresh. -->

_(empty)_
```

Refreshing a page only touches content above the `## Notes` line. If the divider is missing in a page (e.g. user accidentally deleted it), refresh refuses to write that page and logs a warning - user must restore the divider manually.

## Subcommand: create

`/vault-bulk create <vault-slug> --source-type <type> [--source <location>]`

1. Normalize the slug. If it does not start with `llm-wiki-bulk-`, prepend. Validate that the suffix is source-shaped (matches `[a-z0-9-]+`). Ask if it looks topic-shaped.
2. **Self-scaffold the vault directly.** Bulk vaults have a different layout from Hub/Spoke/Activity (extra manifest, `raw/<source-id>/` mirror tree, relaxed lint rules), so do NOT delegate to `/vault-create`. Build the tree below from scratch:

   ```
   vaults/<name>/
   ├── bulk-source.yaml             # manifest (created here, populated in step 3)
   ├── raw/                         # mirror root (per-source dirs added on import)
   ├── wiki/
   │   ├── index.md                 # use the same progressive-index template as vault-create
   │   ├── sources/                 # bulk source-notes land here
   │   ├── entities/                # user-curated, optional
   │   └── concepts/                # user-curated, optional
   ├── log.md                       # use the same template as vault-create
   ├── ROADMAP.md                   # thin, optional - bulk vaults are usually idle between refreshes
   ├── CLAUDE.md                    # bulk-specific template (below) - NOT the vault-create one
   ├── README.md                    # bulk-specific
   └── .gitignore                   # same as vault-create
   ```

   The progressive-index template, log template, and `.gitignore` content are documented in `vault-create/SKILL.md` step 3, 4, and 7 respectively - copy them verbatim (don't `Skill` invoke vault-create; just read those templates and write the files inline). The CLAUDE.md and README templates are bulk-specific (next bullet).

3. Add `bulk-source.yaml` at the vault root. If `--source` was provided, pre-register it with `first-pulled-at: null`. Otherwise leave `sources: []`.

4. Initialize the git repo and register in Obsidian using the same Bash blocks as `vault-create` steps 8-9.

5. If `--source` was provided, automatically continue into `/vault-bulk import <vault>` after confirming with the user. Otherwise tell them to run `/vault-bulk add-source` then `/vault-bulk import`.

The bulk CLAUDE.md template is shorter than a Hub/Spoke template, because the vault is not curated:

```markdown
# <Vault Name>

## Vault Info
- **Archetype**: Bulk (machine-populated mirror)
- **Source**: <type> at <location>
- **Domain**: bulk-<source-slug>
- **Created**: <date>

## What This Vault Is

A bulk mirror of <source>. The source-of-truth lives upstream; this vault is a queryable, time-stamped copy.

## Conventions

- Do not edit `raw/` or the auto-generated body of any `wiki/sources/` page. Refresh will overwrite those.
- User-added content goes below the `## Notes` divider on a source-note, or in `wiki/concepts/` and `wiki/entities/` (those are never touched by refresh).
- Run `/vault-bulk refresh <vault>` to re-pull from upstream.
- Run `/vault-bulk status <vault>` to see last-pull state and drift.

## Lint Rules

This vault relaxes the standard lint rules:
- Orphan source-notes are EXPECTED, not a defect. Bulk-imported pages are not curated and may have zero inbound links.
- Empty `## Notes` sections are NORMAL.
- Cross-vault link audits should skip `wiki/sources/` (which contains upstream URLs that resolve outside the wiki).

`/lint` checks `archetype: bulk` in CLAUDE.md and downgrades the matching rule classes to info-only.

## Promotion

`/promote` between bulk vaults is forbidden. To promote a single insight from a bulk vault into a Hub, run `/promote <vault> --page <page> --to <hub-vault>` which converts the page to a concept-note (drops bulk frontmatter, adds a `derived-from:` ref) before moving it.
```

## Subcommand: add-source

`/vault-bulk add-source <vault> --type <local|git|sharepoint|confluence> --location <...> [--id <source-id>]`

1. Read `bulk-source.yaml`. If `<source-id>` already exists, refuse (the user should refresh, not re-add).
2. Generate a source-id if not provided. Format: `<type>-<short-slug>` (e.g. `confluence-prod`, `git-handbook`).
3. For SharePoint and Confluence, check whether a connector skill is available (see "Connector resolution" below). If not, abort with a clear "install or create a connector skill before continuing" message.
4. Append a new entry to `sources:` with `first-pulled-at: null`, `last-pulled-at: null`, empty `last-refresh-summary`.
5. Tell the user to run `/vault-bulk import <vault> --source <source-id>` to pull.

## Subcommand: import

`/vault-bulk import <vault> [--source <source-id>] [--dry-run]`

Initial pull for one or all sources where `last-pulled-at` is null.

1. Read manifest.
2. For each source matching the filter:
   - Resolve the connector (see "Connector resolution").
   - Invoke the connector with the source location and `raw/<source-id>/` as target.
   - For every file the connector writes to `raw/`, generate a corresponding `wiki/sources/<safe-slug>.md` with the bulk frontmatter and a body that quotes or summarises the raw file. For markdown raw files, body is a verbatim copy. For PDFs/Office docs, delegate to `ingest-pdf` / `ingest-office` to extract text, then write the resulting markdown into the source-note body.
   - Each generated page ends with the `## Notes` divider and an empty placeholder.
   - Update `imported-at`, `source-modified-at` (if connector returned it), `source-hash`.
3. Update manifest: `first-pulled-at`, `last-pulled-at`, `last-refresh-summary`.
4. Regenerate `wiki/index.md` (L2 Sources table only - bulk vaults skip L1 unless user opts in).
5. Append a `log.md` entry with counts.
6. If `--dry-run`, do steps 1-2 against a tmp dir and report the plan without writing.

## Subcommand: refresh

`/vault-bulk refresh <vault> [--source <source-id>] [--dry-run]`

Same shape as `import`, but every page has an existing hash to diff against. Follow the "Refresh policy" section above.

The `--dry-run` flag is **strongly encouraged** for first refreshes - it reports the page-by-page diff (new / changed / removed / unchanged counts) so the user can sanity-check before committing.

After a real refresh:

- Stage and commit the vault automatically with message `🔄 refresh: <source-id> - +N new, ~M changed, -K removed`.
- Push if the vault has a remote configured (the user's preference is commit AND push on autonomous loops).

## Subcommand: status

`/vault-bulk status <vault>`

Print a one-screen report:

```
Vault: llm-wiki-bulk-acme-engineering
Created: 2026-05-11

Sources:
  confluence-prod     last-pulled 2026-05-09 (2 days ago)   412 pages   ✓ healthy
  sharepoint-eng      last-pulled 2026-04-22 (19 days ago)  118 pages   ⚠ stale

Last refresh: 2026-05-09 - +14 new, ~3 changed, -1 removed

Run /vault-bulk refresh <vault> [--source <id>] to re-pull.
```

"Stale" threshold is 14 days by default. Add a `stale-after-days:` field to each source in the manifest to override per-source.

## Connector resolution

Connectors are external to this skill. The dispatcher looks up the right one in this order:

1. **Local folder** (`type: local`) - handled inline by this skill via `connectors/local-folder.md`. Uses `rsync` to mirror, delegates extraction to `ingest-pdf`/`ingest-office`/`ingest-text`.
2. **Git repo** (`type: git`) - handled inline via `connectors/git-repo.md`. Clones or fetches, then treats the working tree as a local folder.
3. **SharePoint** (`type: sharepoint`) - delegates. See `connectors/sharepoint.md`.
4. **Confluence** (`type: confluence`) - delegates. See `connectors/confluence.md`.

For SharePoint/Confluence the skill checks for an available connector skill by scanning the loaded skill list for any of:

- `<employer>:sharepoint`, `<employer>:confluence` (work plugin)
- `ro:sharepoint`, `ro:confluence` (personal plugin if it ever exists)
- `<plugin>:sharepoint`, `<plugin>:confluence` (other plugins)
- A user-created skill named `bulk-connector-<type>` (vault-local override)

If none is found, the dispatcher MUST abort with:

> No connector skill found for <type>. To bulk-import from <type> you need a skill that can authenticate, list pages, fetch content, and detect changes. Options:
>
> 1. If your work plugin has one (e.g. `<employer>:confluence`), make sure it's enabled in this session.
> 2. Create one with `/ro:create-skill bulk-connector-<type>` - it must expose `list-pages`, `fetch-page <id>`, and ideally `since <iso-timestamp>` for incremental refresh.
> 3. Until then, you can export the source to a local folder and use `--type local`.

Do not half-implement SharePoint/Confluence auth in this skill. Connector skills own the auth surface.

## Cross-skill contract for connectors

Any connector skill MUST expose three operations the dispatcher can invoke via the `Skill` tool:

- `list-pages --source <location> [--since <iso-timestamp>]` returns a JSON array of `{id, path, url, modified-at, hash}` records.
- `fetch-page --source <location> --page-id <id> --target <raw-path>` writes the raw page to disk and returns `{hash, modified-at}`.
- `fetch-attachments --source <location> --page-id <id> --target <raw-path>` writes binary attachments under `_attachments/`.

This contract is documented in `connectors/sharepoint.md` and `connectors/confluence.md` so a user creating their own connector knows the interface to implement.

## Lint integration

`/lint` reads the vault's CLAUDE.md, sees `Archetype: Bulk`, and:

- Skips orphan-page warnings (orphans are expected in bulk vaults).
- Skips empty-related-field warnings.
- Adds a NEW check: every page in `wiki/sources/` must have the `## Notes` divider and the bulk frontmatter fields. Pages missing them are flagged as "refresh-unsafe".
- Adds a NEW check: pages whose `source-modified-at` is older than 90 days OR whose source no longer exists upstream are flagged as "review-for-removal".

## Generate integration

`/generate <type>` works against bulk vaults but with one caveat: when the user runs `/generate book` or similar across a bulk vault, prefer narrowing to a subset (e.g. `--filter source-modified-after:2026-01-01` or `--filter path:docs/architecture/`) because a 400-page bulk vault produces a useless 800-page book otherwise. The dispatcher in `/generate` checks for `Archetype: Bulk` and prompts for a filter if none is supplied.

## Open questions deferred to first real use

- Attachment sizes: do we mirror binaries verbatim, or sidecar with a "fetch on demand" placeholder? Default for now: mirror everything, add `--no-attachments` flag if vault size becomes a problem.
- Conflict handling when both upstream and user-notes have changed at the same divider line: refuse, log a conflict, leave the page untouched. User decides.
- Incremental refresh: connectors that support `since <timestamp>` get incremental. Connectors that do not get a full re-pull and full hash compare. The dispatcher does not care which path the connector took.
