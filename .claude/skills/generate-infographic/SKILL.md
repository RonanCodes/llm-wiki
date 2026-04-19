---
name: generate-infographic
description: Render a single-page SVG infographic summarising a topic. Uses a template library (stats-card, comparison-grid, timeline) and fills slots from wiki content. Optional PNG export via rsvg-convert. Closes the loop via verify-quick.sh (mandatory) and optional /verify-artifact. Used by /generate infographic. Not user-invocable directly — go through /generate.
user-invocable: false
allowed-tools: Bash(which *) Bash(brew *) Bash(git *) Bash(mkdir *) Bash(date *) Bash(cat *) Bash(sed *) Bash(grep *) Bash(awk *) Bash(rsvg-convert *) Read Write Glob Grep
---

# Generate Infographic

Produce a shareable single-page SVG infographic summarising a topic, styled to the Observatory theme (amber, cyan, green). The LLM picks a template based on the topic's shape (counts, comparisons, timeline) and fills its slots from the wiki content.

Artifact-first — output lands in `vaults/<vault>/artifacts/infographic/`.

## Usage (via /generate router)

```
/generate infographic <topic> [--vault <name>] [--template <name>] [--no-png] [--verify]
```

The `--verify` flag runs the heavy `/verify-artifact infographic <topic>` round-trip after generation. `verify-quick.sh` runs unconditionally — see Step 10.

The handler applies `.claude/skills/generate/lib/quality-rubric.md` — the canonical rubric for scope, depth, engagement, source refs, verification. Read it alongside this file. The §1 scope rule matters here: fill template slots with the *relevant* concepts, not the whole vault.

Where `<topic>` is one of:

- A **tag** — matches all pages whose frontmatter `tags:` list includes it.
- A **folder path** under `wiki/` — all `.md` in that folder.
- A **single page path** — just that page.
- The literal string `all` — every page under `wiki/`.

Same resolution as sibling handlers — reuses `.claude/skills/generate/lib/select-pages.sh`.

## Step 1: Dependency Check

No hard dependencies for SVG — it's text output. PNG export uses `rsvg-convert` (librsvg) when present:

```bash
HAS_RSVG=0
if which rsvg-convert >/dev/null 2>&1; then
  HAS_RSVG=1
elif [ "$NO_PNG" != "1" ]; then
  echo "rsvg-convert not found; install with: brew install librsvg  (or apt: librsvg2-bin)"
  echo "Continuing with SVG-only output. Re-run with --no-png to suppress this message."
fi
```

## Step 2: Resolve Vault + Topic

Use the shared helper — single source of truth, no duplication:

```bash
mapfile -t PAGES < <(.claude/skills/generate/lib/select-pages.sh "$VAULT_DIR" "$TOPIC")
```

Exit 1 from the helper means "no pages matched" — surface that error verbatim.

## Step 3: Compute Source Hash

```bash
HASH=$(.claude/skills/generate/lib/source-hash.sh "${PAGES[@]}")
```

## Step 4: Extract Content Shape

Read the source pages and build a small structured summary. The LLM doing the invocation should populate fields that templates can consume:

```yaml
# in-memory — not written to disk
title: "<Topic as Title Case>"
page_count: <N>
tag_counts:
  - tag: <tag>
    count: <N>
domains: [<domain1>, <domain2>]
top_concepts:         # derived from H1 headings of each page
  - <concept 1>
  - <concept 2>
pull_quote: "<a short quote from the content>"
comparisons:          # populated only if the topic is comparison-shaped
  - { left: <thing A>, right: <thing B>, dimension: <axis>, verdict: "A wins" }
timeline:             # populated only if dates are abundant
  - { date: YYYY-MM-DD, event: "<what>" }
```

**Template pick rule** — the LLM inspects the shape and chooses:

- ≥ 2 comparison pages OR topic contains "vs" / "versus" → **comparison-grid**.
- Timeline-like dates in ≥ 3 pages → **timeline** (future template; fall through for now).
- Otherwise → **stats-card** (the safe default).

