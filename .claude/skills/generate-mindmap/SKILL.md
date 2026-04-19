---
name: generate-mindmap
description: Render an interactive Markmap HTML mind map from wiki pages matching a topic. Walks page headings to build the outline; preserves wikilinks as clickable nodes. Lazy-installs markmap-cli. Closes the loop via verify-quick.sh (mandatory) and optional /verify-artifact. Used by /generate mindmap. Not user-invocable directly — go through /generate.
user-invocable: false
allowed-tools: Bash(which *) Bash(npx *) Bash(pnpm *) Bash(npm *) Bash(git *) Bash(mkdir *) Bash(date *) Bash(cat *) Bash(sed *) Bash(grep *) Bash(awk *) Read Write Glob Grep
---

# Generate Mindmap

Produce a self-contained Markmap HTML mind map from wiki pages matching a topic. The outline is built from each page's heading hierarchy and cross-links; the rendered HTML is interactive (zoom, pan, fold/unfold, node hyperlinks).

Artifact-first — output lands in `vaults/<vault>/artifacts/mindmap/`, never in `wiki/`.

## Usage (via /generate router)

```
/generate mindmap <topic> [--vault <name>] [--template <name>] [--include-wikilinks] [--verify]
```

The `--verify` flag triggers the heavy `/verify-artifact mindmap <topic>` round-trip after generation. `verify-quick.sh` runs unconditionally — see Step 9.

The handler also applies `.claude/skills/generate/lib/quality-rubric.md` — the canonical rubric for scope, depth, engagement, source refs, verification. Read it alongside this file.

Where `<topic>` is one of:

- A **tag** — matches all pages whose frontmatter `tags:` list includes it.
- A **folder path** under `wiki/` — all `.md` in that folder.
- A **single page path** — just that page (makes a single-root map).
- The literal string `all` — every page under `wiki/` (minus `index.md` and `log.md`).

`--include-wikilinks` adds a sub-branch per outbound `[[wikilink]]` discovered in the page body — useful for seeing inter-page structure, noisy for dense vaults.

## Step 1: Dependency Check

```bash
if ! which markmap >/dev/null 2>&1 && ! npx --no-install markmap-cli --version >/dev/null 2>&1; then
  echo "Installing markmap-cli globally…"
  pnpm add -g markmap-cli 2>/dev/null \
    || npm install -g markmap-cli 2>/dev/null \
    || { echo "⚠️  Could not install markmap-cli; falling back to Mermaid mindmap block."; USE_MERMAID_FALLBACK=1; }
fi
```

If `USE_MERMAID_FALLBACK=1`, skip markmap rendering and write a `.md` file with a `mermaid` mindmap block instead (Step 6 branch).

## Step 2: Resolve Vault + Topic

Reuse `generate-book` / `generate-slides` selection:

- `VAULT_DIR="vaults/<name>"`, `WIKI_DIR="$VAULT_DIR/wiki"`.
- Slugify the topic for filenames.
- Resolve topic to a sorted `PAGES=(...)` list.

If the list is empty, exit with a clear error.

(If this is the third duplicated copy of this logic in the codebase, lift it into `.claude/skills/generate/lib/select-pages.sh` as noted in `progress-phase-2b-presentation.txt`.)

## Step 3: Compute Source Hash

```bash
HASH=$(.claude/skills/generate/lib/source-hash.sh "${PAGES[@]}")
```

## Step 4: Build the Mindmap Outline (Markdown)

Markmap consumes a markdown file and treats each heading level as a branch depth. Build `$VAULT_DIR/artifacts/mindmap/<slug>-<date>.outline.md` with this shape:

```markdown
---
title: <Topic as Title Case>
markmap:
  colorFreezeLevel: 2
  maxWidth: 300
  duration: 400
---

# <Topic as Title Case>

## <First Page Title>
- <Section H2 from page>
  - <Subsection H3>
- <Another H2>
- [Source](<relative path to wiki/.../page.md>)

## <Second Page Title>
- …
```

