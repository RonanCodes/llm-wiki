---
title: "Vault Bulk"
description: "Mirror a large external knowledge base (SharePoint, Confluence, folder, git repo) into a refresh-aware vault."
---

The `/vault-bulk` skill creates and maintains a **Bulk vault**: a queryable, timestamped mirror of a high-volume external knowledge base that you do not want to curate page by page. Bulk is the fourth archetype, alongside Hub, Spoke, and Activity.

Use it when:

- The source has hundreds or thousands of pages.
- The source has its own identity (one SharePoint site, one Confluence space, one git repo, one inherited folder).
- The source-of-truth lives upstream and you need to refresh on a cadence.
- You want raw fidelity plus search, not hand-curated synthesis.

For one-off ingests of a single article, use `/ingest`. For mixed curated knowledge, use a Hub or Spoke.

## Usage

```
/vault-bulk create <vault-slug> --source-type <local|git|sharepoint|confluence> [--source <location>]
/vault-bulk add-source <vault> --type <type> --location <location> [--id <source-id>]
/vault-bulk import <vault> [--source <source-id>] [--dry-run]
/vault-bulk refresh <vault> [--source <source-id>] [--dry-run]
/vault-bulk status <vault>
```

| Subcommand | Purpose |
|------------|---------|
| `create` | Scaffold a new bulk vault and (optionally) register a first source |
| `add-source` | Register an additional source on an existing bulk vault |
| `import` | First-time pull for sources whose `last-pulled-at` is null |
| `refresh` | Re-pull, diff against stored hashes, overwrite changed pages while preserving user notes |
| `status` | Print last-pulled state and drift per source |

## Naming convention

Bulk vault names are **source-shaped**, not topic-shaped: `llm-wiki-bulk-<source-slug>`. The vault's identity IS its source.

| Source | Vault slug |
|--------|------------|
| `acme.sharepoint.com/sites/Engineering` | `llm-wiki-bulk-acme-engineering` |
| Confluence space `PROD` on `redacted.atlassian.net` | `llm-wiki-bulk-redacted-prod` |
| Inherited folder of HR docs | `llm-wiki-bulk-hr-archive` |
| `github.com/org/handbook` | `llm-wiki-bulk-org-handbook` |

## Vault layout

A bulk vault adds a `bulk-source.yaml` manifest and a `raw/<source-id>/` mirror tree to the standard vault structure:

```
vaults/llm-wiki-bulk-<source-slug>/
├── bulk-source.yaml          # registry of sources + last-pull state
├── raw/<source-id>/          # immutable mirror of source content
├── wiki/
│   ├── index.md
│   ├── sources/              # one source-note per imported page
│   ├── entities/             # user-curated (rare in bulk vaults)
│   └── concepts/             # user-curated (rare in bulk vaults)
├── log.md
├── CLAUDE.md                 # marks Archetype: Bulk
└── README.md
```

## Connectors

Four source types are supported:

| Type | Auth needed? | Implementation |
|------|--------------|----------------|
| `local` | No | Built in. Walks a folder, mirrors with `rsync`, hashes with `sha256` |
| `git` | SSH agent or `gh` auth | Built in. Clones the repo, uses `git diff` for cheap refresh |
| `sharepoint` | MS Graph token | **Delegated.** Requires a separate connector skill (e.g. work-plugin `redacted:sharepoint`, or you create `bulk-connector-sharepoint` via `/ro:create-skill`) |
| `confluence` | Atlassian API token or PAT | **Delegated.** Same pattern: `redacted:confluence`, `ro:confluence`, or a vault-local override |

If you point `/vault-bulk` at a SharePoint or Confluence source and no connector skill is loaded, it aborts with instructions on which skill to enable or scaffold. Auth never lives in the bulk skill itself.

## Refresh policy

Refresh is **overwrite-raw, preserve-notes**:

