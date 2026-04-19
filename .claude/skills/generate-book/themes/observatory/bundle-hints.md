---
theme: observatory
pedagogy: precise, reference-grade, dark-mode editorial
---

# Observatory — Bundle Hints

The Observatory theme is the project's native voice — **precise, calm, reference-grade**.
Treat the reader as a technical peer. No hand-holding, no baby talk. Pitched at a
mid-senior engineer.

## Tone

- Declarative. "The attention head projects Q, K, V." not "Let's learn about attention!"
- Sober humour is fine; clowning is not.
- British-leaning prose is OK (the project's house voice).

## Structure rules

- **Chapter opener** — a pull quote (≤ 25 words) that captures the chapter's thesis.
  No cartoons, no emoji.
- **Mini-TOC** per chapter — bullet list of the 3–5 ideas covered.
- **Key takeaways** at the end of each chapter — 3–5 terse bullets, no padding.

## Engagement techniques (apply ≥ 3 per chapter — rubric §3)

- Mermaid diagrams (rendered as SVG — mandatory for any process, flow, or architecture).
- Pull quotes (amber left border — CSS class `.pullquote`).
- Callout boxes: `.note` (cyan), `.tip` (green), `.warn` (amber). Use sparingly —
  a chapter with 8 callouts has lost its shape.
- Worked examples with code + `Source: [path](url)` caption where the snippet
  comes from a real repo.
- Progressive disclosure — simple case first, then edge cases.

## What to cut

- Marketing tone, exclamation marks, "imagine that…" openers.
- Filler transitions ("Now that we've covered X, let's move on to Y" — just move on).
- Redundant summaries unless this is the final chapter.

## Scope rule (rubric §1)

Keep the book **focused on the topic**. If the source vault has a page about unrelated
infrastructure, drop it. H2 sections that don't match the topic vocabulary get trimmed,
not ported verbatim.