`--template <name>` overrides the auto-pick.

## Step 5: Template Resolution

Templates live at `.claude/skills/generate-infographic/templates/<name>.svg`. Shipped in Phase 2B:

- `stats-card.svg` — top-line counts, tag cloud, pull-quote panel.
- `comparison-grid.svg` — two-column table with a verdict row.

Resolution order:

1. `--template <name>` flag → `.claude/skills/generate-infographic/templates/<name>.svg` OR `$VAULT_DIR/.templates/infographic/<name>.svg`.
2. Vault-local default — `$VAULT_DIR/.templates/infographic/default.svg` if present.
3. Auto-picked from Step 4.

## Step 6: Fill the Template

Templates use `{{mustache}}`-style placeholders. Replace with extracted values:

```bash
SVG_OUT="$VAULT_DIR/artifacts/infographic/<slug>-<date>.svg"

sed \
  -e "s|{{title}}|$TITLE|g" \
  -e "s|{{date}}|$(date +%Y-%m-%d)|g" \
  -e "s|{{page_count}}|$PAGE_COUNT|g" \
  -e "s|{{top_concept_1}}|$CONCEPT_1|g" \
  … \
  < "$TEMPLATE_PATH" > "$SVG_OUT"
```

For list placeholders (e.g. tag cloud), the LLM generates the `<text>` sub-elements inline — the template reserves a `<!-- {{tag_cloud}} -->` anchor which gets replaced with the generated SVG fragment.

### Observatory Theme

All templates must use the project palette (locked in `shared/tokens.css`):

| Role | Color | Usage |
|------|-------|-------|
| Amber | `#e0af40` | Source / input / headings |
| Cyan | `#5bbcd6` | Engine / process / accent |
| Green | `#7dcea0` | Output / positive / highlight |
| Background | `#0b0f14` | Dark panels |
| Text | `#e8eef6` | Body text on dark |

Templates authored outside this palette must note the deviation in a comment near the top.

## Step 7: PNG Export (optional)

```bash
if [ "$HAS_RSVG" = "1" ] && [ "$NO_PNG" != "1" ]; then
  PNG_OUT="${SVG_OUT%.svg}.png"
  rsvg-convert -w 1600 "$SVG_OUT" -o "$PNG_OUT"
fi
```

1600px wide is a reasonable Twitter/LinkedIn card size. A template can request a different width by declaring `<!-- export-width: 2400 -->` in the SVG header; handler honours that if present.

## Step 8: Version Detection

Before writing the sidecar, check for an existing artifact of the same type and topic:

```bash
ARTIFACT_TYPE="infographic"
EXISTING=$(ls "$VAULT_DIR/artifacts/$ARTIFACT_TYPE/"*"$TOPIC_SLUG"*.meta.yaml 2>/dev/null | sort | tail -1)
if [ -n "$EXISTING" ]; then
  PREV_VERSION=$(grep '^version:' "$EXISTING" | awk '{print $2}')
  PREV_VERSION=${PREV_VERSION:-1}
  VERSION=$((PREV_VERSION + 1))
  PREV_SLUG=$(basename "$EXISTING" .meta.yaml)
else
  VERSION=1
  PREV_SLUG=""
fi
```

The old artifact stays in place — not deleted, not overwritten. Multiple files of the same type + topic = version history. The portal discovers and displays these automatically.

Small fixes (CSS tweaks, typo corrections) should update the file in-place without incrementing the version — use judgement based on whether the content meaningfully changed.

## Step 9: Write the Sidecar

```bash
META="${SVG_OUT%.svg}.meta.yaml"
cat > "$META" <<EOF
generator: generate-infographic@0.1.0
generated-at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
template: $TEMPLATE_NAME
topic: "<raw topic argument>"
flags:
  no-png: ${NO_PNG:-false}
generated-from:
$(for p in "${PAGES[@]}"; do echo "  - $p"; done)
source-hash: $HASH
version: $VERSION
change-note: "<brief description of what changed, or 'Initial version' for v1>"
replaces: "$PREV_SLUG"
EOF
```

