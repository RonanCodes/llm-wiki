---
name: generate-slides
description: Render a Marp (default) or Reveal.js slide deck from wiki pages matching a topic. Writes HTML + PDF to artifacts/slides/ with sidecar provenance. Lazy-installs Marp CLI. Used by /generate slides. Not user-invocable directly — go through /generate.
user-invocable: false
allowed-tools: Bash(which *) Bash(npx *) Bash(pnpm *) Bash(brew *) Bash(pandoc *) Bash(git *) Bash(mkdir *) Bash(date *) Bash(cat *) Bash(sed *) Bash(grep *) Bash(awk *) Read Write Glob Grep
---

# Generate Slides

Produce a slide deck from wiki pages matching a topic. Default renderer is **Marp** (self-contained HTML + PDF); `--format reveal` switches to Reveal.js via Pandoc.

Artifact-first — slides are written under `vaults/<vault>/artifacts/slides/`, **not** into the wiki. The Marp source markdown is preserved alongside the rendered output so it can be re-rendered without re-running the handler.

## Usage (via /generate router)

```
/generate slides <topic> [--vault <name>] [--format marp|reveal] [--template <name>] [--no-pdf]
```

Where `<topic>` is one of:

- A **tag** (e.g. `attention`) — matches all pages whose frontmatter `tags:` list includes it.
- A **folder path** under `wiki/` (e.g. `concepts/rag`) — all `.md` in that folder.
- A **single page path** (e.g. `wiki/concepts/attention.md`) — just that page.
- The literal string `all` — every page under `wiki/` (minus `index.md` and `log.md`).

Topic resolution is identical to `/generate book` — same pages → same slides.

## Step 1: Dependency Check

For Marp (default):

```bash
if ! which marp >/dev/null 2>&1 && ! npx --no-install @marp-team/marp-cli --version >/dev/null 2>&1; then
  echo "Installing Marp CLI globally…"
  # npm first — it's always present wherever node is, and doesn't need
  # `pnpm setup` to have been run first. pnpm -g silently no-ops (or errors
  # with ERR_PNPM_NO_GLOBAL_BIN_DIR) on machines that haven't run setup.
  npm install -g @marp-team/marp-cli 2>/dev/null \
    || pnpm add -g @marp-team/marp-cli 2>/dev/null \
    || echo "⚠️  Could not install marp-cli; falling back to npx (slower, downloads on every run)"
fi
```

For Reveal.js (`--format reveal`): use the shared Pandoc helper:

```bash
source .claude/skills/generate/lib/ensure-pandoc.sh
ensure_pandoc || exit 1
```

No LaTeX engine is needed for slides — we render to HTML.

## Step 2: Resolve Vault + Topic

Reuse the selection logic from `generate-book` (deterministic sort included). Do not reimplement — if the logic ever drifts between handlers, lift it into `.claude/skills/generate/lib/select-pages.sh`.

- `VAULT_DIR="vaults/<name>"`, `WIKI_DIR="$VAULT_DIR/wiki"`.
- Slugify the topic for filenames.
- Resolve topic to `PAGES=(...)` (sorted lexicographic).

If the list is empty, exit with a clear error.

## Step 3: Compute Source Hash

```bash
HASH=$(.claude/skills/generate/lib/source-hash.sh "${PAGES[@]}")
```

## Step 4: Build the Marp Markdown

Write `$VAULT_DIR/artifacts/slides/<slug>-<date>.marp.md` with:

1. **Marp frontmatter** — template-selected (see Step 5 for template resolution):

   ```markdown
   ---
   marp: true
   theme: default
   paginate: true
   title: "<Topic as Title Case>"
   author: "LLM Wiki"
   ---
   ```

2. **Title slide** — the first slide of the deck:

   ```markdown
   # <Topic as Title Case>

   <sub>Generated <YYYY-MM-DD> from <N> wiki pages</sub>
   ```

3. **One section per source page**, in sorted order:

   a. Strip the page's own YAML frontmatter.

   b. Resolve wikilinks (same sed pass as other handlers — factored once, reused):

      ```bash
      sed -E 's/\[\[([^|\]]+)\|([^\]]+)\]\]/*\2*/g; s/\[\[([^\]]+)\]\]/*\1*/g'
      ```

   c. Convert each `## Heading` into a slide break: emit `\n---\n\n## Heading\n` (Marp uses `---` as the slide separator — same character as YAML, which is fine because the frontmatter only has the leading pair).

   d. Truncate slides that would overflow. Marp does not auto-paginate content — a slide with 40 bullets runs off the screen. Apply a soft rule: if a slide body exceeds ~12 lines, break it at the next blank line and continue on the following slide with `## <heading> (cont.)`.

   e. Rewrite relative image paths to absolute (same as `generate-book`) so Marp can find images.

   f. Mermaid code blocks — leave as-is. Marp does not render mermaid natively; Phase 2B can layer a pre-pass that swaps each block for a rendered PNG.

4. **Closing "Sources" slide** listing the source pages as wikilinks rendered as italic text:

   ```markdown
   ---

   ## Sources

   - *concepts/attention*
   - *concepts/rag*
   - …
   ```

## Step 5: Template Resolution

Templates live under `.claude/skills/generate-slides/templates/` and are keyed by name — e.g. `default.md`, `dark.md`, `academic.md`.

Resolution order (first hit wins):

1. `--template <name>` flag → `.claude/skills/generate-slides/templates/<name>.md` **OR** `$VAULT_DIR/.templates/slides/<name>.md`.
2. Vault-local default — `$VAULT_DIR/.templates/slides/default.md` if present.
3. Global default — `.claude/skills/generate-slides/templates/default.md`.