For **each source page**, in sorted order:

1. Strip the page's own YAML frontmatter.
2. Extract the first `# H1` as the branch label; fall back to the filename (title-cased) if absent.
3. Emit each `## H2` in the page as a child bullet `-`; each `### H3` as a nested bullet (two-space indent).
4. Convert wikilinks:
   - If `--include-wikilinks` is set: append a `- Related:` sub-branch listing each unique outbound `[[page]]` as a child bullet with markdown link text `[page]()` (empty href — markmap renders the label).
   - Otherwise: inline wikilinks in the heading text as `*page*` (italic), same sed pass as sibling handlers.
5. Append a `- [Source](../../wiki/<relative-path>.md)` bullet so clicking a node in the rendered HTML jumps to the wiki page in the local file viewer.

Keep depth shallow. Markmap is beautiful at 3-4 levels; past 5 it turns into a scroll. H4+ headings get flattened into their parent branch as `- H4 title` bullets.

## Step 5: Template Resolution

Templates live at `.claude/skills/generate-mindmap/templates/`. A template is a markdown file with a `markmap:` YAML block controlling visual options — `colorFreezeLevel`, `maxWidth`, `initialExpandLevel`, etc. — followed by a `{{body}}` placeholder substituted by Step 4's outline.

Resolution order:

1. `--template <name>` → `.claude/skills/generate-mindmap/templates/<name>.md` OR `$VAULT_DIR/.templates/mindmap/<name>.md`.
2. Vault-local default — `$VAULT_DIR/.templates/mindmap/default.md`.
3. Global default — `.claude/skills/generate-mindmap/templates/default.md`.

## Step 6: Render

### Markmap (default path)

```bash
OUT="$VAULT_DIR/artifacts/mindmap/<slug>-<date>.html"
OUTLINE="$VAULT_DIR/artifacts/mindmap/<slug>-<date>.outline.md"

npx markmap-cli "$OUTLINE" -o "$OUT" --no-open
```

`markmap-cli` produces a self-contained HTML file — inline SVG, inline scripts, zero external dependencies. Works offline.

### Mermaid Fallback (`USE_MERMAID_FALLBACK=1`)

When markmap-cli is absent and install failed, emit a markdown file containing a `mermaid` mindmap block:

```bash
OUT="$VAULT_DIR/artifacts/mindmap/<slug>-<date>.md"

cat > "$OUT" <<EOF
# Mindmap: <Topic as Title Case>

\`\`\`mermaid
mindmap
  root((<Topic>))
$(printf '    %s\n' "${BRANCH_LINES[@]}")
\`\`\`

Source pages:
$(for p in "${PAGES[@]}"; do echo "- $p"; done)
EOF
```

Mermaid mindmaps render in Obsidian, GitHub, and anywhere mermaid is supported — losing interactivity but keeping the structure. Document this in the sidecar as `template: mermaid-fallback`.

## Step 7: Version Detection

Before writing the sidecar, check for an existing artifact of the same type and topic:

```bash
ARTIFACT_TYPE="mindmap"
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

## Step 8: Write the Sidecar

```bash
META="$VAULT_DIR/artifacts/mindmap/<slug>-<date>.meta.yaml"
cat > "$META" <<EOF
generator: generate-mindmap@0.1.0
generated-at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
template: ${TEMPLATE_NAME:-default}
renderer: ${USE_MERMAID_FALLBACK:+mermaid-fallback}${USE_MERMAID_FALLBACK:-markmap}
topic: "<raw topic argument>"
flags:
  include-wikilinks: ${INCLUDE_WIKILINKS:-false}
