---
name: generate-book
description: Render a PDF book from wiki pages matching a topic. Concatenates pages, preserves headings, resolves wikilinks, runs Pandoc. Lazy-installs pandoc. Used by /generate book. Not user-invocable directly — go through /generate.
user-invocable: false
allowed-tools: Bash(which *) Bash(brew *) Bash(pandoc *) Bash(git *) Bash(mkdir *) Bash(date *) Bash(cat *) Bash(sed *) Bash(grep *) Bash(awk *) Read Write Glob Grep
---

# Generate Book

Concatenate wiki pages matching a topic into a Pandoc-rendered PDF book with a title page, table of contents, and preserved cross-references.

## Usage (via /generate router)

```
/generate book <topic> [--vault <name>] [--no-toc] [--template <name>]
```

Where `<topic>` is one of:

- A **tag** (e.g. `attention`) — matches all pages whose frontmatter `tags:` list includes it.
- A **folder path** under `wiki/` (e.g. `concepts/rag`) — renders every `.md` in that folder.
- A **single page path** (e.g. `wiki/concepts/attention.md`) — renders just that page.
- The literal string `all` — renders every `.md` under `wiki/` (minus `index.md` and `log.md`).

## Step 1: Dependency Check

Source the shared helper. It lazy-installs pandoc (via brew / apt) and picks a LaTeX engine, exporting `PDF_ENGINE` and `USE_HTML_FALLBACK`:

```bash
source .claude/skills/generate/lib/ensure-pandoc.sh
ensure_pandoc || exit 1
ensure_latex_engine   # sets PDF_ENGINE=xelatex|pdflatex, or USE_HTML_FALLBACK=1
```

Do NOT duplicate install/probe logic in the handler body — the shared helper is the single source of truth.

## Step 2: Resolve Vault + Topic

- Vault is already resolved by the /generate router (forwarded via `--vault <name>`).
- `VAULT_DIR="vaults/<name>"`, `WIKI_DIR="$VAULT_DIR/wiki"`.
- Slugify the topic for filenames: lowercase, spaces→`-`, drop non-`[a-z0-9-]`.

Resolve the topic to a list of source page paths:

| Topic form | Selection |
|------------|-----------|
| `all` | `find $WIKI_DIR -name '*.md' -not -name 'index.md' -not -name 'log.md'` |
| Folder path | `find $WIKI_DIR/<folder> -name '*.md'` |
| Single `.md` path | just that file |
| Tag | Glob `$WIKI_DIR/**/*.md`, for each read the YAML frontmatter, include file if the `tags:` list contains the topic |

Sort the resulting list deterministically (lexicographic) — this is both the concatenation order and the input order to the source-hash helper.

If the list is empty, exit with a clear error that shows the topic tried and suggests either checking tags or using an `all` / folder form.

## Step 3: Compute Source Hash

```bash
HASH=$(.claude/skills/generate/lib/source-hash.sh "${PAGES[@]}")
```

Stamp this into the sidecar. Handlers MUST NOT roll their own hash — the shared helper is the single source of truth for canonicalisation.

## Step 4: Build the Markdown Bundle

Write a temporary combined markdown file (`/tmp/generate-book-<slug>-<pid>.md`) with:

1. **Title page** — Pandoc YAML metadata block:

   ```yaml
   ---
   title: "<Topic as Title Case>"
   subtitle: "An LLM Wiki book"
   date: "<YYYY-MM-DD>"
   toc: true                      # unless --no-toc passed
   toc-depth: 3
   documentclass: book
   geometry: margin=1in
   ---
   ```

