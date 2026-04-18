# timeline

A vertical chronological event list, filterable by tag and search.

## When to use

Pages that naturally order on a time axis:

- Paper publication chronology ("LLM Scaling — A Timeline")
- Release history / changelog narratives
- Project decision log
- Personal learning journal

## Data shape

See `src/data.schema.json`. Each event has:

- `date` — `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`. Sorts **lexically**, so mix these only if you're OK with (say) `2024` sorting before `2024-01-15`.
- `title` — short headline
- `source` — relative wiki page path (surfaced as a "source" link)
- `summary` — 1–2 sentence description
- `tags` — optional array of strings, rendered as filter chips

## Extending

- Add per-event links: extend `Event` type in `App.tsx`, append to JSX.
- Change orientation to horizontal: edit `.tl` in `src/index.css` — turn `padding-left` + `border-left` into `padding-top` + `border-top` and use flex-row.
- Date-axis markers (year labels every scroll): add a grouping pass in `App.tsx`.

## What this doesn't do

- No zooming or panning (it's a list, not a chart).
- No detail view — all info is inline.
- No per-event editor. Edit `src/data.json` directly.
