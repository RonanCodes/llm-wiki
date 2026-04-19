---
name: generate
description: Generate an artifact from a vault's wiki pages. Dispatches to a handler skill (generate-book, generate-pdf, generate-slides, etc.) based on artifact type. The mirror of /ingest — /ingest reads sources in; /generate emits artifacts out. Use when the user wants to produce a book, pdf, slides, podcast, video, quiz, flashcards, app, mindmap, or infographic from their wiki.
argument-hint: <type> <topic> [--vault <name>] [handler-specific flags]
allowed-tools: Bash(git *) Bash(ls *) Read Glob Grep
---

# Generate Artifact

Produce a consumable artifact (book, pdf, slides, podcast, video, quiz, app, …) from wiki pages. `/generate` is the **mirror of `/ingest`**:

```
/ingest  source     →  wiki pages     (input  side: many formats → one canonical form)
/generate artifact  ←  wiki pages     (output side: one canonical form → many formats)
```

Both are routers. Both dispatch to per-type handler skills. No registry — handlers are discovered by naming convention (`generate-<type>/SKILL.md`).

## Usage

```
/generate book transformers --vault my-research
/generate pdf wiki/concepts/attention.md --vault my-research
/generate slides rag-patterns --vault my-research --count 15
/generate podcast "llm wiki design" --length medium
/generate video transformers --vault my-research
/generate quiz attention --vault my-research --difficulty medium --count 10
```

## Step 1: Parse Arguments

- `$ARGUMENTS` contains the type, topic, and optional flags.
- First positional arg is the **artifact type** (book, pdf, slides, podcast, video, quiz, flashcards, app, mindmap, infographic, …).
- Second positional arg is the **topic** (a tag, a wiki page path, a wiki folder, `all`, or a free-form topic phrase — handler decides).
- Extract `--vault <name>` if present. If missing, resolve the vault the same way `/ingest` does: if only one vault exists, use it; otherwise ask.
- All other flags are forwarded verbatim to the handler.

If the first arg is missing or is `--help`, show this usage block and the known-handlers list (Step 2) and stop.

## Step 2: Discover Handlers

Handlers are any skill directory matching `.claude/skills/generate-*` with a `SKILL.md` inside. Discover them with:

```bash
ls .claude/skills/ | grep '^generate-' | sed 's/^generate-//'
```

Or via Glob: `.claude/skills/generate-*/SKILL.md`.

The router does **not** maintain a registry. Adding a new artifact type is just creating a new `.claude/skills/generate-<type>/` directory. The router will pick it up on the next invocation.

## Step 3: Dispatch to Handler

Look up `.claude/skills/generate-<type>/SKILL.md`.

**If it exists:** invoke it with the remaining arguments (topic + flags + resolved `--vault`). The handler owns the rest of the pipeline (selection, rendering, output, sidecar, commit).

**If it does not exist:** emit a clear error that lists the handlers that *are* available:

```
No handler registered for artifact type: <type>

Known handlers:
  - book         (generate a pandoc-rendered book PDF)
  - pdf          (generate a single-page or section PDF)
  - slides       (when ready)
  - …

To add a new type, create .claude/skills/generate-<type>/SKILL.md — it will be picked up automatically.
```

Derive the one-line descriptions by reading each handler's `description:` frontmatter field. Do not hardcode them in this file.

## Step 4: Respect Vault Resolution

The `--vault` flag is the handler's concern to act on (that's where the wiki pages live and where the artifact is written). The router's job is only to **resolve** it:

- If `--vault <name>` is passed, forward it as-is.
- If missing and exactly one vault exists under `vaults/`, inject `--vault <only-vault-name>`.
- If missing and multiple vaults exist, ask the user which to use, then forward the chosen name.

## Step 5: Handler Output Contract

All handlers must follow the artifacts convention (see `.claude/skills/generate-<type>/SKILL.md` and `sites/docs/src/content/docs/reference/artifacts.md`):

- Write output to `vaults/<vault>/artifacts/<type>/<topic>-<date>.<ext>`
- Write a `.meta.yaml` sidecar alongside with provenance (generated-from, source-hash, generator, generated-at, template)
- Commit the artifact + sidecar with an emoji-conventional commit message

The router does not write artifacts itself. It only dispatches.

## Currently-Implemented Handlers

Keep this list in sync as handlers land. Discover at runtime via Glob; the list below is documentation for humans reading the source.

| Type | Handler skill | Phase | Purpose |
|------|---------------|-------|---------|
| `book` | `generate-book` | 2A | Pandoc-rendered book PDF with TOC, title page |
| `pdf` | `generate-pdf` | 2A | Shareable PDF from a page or folder (no ceremony) |
| `slides` | `generate-slides` | 2B | Marp/Reveal.js slide deck |
| `mindmap` | `generate-mindmap` | 2B | Markmap HTML mind map |
| `infographic` | `generate-infographic` | 2B | Poster-style infographic |
| `podcast` | `generate-podcast` | 2C | TTS-rendered MP3 explainer |
| `video` | `generate-video` | 2C | Remotion-rendered MP4 |
| `quiz` | `generate-quiz` | 2D | Standalone HTML quiz |
| `flashcards` | `generate-flashcards` | 2D | Anki `.apkg` flashcard deck |
| `app` | `generate-app` | 2D | Scaffolded interactive web app |
| `portal` | `generate-portal` | 2E | Per-vault artifact index HTML (and root-level vault index with `--root`) |
| `all` | `generate-all` | 2E | Meta-generator — runs every handler for one topic in one pass |

Entries without an existing handler skill will trip the "no handler registered" error in Step 3 — that's the intended behaviour.

## Notes

- **Convention over registry.** `/ingest` uses a URL-pattern match table; `/generate` uses directory presence. Same spirit: no central list to keep in sync.
- **Handlers must be self-contained.** Each handler skill owns its own install-checks, template, output path, sidecar, and commit. The router is a thin dispatcher.
- **One artifact per invocation.** Like `/ingest`, stay involved per run. A batch mode can come later as a separate skill if needed.
- **Close-the-loop.** Every artifact must be re-ingestable (or as close to it as recoverability allows). See `vaults/llm-wiki/wiki/concepts/close-the-loop-testing.md`.
