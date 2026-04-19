---
name: generate-pdf
description: Render a shareable PDF from a single wiki page or a folder of pages. Minimal print stylesheet — no title page, no TOC unless --toc passed. Renders mermaid diagrams inline. Closes the loop via verify-quick.sh. Used by /generate pdf. Not user-invocable directly — go through /generate.
user-invocable: false
allowed-tools: Bash(which *) Bash(brew *) Bash(pandoc *) Bash(node *) Bash(npx *) Bash(pnpm *) Bash(npm *) Bash(git *) Bash(mkdir *) Bash(date *) Bash(cat *) Bash(sed *) Bash(grep *) Bash(awk *) Read Write Glob Grep
---

# Generate PDF

Produce a quick, shareable PDF from a **single wiki page** or a **folder of pages** — without the book ceremony (no title page, no TOC by default).

Think of it as "print this page" rather than "compile a book."

## Usage (via /generate router)

```
/generate pdf <path> [--vault <name>] [--toc] [--template <name>]
```

Where `<path>` is:

- A **single page** relative to the wiki: `wiki/concepts/attention.md` or `concepts/attention.md`.
- A **folder** relative to the wiki: `concepts/rag/` — every `.md` inside, concatenated in filename order.

No tag-based selection (that's `/generate book`). No `all` target.

This handler applies `.claude/skills/generate/lib/quality-rubric.md` — the canonical rubric for scope, depth, engagement, source refs, verification. Read it alongside this file.

## Step 1: Dependency Check

Source the shared helper — same one `generate-book` uses. DRY.

```bash
source .claude/skills/generate/lib/ensure-pandoc.sh
ensure_pandoc || exit 1
ensure_latex_engine
```

## Step 2: Resolve Vault + Path

- `VAULT_DIR="vaults/<name>"`, `WIKI_DIR="$VAULT_DIR/wiki"`.
- Slugify the leaf of the path for output filename:
  - `wiki/concepts/attention.md` → `attention`
  - `concepts/rag/` → `rag`

Resolve the path to a list of source files:

| Input | Selection |
|-------|-----------|
| A `.md` file | That single file. |
| A folder | `find $PATH -maxdepth 1 -name '*.md'` — filename-order sort. Non-recursive by default (keeps output scope predictable). Pass `--recursive` for recursive descent. |

If the path doesn't exist or the folder contains no `.md` files, exit with a clear error showing the resolved absolute path.

## Step 3: Compute Source Hash

Always the shared helper — never a bespoke hash:

```bash
HASH=$(.claude/skills/generate/lib/source-hash.sh "${PAGES[@]}")
```

## Step 4: Build the Markdown Bundle

Minimal bundle — no title page, no chapter framing. The goal is to feel like "printed the page as-is."

For each source file (in the order from Step 2):

1. Strip the page's own YAML frontmatter.
2. Resolve wikilinks (same sed pass as `generate-book`):
   ```bash
   sed -E 's/\[\[([^|\]]+)\|([^\]]+)\]\]/*\2*/g; s/\[\[([^\]]+)\]\]/*\1*/g'
   ```
3. Rewrite relative image paths to absolute (so Pandoc can find them).
4. Concatenate. If more than one page, insert `\newpage` between them.

Prepend a tiny Pandoc YAML block. Unlike `generate-book`, don't set `documentclass: book` — use the default `article`:

```yaml
---
title: "<leaf-of-path as Title Case>"
date: "<YYYY-MM-DD>"
geometry: margin=1in
fontsize: 11pt
---
```

If only a single page, and its first non-frontmatter line is a `# H1`, use that H1 as the title and drop the YAML `title:` to avoid duplicate headings.

## Step 4.5: Render Mermaid Diagrams to Images

Run the shared helper before Pandoc so mermaid blocks become rendered images, not fenced code:

```bash
ASSETS_DIR="$VAULT_DIR/artifacts/pdf/assets-<slug>-<YYYY-MM-DD>"
RENDERED_BUNDLE="/tmp/generate-pdf-<slug>-<pid>.rendered.md"

.claude/skills/generate/lib/render-mermaid.sh \
  "$BUNDLE" "$RENDERED_BUNDLE" "$ASSETS_DIR" svg
BUNDLE="$RENDERED_BUNDLE"
```

If mermaid-cli is unavailable, the helper returns non-zero and leaves the fences in place — treat as a soft warning and continue.

## Step 4.6: Preserve Code-Snippet Source Refs

Rubric §4 — if a fenced code block appears and the source page's frontmatter `sources:` points at a repo (GitHub / GitLab / Confluence), append a `*Source: [path](url)*` caption beneath the block. If the body uses `file_path:line_number` markers, preserve them verbatim. Don't invent paths.

## Step 5: Render with Pandoc

```bash
OUT="$VAULT_DIR/artifacts/pdf/<slug>-<YYYY-MM-DD>.pdf"

RENDER_ARGS=()
if [ "$TOC_FLAG" = "1" ]; then
  RENDER_ARGS+=(--toc)
fi
if [ -f ".claude/skills/generate-pdf/templates/print.tex" ]; then
  RENDER_ARGS+=(--template ".claude/skills/generate-pdf/templates/print.tex")
fi

.claude/skills/generate/lib/render-pdf.sh "$BUNDLE" "$OUT" "${RENDER_ARGS[@]}"
```

The shared `render-pdf.sh` handles:

- Engine selection (xelatex / pdflatex / HTML fallback via `$PDF_ENGINE`, `$USE_HTML_FALLBACK`).
- Pandoc error tail + common-fix hints.
- Template override lookup.

`generate-pdf` does not roll its own pandoc invocation. If the shared helper doesn't support a pandoc flag you need, **extend the helper** rather than bypassing it.

### HTML fallback when LaTeX is absent

On machines without a LaTeX engine (xelatex / pdflatex), `render-pdf.sh` silently sets `USE_HTML_FALLBACK=1` and emits an **HTML file at the `.pdf` path** rather than failing. This mirrors `generate-book`, but this handler does **not** (yet) chain Playwright to convert the HTML back to a real PDF — see `.claude/skills/generate-book/html-to-pdf.mjs` for the pattern to port.

If you need a real PDF on a LaTeX-less machine:

1. Install a LaTeX engine: `brew install --cask mactex-no-gui` (or `basictex` for a smaller footprint).
2. Or port the Playwright pipeline — call `html-to-pdf.mjs` after Pandoc emits styled HTML.

The sidecar should reflect reality — add `renderer: html-fallback` to `flags:` when `USE_HTML_FALLBACK=1` so downstream tools can tell a real PDF from a renamed HTML file.

## Step 6: Version Detection

Before writing the sidecar, check for an existing artifact of the same type and topic:

```bash
ARTIFACT_TYPE="pdf"
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

## Step 7: Write the Sidecar

```bash
META="${OUT%.pdf}.meta.yaml"
cat > "$META" <<EOF
generator: generate-pdf@0.1.0
generated-at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
template: pdf-default
topic: "<raw path argument>"
flags:
  toc: ${TOC_FLAG:-false}
  recursive: ${RECURSIVE_FLAG:-false}
generated-from:
$(for p in "${PAGES[@]}"; do echo "  - $p"; done)
source-hash: $HASH
version: $VERSION
change-note: "<brief description of what changed, or 'Initial version' for v1>"
replaces: "$PREV_SLUG"
EOF
```

Same schema as `generate-book` — see `sites/docs/src/content/docs/reference/artifacts.md`.

## Step 7.5: Close the Loop (Quality Verify) — MANDATORY

Rubric §6 — every handler runs `verify-quick.sh` on its own output before reporting success.

```bash
.claude/skills/generate/lib/verify-quick.sh pdf "$OUT" "$META"
QV_EXIT=$?
```

Checks: size, word-count ≥ 400 (rubric §2), sidecar shape, at least one engagement technique (rubric §3). Warnings surface in the Step 9 report and stamp into the sidecar's `quality:` block.

## Step 8: Commit to Vault Repo

Defensive — `artifacts/` is gitignored by default. No-op is fine:

```bash
cd "$VAULT_DIR"
git add \
  "artifacts/pdf/<slug>-<YYYY-MM-DD>.pdf" \
  "artifacts/pdf/<slug>-<YYYY-MM-DD>.meta.yaml" \
  "artifacts/pdf/assets-<slug>-<YYYY-MM-DD>/"*.svg 2>/dev/null
git diff --cached --quiet || git commit -m "📄 pdf: generate <slug> ($(date +%Y-%m-%d))"
```

## Step 9: Report to User

```
✅ PDF generated
   Input:       <path>
   Pages:       <N>
   Source hash: <first 12 chars>
   Output:      vaults/<vault>/artifacts/pdf/<slug>-<date>.pdf
   Sidecar:     vaults/<vault>/artifacts/pdf/<slug>-<date>.meta.yaml
   Open with:   open <absolute path>
```

## Difference from /generate book

| Aspect | `generate-pdf` | `generate-book` |
|--------|----------------|-----------------|
| Input | one page, or one folder | tag, folder, file, or `all` |
| Title page | none | yes |
| Table of contents | opt-in via `--toc` | default on; opt out with `--no-toc` |
| Pandoc `documentclass` | `article` | `book` |
| Wikilinks | italic inline | italic inline |
| Mermaid | rendered to SVG via shared helper | rendered to SVG via shared helper |
| Per-page page break | only if multi-file | always (chapter-level) |
| Output folder | `artifacts/pdf/` | `artifacts/book/` |
| Generator string | `generate-pdf@0.1.0` | `generate-book@0.1.0` |

## Template Customisation

Override the print template by dropping a LaTeX template at `.claude/skills/generate-pdf/templates/print.tex` (or pass `--template <name>` mapping to that directory). Start from `pandoc -D latex` and simplify.

## Known Limitations

- Mermaid requires `@mermaid-js/mermaid-cli`; lazy-installed on first run. If install fails, blocks stay as code.
- Wikilinks are italicised inline text, not clickable hyperlinks.
- Cross-vault references are not resolved.
- Pandoc LaTeX fallback doesn't honour the HTML theme — on machines without Playwright, the PDF is monochrome.

## See Also

- `.claude/skills/generate/lib/quality-rubric.md` — canonical rubric applied here.
- `.claude/skills/generate/lib/render-mermaid.sh` — the mermaid pre-pass.
- `.claude/skills/generate/lib/verify-quick.sh` — the mandatory close-the-loop check.
- `.claude/skills/generate/SKILL.md` — router that dispatches here.
- `.claude/skills/generate-book/SKILL.md` — the other side of the 2A foundation pair.
- `.claude/skills/generate/lib/ensure-pandoc.sh` — shared dependency check.
- `.claude/skills/generate/lib/render-pdf.sh` — shared pandoc invocation.
- `.claude/skills/generate/lib/source-hash.sh` — shared provenance hash.
- `sites/docs/src/content/docs/reference/artifacts.md` — sidecar schema.
