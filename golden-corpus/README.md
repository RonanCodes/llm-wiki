# Golden Corpus

A small, hand-curated set of wiki pages that every `generate-*` handler must render cleanly. These pages don't belong to any vault — they're the regression fixture for the artifact-generation pipeline.

## Why it exists

Close-the-loop testing needs a **frozen input**. If we verified against a live vault, artifact drift and wiki drift would mix together and we'd never know which side changed. The golden corpus gives us a known-good set of pages so that any shift in artifact quality or source-hash is the pipeline's fault, not the content's.

CI runs `/generate` for each handler against this corpus, then `/verify-artifact` for each output. The fidelity scores are tracked over time; regressions show up as scores dropping below their per-type targets.

## Structure

```
golden-corpus/
├── README.md                          (this file)
├── index.md                           (pretends to be a vault index)
└── wiki/
    ├── concepts/
    │   ├── attention-mechanism.md
    │   ├── retrieval-augmented-generation.md
    │   └── context-window.md
    └── entities/
        └── transformer.md
```

All pages follow the full wiki frontmatter convention (see [page templates reference](../sites/docs/src/content/docs/reference/page-templates.md)):

- `title`, `date-created`, `date-modified`
- `page-type` (one of `concept`, `entity`, `comparison`, `source-note`, `summary`)
- `domain: [llm-wiki, golden-corpus]`
- `tags:` topical keywords
- `sources:` pointer back to the original material
- `related:` wikilinks to the other corpus pages

Pages are deliberately **small** (100–300 words each) and **concept-clear** — long enough to render non-trivially into all ten artifact types (book, slides, podcast, video, mindmap, infographic, quiz, flashcards, app, PDF), short enough that regenerating the full corpus takes seconds, not minutes.

## How CI uses the corpus

See `.github/workflows/golden-corpus.yml`. On every push:

1. Install Pandoc, Piper TTS (best-effort), Remotion deps (best-effort).
2. For each artifact type, run `/generate <type> golden-corpus` with the corpus as the vault.
3. For each output, run `/verify-artifact <type> golden-corpus` and collect the fidelity score.
4. Upload all artifacts under `out/` as CI artifacts.
5. **Advisory only:** `continue-on-error: true` while scores stabilise. Will flip to hard-fail once per-type targets hold across three consecutive green runs.

## Adding fixtures

Keep the bar high — more pages is not better. Only add a page when one of the existing handlers has a blind spot:

- If a handler crashes on some content pattern not represented in the corpus, add the smallest page that reproduces the pattern.
- If a handler's fidelity score is consistently at the ceiling against the current corpus, the corpus isn't stressing it — add one harder page rather than ten easy ones.

Every new page must:

- Pass `/lint` with no warnings against a vault scaffolded from the corpus.
- Link to at least one other corpus page via `[[wikilink]]` (keeps the graph connected).
- Fit in ≤300 words.
- Live under `wiki/` in a subdirectory matching its `page-type` (concepts/, entities/, etc.).

## Relationship to real vaults

The corpus is **not** a vault — no `.obsidian/`, no git repo, no CLAUDE.md. The test harness treats the directory as if it were a vault root by pointing `--vault golden-corpus` at it. This sidesteps the question "which user's vault should CI use?" and keeps the pipeline content-agnostic.
