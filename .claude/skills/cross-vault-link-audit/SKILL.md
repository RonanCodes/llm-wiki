---
name: cross-vault-link-audit
description: Audit, fix, and maintain cross-vault links across all vaults in the llm-wiki repo. Use when user wants to check for broken cross-vault links, migrate legacy `[[vault:page]]` wikilinks to the new markdown-link form, or move a file and update all cross-vault references pointing at it. Also the tool of record after any file rename/move inside a vault.
---

# cross-vault-link-audit

The cross-vault link format in this repo is:

```
[vault-short:page-slug](obsidian://open?vault=llm-wiki-<vault-short>&file=<url-encoded-path-without-.md>)
```

Legacy format that needs migration:

```
[[vault-short:page-slug]]
```

This skill owns three operations:

1. **audit** (default) — walk every vault under `vaults/`, find cross-vault refs (both new and legacy forms), classify each (ok / legacy-wikilink / broken-target), report.
2. **fix** — rewrite legacy wikilinks to the new form; for broken targets, try slug-match resolution against the target vault and rewrite when exactly one match is found.
3. **move** — move a file from `<from>` to `<to>` within a given vault, then rewrite every incoming cross-vault ref across all other vaults.

All three operations run from the repo root: `/Users/ronan/Dev/ai-projects/llm-wiki`.

## When to use

- After creating a new cross-vault link (audit-only to sanity-check).
- After renaming or moving files inside any vault (audit + fix, or use `move` if you know which file).
- Periodically (weekly / pre-release) as a link-rot check.
- As part of a convention migration (legacy wikilinks → markdown links).

## How to invoke

`/cross-vault-link-audit` — audit mode (default, no writes).
`/cross-vault-link-audit --fix` — audit then fix legacy + resolvable-broken links.
`/cross-vault-link-audit --move <from> <to> --vault <vault-short>` — move a file and rewrite incoming refs.

## Operation: audit (default)

Report structure:

```
Cross-vault link audit — YYYY-MM-DD HH:MM

Vaults scanned: N
Cross-vault refs found: M
  - OK (new form, target exists):       A
  - Legacy [[wikilink]] form:           B
  - Broken target (path not found):     C
  - Malformed (unparseable):            D

Per-vault breakdown:
  side-projects:        a ok / b legacy / c broken
  career-moves:         ...
  ...

Issues requiring attention:

[Legacy wikilinks — B entries]
  vaults/side-projects/wiki/entities/project-foo.md:42
    [[marketing:indie-builder-marketing-playbook]]
    → suggested: [marketing:indie-builder-marketing-playbook](obsidian://open?vault=llm-wiki-marketing&file=wiki%2Fconcepts%2Findie-builder-marketing-playbook)

[Broken targets — C entries]
  vaults/foo/wiki/concepts/bar.md:17
    [research:remotion-v2](obsidian://open?vault=llm-wiki-research&file=wiki%2Fconcepts%2Fremotion-v2)
    → target file not found in llm-wiki-research
    → slug-match candidates: 1 (wiki/concepts/remotion.md) — auto-fixable in --fix mode
    OR → slug-match candidates: 0 — manual resolution required
    OR → slug-match candidates: 3 — manual pick required

Legacy wikilinks: run with --fix to migrate.
Broken targets with 1 slug-match candidate: run with --fix to auto-relocate.
Broken targets with 0 or multi matches: listed above for manual resolution.
```

## Operation: fix

Applies these transformations:

**Transformation 1: legacy wikilink → markdown link.**
For each `[[vault-short:page-slug]]` match:
1. Find the target file in `vaults/llm-wiki-<vault-short>/`. Search is: first look for exact path `wiki/*/<page-slug>.md`; if multiple hits, list them and skip (manual).
2. If exactly one match at `<path>`, rewrite `[[vault-short:page-slug]]` to `[vault-short:page-slug](obsidian://open?vault=llm-wiki-<vault-short>&file=<url-encoded-path-without-.md>)`.
3. URL-encode: `/` → `%2F`, spaces → `%20`.

**Special case — frontmatter `related:` lists.** The wikilink form inside a YAML string like `"[[vault:page]]"` should also be migrated. Replace the entire quoted string with `"[vault:page](obsidian://open?vault=...&file=...)"`.

**Transformation 2: broken-target auto-relocate.**
For each markdown-form cross-vault link whose target file doesn't exist:
1. Extract the slug (last path segment minus any query/fragment).
2. In the target vault, `find wiki/ -name "<slug>.md" -type f`.
3. If exactly one match, rewrite the URL with the new path. Log the fix.
4. If zero or multiple matches, skip and list in the report.

**Commit after fix mode.** Write one commit per vault touched:
- Message: `🧹 chore(vault-name): migrate cross-vault links (N fixed)`
- Use backdated weekday timestamp per the project's commit-timestamp rule.

## Operation: move

`/cross-vault-link-audit --move <from-path> <to-path> --vault <vault-short>`

Paths are relative to the vault root (e.g. `wiki/concepts/foo.md` `wiki/entities/foo.md`).

