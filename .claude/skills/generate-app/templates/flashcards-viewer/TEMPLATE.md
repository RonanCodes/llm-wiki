# flashcards-viewer

A spaced-repetition flashcard web app. Reads `src/data.json`, persists review state per deck in `localStorage`, schedules with **FSRS** via [`ts-fsrs`](https://github.com/open-spaced-repetition/ts-fsrs).

## When to use

- Any `/generate flashcards` run — the viewer is the shareable-link counterpart to the `.apkg`.
- Topic pages that lend themselves to fact recall (definitions, APIs, design choices).

## Data shape

See `src/data.schema.json`. Each card has:

- `id` — stable string. Required so localStorage keeps review state across regenerations.
- `front`, `back` — the card text.
- `source` — relative wiki page path; surfaced as a link.
- `tags?` — optional.

Top-level `deck_id` keys the localStorage entry. Keep it stable across regenerations or review history resets.

## How it works

| Screen | Behaviour |
|--------|-----------|
| **Home** | Deck title, counts (due / new / learning / review), "study" button, full card list. |
| **Study** | One card at a time. Space reveals the answer; 1/2/3/4 rate as Again/Hard/Good/Easy. FSRS computes the next due date. |
| **Done** | Session summary + back-to-deck. |

No backend, no login. Review state is a single localStorage key: `flashcards-viewer:<deck_id>`.

## Keyboard shortcuts

| Key | Effect |
|-----|--------|
| `space` / `enter` | Reveal answer (then rate as Good) |
| `1` | Again |
| `2` | Hard |
| `3` | Good |
| `4` | Easy |

## Extending

- **New card fields**: extend `data.schema.json`, then surface them in `App.tsx`'s `<article className="card">`.
- **Custom scheduler params**: edit `fsrs(generatorParameters())` in `src/store.ts` — `ts-fsrs` exposes weights and retention targets.
- **Different palette**: `:root` custom properties in `src/index.css`.

## What this doesn't do

- No cloze cards — add a new card type to `data.schema.json` + a render branch in `App.tsx` if you want them.
- No media — text only. Images/audio would need asset packaging.
- No sync — localStorage is per-browser. For cross-device review, use Anki instead (the `.apkg` sidecar ships alongside).
- No deck editor — the viewer is read-only. Edit `src/data.json` and reload.
