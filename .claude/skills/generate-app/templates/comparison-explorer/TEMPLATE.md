# comparison-explorer

A filterable card grid for comparing N items across M dimensions.

## When to use

Pages that naturally fit a table:

- "vLLM vs TGI vs TensorRT-LLM" — inference server comparison
- "React vs Svelte vs Solid" — framework comparison
- "GPT-4 vs Claude vs Gemini" — model shootout

## Data shape

See `src/data.schema.json`. Each row has:

- `name` — display title
- `source` — relative wiki page path (surfaced as a "source" link in the UI)
- `summary` — 1–2 sentence description
- `values` — map of `column.key → string value`

Columns you define in `columns` become both pill labels on each card and filter chip groups at the top.

## Extending

- Add a new column: append to `columns`, add the same key to each row's `values`.
- Change the card layout: edit `src/App.tsx` — everything fits in `<article className="card">`.
- Swap the palette: edit `:root` custom properties in `src/index.css`.

## What this doesn't do

- No routing (single page).
- No detail view — cards are the whole UI. If you want click-to-expand, wrap `<article>` in a disclosure component.
- No server — data ships in `src/data.json`. For 100+ rows, consider paginating in `App.tsx`.