2. **For each source page**, in sorted order:

   a. Strip the page's own YAML frontmatter (everything between the first `---\n` and the next `---\n`).

   b. If the first remaining non-blank line is a `# H1`, keep it (becomes a chapter heading). If not, synthesize one from the filename: `# <Filename as Title Case>`.

   c. Demote nested headings by one level so the H1 is the chapter and H2/H3 become sections (Pandoc's `--shift-heading-level-by=0` suffices if we keep this manual, but easier is: leave headings alone and rely on `documentclass: book` to treat H1 as chapter).

   d. Resolve wikilinks:

      - `[[page-name]]` → *`page-name`* (emphasised inline). Simplest and survives PDF rendering.
      - `[[page-name|display text]]` → *`display text`*.

      Use a sed pass:

      ```bash
      sed -E 's/\[\[([^|\]]+)\|([^\]]+)\]\]/*\2*/g; s/\[\[([^\]]+)\]\]/*\1*/g'
      ```

   e. Rewrite relative image paths (`./assets/foo.png`, `raw/assets/foo.png`) to absolute paths so Pandoc can find them. Images under `raw/assets/` get rewritten to `$VAULT_DIR/raw/assets/foo.png`.

   f. Mermaid code blocks: **leave as-is** for now. In phase 2A, mermaid blocks survive as fenced code blocks in the PDF (readable, not rendered). Phase 2B can add a `mermaid-cli → static PNG` pre-pass. Document this limitation in the "Known Limitations" section below.

   g. Append to the bundle, separated by a page-break (`\newpage` LaTeX or `<div style="page-break-before:always"></div>` HTML).

## Step 5: Render with Pandoc

Delegate to the shared render helper. It picks engine/fallback based on the env vars set by `ensure_latex_engine` in Step 1, handles error tail + fix hints, and supports template override:

```bash
OUT="$VAULT_DIR/artifacts/book/<slug>-<YYYY-MM-DD>.pdf"

RENDER_ARGS=(--toc)                            # drop --toc if --no-toc was passed
if [ -f ".claude/skills/generate-book/templates/book.tex" ]; then
  RENDER_ARGS+=(--template ".claude/skills/generate-book/templates/book.tex")
fi

.claude/skills/generate/lib/render-pdf.sh "$BUNDLE" "$OUT" "${RENDER_ARGS[@]}"
```

The helper:

- Uses `$PDF_ENGINE` (xelatex / pdflatex) when set.
- Falls back to HTML output when `USE_HTML_FALLBACK=1` — writes `$OUT.html` and tells the user how to install a LaTeX engine.
- Tails the last 20 lines of pandoc stderr on failure and suggests the common fixes (missing LaTeX package → `tlmgr install`, unicode → `--pdf-engine=xelatex`, image-path issues, font issues).
- Exits 0 on success, 2 on render failure, 3 on bad arguments, 4 if pandoc is absent.

## Step 6: Version Detection

Before writing the sidecar, check for an existing artifact of the same type and topic:

```bash
ARTIFACT_TYPE="book"
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
generator: generate-book@0.1.0
generated-at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
template: book-default
topic: "<raw topic argument>"
flags:
  toc: ${TOC_FLAG:-true}
generated-from:
$(for p in "${PAGES[@]}"; do echo "  - $p"; done)
source-hash: $HASH
version: $VERSION
change-note: "<brief description of what changed, or 'Initial version' for v1>"
replaces: "$PREV_SLUG"
EOF
```

Format must match the schema in `sites/docs/src/content/docs/reference/artifacts.md`.

## Step 8: Commit to Vault Repo

Artifacts live in a gitignored directory by default. If the user has opted into tracking artifacts (custom per-vault config), commit:

```bash
cd "$VAULT_DIR"
# respect .gitignore — this will be a no-op if artifacts/ is gitignored
git add artifacts/book/<slug>-<YYYY-MM-DD>.pdf artifacts/book/<slug>-<YYYY-MM-DD>.meta.yaml 2>/dev/null
git diff --cached --quiet || git commit -m "📚 book: generate <topic> ($(date +%Y-%m-%d))"
```

Do not fail if the add is a no-op — gitignored artifacts are the default and expected path.

## Step 9: Report to User

```
✅ Book generated
   Topic:       <topic>
   Pages in:    <N> (sorted)
   Source hash: <first 12 chars of hash>
   Output:      vaults/<vault>/artifacts/book/<slug>-<date>.pdf
   Sidecar:     vaults/<vault>/artifacts/book/<slug>-<date>.meta.yaml
   Open with:   open <absolute path to pdf>
```

## Template Customisation

Default template = Pandoc's built-in book template (implicit when `documentclass: book`).

To customise:

1. Start from the default: `pandoc -D latex > my-book.tex`.
2. Save it to `.claude/skills/generate-book/templates/book.tex`.
3. Edit to taste (fonts, headers, cover).
4. Re-run `/generate book <topic>`; the skill auto-detects and uses the override.

Per-vault overrides can live at `vaults/<vault>/.artifacts-templates/book.tex` — a future enhancement, not in phase 2A.

## Known Limitations (Phase 2A)

- **Mermaid diagrams** render as fenced code blocks, not images. Phase 2B adds a `mermaid-cli → PNG` pre-pass.
- **Wikilinks** render as emphasised inline text, not clickable links. Phase 2B adds internal `\hyperref` targets.
- **Cross-vault references** are not resolved — `[[vault:page]]` is not a thing.
- **Auto page breaks** between wiki pages use `\newpage`; a page-per-chapter feel may insert blanks. Use `--no-toc` + manual spacing if it matters.

## See Also

- `.claude/skills/generate/SKILL.md` — router that dispatches here.
- `.claude/skills/generate-pdf/SKILL.md` — sibling handler for non-book single-page PDFs.
- `.claude/skills/generate/lib/source-hash.sh` — shared hash helper. Always call this.
- `sites/docs/src/content/docs/reference/artifacts.md` — sidecar schema and convention.
