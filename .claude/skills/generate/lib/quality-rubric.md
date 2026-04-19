# Artifact Quality Rubric

Every `generate-*` handler MUST apply this rubric before writing the artifact. Think of it as the wiki's answer to "how do we make sure this thing is actually *good* to consume?"

Three things make an artifact good:

1. **It's scoped.** It only covers what the learner needs for the topic — not the entire vault.
2. **It's deep enough to be useful.** It clears a minimum bar for substance. A one-paragraph "book" fails.
3. **It's engaging.** It earns the reader's attention with variety — visuals, examples, callouts, pull quotes, not walls of text.

This doc is the single source of truth. Handlers reference it; don't duplicate the rules.

---

## 1. Scope filtering — "only the relevant parts"

**Rule:** Include only the portions of source pages that bear on the topic. Drop tangential preamble, side notes, and unrelated sections.

**Why:** The vault is a dense graph. A page tagged `attention` may also cover tokenisation, sampling, and deploy notes. A book about *attention* shouldn't ship the deploy notes. The user called it out: "we don't need the full CDM model, just the parts that are relevant."

**How to apply (in the handler, after Step 2 selection, before Step 4 bundle build):**

1. Compute a **topic vocabulary** from the topic argument:
   - If `<topic>` is a tag, the vocabulary is `{tag, tag-as-phrase, singular/plural variants}`.
   - If a folder, vocabulary = folder name + each page's H1 within the folder.
   - If a free-form phrase, vocabulary = the phrase words + obvious synonyms.
2. For each selected page, split by `##` headings into sections.
3. Keep a section if ANY of these is true:
   - Its heading contains a vocab word.
   - ≥ 2 body paragraphs contain a vocab word.
   - It's the page's first (intro) or last (summary/next-steps) section.
4. Drop sections that pass none of those. Log dropped sections to stderr so the user can see what was trimmed.
5. If **every** section of a page is dropped, keep the page's intro + H1 + a one-line "See full page for unrelated detail" stub — don't drop the whole page silently.

**Never** filter by hard word count alone — some short sections are the crux.

## 2. Minimum depth — "long enough to be useful"

**Rule:** Don't ship an artifact that's too thin. If the topic can't fill the minimum, either widen the topic or fail loudly.

**Per-artifact minimums (post-scope-filter):**

| Artifact | Floor | Measured as |
|----------|-------|-------------|
| `book` | 3,000 words across ≥ 3 chapters | word count of concatenated bundle |
| `pdf` | 400 words | word count of bundle |
| `slides` | ≥ 8 content slides (excl. title/TOC/outro) | slide count |
| `mindmap` | ≥ 12 leaf nodes, ≥ 3 depth | count of bullet nodes |
| `infographic` | ≥ 5 data points / comparisons | populated placeholders |
| `podcast` | ≥ 4 minutes of spoken content | script word count / 150 wpm |
| `video` | ≥ 8 scenes | scene count |
| `quiz` | ≥ 6 questions | question count |
| `flashcards` | ≥ 10 cards | card count |
| `app` | ≥ 3 views/routes and ≥ 10 data entries | file + json inspection |
| `book cover` | — | n/a |

If the floor isn't met, **don't silently emit a tiny artifact.** Do one of:

- Surface a warning and ask the user whether to proceed, broaden the topic, or abort.
- Auto-widen by including the nearest-related tag (one hop) and re-running selection.

Record the depth metric in the sidecar under `quality:` so `verify-quick.sh` can check it later.

## 3. Engagement — "keep the learner engaged"

**Rule:** Vary the rhythm. A wall of prose is the dullest possible output; it's also the default unless you make an effort.

**Techniques (mix at least 3 per artifact where the format supports them):**

| Technique | When to use | How |
|-----------|-------------|-----|
| **Mermaid diagrams** | any flow, architecture, decision tree | Render via `render-mermaid.sh` to real images. Observatory palette. |
| **Pull quotes** | a source page has a striking one-liner | Block-quote with larger font + amber left border |
| **Callout boxes** | key insights, warnings, examples | `> [!NOTE]`, `> [!TIP]`, `> [!WARN]` — render as coloured panels |
| **Worked examples** | any abstract concept | Table or fenced block showing input → output |
| **Progressive disclosure** | long sections | H3 sub-sections with one idea each — never a wall of 800 words under one H2 |
| **Visual breaks** | every 2-3 screens of prose | Mermaid, image, quote, or horizontal rule |
| **Chapter openers** (books) | between chapters | Dedicated page with chapter number, title, one-line synopsis, illustration if available |
| **Key takeaways** | end of each chapter/section | Bulleted summary ≤ 5 items |
| **Code snippets with source refs** | code appears anywhere | Fenced block + caption linking to repo path:line (see §4) |

Don't shotgun every technique at once — 3 well-placed beats 7 crammed in.

## 4. Source references for code snippets

**Rule:** When a code snippet appears in an artifact, link it to where the real file lives.

**Why:** The user is going to want to read the surrounding code, edit it, or cite it. Guessing where it came from wastes their time.