A template is a Marp markdown file with `{{title}}`, `{{author}}`, `{{date}}`, and `{{body}}` placeholder substitutions. Keep templates minimal — Marp themes do the heavy lifting.

Per-vault overrides at `$VAULT_DIR/.templates/slides/` let a vault ship its own house style without polluting the shared handler.

## Step 6: Render

### Marp (default)

```bash
MARP_SRC="$VAULT_DIR/artifacts/slides/<slug>-<date>.marp.md"
HTML_OUT="$VAULT_DIR/artifacts/slides/<slug>-<date>.html"
PDF_OUT="$VAULT_DIR/artifacts/slides/<slug>-<date>.pdf"

# HTML — always
npx @marp-team/marp-cli "$MARP_SRC" --html -o "$HTML_OUT" --allow-local-files

# PDF — unless --no-pdf passed
if [ "$NO_PDF" != "1" ]; then
  npx @marp-team/marp-cli "$MARP_SRC" --pdf -o "$PDF_OUT" --allow-local-files
fi
```

### Reveal.js (`--format reveal`)

Pandoc ships a Reveal.js writer. Renders a single HTML file:

```bash
HTML_OUT="$VAULT_DIR/artifacts/slides/<slug>-<date>.html"
pandoc -t revealjs -s -o "$HTML_OUT" \
  --slide-level=2 \
  -V revealjs-url=https://unpkg.com/reveal.js@5 \
  "$MARP_SRC"
```

Reveal decks are HTML-only (no PDF) in this phase — printing reveal to PDF is a browser trick and brittle. If needed, document the Chromium print-to-PDF workflow in the limitations section.

## Step 7: Version Detection

Before writing the sidecar, check for an existing artifact of the same type and topic:

```bash
ARTIFACT_TYPE="slides"
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
META="$VAULT_DIR/artifacts/slides/<slug>-<date>.meta.yaml"
cat > "$META" <<EOF
generator: generate-slides@0.1.0
generated-at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
template: ${TEMPLATE_NAME:-default}
format: ${FORMAT:-marp}
topic: "<raw topic argument>"
flags:
  no-pdf: ${NO_PDF:-false}
generated-from:
$(for p in "${PAGES[@]}"; do echo "  - $p"; done)
source-hash: $HASH
version: $VERSION
change-note: "<brief description of what changed, or 'Initial version' for v1>"
replaces: "$PREV_SLUG"
EOF
```

Schema matches `sites/docs/src/content/docs/reference/artifacts.md`.

## Step 9: Commit to Vault Repo

`artifacts/` is gitignored by default — git add is a safe no-op:

```bash
cd "$VAULT_DIR"
git add "artifacts/slides/<slug>-<date>."{marp.md,html,pdf,meta.yaml} 2>/dev/null
git diff --cached --quiet || git commit -m "🎞️  slides: generate <topic> ($(date +%Y-%m-%d))"
```

## Step 10: Report to User

```
✅ Slides generated
   Topic:       <topic>
   Format:      marp
   Pages in:    <N> (sorted)
   Source hash: <first 12 chars>
   Marp source: vaults/<vault>/artifacts/slides/<slug>-<date>.marp.md
   HTML:        vaults/<vault>/artifacts/slides/<slug>-<date>.html
   PDF:         vaults/<vault>/artifacts/slides/<slug>-<date>.pdf
   Sidecar:     vaults/<vault>/artifacts/slides/<slug>-<date>.meta.yaml
   Open with:   open <absolute path to html>
```

## Format Choice: Marp vs Reveal.js

| Aspect | Marp | Reveal.js |
|--------|------|-----------|
| Output | HTML + PDF | HTML only |
| Self-contained | ✅ single HTML | 🟨 pulls revealjs from CDN (configurable) |
| Theming | Themes + CSS | Themes + CSS |
| Speaker notes | ✅ | ✅ |
| PDF quality | excellent | browser print (skip in this phase) |
| Obsidian preview | ✅ (Marp Slides plugin) | ❌ |
| Default | **yes** | opt-in via `--format reveal` |

Pick Marp unless you specifically want Reveal's navigation/fragment model.

## Template Customisation

Ship a template at `.claude/skills/generate-slides/templates/<name>.md`. Minimal example:

```markdown
---
marp: true
theme: default
paginate: true
class: lead
title: "{{title}}"
author: "{{author}}"
---

# {{title}}

<sub>{{date}}</sub>

{{body}}
```

Per-vault house style lives at `<vault>/.templates/slides/default.md` — picked up automatically with no flag.

## Known Limitations (Phase 2B)

- **Mermaid** still renders as a code block. A pre-pass using `mermaid-cli → PNG` is tracked for Phase 2B closure; slides handler inherits the fix.
- **Images** must be reachable from `$VAULT_DIR` (Marp `--allow-local-files`).
- **Slide overflow** is best-effort — content packing hinges on the LLM writing slide-friendly prose (short bullets, one idea per slide). The topic content is the biggest lever on readability, not the template.
- **Reveal.js PDF** is omitted — use a browser's print-to-PDF if needed.

## See Also

- `.claude/skills/generate/SKILL.md` — router that dispatches here.
- `.claude/skills/generate-book/SKILL.md` / `.claude/skills/generate-pdf/SKILL.md` — sibling handlers using the same conventions.
- `.claude/skills/generate/lib/source-hash.sh` — always call this, never roll your own hash.
- `.claude/skills/slides/SKILL.md` — legacy shim that points to this handler.
- `sites/docs/src/content/docs/reference/artifacts.md` — sidecar schema and convention.
