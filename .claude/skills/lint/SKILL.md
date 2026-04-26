---
name: lint
description: Health-check an LLM Wiki vault for issues — orphan pages, missing links, contradictions, stale content, frontmatter problems. With --artifacts, walks artifacts/ for .meta.yaml sidecars and flags any whose source-hash has drifted since generation. Use when user wants to lint, check, audit, or health-check their wiki, or check for stale artifacts.
argument-hint: [--vault <name>] [--fix] [--artifacts] [--verify]
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

### 3i. Backlink Density

Count incoming wikilinks per page to surface graph-health issues. Orphans (zero incoming) are already flagged by 3b — this check adds two more signals.

```bash
# For each page, count distinct other-page files that wikilink to it.
for page in $(find "$VAULT/wiki" -name "*.md" ! -name "index.md" -type f); do
  slug=$(basename "$page" .md)
  count=$(grep -rl "\[\[$slug\]\]" "$VAULT/wiki/" --include="*.md" | grep -v "/$slug.md$" | wc -l | tr -d ' ')
  echo "$count $page"
done | sort -rn
```

Flag levels:
- **Hub** (≥15 incoming): `💡` candidate for the L1 Topic Map section. High-traffic pages should appear in the progressive index's L1 tier.
- **Near-orphan** (exactly 1 incoming, page-type ≠ stub/source-note): `⚠️` fragile — losing the one referrer makes it an orphan. Worth a second backlink or a merge.
- **Orphan** (0 incoming): already covered by 3b.

**Auto-fix:** Cannot auto-fix — report only.

### 3j. Near-Duplicate Pages (compaction detector)

Surface page pairs that look like they cover the same ground. **Detect-only** — no auto-merge, no fix. The user reviews flagged pairs in Obsidian and decides whether to keep both, manually merge, or leave a redirect stub.

Conservative thresholds (high precision, low recall — better to under-flag than to confuse the user with false pairs):

A pair `(A, B)` is flagged when ALL of:
- Same `page-type` (entity vs entity, concept vs concept).
- ≥2 shared `domain` tags.
- ≥3 shared `tags`.
- Title token Jaccard ≥0.5 (after dropping stopwords like `vs`, `and`, `the`, `a`).

When `qmd` is available, additionally flag pairs where each ranks in the other's top-3 search results for its own title — strong signal of content overlap.

```bash
# Build a (slug, page-type, domain[], tags[], title-tokens) table by scanning frontmatter.
# For each pair within the same page-type, compute Jaccard on title tokens and shared-tag counts.
# (Implementation sketch — full bash is verbose; the LLM can iterate explicitly.)
```

Report each flagged pair with:
- Both page paths
- Shared tags list
- Title-Jaccard score
- A one-line "why this might be a duplicate" hint

**Auto-fix:** None. Compaction is a deliberate, human-in-the-loop operation. See `wiki-templates` § Progressive Index for why naive merging is dangerous (wikilink breakage, cross-vault link breakage, provenance loss, identity churn). If the user wants to act on a flagged pair, they manually edit and use `cross-vault-link-audit` to handle inbound link rewrites.

### 3k. Index Tier Budget

The progressive index spec (see `wiki-templates` § Progressive Index) defines token budgets per tier. This check measures the actual tokens in each section of `index.md` and warns when budgets are exceeded.

Approximate tokens as `wc -w × 1.3` (close enough for guidance). Section boundaries are H2 headings: `## Purpose`, `## Topic Map`, `## Full Index`. If the file has been sharded (`index-l1.md`, `index-l2.md` exist), measure each shard against its tier budget.

| Section / file | Soft budget | Warn at |
|----------------|-------------|---------|
| `## Purpose` (L0) | 500 tokens | ≥750 |
| `## Topic Map` (L1) | 2000 tokens | ≥3000 |
| `## Full Index` (L2) | 8000 tokens | ≥10K |
| `index.md` total | 10K tokens | ≥10K — suggest sharding into `index-l1.md` / `index-l2.md` |

```bash
INDEX="$VAULT/wiki/index.md"
# Extract each section by H2 boundary and count words. Multiply by 1.3 for token estimate.
awk '/^## Purpose/{p=1;next} /^## /{p=0} p' "$INDEX" | wc -w
awk '/^## Topic Map/{p=1;next} /^## /{p=0} p' "$INDEX" | wc -w
awk '/^## Full Index/{p=1;next} /^## /{p=0} p' "$INDEX" | wc -w
```

Flag thresholds:
- L0 over 750 tokens: `⚠️` shrink to anchor entities + one-paragraph purpose.
- L1 over 3K tokens: `⚠️` Topic Map is bloating — promote some entries to L2-only or shard.
- L2 over 10K tokens: `💡` shard into `index-l2.md`.
- `index.md` total over 10K: `💡` shard into separate `index-l1.md` / `index-l2.md` files. Suggest the split, do not perform it.