**How to apply:**

- If a source page has a `sources:` frontmatter field pointing at a repo URL (GitHub, Confluence, GitLab, internal), preserve that as a caption on any code snippet:

  ```markdown
  ```typescript
  export function handleAttention() { ... }
  ```
  *Source: [`src/attention/handle.ts:42`](https://github.com/org/repo/blob/main/src/attention/handle.ts#L42)*
  ```

- If the page uses the wiki convention `file_path:line_number` in body text (e.g. `src/attention/handle.ts:42`), preserve it verbatim — don't strip or reformat.
- If neither is present, **don't invent a path.** Leave the snippet uncaptioned.
- For Confluence sources: keep the full Confluence URL in the caption. Confluence links break if re-pathed.

## 5. Visual hierarchy — "beautiful by default"

**Rule:** Every HTML/PDF artifact must use the Observatory palette. Every renderer that supports typography must ship with a well-tuned type scale.

**Palette (locked):**

| Role | Hex | Used for |
|------|-----|----------|
| Amber | `#e0af40` | H1 headings, sources/inputs, highlights |
| Cyan | `#5bbcd6` | H2 headings, engine/process, accents |
| Green | `#7dcea0` | H3 headings, outputs, positive/success |
| Background | `#0b0f14` | outer/page frame |
| Surface | `#0f172a` | content panels |
| Text | `#e8eef6` | body on dark |
| Muted | `#64748b` | captions, footers |

**Typography (HTML/PDF):**

- Body: `Inter`, `system-ui`, 18px, line-height 1.65.
- Headings: `Inter` 700, slightly tighter line-height, amber/cyan/green per level.
- Code: `JetBrains Mono`, 15px, on `#1e293b` surface with cyan border-left.
- Drop caps (books, chapter opens): 3-line initial, amber, serif (Fraunces / Playfair).
- Margins: 1in page for PDF, 1100px max-width for HTML.
- Spacing: generous. A cramped page signals a cramped idea.

## 6. Close the loop — "verify before reporting done"

**Rule:** Every handler MUST run `verify-quick.sh` on its own output and stamp the result into the sidecar. `verify-artifact` (the heavier round-trip) is opt-in.

**`verify-quick` checks (implemented in `verify-quick.sh`):**

- Artifact exists and is non-empty.
- Depth metric meets the §2 floor for that type.
- At least one of the §3 engagement techniques was applied (heuristic: count of mermaid images, callouts, pull-quote blocks).
- If §4 applies: every fenced code block has an adjacent caption OR the source page had no `sources:` repo URL to preserve.
- Sidecar is present and well-formed.

Failures are **warnings by default**, not hard failures — the user decides whether to regenerate. But the warning MUST be printed and the `quality:` block in the sidecar MUST record which checks failed. CI can switch the mode to hard-fail.

For the heavier round-trip (`/verify-artifact`):

- Book, PDF, slides, podcast, video → suggest `/verify-artifact <type> <topic>` in the report.
- Mindmap, infographic, quiz, flashcards, app → opt-in `--verify` flag runs it automatically.

## 7. Covers, thumbnails, and generated imagery

**Rule:** Long-form artifacts (book, podcast album art, video thumbnail) SHOULD have a generated cover. Short ones (pdf, slides, mindmap, infographic) don't need one.

**How:** Call the `ro:generate-image` skill with Nano Banana 2 via `--for` and a prompt assembled from the topic + vault domain + a style-of-the-week.

**Cover prompt recipe:**

```
<style-of-the-week> cover illustration for a book titled "<Topic Title Case>".
Subject: <one-sentence synopsis derived from the topic's lead page>.
Palette: deep navy (#0b0f14) background, amber (#e0af40) accents, cyan (#5bbcd6)
highlights, green (#7dcea0) organic details.
Mood: studious, modern, slightly playful. Editorial illustration, not stock photo.
Leave a vertical strip on the right for the title text to be overlaid later.
No text in the image itself.
```

**Style-of-the-week** rotates so a vault's covers don't all look identical:

- week 1 — Isometric 3D illustration
- week 2 — Flat editorial illustration
- week 3 — Woodcut engraving / risograph print
- week 4 — Retro 1970s science textbook
- week 5 — Abstract geometric minimalism
- week 6 — Hand-drawn marginalia style

Pick by `(date.isocalendar().week % 6)` so the same topic on the same week gets the same style (deterministic and idempotent).

**Fun covers on-the-nose:** if the topic is obviously playful (e.g. "llm wiki", "rubber ducks", "debugging") or the vault domain is humorous, lean into it — ask the prompt for literal, comedic imagery ("a wiki made of Post-It notes glued to a library duck"). Only for topics where it doesn't feel disrespectful to the content.

Fallback: if `GEMINI_API_KEY` is missing or the API fails, skip cover generation and emit the artifact without one. Don't block the artifact on a cover.

---

## Changelog

- 2026-04-19 — initial version alongside mermaid rendering + book overhaul.
