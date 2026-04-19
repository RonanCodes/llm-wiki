---
name: generate-book
description: Render a beautifully-themed PDF book from wiki pages matching a topic. Pick a publisher style — observatory (default dark editorial), oreilly (woodcut animal + sober serif), dummies (yellow/black cheat-sheet), headfirst (warm cream collage, Q&A). Renders mermaid diagrams inline, generates a per-theme Nano Banana cover, shapes bundle pedagogy to the theme. Preserves code snippet source refs. Used by /generate book. Not user-invocable directly — go through /generate.
user-invocable: false
allowed-tools: Bash(which *) Bash(brew *) Bash(pandoc *) Bash(node *) Bash(npx *) Bash(pnpm *) Bash(npm *) Bash(git *) Bash(mkdir *) Bash(date *) Bash(cat *) Bash(sed *) Bash(grep *) Bash(awk *) Bash(cp *) Read Write Glob Grep Skill
---

# Generate Book

Concatenate wiki pages matching a topic into a **beautifully-themed** PDF book: rendered mermaid diagrams, a generated cover, drop caps, chapter opener pages, pull quotes, callouts, code-snippet source references, and key-takeaways boxes at the end of each chapter. The goal is to keep the learner engaged — not to ship a wall of prose.

Four named themes ship — each with its own CSS, cover prompt, and pedagogy hints:

| Theme | Vibe |
|-------|------|
| `observatory` (default) | Dark editorial — amber / cyan / green, reference-grade prose, Inter + Fraunces. |
| `oreilly` | Sober cream + serif, woodcut animal cover, indexable reference-book voice. |
| `dummies` | Loud yellow/black chrome, icon callouts, cheat-sheet panels, smart-beginner voice. |
| `headfirst` | Warm cream collage, Q&A + exercises, handwritten marginalia, brain-friendly redundancy. |

Read `.claude/skills/generate/lib/quality-rubric.md` alongside this file — it is the single source of truth for scope, depth, engagement, source refs, and verification. This handler applies the rubric; it doesn't re-derive the rules.

## Usage (via /generate router)

```
/generate book <topic> [--vault <name>] [--theme <name>] [--sample [theme|all]] [--no-toc] [--no-cover] [--template <name>] [--verify]
```

Where `<topic>` is one of:

- A **tag** (e.g. `attention`) — matches all pages whose frontmatter `tags:` list includes it.
- A **folder path** under `wiki/` (e.g. `concepts/rag`).
- A **single page path** (e.g. `wiki/concepts/attention.md`).
- The literal string `all` — renders every `.md` under `wiki/` (minus `index.md` and `log.md`).

| Flag | Default | Effect |
|------|---------|--------|
| `--theme <name>` | interactive pick | `observatory` · `oreilly` · `dummies` · `headfirst`. If omitted, Step 0 asks. |
| `--sample [theme\|all]` | off | Render the first chapter only (saves cost). `theme` = sample the chosen/picked theme. `all` = one sample per theme for side-by-side comparison, then re-prompt. |
| `--no-toc` | off | Skip the table of contents. |
| `--no-cover` | off | Skip Nano Banana cover generation. |
| `--template <name>` | `book-default` | Use a named Pandoc template from `templates/`. Independent of `--theme`. |
| `--verify` | off | After rendering, also run the heavy `/verify-artifact book <topic>` round-trip. |

## Step 0: Pick a Theme

Theme resolution order:

1. `--theme <name>` passed → use it. Skip to Step 1.
2. Otherwise, ask the user with `AskUserQuestion`:

   **Question:** "Which book theme?"

   **Options:**
   1. **Observatory (default)** — Dark editorial, amber/cyan/green, reference-grade. This project's native voice.
   2. **O'Reilly** — Sober cream + serif, woodcut animal cover, indexable reference voice.
   3. **For Dummies** — Loud yellow/black, icon callouts, cheat-sheet panels, smart-beginner voice.
   4. **Head First** — Warm cream collage, Q&A + exercises, handwritten marginalia, brain-friendly.
   5. **Sample all four first** — render the first chapter in each theme so you can compare, then pick for the full book.

   If the user picks option 5, set `SAMPLE_ALL=1` internally — it's equivalent to `--sample all`.