Steps:
1. Confirm source file exists at `vaults/llm-wiki-<vault-short>/<from-path>`.
2. Confirm target path does not exist (don't silently overwrite).
3. `git mv` the file inside the vault (preserves git history).
4. For EVERY other vault under `vaults/`, search for incoming cross-vault refs that point at the old path. Match both:
   - The markdown-link URL: `obsidian://open?vault=llm-wiki-<vault-short>&file=<url-encoded-from-path-without-.md>`.
   - The visible text: `[<vault-short>:<slug>]` where slug was derived from the old path.
5. Rewrite each to the new URL + (if the filename changed) new slug.
6. Also search intra-vault wikilinks `[[old-slug]]` within the moved-from vault — these are Obsidian's responsibility if the user moved via the Obsidian UI, but if the move was via `git mv`, wikilinks won't have been updated. Offer to rewrite them too (same rule: `find wiki/ -name "<old-slug>.md"` turns up nothing, replace with the new slug).
7. Commit per vault touched:
   - Moved-from vault: `♻️ refactor(<vault>): move <from> → <to>`
   - Each other-vault: `🧹 chore(<vault>): follow cross-vault link rename of <vault-short>:<slug>`

## Vault short-name list

Known vaults as of 2026-04-24 (derived by scanning `vaults/llm-wiki-*`):

- `career-moves`
- `marketing`
- `personal-work`
- `research`
- `side-projects`
- `simplicity-taskforce-partnership`
- `skill-lab`
- `startup-strategy`
- `llm-wiki` (the project's own vault, rarely a link target)

Discover at runtime via `ls vaults/ | sed 's/^llm-wiki-//'` so new vaults are picked up automatically.

## Implementation notes

### Regex for detection

- **Legacy wikilink:** `\[\[([a-z0-9-]+):([a-z0-9-]+)\]\]` (captures vault-short + slug).
- **New markdown link:** `\[([a-z0-9-]+):([a-z0-9-]+)\]\(obsidian://open\?vault=llm-wiki-([a-z0-9-]+)&file=([^)]+)\)` (captures visible vault, visible slug, URL-vault, URL-path).
- Validate consistency: visible `vault-short` should equal URL `vault-short` minus the `llm-wiki-` prefix. Flag mismatches.

### URL encoding

Minimal set: `/` → `%2F`, space → `%20`. Do not re-encode already-encoded strings (idempotent). Do not include `.md` in the URL.

### Cross-vault refs inside YAML frontmatter

Frontmatter `related:` items often carry `"[[vault:page]]"`. The migration applies there too — strip the `[[...]]`, wrap as `"[vault:page](obsidian://...)"`.

### Cross-vault refs inside links-only frontmatter lists

Some entities carry bare list items like `- [[vault:page]]` — those are covered by the same regex.

### Ignore

- Files outside `vaults/` (e.g. skill SKILL.md files can contain illustrative `[[vault:page]]` in code blocks — use file-path filter `vaults/*/wiki/**/*.md` or `vaults/*/**/*.md` plus `.raw/` exclusion).
- Raw files under `vaults/<name>/raw/` — raw source notes shouldn't be rewritten.

### Commit policy

- Always work inside the individual vault's git repo (each vault is its own repo per CLAUDE.md).
- Use backdated commit timestamps per the project's weekday-outside-work-hours rule: `git log --oneline --format="%h %ai" -1` for the vault, then stagger 5 min after.
- One commit per vault touched in a single run.

### Dry-run requirement

Always show the full list of proposed changes and ask the user to confirm before executing fixes or the move operation. Exception: audit mode performs no writes and never prompts.

## Example session — audit-only

```
> /cross-vault-link-audit

Cross-vault link audit — 2026-04-24 19:00

Vaults scanned: 8
Cross-vault refs found: 42
  - OK (new form, target exists):       3
  - Legacy [[wikilink]] form:           38
  - Broken target (path not found):     1

[Legacy wikilinks — 38 entries]
  vaults/side-projects/wiki/concepts/plan-launch-cockpit.md:20
    [[simplicity-taskforce-partnership:algorithm-runtime]]
    → [simplicity-taskforce-partnership:algorithm-runtime](obsidian://open?vault=llm-wiki-simplicity-taskforce-partnership&file=wiki%2Fcomparisons%2Falgorithm-runtime)
  ...

[Broken targets — 1 entry]
  vaults/side-projects/wiki/entities/project-foo.md:53
    [research:remotion-v2](obsidian://open?vault=llm-wiki-research&file=wiki%2Fconcepts%2Fremotion-v2)
    → target file not found
    → slug-match: 1 candidate (wiki/concepts/remotion.md) — probably renamed

Run `/cross-vault-link-audit --fix` to migrate all 38 legacy wikilinks and auto-relocate the 1 broken target.
```

## Example session — move

```
> /cross-vault-link-audit --move wiki/concepts/remotion.md wiki/entities/remotion.md --vault research

Move plan:
  vaults/llm-wiki-research/wiki/concepts/remotion.md
  → vaults/llm-wiki-research/wiki/entities/remotion.md

Incoming cross-vault references that will be updated:
  side-projects/wiki/entities/project-connections-helper.md:25
    [research:remotion](obsidian://...&file=wiki%2Fconcepts%2Fremotion)
    → [research:remotion](obsidian://...&file=wiki%2Fentities%2Fremotion)
  side-projects/wiki/concepts/plan-launch-cockpit.md:47
    ... (same change)

Intra-vault wikilinks in llm-wiki-research pointing at remotion.md: 4 occurrences will also be updated.

Commits to be made:
  - llm-wiki-research: ♻️ refactor(research): move remotion from concepts to entities
  - llm-wiki-side-projects: 🧹 chore(side-projects): follow cross-vault rename of research:remotion

Proceed? [y/N]
```

## Safety checklist

- [ ] Never run `--fix` or `--move` without showing the dry-run diff first.
- [ ] Never overwrite an existing target path on move.
- [ ] Always backdate commit timestamps to outside weekday work hours.
- [ ] Never touch files outside `vaults/<name>/wiki/` (keeps raw sources and SKILL.md examples untouched).
- [ ] When slug match count ≠ 1 for a broken target, never guess — leave for manual resolution.