1. Re-pull each source.
2. For every page where the new hash differs from the stored `source-hash`:
   - Overwrite `raw/<source-id>/<path>` with the new bytes.
   - Regenerate the source-note body above the `## Notes` divider.
   - Update `date-modified`, `source-modified-at`, `last-refreshed-at`, `source-hash`.
   - Preserve everything below `## Notes` verbatim.
3. Pages that disappeared upstream move to `wiki/sources/.removed-<refresh-date>/` — never deleted outright.
4. Pages that are new upstream are created fresh.
5. A refresh summary is appended to `log.md` and the manifest's `last-refresh-summary` updates.

### The `## Notes` divider contract

Every bulk source-note ends with a `## Notes` H2. Content above the divider is auto-generated and overwritten on refresh. Content below is user-curated and preserved verbatim.

```markdown
... auto-generated body ...

## Notes

<!-- Anything below this divider is user-added and preserved across refresh. -->

_(empty)_
```

If the divider goes missing on a page, refresh refuses to write that page and `/lint` flags it as **refresh-unsafe** under Check 3n.

## Page frontmatter

Bulk source-notes carry three timestamps plus a content hash on top of the standard frontmatter. See [Page Templates](/llm-wiki/reference/page-templates/) for the full schema.

| Field | Updated by | Question it answers |
|-------|------------|---------------------|
| `imported-at` | First import only | When did this page first land in the vault? |
| `source-modified-at` | Refresh, when the connector reports a new value | When did the upstream last change? |
| `last-refreshed-at` | Every refresh that touches the page | When did we last re-pull? |
| `source-hash` | Every refresh | Used by refresh diff — load-bearing |

## How `/lint` treats Bulk vaults

`/lint` reads `Archetype: Bulk` from the vault's `CLAUDE.md` and adjusts:

| Check | Hub / Spoke / Activity | Bulk |
|-------|------------------------|------|
| Orphan pages | Warning | **Info only** |
| Near-orphans (1 inbound link) | Warning | **Info only** |
| Concepts without pages | Info | **Skipped** |
| Near-duplicate detector | Info | **Skipped** |
| Auto-promote candidates | Info | **Skipped** |
| Bulk refresh-safety (NEW) | n/a | **Critical** — flags missing `## Notes` dividers and missing bulk frontmatter fields |

## How `/promote` treats Bulk vaults

| Source | Target | Allowed? |
|--------|--------|----------|
| Bulk | Bulk | No — each bulk vault is a mirror of one upstream source |
| Bulk | Hub / Spoke / Activity | Yes, with conversion: bulk frontmatter is dropped, `derived-from:` lineage is added |
| Hub / Spoke / Activity | Bulk | No — refresh would destroy hand-written content |

## How `/generate` treats Bulk vaults

`/generate` detects Bulk and prompts for a narrowing filter before dispatching to the handler, because a 400-page bulk vault produces an unfocused book or slide deck. Supported filters:

- `--path <subpath>`
- `--source <source-id>`
- `--since <iso-date>`
- `--tag <tag>`

You can opt out with "Generate anyway, no filter" when you genuinely want the full corpus.

## Example workflow

```bash
# Mirror a folder of inherited HR docs
/vault-bulk create hr-archive --source-type local --source /Users/me/Archives/hr-2024-export

# Or wire up a Confluence space (requires a connector skill)
/vault-bulk create redacted-prod --source-type confluence --source https://redacted.atlassian.net/wiki/spaces/PROD

# Check what's mirrored and when it was last refreshed
/vault-status                  # bulk vaults get an Archetype column and per-source freshness rows

# Re-pull when you want fresh content
/vault-bulk refresh hr-archive --dry-run    # see the diff first
/vault-bulk refresh hr-archive               # apply

# Query it like any other vault
/query "what is our parental leave policy" --vault llm-wiki-bulk-hr-archive
```

## Related

- [Vault Create](/llm-wiki/features/promote/) — the standard scaffolder for Hub/Spoke/Activity vaults
- [Ingest](/llm-wiki/features/ingest/) — for one-off source ingestion into any vault
- [Promote](/llm-wiki/features/promote/) — graduate a single bulk page into a Hub as a concept