**Auto-fix:** None. Sharding is a deliberate restructuring the user runs when they actually want it.

### 3l. Drafts Staleness

If the vault has a `scratchpad/` directory (the Drafts layer — see `wiki-templates` § KB + Drafts Layers), flag any draft files unmodified for over 30 days. Stale drafts are either ready to promote (run `/promote --vault <name> --from-drafts`) or no longer needed (delete them).

```bash
SCRATCH="$VAULT/scratchpad"
if [ -d "$SCRATCH" ]; then
  find "$SCRATCH" -name "*.md" -type f -mtime +30
fi
```

For each stale file, suggest the action: promote vs delete. Don't recommend silently — the point of a Drafts layer is human-driven thinking, so /lint asks the user, doesn't decide.

**Auto-fix:** None. Drafts are user-managed; lint just surfaces them.

### 3m. Auto-Promote Candidates (cross-vault inbound traffic)

Pages that other vaults frequently link to are good candidates for promotion to a hub vault — they've earned reuse status. This check counts inbound cross-vault references and flags pages above the threshold.

Scope: scan every `vaults/*/wiki/**/*.md` **outside** the current target vault for cross-vault links (`obsidian://open?vault=llm-wiki-<this-vault-short>&file=...`) pointing at pages in this vault. Cross-vault links use the markdown form documented in `wiki-templates` § Wikilinks; grep for the canonical pattern.

```bash
THIS_VAULT_SHORT=${VAULT##*llm-wiki-}   # strip the prefix
THIS_VAULT_DIR="$VAULT/wiki"

for page in $(find "$THIS_VAULT_DIR" -name "*.md" ! -name "index*.md" -type f); do
  rel="${page#$THIS_VAULT_DIR/}"
  slug="${rel%.md}"
  # URL-encoded path: '/' → '%2F'
  encoded="wiki%2F${slug//\//%2F}"
  pattern="obsidian://open?vault=llm-wiki-${THIS_VAULT_SHORT}&file=${encoded}"

  # Count distinct OTHER-vault files referencing this page
  count=$(grep -rl --include="*.md" "$pattern" vaults/ 2>/dev/null \
    | grep -v "^$VAULT/" | wc -l | tr -d ' ')

  if [[ "$count" -ge 2 ]]; then
    echo "$count $page"
  fi
done | sort -rn
```

Flag levels:
- **≥2 inbound from other vaults** → `💡 promote candidate`. The page has earned cross-vault reuse signal — likely belongs in a hub vault (`llm-wiki-research`, `llm-wiki-marketing`, etc.). Recommend running `/promote <this-vault> --to <hub-vault>` for the page.
- **≥5 inbound from other vaults** → `⚠️ strong promote candidate`. The page is acting as a de facto hub already. Promotion should be near-automatic.

The check itself doesn't move anything — `/promote` is the user-driven action. This is purely a discoverability signal for "what should I graduate next?"

**Caveats and rejected designs:**
- This **cannot** detect promotion candidates from within the same vault (intra-vault wikilink density is what check 3i covers). Auto-promote is specifically about cross-vault traffic.
- We do not score by qmd similarity across vaults here — too noisy at typical small vault counts (<10), and cross-vault retrieval isn't yet wired in `/query --all-vaults`.
- Threshold of 2 is intentionally low. Adjust upward if false-positive rate is a problem.

**Auto-fix:** None. Promotion is a deliberate cross-vault operation.

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

### Warning (orphans, missing metadata, fragile pages, index bloat)
- ⚠️ wiki/entities/old-tool.md — orphan (no inbound links)
- ⚠️ wiki/concepts/some-idea.md — missing domain tag
- ⚠️ wiki/concepts/lonely-concept.md — near-orphan (1 incoming link, fragile)
- ⚠️ index.md L0 section over budget (820 tokens, target ≤500)

### Info (suggestions)
- 💡 "machine learning" mentioned 8 times but has no concept page
- 💡 Consider ingesting more sources on <topic> (only 1 source-note)
- 💡 wiki/sources/old-article.md may be stale (not modified in 30+ days)
- 💡 wiki/entities/popular-tool.md — hub (22 incoming links). Promote to L1 Topic Map.
- 💡 Possible duplicate pair: wiki/concepts/llm-wikis.md ↔ wiki/concepts/llm-knowledge-bases.md (shared tags: llm, wiki, knowledge-base; title-Jaccard 0.67). Review manually — see check 3j for why no auto-fix.
- 💡 index.md total over 10K tokens. Consider sharding: keep L0 in index.md, move L1 to index-l1.md, L2 to index-l2.md.
- 💡 wiki/concepts/voice-extraction-methodology.md — promote candidate (3 cross-vault inbounds: marketing, personal-work, side-projects). Likely belongs in a hub. Run `/promote <this-vault> --to llm-wiki-research`.
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