## Step 10: Close the Loop (Quality Verify) — MANDATORY

Rubric §6 — every handler runs `verify-quick.sh` on its own output before reporting success.

```bash
.claude/skills/generate/lib/verify-quick.sh infographic "$SVG_OUT" "$META"
QV_EXIT=$?
```

The check enforces:

- SVG exists and has ≥ 5 populated `<text>` data points (rubric §2 floor).
- At least some of the source pages' top concepts appear in the SVG text layer (rubric §3 engagement proxy — an infographic that lost its content is not engaging).
- Sidecar has `generated-from` + `source-hash`.

Surface warnings in Step 12's report and stamp them into the sidecar's `quality:` block. Common warning: "only 3 datapoints; try a richer template or widen the topic."

### Optional: full round-trip (`--verify`)

If `--verify` was passed, invoke:

```bash
/verify-artifact infographic "$TOPIC" --vault "$VAULT_NAME"
```

Infographic fidelity is low-target (0.25) by design — most context is lost, captions survive. The round-trip still tells you whether the captions you kept are the *right* ones.

## Step 11: Commit to Vault Repo

```bash
cd "$VAULT_DIR"
git add "artifacts/infographic/<slug>-<date>."{svg,png,meta.yaml} 2>/dev/null
git diff --cached --quiet || git commit -m "🎨 infographic: generate <topic> ($(date +%Y-%m-%d))"
```

## Step 12: Report to User

```
✅ Infographic generated
   Topic:       <topic>
   Template:    <template name>
   Pages in:    <N>
   Source hash: <first 12 chars>
   Quality:     pass  (or warn: <list from verify-quick>)
   SVG:         vaults/<vault>/artifacts/infographic/<slug>-<date>.svg
   PNG:         vaults/<vault>/artifacts/infographic/<slug>-<date>.png  (if rsvg-convert available)
   Sidecar:     vaults/<vault>/artifacts/infographic/<slug>-<date>.meta.yaml
   Open with:   open <absolute path to svg>
```

If `--verify` was used, append the round-trip result (coverage, Jaccard, normalised fidelity, pass/fail).

## Authoring New Templates

1. Start from an existing template in `templates/` as a base.
2. Place your placeholders as `{{name}}`. Document each one at the top of the SVG in a `<!-- placeholders: ... -->` comment block.
3. Use the Observatory palette; if you deviate, document why.
4. Keep it to a single page — infographics aren't reports. Rule of thumb: readable at 1200px wide without zooming.
5. Add a worked example to `sites/docs/src/content/docs/features/generate-infographic.md` with a screenshot.

## Known Limitations (Phase 2B)

- **Content extraction is LLM-dependent.** The handler relies on the invoking LLM reading pages and producing the structured summary. No static parser. Quality varies with prompt.
- **Only 2 templates shipped.** `timeline` template is noted but deferred.
- **SVG sizing** is fixed per-template. Future: accept `--width` and scale.
- **rsvg-convert** is optional; SVG alone is fine for web display but PNGs are better for social cards.

## See Also

- `.claude/skills/generate/lib/quality-rubric.md` — canonical rubric applied here.
- `.claude/skills/generate/lib/verify-quick.sh` — the mandatory close-the-loop check.
- `.claude/skills/verify-artifact/SKILL.md` — opt-in full round-trip fidelity test.
- `.claude/skills/generate/SKILL.md` — router that dispatches here.
- `.claude/skills/generate/lib/select-pages.sh` — shared topic resolution.
- `.claude/skills/generate/lib/source-hash.sh` — shared provenance hash.
- `sites/docs/src/content/docs/reference/artifacts.md` — sidecar schema.
- `CLAUDE.md` — Observatory theme definition.