generated-from:
$(for p in "${PAGES[@]}"; do echo "  - $p"; done)
source-hash: $HASH
version: $VERSION
change-note: "<brief description of what changed, or 'Initial version' for v1>"
replaces: "$PREV_SLUG"
EOF
```

Schema matches `sites/docs/src/content/docs/reference/artifacts.md`.

## Step 9: Close the Loop (Quality Verify) — MANDATORY

Rubric §6 — every handler must run `verify-quick.sh` on its own output before reporting success.

```bash
.claude/skills/generate/lib/verify-quick.sh mindmap "$OUT" "$META"
QV_EXIT=$?
```

The check enforces:

- Outline has ≥ 12 leaf nodes and ≥ 3 levels of depth (rubric §2).
- At least some wikilink / source preservation happened (rubric §3 engagement count).
- Sidecar has `generated-from` + `source-hash`.

Warnings don't abort the flow — they surface in Step 11's report and get stamped into the sidecar's `quality:` block. A mindmap with 4 shallow branches fails the depth check and earns a `warn`; the user decides whether to broaden the topic or accept it.

### Optional: full round-trip (`--verify`)

If `--verify` was passed, also invoke:

```bash
/verify-artifact mindmap "$TOPIC" --vault "$VAULT_NAME"
```

This re-ingests the HTML's text layer into a scratch vault and scores coverage + Jaccard vs the originals. Slow (tens of seconds); opt-in by design.

## Step 10: Commit to Vault Repo

```bash
cd "$VAULT_DIR"
git add "artifacts/mindmap/<slug>-<date>."{outline.md,html,md,meta.yaml} 2>/dev/null
git diff --cached --quiet || git commit -m "🧠 mindmap: generate <topic> ($(date +%Y-%m-%d))"
```

## Step 11: Report to User

```
✅ Mindmap generated
   Topic:       <topic>
   Pages in:    <N> (sorted)
   Source hash: <first 12 chars>
   Renderer:    markmap  (or mermaid-fallback)
   Quality:     pass  (or warn: <list from verify-quick>)
   Outline:     vaults/<vault>/artifacts/mindmap/<slug>-<date>.outline.md
   HTML:        vaults/<vault>/artifacts/mindmap/<slug>-<date>.html
   Sidecar:     vaults/<vault>/artifacts/mindmap/<slug>-<date>.meta.yaml
   Open with:   open <absolute path to html>
```

If `--verify` was used, append the round-trip result (coverage, Jaccard, normalised fidelity, pass/fail).

## Embedding in Obsidian

Markmap HTML files can be opened via the [Obsidian HTML Reader plugin](https://github.com/nuthrash/obsidian-html-reader) or by a simple `<iframe>` embed in a dataview-enabled page:

```markdown
```dataviewjs
dv.el('iframe', '', {
  attr: { src: 'artifacts/mindmap/<slug>-<date>.html', width: '100%', height: '600' }
})
```

The fallback `.md` (Mermaid) renders natively in Obsidian with no plugin.

## Known Limitations (Phase 2B)

- **Heading hierarchy** drives the tree. Pages with flat headings (all H2) make wide, shallow maps. Pages without headings degrade to a single-node branch.
- **Wikilinks** are label-only — Markmap doesn't hyperlink to another markmap, only to external URLs or local files. The `[Source]()` link works when the HTML is opened from within the vault folder.
- **Large topics** (100+ pages) produce unusably wide maps. Use tag or folder scoping to keep under ~30 pages per map.
- **Image nodes** aren't supported — Markmap renders text only.

## See Also

- `.claude/skills/generate/lib/quality-rubric.md` — canonical rubric applied here.
- `.claude/skills/generate/lib/verify-quick.sh` — the mandatory close-the-loop check.
- `.claude/skills/verify-artifact/SKILL.md` — opt-in full round-trip fidelity test.
- `.claude/skills/generate/SKILL.md` — router that dispatches here.
- `.claude/skills/generate-slides/SKILL.md` — sibling presentation handler.
- `.claude/skills/generate/lib/source-hash.sh` — shared provenance hash.
- `sites/docs/src/content/docs/reference/artifacts.md` — sidecar schema.