3. Store the resolved choice as `$THEME` (one of `observatory`, `oreilly`, `dummies`, `headfirst`).
4. Validate: `.claude/skills/generate-book/themes/$THEME/theme.css` must exist. If not, fall back to `observatory` and print `⚠️  theme '$THEME' not found; falling back to observatory`.

### Sample mode

`--sample` renders the first chapter only (saves LaTeX/Playwright/Nano Banana cost). Two forms:

| Form | Behaviour |
|------|-----------|
| `--sample` or `--sample theme` | Render chapter 1 of `$TOPIC` in `$THEME` only. Output to `artifacts/book/samples/<slug>-<date>-<theme>.pdf`. After render, ask: *"Happy with this theme? (Y / pick another / render full book)"*. |
| `--sample all` | Render chapter 1 in **all four themes** sequentially — observatory, oreilly, dummies, headfirst. Each sample lands in `artifacts/book/samples/`. After all four, ask: *"Which theme for the full book? (observatory / oreilly / dummies / headfirst / skip)"*. |

Samples skip cover generation by default (too costly) unless `--with-cover` was passed. Their sidecars get `flags: { sample: true }`.

When a sample completes, this skill **exits after the picker question** — the user re-runs `/generate book <topic> --theme <choice>` to render the full book. That keeps each run deterministic.

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

**First, read the theme's pedagogy hints** and let them shape tone, structure, and engagement decisions made below:

```bash
HINTS=".claude/skills/generate-book/themes/$THEME/bundle-hints.md"
if [ -f "$HINTS" ]; then
  # The LLM reads $HINTS before generating any chapter content. The hints
  # rewrite the "voice" — Observatory is precise, Dummies is friendly second-
  # person, Head First is conversational with Q&A, O'Reilly is indexable-dry.
  :
fi
```

The hints file is the theme's **voice contract**. Observatory keeps the current precise tone; Dummies demands second-person + cheat-sheet panels + icon callouts; Head First demands Q&A dialogue + exercises + handwritten marginalia + the hook-explore-do-check loop; O'Reilly demands third-person + `.in-chapter` lede paragraphs + indexable H2s. In sample mode, only chapter 1 is emitted, so the hints matter even more per chapter.

If `$THEME` is `headfirst`, also emit a `.qa` block and at least one `.exercise` panel per chapter.
If `$THEME` is `dummies`, also emit an `.in-this-chapter` panel in the opener and a `.cheatsheet` panel at the end.
If `$THEME` is `oreilly`, do **not** emit drop caps (distracting in a reference book) — use plain paragraph openers.
If `$THEME` is `observatory`, use the current structure as-is.

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

**Covers are per-theme.** Each theme ships its own cover prompt at
`.claude/skills/generate-book/themes/$THEME/cover-prompt.md`. That file has
placeholders `{{TITLE}}` and `{{TOPIC}}` — replace them with the book's title
and raw topic argument, then send the filled prompt to `ro:generate-image`.
Do not hand-roll the prompt in this file.

1. Load the theme cover prompt:

   ```bash
   PROMPT_TEMPLATE=".claude/skills/generate-book/themes/$THEME/cover-prompt.md"
   # Strip the YAML frontmatter, keep only the body.
   PROMPT_BODY=$(sed -n '/^---$/,/^---$/!p' "$PROMPT_TEMPLATE" | sed '/./,$!d')
   PROMPT_BODY="${PROMPT_BODY//\{\{TITLE\}\}/$TITLE_CASE}"
   PROMPT_BODY="${PROMPT_BODY//\{\{TOPIC\}\}/$TOPIC}"
   ```

2. Invoke `ro:generate-image` via the Skill tool with the filled prompt:

   ```
   Skill(skill="ro:generate-image", args='<PROMPT_BODY> --output vaults/<vault>/artifacts/book/<slug>-<YYYY-MM-DD>.cover.png --size 1024x1536 --for slide --style illustration')
   ```

   `--size 1024x1536` gives a portrait book cover aspect ratio. The theme-specific
   prompt dictates palette and composition — do **not** add Observatory guidance
   on top of an O'Reilly or Dummies prompt; the prompt is authoritative.

