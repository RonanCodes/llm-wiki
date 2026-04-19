---
name: generate-book
description: Render a beautifully-themed PDF book from wiki pages matching a topic. Renders mermaid diagrams inline, generates a Nano Banana cover illustration, adds drop caps, chapter openers, pull quotes, callouts, and key-takeaways boxes. Preserves code snippet source refs. Used by /generate book. Not user-invocable directly — go through /generate.
user-invocable: false
allowed-tools: Bash(which *) Bash(brew *) Bash(pandoc *) Bash(node *) Bash(npx *) Bash(pnpm *) Bash(npm *) Bash(git *) Bash(mkdir *) Bash(date *) Bash(cat *) Bash(sed *) Bash(grep *) Bash(awk *) Bash(cp *) Read Write Glob Grep Skill
---

# Generate Book

Concatenate wiki pages matching a topic into a **beautifully-themed** PDF book: rendered mermaid diagrams, a generated cover, drop caps, chapter opener pages, pull quotes, callouts, code-snippet source references, and key-takeaways boxes at the end of each chapter. The goal is to keep the learner engaged — not to ship a wall of prose.

Read `.claude/skills/generate/lib/quality-rubric.md` alongside this file — it is the single source of truth for scope, depth, engagement, source refs, and verification. This handler applies the rubric; it doesn't re-derive the rules.

## Usage (via /generate router)

```
/generate book <topic> [--vault <name>] [--no-toc] [--no-cover] [--template <name>] [--verify]
```

Where `<topic>` is one of:

- A **tag** (e.g. `attention`) — matches all pages whose frontmatter `tags:` list includes it.
- A **folder path** under `wiki/` (e.g. `concepts/rag`).
- A **single page path** (e.g. `wiki/concepts/attention.md`).
- The literal string `all` — renders every `.md` under `wiki/` (minus `index.md` and `log.md`).

| Flag | Default | Effect |
|------|---------|--------|
| `--no-toc` | off | Skip the table of contents. |
| `--no-cover` | off | Skip Nano Banana cover generation. |
| `--template <name>` | `book-default` | Use a named template from `templates/`. |
| `--verify` | off | After rendering, also run the heavy `/verify-artifact book <topic>` round-trip. |

## Step 1: Dependency Check

```bash
source .claude/skills/generate/lib/ensure-pandoc.sh
ensure_pandoc || exit 1
ensure_latex_engine   # sets PDF_ENGINE=xelatex|pdflatex, or USE_HTML_FALLBACK=1
```

The mermaid and cover steps lazy-install their own tooling — see Steps 4.5 and 4.6. The shared helper is the single source of truth for the pandoc side; don't duplicate install logic here.

## Step 2: Resolve Vault + Topic

```bash
mapfile -t PAGES < <(.claude/skills/generate/lib/select-pages.sh "$VAULT_DIR" "$TOPIC")
```

Slugify the topic for filenames: lowercase, spaces→`-`, drop non-`[a-z0-9-]`. If `$PAGES` is empty, exit 1 with a clear error showing the topic tried and suggesting `all` or a folder form.

## Step 3: Compute Source Hash

```bash
HASH=$(.claude/skills/generate/lib/source-hash.sh "${PAGES[@]}")
```

## Step 3.5: Scope Filter — "only the relevant parts"

Apply the rubric §1 rule: the bundle gets only sections of each page that bear on the topic.

For each page in `${PAGES[@]}`:

1. Build a topic vocabulary — the topic string + its obvious variants (singular/plural, hyphenated/spaced), plus any `tags:` from the page that textually contain the topic.
2. Split the page body by `## H2` headings into sections.
3. Keep a section if its heading contains a vocab word, OR ≥ 2 of its paragraphs contain a vocab word, OR it is the first (intro) / last (summary) section of the page.
4. Drop other sections. Log dropped section titles to stderr: `scope-filter: dropped 'Deploy notes' from attention.md`.
5. If every H2 section of a page would be dropped, keep the page's intro + H1 + a single stub line `*(See the full page for unrelated detail.)*` — never silently drop a whole page.

This is the "we don't need the full CDM model, just the relevant parts" rule. The dropped content isn't deleted from the wiki — only filtered out of *this* book.

## Step 4: Build the Markdown Bundle

Write `/tmp/generate-book-<slug>-<pid>.bundle.md` with the structure below. The `.bundle.md` suffix matters — `verify-quick.sh` looks for it to measure word count.

### 4a. Pandoc YAML metadata

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

### 4b. For each scoped source page (sorted order)

