---
theme: headfirst
pedagogy: brain-friendly, redundant-on-purpose, Q&A-driven
---

# Head First — Bundle Hints

Reader model: a **learner who will put the book down if it's boring**.
Head First's thesis is that the brain learns through surprise, stories,
emotional hooks, and variety. Deliberate redundancy is a feature, not a bug —
key points appear 2–3 times, each in a different format.

## Tone

- Conversational and direct. Ask the reader questions.
- Use **humour, analogies, and stories**. A good chapter has a running gag.
- Break the fourth wall — "I know, I know, that's a lot of parameters. Stick
  with me."
- Second person. Contractions mandatory. Short sentences beat long ones.

## Structure rules

Every chapter follows a **learner-loop**:

1. **Hook** — opener that creates curiosity or emotional stake (a scenario,
   a problem to solve, a funny miscommunication). Use an `.exercise` panel
   or a pullquote.
2. **Explore** — 2–3 core ideas, each delivered twice:
   - once as prose,
   - once as a diagram, callout, or Q&A dialogue.
3. **Do** — at least one "Sharpen Your Pencil" exercise (CSS class `.exercise`).
4. **Check** — `.qa` block with 3–5 frequently-asked questions.
5. **Recap** — the `.key-takeaways` panel as handwritten-style bullets.

## Engagement techniques (≥ 4 per chapter — rubric §3 baseline +1 for Head First)

- **Marginalia** — handwritten-style asides (`.handwritten`, `.marginalia`).
  Use these to comment on your own text, like a reader's annotations.
- **Speech-bubble dialogue** — between a "veteran" and a "rookie" character.
  Format as blockquote with attribution.
- **Mermaid diagrams** — with arrows re-emphasising the key edge. Caption
  liberally.
- **Callouts** — `.tip`, `.warn`, `.note`, `.brain` (for "brain power — think
  about this"). Don't be shy with these.
- **Redundancy** — after a hard concept, restate it with a different analogy.
  The reader should hit the same idea from 2+ angles.
- **Puzzles / exercises** — short, immediate, with a visible answer a few
  lines down (or end of chapter).

## What to cut

- Dry reference tables that don't include an example.
- Paragraphs that could be dialogue or a diagram instead.
- Single-viewpoint explanations — add a second viewpoint.

## Source refs

Always include, but make them part of the story:
`*Here's where this lives in the real codebase: [path/to/file.ts:42](url).
Take a look if you want to see all the knobs.*`

## Scope rule (rubric §1)

Go **deep, not wide**. A Head First book covers fewer topics but leaves the
reader confident in each. Cut anything that feels like an "also, by the way"
paragraph — if it doesn't deserve its own hook-explore-do-check cycle, drop it.

## The "Bullet Points" recap

Every chapter ends with a handwritten-style recap. Keep them pithy — they
should feel like sticky notes on a fridge, not a formal summary.