3. Fallback: if `GEMINI_API_KEY` is unset or the skill returns a non-zero exit, skip the cover and emit `⚠️  cover skipped (see rubric §7 fallback)`. Don't block the book on this.

4. Inject the cover into Step 5's HTML as the very first page inside `<body>`. The markup is the same across themes — each theme's CSS styles `.book-cover` differently (Observatory puts a translucent amber panel; O'Reilly a solid red-rule band; Dummies the yellow wedge; Head First a taped card).

   ```html
   <div class="book-cover">
     <img src="<absolute path to .cover.png>" alt="Book cover"/>
     <div class="cover-title">
       <h1>{{Topic Title Case}}</h1>
       <div class="cover-subtitle">An LLM Wiki book · {{YYYY-MM-DD}}</div>
     </div>
     <div class="cover-strap">LLM Wiki Press</div>
   </div>
   <div style="page-break-after:always"></div>
   ```

   The `.cover-strap` element is ignored by Observatory and O'Reilly CSS but used by Dummies and Head First — keep the markup theme-agnostic.

5. Fun-mode detection (unchanged): if the topic matches `duck`, `llm wiki`, `debug`, `vibe`, `rubber`, or the vault's `CLAUDE.md` declares `tone: playful`, append `Extra direction: lean into the playfulness of the topic — on-the-nose imagery is welcome.` to `$PROMPT_BODY` before invoking the image skill. Still subject to the theme's visual style.

## Step 5: Render HTML with Pandoc + Inject Theme CSS

```bash
HTML_OUT="$VAULT_DIR/artifacts/book/<slug>-<YYYY-MM-DD>.html"

pandoc "$BUNDLE" -o "$HTML_OUT" --standalone --toc --toc-depth=3 \
  --metadata title="<Topic as Title Case>" \
  --metadata subtitle="An LLM Wiki book" \
  --metadata date="<YYYY-MM-DD>"
```

Then inject the **theme's CSS** from `.claude/skills/generate-book/themes/$THEME/theme.css` so the file stays self-contained and has no external font/CSS dependency at read-time:

```bash
THEME_CSS=".claude/skills/generate-book/themes/$THEME/theme.css"
if [ ! -f "$THEME_CSS" ]; then
  echo "theme '$THEME' missing theme.css — falling back to observatory" >&2
  THEME_CSS=".claude/skills/generate-book/themes/observatory/theme.css"
fi

# Allow per-vault override
VAULT_OVERRIDE="$VAULT_DIR/.artifacts-templates/book-$THEME.css"
[ -f "$VAULT_OVERRIDE" ] && THEME_CSS="$VAULT_OVERRIDE"

# Inline the CSS into the HTML inside a <style> tag just before </head>.
python3 - <<'PYEOF' "$HTML_OUT" "$THEME_CSS"
import sys, pathlib
html_path, css_path = sys.argv[1], sys.argv[2]
html = pathlib.Path(html_path).read_text()
css  = pathlib.Path(css_path).read_text()
needle = "</head>"
if needle in html:
    html = html.replace(needle, f"<style>\n{css}\n</style>\n{needle}", 1)
    pathlib.Path(html_path).write_text(html)
PYEOF
```

Do **not** duplicate the CSS inline in this SKILL.md. The theme files are the source of truth. The CSS responsibilities (for reviewers) are:

**Every theme.css must define:**

- `html, body` — base palette, font stack, line-height.
- `h1`/`h2`/`h3` — role-coloured, per the theme's palette.
- `.book-cover`, `.cover-title`, `.cover-subtitle`, `.cover-strap` — theme's signature cover treatment.
- `.chapter-opener`, `.chapter-number`/`.eyebrow`, `.chapter-title`, `.chapter-synopsis`/`.chapter-subtitle` — opener spread.
- `.dropcap` — opening-letter treatment (Observatory + Dummies + Head First). O'Reilly explicitly no-ops this.
- `.pullquote` — sidebar quote treatment.
- `blockquote.note` / `.tip` / `.warn` (+ per-theme additions: `.remember`, `.technical`, `.brain`).
- `.key-takeaways` — end-of-chapter summary panel.
- `pre` / `code` / `.source-ref` — code block + source-ref caption.
- `img[alt^="diagram"]` — mermaid SVG framing.
- `@page` rules for print margins + page numbers.

**Per-theme additions:**

- `observatory`: Inter + Fraunces + JetBrains Mono; amber/cyan/green on navy.
- `oreilly`: Source Serif Pro + Source Sans Pro + Fira Mono; cream + black + red rule.
- `dummies`: Montserrat + Lora + JetBrains Mono; yellow + black wedge + sticker icons; `.cheatsheet` + `.in-this-chapter` + `.remember` + `.technical`.
- `headfirst`: Caveat + Nunito + Lora + JetBrains Mono; cream + orange + teal; `.qa`, `.exercise`, `.handwritten`, `.marginalia`, `.brain`.

See each theme's `theme.css` for the concrete styles.

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
generator: generate-book@0.3.0
generated-at: <UTC ISO 8601>
template: book-default
theme: "<observatory|oreilly|dummies|headfirst>"
topic: "<raw topic argument>"
flags:
  toc: ${TOC_FLAG:-true}
  cover: ${COVER_FLAG:-true}
  sample: ${SAMPLE_FLAG:-false}
cover:
  enabled: true|false
  theme_prompt: ".claude/skills/generate-book/themes/<theme>/cover-prompt.md"
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

Bumped to `generate-book@0.3.0` because the new `theme:` field changes the artifact's shape and reproducibility contract.

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
   Theme:         <observatory|oreilly|dummies|headfirst>
   Pages in:      <N> (sorted, <M> sections scope-filtered out)
   Source hash:   <first 12 chars of hash>
   Mermaid:       <N> diagrams rendered
   Cover:         <theme> prompt via Nano Banana  (or "skipped: no GEMINI_API_KEY")
   Quality:       pass   (or warn: <list>)
   Cover image:   vaults/<vault>/artifacts/book/<slug>-<date>.cover.png
   HTML:          vaults/<vault>/artifacts/book/<slug>-<date>.html
   PDF:           vaults/<vault>/artifacts/book/<slug>-<date>.pdf
   Sidecar:       vaults/<vault>/artifacts/book/<slug>-<date>.meta.yaml
   Open HTML:     open <abs html path>
   Open PDF:      open <abs pdf path>

   Suggestion: run `/verify-artifact book <topic>` for a full round-trip fidelity check.
```

For sample mode, append a prompt:
```
Sample rendered. What next?
  1. Render the full book in <theme>.
  2. Pick a different theme and re-sample.
  3. Done — exit.
```

## Template Customisation

- **Themes** live at `.claude/skills/generate-book/themes/<name>/` and own:
  - `theme.css` — the full style sheet, injected into the HTML at render time.
  - `cover-prompt.md` — the per-theme Nano Banana prompt template with `{{TITLE}}`/`{{TOPIC}}` placeholders.
  - `bundle-hints.md` — pedagogy hints (voice, structure rules, engagement requirements) that shape Step 4's markdown bundle.
- **Per-vault overrides** — drop a `vaults/<vault>/.artifacts-templates/book-<theme>.css` and it wins over the shared theme.css. Vault-level cover prompt override at `vaults/<vault>/.artifacts-templates/cover-prompt-<theme>.md`.
- **Pandoc LaTeX template** at `.claude/skills/generate-book/templates/book.tex` (only used on Playwright fallback — loses theme styling).
- **Adding a new theme** — create `.claude/skills/generate-book/themes/<name>/` with the three files above and it becomes available to `--theme <name>` and the Step 0 picker. No router changes needed.

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
- `.claude/skills/generate-book/themes/observatory/` — dark editorial theme (default) — `theme.css`, `cover-prompt.md`, `bundle-hints.md`.
- `.claude/skills/generate-book/themes/oreilly/` — woodcut-animal reference theme.
- `.claude/skills/generate-book/themes/dummies/` — yellow/black cheat-sheet theme.
- `.claude/skills/generate-book/themes/headfirst/` — warm-cream Q&A-driven theme.
- `.claude/skills/generate-book/html-to-pdf.mjs` — Playwright HTML → PDF converter.
- `ro:generate-image` — Nano Banana wrapper used for the cover.
- `.claude/skills/verify-artifact/SKILL.md` — opt-in full round-trip fidelity test.
- `sites/docs/src/content/docs/reference/artifacts.md` — sidecar schema.