1. **Chapter opener page** — emit a dedicated spread before the chapter body:

   ```markdown
   <div class="chapter-opener">
     <div class="chapter-number">Chapter <N></div>
     <h1 class="chapter-title">{{page H1 or Title Case filename}}</h1>
     <div class="chapter-synopsis">{{one-line synopsis — first sentence of the page, trimmed}}</div>
   </div>

   <div style="page-break-after:always"></div>
   ```

2. **Drop cap** for the first paragraph: wrap the first letter in `<span class="dropcap">X</span>` so the CSS can style it.

3. **Resolve wikilinks** via sed (unchanged):

   ```bash
   sed -E 's/\[\[([^|\]]+)\|([^\]]+)\]\]/*\2*/g; s/\[\[([^\]]+)\]\]/*\1*/g'
   ```

4. **Preserve code-snippet source refs** (rubric §4):

   If the source page frontmatter has a `sources:` entry pointing at a repo (GitHub/GitLab/Confluence), attach that as a caption to any fenced code block in the page. If the page body contains `file_path:line_number` markers (e.g. `src/attention/handle.ts:42`), keep them verbatim. Don't invent paths when none exist.

   Transform:

   ```markdown
   ```typescript
   export function handleAttention() { ... }
   ```
   ```

   Into:

   ```markdown
   ```typescript
   export function handleAttention() { ... }
   ```
   *<small class="source-ref">Source: [`src/attention/handle.ts:42`](https://github.com/org/repo/blob/main/src/attention/handle.ts#L42)</small>*
   ```

