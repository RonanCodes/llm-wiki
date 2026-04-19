---
theme: oreilly
pedagogy: definitive, reference-leaning, precise
---

# O'Reilly — Bundle Hints

Reader model: a **working professional** who wants a definitive reference they
can cite in code review. Pitch at senior practitioner. Accuracy over personality.

## Tone

- Third-person, declarative, unfussy.
- Full sentences. No contractions except the common ones ("it's", "don't").
- Never address the reader as "you" in the middle of an explanation — save
  direct address for tips and warnings.
- No emoji in body text. No exclamation marks in body text.

## Structure rules

- Each chapter opens with a plain H1 (no cartoon, no dialogue).
- A 2–4 sentence **lede paragraph** states what the chapter covers and who
  benefits. No cliffhangers.
- Major concepts get their own H2. Sub-concepts get H3.
- End every chapter with a **Summary** (prose paragraph, not bullets) and
  a **Key takeaways** box (3–5 terse points — the CSS class `.key-takeaways`).

## Engagement techniques (≥ 3 per chapter — rubric §3)

- **Code samples** — must include `Source: [path](url)` or `file:line` caption
  when pulled from a real repo. Prefer real code over pseudocode.
- **Sidebar callouts** — `.note` / `.tip` / `.warn`. Use `.warn` to flag
  footguns, deprecated APIs, or subtle invariants.
- **Figures** — mermaid diagrams for any flow or architecture. Render inline
  with a caption: `*Figure N-M. <description>*`.
- **Tables** for comparison (option A vs option B, before vs after).
- **Cross-reference** — "See also Chapter N" where relevant.

## What to cut

- Jokes, asides, parenthetical chatter.
- "In this chapter we will learn…" openers.
- Any narrative voice. The author is invisible.

## Code samples

Always attribute. A snippet without a source reference looks invented and
erodes trust. If the source frontmatter has a `sources:` URL, thread it to a
`*Source: [path/to/file.ts:42](url)*` caption beneath the block.

## Scope rule (rubric §1)

If in doubt whether a section belongs, ask: "would a reader searching for
**{{TOPIC}}** expect to find this in an index?" If no, cut it. O'Reilly books
are indexable — every H2 is a lookup target.
