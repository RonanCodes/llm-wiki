---
theme: dummies
pedagogy: friendly, zero-assumption, cheat-sheet-heavy
---

# For Dummies — Bundle Hints

Reader model: a **smart beginner**. Assume no prior exposure, but don't talk
down. Clear over clever. Warm over formal.

## Tone

- Second person. "You'll notice", "try this", "when you run into X…"
- Contractions welcome. Light humour welcome. Warmth always.
- Never use a ten-dollar word where a two-dollar word will do.
- Never say "obviously" or "clearly".

## Structure rules

- Every chapter opens with a yellow-band opener (handled by CSS `.chapter-opener`)
  containing:
  - Eyebrow: `CHAPTER N`
  - H1 title
  - **In This Chapter** checklist panel (CSS class `.in-this-chapter`) — 3–5
    bullets of what the reader will be able to do by the end.
- Use frequent H2 and H3 — small, digestible sections beat long flowing prose.
- Each chapter ends with:
  - **The Bottom Line** — 2-3 sentence prose wrap.
  - **Cheat Sheet** panel (CSS class `.cheatsheet`) — quick-reference of the
    chapter's commands / formulae / snippets.
  - **Key takeaways** (CSS class `.key-takeaways`).

## Engagement techniques (≥ 3 per chapter — rubric §3)

- **Callouts** with the classic Dummies icons — pick liberally:
  - `.tip` — shortcut or "better way"
  - `.note` — contextual aside
  - `.warn` — footgun, do-not-do-this
  - `.remember` — "keep this in your back pocket"
  - `.technical` — "nerdy aside you can skip"
- **Worked examples** — step-by-step, numbered. Every example gets input,
  command, and expected output.
- **Analogies** — "Think of an LLM as a very well-read but forgetful librarian."
- **Mermaid diagrams** for flows. Always captioned.
- **Cheat sheets** at the end — one per chapter.

## What to cut

- Assumed expertise ("as you know from functional programming…" — no).
- Jargon without gloss. First use of any term gets a one-line definition.
- Dense reference tables. If it's a reference, put it in a cheat sheet.

## Source refs

Still mandatory (rubric §4). But phrase them friendly:
`*From the repo: [path/to/file.ts:42](url) — this is where the action happens.*`

## Scope rule (rubric §1)

Err on the side of **covering less, but thoroughly**. A Dummies reader expects
complete coverage of the narrow thing they picked up the book for, not a wide
scan. Cut sections that assume knowledge of adjacent topics.