5. **Pull quotes** — scan the section body for striking one-liners (short sentences flagged by the page author with leading `>` in the source, or Claude's judgement during bundling). Emit them with `<aside class="pullquote">…</aside>` so the CSS can render them large-and-amber-bordered.

6. **Callouts** — GitHub-style `> [!NOTE]`, `> [!TIP]`, `> [!WARN]` blocks render as coloured panels (see §5 CSS).

7. **Rewrite relative image paths** (`./assets/foo.png`, `raw/assets/foo.png`) to absolute so Pandoc can find them.

8. **Key takeaways** — at the end of each chapter, emit:

   ```markdown
   <div class="key-takeaways">

   ### Key takeaways

   - First takeaway
   - Second takeaway
   - Third takeaway

   </div>
   ```

   Generate the bullets by summarising the chapter — lean on the page's explicit `## Summary` / `## TL;DR` section if present; otherwise synthesise ≤ 5 bullets.

9. Append to the bundle with a `\newpage` between chapters.

## Step 4.5: Render Mermaid Diagrams to Images

Run the shared helper BEFORE Pandoc so mermaid blocks become real images, not fenced code:

```bash
ASSETS_DIR="$VAULT_DIR/artifacts/book/assets-<slug>-<YYYY-MM-DD>"
RENDERED_BUNDLE="/tmp/generate-book-<slug>-<pid>.rendered.md"

.claude/skills/generate/lib/render-mermaid.sh \
  "$BUNDLE" "$RENDERED_BUNDLE" "$ASSETS_DIR" svg
BUNDLE="$RENDERED_BUNDLE"
```

SVG is the right format for books — scales crisply in print and on-screen. The helper writes `mmd-1.svg`, `mmd-2.svg`, … into `$ASSETS_DIR` and rewrites the bundle to reference them. If `mmdc` (mermaid-cli) can't be installed, the helper falls through, leaves fenced code intact, and returns non-zero. Treat that as a soft warning: print `⚠️  mermaid diagrams left as code — install @mermaid-js/mermaid-cli for visuals` and continue.

Mermaid diagrams use the Observatory theme baked into the helper (dark background, amber/cyan/green lines) — so they match the book's theme without per-diagram config.

## Step 4.6: Generate a Cover with Nano Banana (optional, opt-out via `--no-cover`)

Rubric §7 — long-form artifacts get a cover. Books get a fun, themed, generated illustration.

1. Derive a one-line synopsis from the lead source page's first paragraph (trimmed to ~140 chars).
2. Pick a **style-of-the-week** deterministically from today's ISO week number mod 6 (see rubric §7 for the rotation). Lock this into the sidecar so regenerations pick the same style.
3. Detect **fun-mode** topics — if the topic string or vault domain looks playful (heuristic: matches `duck`, `llm wiki`, `debug`, `vibe`, `rubber`, or the vault's `CLAUDE.md` declares `tone: playful`), ask for on-the-nose literal imagery. Otherwise stick to editorial.
4. Build the cover prompt per the recipe in rubric §7.
5. Invoke `ro:generate-image` via the Skill tool:

   ```
   Skill(skill="ro:generate-image", args='<prompt> --output vaults/<vault>/artifacts/book/<slug>-<YYYY-MM-DD>.cover.png --size 1024x1536 --for slide --style illustration')
   ```

   `--size 1024x1536` gives a portrait book cover aspect ratio. `--for slide` + `--style illustration` already push the prompt toward the Observatory palette inside that skill.

6. Fallback: if `GEMINI_API_KEY` is unset or the skill returns a non-zero exit, skip the cover and emit `⚠️  cover skipped (see rubric §7 fallback)`. Don't block the book on this.

7. Inject the cover into Step 5's HTML as the very first page inside `<body>`:

   ```html
   <div class="book-cover">
     <img src="<absolute path to .cover.png>" alt="Book cover"/>
     <h1 class="cover-title">{{Topic Title Case}}</h1>
     <div class="cover-subtitle">An LLM Wiki book · {{YYYY-MM-DD}}</div>
   </div>
   <div style="page-break-after:always"></div>
   ```

   The title text is overlaid in CSS (amber on semi-transparent navy panel) rather than baked into the image — Nano Banana is unreliable at rendering text in images.

## Step 5: Render HTML with Pandoc + Inject Beautiful Theme

```bash
HTML_OUT="$VAULT_DIR/artifacts/book/<slug>-<YYYY-MM-DD>.html"

pandoc "$BUNDLE" -o "$HTML_OUT" --standalone --toc --toc-depth=3 \
  --metadata title="<Topic as Title Case>" \
  --metadata subtitle="An LLM Wiki book" \
  --metadata date="<YYYY-MM-DD>"
```

Then inject the full Observatory theme CSS — this is bigger than the old stub. Keep it inline in the HTML so the file stays self-contained.

**CSS responsibilities:**

```css
/* Root & body — Observatory palette, generous air */
html { background: #0b0f14; }
body {
  max-width: 1100px; margin: 0 auto; padding: 3rem 3.5rem;
  background: #0f172a; color: #e8eef6;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 18px; line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}

/* Headings — role-coloured per the palette */
h1 { color: #e0af40; font-size: 2.6rem; letter-spacing: -0.01em; margin: 3rem 0 1rem; }
h2 { color: #5bbcd6; font-size: 1.8rem; margin-top: 2.5rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.4rem; }
h3 { color: #7dcea0; font-size: 1.35rem; margin-top: 2rem; }

/* Book cover — first page */
.book-cover { position: relative; min-height: 90vh; display: flex; flex-direction: column; justify-content: flex-end; padding: 2rem; }
.book-cover img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; border-radius: 0; }
.cover-title { position: relative; z-index: 2; color: #e0af40; font-size: 3.6rem; line-height: 1.05; background: rgba(11,15,20,0.72); padding: 1.2rem 1.6rem; backdrop-filter: blur(3px); }
.cover-subtitle { position: relative; z-index: 2; color: #e8eef6; font-size: 1.1rem; background: rgba(11,15,20,0.72); padding: 0.6rem 1.6rem; }

/* Chapter opener */
.chapter-opener { min-height: 70vh; display: flex; flex-direction: column; justify-content: center; padding: 4rem 2rem; border-top: 6px solid #e0af40; margin-top: 2rem; }
.chapter-number { color: #64748b; letter-spacing: 0.25em; text-transform: uppercase; font-size: 0.85rem; margin-bottom: 1rem; }
.chapter-title { color: #e0af40; font-size: 3rem; margin: 0 0 1rem; font-weight: 700; }
.chapter-synopsis { color: #cbd5e1; font-size: 1.2rem; font-style: italic; max-width: 36rem; }

/* Drop cap — amber serif initial letter */
.dropcap { font-family: 'Fraunces', 'Playfair Display', Georgia, serif; font-size: 4.2rem; line-height: 1; float: left; color: #e0af40; padding: 0.25rem 0.75rem 0 0; font-weight: 700; }

/* Pull quote — amber left border, large italic */
.pullquote { margin: 2.5rem 2rem; padding: 1rem 1.5rem 1rem 2rem; border-left: 4px solid #e0af40; color: #f1f5f9; font-size: 1.3rem; font-style: italic; line-height: 1.45; }

/* Callouts — GitHub-style, coloured panels */
blockquote.note, blockquote:has(p:first-child:is(:contains('[!NOTE]'))) { border-left: 4px solid #5bbcd6; background: rgba(91,188,214,0.08); padding: 1rem 1.25rem; border-radius: 6px; margin: 1.5rem 0; }
blockquote.tip  { border-left: 4px solid #7dcea0; background: rgba(125,206,160,0.08); padding: 1rem 1.25rem; border-radius: 6px; }
blockquote.warn { border-left: 4px solid #e0af40; background: rgba(224,175,64,0.10); padding: 1rem 1.25rem; border-radius: 6px; }

/* Key takeaways box — end-of-chapter summary */
.key-takeaways { margin: 3rem 0; padding: 1.5rem 2rem; background: linear-gradient(135deg, rgba(224,175,64,0.08), rgba(91,188,214,0.06)); border: 1px solid #1e293b; border-radius: 10px; }
.key-takeaways h3 { color: #e0af40; margin-top: 0; border: none; }
.key-takeaways ul { margin: 0; padding-left: 1.2rem; }
.key-takeaways li { margin: 0.4rem 0; }

/* Code blocks — JetBrains Mono, cyan border, surface colour */
pre { background: #1e293b; border-left: 3px solid #5bbcd6; border-radius: 6px; padding: 1rem 1.25rem; overflow-x: auto; font-family: 'JetBrains Mono', 'SF Mono', Menlo, monospace; font-size: 0.92rem; line-height: 1.55; }
code { font-family: 'JetBrains Mono', monospace; background: rgba(91,188,214,0.10); color: #a7d8e6; padding: 0.1rem 0.35rem; border-radius: 3px; font-size: 0.92em; }
pre code { background: transparent; padding: 0; color: #e8eef6; }

/* Source ref caption below code blocks */
.source-ref { display: block; margin-top: -0.3rem; font-size: 0.82rem; color: #94a3b8; }
.source-ref a { color: #5bbcd6; text-decoration: none; border-bottom: 1px dotted #5bbcd6; }

/* Mermaid diagrams — centered, max-width, captioned */
img[alt^="diagram"] { display: block; margin: 2rem auto; max-width: 100%; height: auto; border-radius: 8px; background: #0b0f14; padding: 1rem; }

/* Tables */
table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
th { text-align: left; color: #e0af40; border-bottom: 2px solid #1e293b; padding: 0.5rem 0.75rem; }
td { border-bottom: 1px solid #1e293b; padding: 0.5rem 0.75rem; vertical-align: top; }

/* Links */
a { color: #5bbcd6; text-decoration: none; border-bottom: 1px solid rgba(91,188,214,0.35); }
a:hover { border-bottom-color: #5bbcd6; }

/* TOC */
#TOC, .toc { border: 1px solid #1e293b; border-radius: 8px; padding: 1.5rem 2rem; background: #0b0f14; }
#TOC a, .toc a { color: #cbd5e1; border: none; }
#TOC a:hover { color: #5bbcd6; }
```

Remember: this is a *lot* of CSS. Keep it in a separate template file at `.claude/skills/generate-book/templates/observatory.css` and `sed`-inject it into the Pandoc output, rather than duplicating it inline in the handler script.

## Step 5b: Convert HTML to PDF via Playwright

Unchanged from the prior version:

```bash
PDF_OUT="$VAULT_DIR/artifacts/book/<slug>-<YYYY-MM-DD>.pdf"
node .claude/skills/generate-book/html-to-pdf.mjs "$HTML_OUT" "$PDF_OUT" --format A4
```

The Playwright converter honours `@media print` rules (chapter page breaks, widow/orphan control, header/footer) — already in place in `html-to-pdf.mjs`.

If Playwright is unavailable, fall through to the Pandoc LaTeX pipeline via `.claude/skills/generate/lib/render-pdf.sh`. Document that in the sidecar (`renderer: pandoc-latex`).

## Step 6: Version Detection

Unchanged — look for an existing sidecar of the same type + topic, bump version, record `replaces:`. In-place edits for CSS tweaks keep the version; content changes bump it.

## Step 7: Write the Sidecar

```yaml
generator: generate-book@0.2.0
generated-at: <UTC ISO 8601>
template: book-default
topic: "<raw topic argument>"
flags:
  toc: ${TOC_FLAG:-true}
  cover: ${COVER_FLAG:-true}
cover:
  enabled: true|false
  style: "<style-of-the-week>"
  path: "artifacts/book/<slug>-<date>.cover.png"
mermaid:
  rendered: <N blocks>
  assets_dir: "artifacts/book/assets-<slug>-<date>"
scope_filter:
  dropped_sections: <N>
generated-from:
  - <each page>
source-hash: <HASH>
version: <N>
change-note: "<what changed or 'Initial version'>"
replaces: "<prev slug or empty>"
```

The shape matches `sites/docs/src/content/docs/reference/artifacts.md`. The new `cover:`, `mermaid:`, and `scope_filter:` blocks are additive — existing tooling ignores them.

## Step 8: Quality Verify (close-the-loop) — MANDATORY

Always run the cheap quality check before reporting success:

```bash
.claude/skills/generate/lib/verify-quick.sh book "$PDF_OUT" "$META"
QV_EXIT=$?
```

`verify-quick.sh` checks rubric §§ 1-4: size, word-count floor (≥ 3,000 words + ≥ 3 chapters for a book), engagement technique count (≥ 3), sidecar shape. It patches a `quality:` block into the sidecar and prints a pass/warn report.

**Don't swallow the warnings.** Surface them in Step 10's report so the user decides whether to regenerate.

If `--verify` was passed, additionally invoke the heavy round-trip:

```bash
/verify-artifact book "$TOPIC" --vault "$VAULT_NAME"
```

That does full re-ingest and coverage/Jaccard scoring. Takes ~30s per book; opt-in only.

## Step 9: Commit to Vault Repo

Artifacts are gitignored by default — the `git add` may be a no-op. That's fine. When the user has opted in:

```bash
cd "$VAULT_DIR"
git add \
  artifacts/book/<slug>-<date>.pdf \
  artifacts/book/<slug>-<date>.html \
  artifacts/book/<slug>-<date>.cover.png \
  artifacts/book/assets-<slug>-<date>/*.svg \
  artifacts/book/<slug>-<date>.meta.yaml 2>/dev/null
git diff --cached --quiet || git commit -m "📚 book: generate <topic> ($(date +%Y-%m-%d))"
```

## Step 10: Report to User

```
✅ Book generated
   Topic:         <topic>
   Pages in:      <N> (sorted, <M> sections scope-filtered out)
   Source hash:   <first 12 chars of hash>
   Mermaid:       <N> diagrams rendered
   Cover:         <style-of-the-week> via Nano Banana  (or "skipped: no GEMINI_API_KEY")
   Quality:       pass   (or warn: <list>)
   Cover image:   vaults/<vault>/artifacts/book/<slug>-<date>.cover.png
   HTML:          vaults/<vault>/artifacts/book/<slug>-<date>.html
   PDF:           vaults/<vault>/artifacts/book/<slug>-<date>.pdf
   Sidecar:       vaults/<vault>/artifacts/book/<slug>-<date>.meta.yaml
   Open HTML:     open <abs html path>
   Open PDF:      open <abs pdf path>

   Suggestion: run `/verify-artifact book <topic>` for a full round-trip fidelity check.
```

## Template Customisation

- CSS lives at `.claude/skills/generate-book/templates/observatory.css`. Edit it to change the theme globally; per-vault overrides at `vaults/<vault>/.artifacts-templates/book.css`.
- Pandoc LaTeX template at `.claude/skills/generate-book/templates/book.tex` (only used on Playwright fallback).
- Cover prompt recipe lives in `quality-rubric.md §7`. Tune per-vault by dropping `vaults/<vault>/.artifacts-templates/cover-prompt.md`.

## Known Limitations

- **Cover text rendering** — Nano Banana is unreliable at drawing readable text in images, so the title is CSS-overlaid on top of the generated art. This is intentional, not a bug.
- **Mermaid-cli install** takes ~30s the first time (Chromium-ish dependency via Puppeteer). Subsequent books reuse the installed binary.
- **Scope filter is heuristic** — based on H2 sections + vocabulary match. For topics where a section is relevant but doesn't name the topic (e.g. "Caching" under an "Attention" book), the filter may drop it. Review the stderr log and widen with `--with-section <heading>` (future flag).
- **Code-snippet source refs** depend on the source page having `sources:` frontmatter pointing at a repo. Pages without that field produce uncaptioned snippets — correct behaviour, per the rubric.
- **Pandoc LaTeX fallback** does not honour the Observatory CSS — the dark theme is lost on that path. Install Playwright to keep the theme.

## See Also

- `.claude/skills/generate/lib/quality-rubric.md` — THE canonical rubric for scope, depth, engagement, source refs, verification, covers.
- `.claude/skills/generate/lib/render-mermaid.sh` — the mermaid pre-pass.
- `.claude/skills/generate/lib/verify-quick.sh` — the mandatory close-the-loop check.
- `.claude/skills/generate-book/html-to-pdf.mjs` — Playwright HTML → PDF converter.
- `ro:generate-image` — Nano Banana wrapper used for the cover.
- `.claude/skills/verify-artifact/SKILL.md` — opt-in full round-trip fidelity test.
- `sites/docs/src/content/docs/reference/artifacts.md` — sidecar schema.
