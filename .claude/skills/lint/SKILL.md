---
name: lint
description: Health-check an LLM Wiki vault for issues — orphan pages, missing links, contradictions, stale content, frontmatter problems. With --artifacts, walks artifacts/ for .meta.yaml sidecars and flags any whose source-hash has drifted since generation. Use when user wants to lint, check, audit, or health-check their wiki, or check for stale artifacts.
argument-hint: [--vault <name>] [--fix] [--artifacts] [--verify]
disable-model-invocation: true
allowed-tools: Bash(git *) Bash(bash *) Bash(find *) Bash(awk *) Read Write Edit Glob Grep
---

# Lint Wiki

Health-check a vault's wiki for structural and content issues. With `--artifacts`, additionally check whether generated artifacts are still in sync with their source wiki pages (drift detection via `source-hash`).

## Usage

```
/lint --vault my-research
/lint --vault my-research --fix
/lint --vault my-research --artifacts               # drift check only
/lint --vault my-research --artifacts --verify      # drift check + auto-verify flagged
```

## Step 1: Parse Arguments

- `--vault <name>` — target vault (if omitted, use sole vault or ask)
- `--fix` — auto-fix what's fixable (missing frontmatter, stub pages, domain tags)
- `--artifacts` — run artifact drift-detection mode (Step 7 below). Skips wiki checks unless also passed `--wiki` (not typical — default wiki mode runs when `--artifacts` isn't passed)
- `--verify` — only meaningful with `--artifacts`. For each flagged (drifted) artifact, chain into `/verify-artifact --from <path>` to produce a full fidelity report

**Mode routing:** if `--artifacts` is passed, skip Steps 2–6 and run Step 7 (`Artifact Drift Detection`) instead. Existing wiki-lint behaviour is unchanged when `--artifacts` isn't passed.

## Step 2: Gather All Pages

```bash
VAULT="vaults/<vault>"
find "$VAULT/wiki" -name "*.md" ! -name "index.md" -type f
```

For each page, read its frontmatter and content.

## Step 3: Run Checks

### 3a. Frontmatter Checks
For each wiki page, verify:
- [ ] Has YAML frontmatter (between `---` markers)
- [ ] Has `title` field
- [ ] Has `date-created` and `date-modified` fields
- [ ] Has `page-type` (one of: source-note, entity, concept, comparison, summary)
- [ ] Has `domain` list (at least the vault default)
- [ ] Has `sources` list (not empty — every page must trace to a source)
- [ ] Has `related` list
- [ ] source-note pages have: `source-url`, `source-type`, `author`, `raw-file`
- [ ] entity pages have: `entity-type`

**Auto-fix (with --fix):** Add missing fields with vault defaults, set `domain` from vault CLAUDE.md.

### 3b. Orphan Pages
Pages with no inbound links from any other page:
```bash
# For each page, check if any other page links to it
FILENAME="page-name"  # without .md extension
grep -rl "\[\[$FILENAME\]\]" "$VAULT/wiki/" --include="*.md"
```
Pages with zero results are orphans.

**Auto-fix:** Cannot auto-fix — report for user review.

### 3c. Broken Wikilinks
Find all `[[link-target]]` references and verify the target page exists:
```bash
grep -roh '\[\[[^]]*\]\]' "$VAULT/wiki/" --include="*.md" | sort -u
```
For each link, check if a matching `.md` file exists.

**Auto-fix (with --fix):** Create stub pages for missing link targets.

### 3d. Missing Source Links
Pages without a `## Sources` section or with empty `sources` frontmatter.

**Auto-fix (with --fix):** Add empty `## Sources` section.

### 3e. Missing Domain Tags
Pages where `domain` frontmatter is empty or missing the vault default.

**Auto-fix (with --fix):** Add vault default domain from CLAUDE.md.

### 3f. Concepts Without Pages
Scan all page content for terms that appear frequently or are clearly important concepts but don't have their own page in `wiki/concepts/`.

**Auto-fix (with --fix):** Create stub concept pages.

### 3g. Stale Content
- `date-modified` significantly older than related pages' modifications
- Source-notes referencing raw files that have been modified after the source-note

**Auto-fix:** Cannot auto-fix — report for user review.

### 3h. Index Completeness
Check `wiki/index.md` against actual pages:
- Pages that exist but aren't in the index
- Index entries for pages that no longer exist

**Auto-fix (with --fix):** Add missing entries, remove stale entries.

## Step 4: Report

Output a markdown report grouped by severity:

```markdown
## Wiki Lint Report — <vault-name>

### Summary
- Total pages: X
- Issues found: Y (Z auto-fixable)

### Critical (broken links, missing sources)
- ❌ [[missing-page]] — referenced by [[page-1]], [[page-2]] but doesn't exist
- ❌ wiki/sources/article.md — no source link (empty sources frontmatter)

### Warning (orphans, missing metadata)
- ⚠️ wiki/entities/old-tool.md — orphan (no inbound links)
- ⚠️ wiki/concepts/some-idea.md — missing domain tag

### Info (suggestions)
- 💡 "machine learning" mentioned 8 times but has no concept page
- 💡 Consider ingesting more sources on <topic> (only 1 source-note)
- 💡 wiki/sources/old-article.md may be stale (not modified in 30+ days)
```

## Step 5: Suggest Next Actions

After the report, suggest:
- New questions to investigate based on gaps
- New sources to look for based on thin coverage areas
- Connections between pages that should be cross-referenced

## Step 6: Auto-Commit (if --fix applied changes)

```bash
cd "vaults/<vault>"
git add .
git commit -m "🧹 chore: lint auto-fix — <summary of fixes>"
```

Append to log.md:
```markdown
## [YYYY-MM-DD] lint | Wiki health check
- Issues found: X
- Auto-fixed: Y
- Remaining: Z
---
```

## Step 7: Artifact Drift Detection (`--artifacts` mode)

When `--artifacts` is passed, skip wiki checks and walk generated artifacts for drift. The contract enforced by every `generate-*` handler is that a `.meta.yaml` sidecar accompanies each artifact and records the `source-hash` over the wiki pages used to render it. Drift = current wiki pages no longer hash to the recorded value.

This is the cheap counterpart to `/verify-artifact`: no re-generation, no re-ingest, no scoring — just recompute the hash and compare. Runs in seconds over hundreds of artifacts.

### 7a. Discover sidecars

```bash
VAULT="vaults/<vault>"
mapfile -t SIDECARS < <(find "$VAULT/artifacts" -type f -name "*.meta.yaml" 2>/dev/null)
```

If `$VAULT/artifacts/` doesn't exist or has no sidecars, report "No artifacts to check." and exit 0.

### 7b. For each sidecar, recompute and compare

For a sidecar at `$SIDECAR`:

```bash
# Extract the artifact's side fields with awk (no yq dep — stay portable).
GENERATED_AT=$(awk -F': *' '/^generated-at:/ {print $2; exit}' "$SIDECAR")
OLD_HASH=$(awk -F': *' '/^source-hash:/ {print $2; exit}' "$SIDECAR")

# generated-from is a YAML list; pull the "- wiki/..." lines until the next top-level key.
mapfile -t SOURCES < <(awk '
  /^generated-from:/ {inlist=1; next}
  inlist && /^[a-zA-Z]/ {inlist=0}
  inlist && /^[[:space:]]*-[[:space:]]+/ {sub(/^[[:space:]]*-[[:space:]]+/, ""); print}
' "$SIDECAR")

# Resolve source paths relative to the vault (sidecars store repo-relative POSIX paths from the vault root).
SRC_ARGS=()
MISSING=()
for s in "${SOURCES[@]}"; do
  p="$VAULT/$s"
  if [[ -f "$p" ]]; then SRC_ARGS+=("$p"); else MISSING+=("$s"); fi
done

if (( ${#MISSING[@]} > 0 )); then
  # Source page was deleted/moved since generation — flag as orphaned.
  report_orphan "$SIDECAR" "${MISSING[@]}"
  continue
fi

NEW_HASH=$(bash .claude/skills/generate/lib/source-hash.sh "${SRC_ARGS[@]}")

if [[ "$OLD_HASH" != "$NEW_HASH" ]]; then
  # Count commits on the source pages since generated-at to estimate drift age.
  DRIFT_COMMITS=$(cd "$VAULT" && git log --oneline --since="$GENERATED_AT" -- "${SOURCES[@]}" 2>/dev/null | wc -l | tr -d ' ')
  report_drift "$SIDECAR" "$GENERATED_AT" "$OLD_HASH" "$NEW_HASH" "$DRIFT_COMMITS"
fi
```

### 7c. Report format

```markdown
## Artifact Drift Report — <vault-name>

### Summary
- Total artifacts checked: 14
- Drifted: 3
- Orphaned (source deleted): 1
- In sync: 10

### Drifted
- ❌ artifacts/book/attention-2026-04-12.pdf
  - generated-at: 2026-04-12T09:05:00+01:00
  - old hash: 2dd9ed4a003f9a77…
  - new hash: 91c5ab77e234bb08…
  - drift age: 4 commits on source pages since generated-at

- ❌ artifacts/slides/rag-patterns-2026-04-13.html
  - generated-at: 2026-04-13T11:12:00+01:00
  - old hash: 5b4a8e12ffd10c9c…
  - new hash: 8f0c3d77a9b12e44…
  - drift age: 1 commit on source pages since generated-at

### Orphaned
- ⚠️ artifacts/quiz/deprecated-topic-2026-03-30.html
  - generated-from wiki/concepts/deprecated-topic.md (no longer exists)

### In sync
- ✅ artifacts/podcast/transformers-2026-04-15.mp3
- ✅ artifacts/flashcards/attention-2026-04-16.apkg
- …
```

### 7d. Optional `--verify` chaining

When `--verify` is passed together with `--artifacts`, after the report is printed, iterate the drifted list and for each run:

```
/verify-artifact --from <artifact-path>
```

Collect the per-artifact fidelity scores. Append a `### Verification Results` section to the report with the score and pass/fail per drifted artifact. This lets the user decide whether the drift actually matters — small edits on source pages can still produce a fidelity-preserving artifact.

### 7e. Exit codes

- `0` — no drift, or drift reported without `--verify`
- `1` — drift detected with `--verify`, and at least one verification fell below its target
- `2` — infrastructure error (missing `.claude/skills/generate/lib/source-hash.sh`, unreadable sidecar, etc.)

This makes `--artifacts --verify` CI-usable against a golden corpus (see US-004).

### Why this is separate from `/verify-artifact`

| Aspect | `/lint --artifacts` | `/verify-artifact` |
|--------|--------------------|--------------------|
| Cost | O(ms) per artifact (one hash) | O(s–min) per artifact (regenerate + re-ingest + score) |
| Scope | All artifacts in a vault | One artifact |
| Question answered | "Has anything drifted?" | "How faithful is this artifact?" |
| CI fit | Fast pre-check on every push | Nightly / on flagged only |

Use `/lint --artifacts` as the cheap filter, then `/verify-artifact` (or `/lint --artifacts --verify`) on what it surfaces.
