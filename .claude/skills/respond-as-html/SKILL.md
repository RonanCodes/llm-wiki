---
name: respond-as-html
description: Render the current response (or a specific piece of content under discussion) as a single-file HTML artefact instead of a long Markdown reply. Use whenever the user asks for a "human-readable version", "an artifact", "a shareable page", "an HTML version", "make it pretty", "save that as a page", or similar phrasing. Auto-detects an llm-wiki vault or any repo/folder and writes to `<root>/artifacts/html/<timestamp>-<slug>.html`. Tailwind via CDN, opens in the user's default browser. Markdown stays the default chat surface; this skill is the explicit promote-to-artefact step.
user-invocable: true
allowed-tools: Bash(mkdir *) Bash(date *) Bash(open *) Bash(git *) Bash(pwd *) Bash(realpath *) Bash(basename *) Bash(test *) Read Write Glob
---

# Respond as HTML

Snapshot the current response (or a specific piece of content) as a single-file HTML artefact. Markdown stays the chat default. This skill is the explicit "promote this moment to a real artefact" step.

## When to invoke

Fire automatically on intent phrases like:

- "give me a human-readable version"
- "make that an artifact"
- "save that as a page"
- "give me the HTML version"
- "make it pretty"
- "make it shareable"
- "I want to review that properly"
- explicit `/respond-as-html` (or whatever alias the user types)

Do NOT fire for short factual replies, code-only edits, or one-line answers. The smell test: would the user open this in a browser tab and read it side-by-side with something else? If yes, fire. If no, leave it in the terminal.

## What "the current response" means

The content under discussion. In order of preference:

1. The last substantive assistant message in this conversation (a plan, a synthesis, a long analysis, a trend report).
2. A specific message the user points at ("that section above", "the part about X").
3. Content the user pastes inline as the prompt body.

When ambiguous, ask one clarifying question. Don't guess wrong and waste a render.

## Step 1: Resolve the output root

Auto-detect, in this order:

1. **Inside an llm-wiki vault** (cwd or a parent matches `vaults/llm-wiki-*/`). Root = the vault directory. The skill writes to `<vault-root>/artifacts/html/`.
2. **Inside any other git repo.** Root = `git rev-parse --show-toplevel`. Writes to `<repo-root>/artifacts/html/`.
3. **Plain directory, no git.** Root = current working directory. Writes to `<cwd>/artifacts/html/`.

```bash
# Detect root
if pwd | grep -q "/vaults/llm-wiki-"; then
  ROOT="$(pwd | sed -E 's|(.*/vaults/llm-wiki-[^/]+).*|\1|')"
elif git rev-parse --show-toplevel >/dev/null 2>&1; then
  ROOT="$(git rev-parse --show-toplevel)"
else
  ROOT="$(pwd)"
fi
OUT_DIR="$ROOT/artifacts/html"
mkdir -p "$OUT_DIR"
```

Report the chosen root to the user in one short line so they know where the file landed.

## Step 2: Derive title and filename

- **Title**: a short human-readable headline for the artefact. Pull it from the content (first H1, or the most natural summary phrase). Ask the user if nothing obvious.
- **Slug**: kebab-case from the title, max 60 chars.
- **Timestamp**: `YYYY-MM-DD-HHMM` in local time.
- **Filename**: `<timestamp>-<slug>.html`.

```bash
TIMESTAMP="$(date +%Y-%m-%d-%H%M)"
SLUG="<derived-from-title>"
FILE="$OUT_DIR/${TIMESTAMP}-${SLUG}.html"
```

## Step 3: Render the HTML

Use the template at `.claude/skills/respond-as-html/template.html` as the starting point. The template:

- Loads Tailwind via CDN (single `<script>` tag, no build step).
- Has a `prose` container so Markdown converts to readable typography.
- Light/dark colour scheme respects `prefers-color-scheme`.
- A header block with title + generation timestamp.
- A footer block with the path to the source vault/repo (so the artefact is self-describing).
- Inline mermaid renderer (lazy-loaded via CDN) if the content contains ` ```mermaid` fences.

Render the content body as semantic HTML (convert Markdown to HTML, preserve code blocks, tables, lists, blockquotes, images). Do NOT just paste raw Markdown inside a `<pre>` block; that defeats the point.

If the content has structure cues (multiple H2 sections, lists, tables), use them as visual anchors. Long syntheses get section dividers; short reflections get one calm column of prose. Don't add navigation chrome for a single-page artefact.

## Step 4: Write the file

```bash
Write tool with file_path=$FILE and content=<rendered HTML>
```

## Step 4b: Auto-create or update the index

After writing the new artefact, check how many `.html` files (excluding `index.html` itself) live in `$OUT_DIR`:

```bash
COUNT=$(ls "$OUT_DIR"/*.html 2>/dev/null | grep -v "/index.html$" | wc -l | tr -d ' ')
```

- **If COUNT is 1** (just the file you wrote): do nothing. A single artefact does not need an index.
- **If COUNT >= 2**: create or refresh `$OUT_DIR/index.html`. The index:
  - Lists every artefact in the folder, newest first.
  - Title per artefact pulled from `<title>` tag.
  - One-line summary pulled from the artefact's first paragraph or H1 deck (heuristic; fall back to the slug).
  - Stack pill (Tailwind / Plain / etc.) inferred from the artefact's contents.
  - Uses the plain editorial style by default (lightest viable, no CDN dependency).

**Every artefact must include a back-link to the index** in its header *and* its footer:

```html
<nav><a href="index.html">← Back to index</a></nav>
```

The index page itself does NOT need a back-link (it is the root).

The index filename is always literally `index.html`, never timestamped, so its URL stays stable across sessions.

## Step 5: Open in browser

```bash
# If an index exists, open the index. Otherwise open the new artefact.
if [ -f "$OUT_DIR/index.html" ]; then
  open "$OUT_DIR/index.html"
else
  open "$FILE"
fi
```

## Step 6: Report

One short status block to the user:

```
Wrote → artifacts/html/<filename>
Opened in browser.
Root: <root path>
```

That's it. No long summary, no commentary, no "let me know if you'd like changes." The artefact speaks for itself; if the user wants edits they will tell you.

## Style rules for the rendered HTML

- No em-dashes or en-dashes in body text. Convert any present in the source to commas, colons, or full stops per the user's house style.
- No AI-tell vocabulary added by this skill (delve, leverage, robust, seamless, unlock, empower, streamline).
- Preserve the user's voice in any quoted material exactly as-is, even if it contains those words.
- Code blocks: monospace, subtle background, no syntax-highlighting library by default (keeps the artefact under 50KB for fast loads).
- Tables: full-width, zebra-striped rows, readable on mobile.
- Links: underlined on hover only; never `target="_blank"` by default (let the user choose).

## Notes

- Single-file output. No external assets except the Tailwind CDN script and (optionally) the mermaid CDN script.
- Self-contained: the artefact must render correctly when opened directly from disk, even offline (Tailwind CDN gracefully degrades; the content is still readable as plain HTML).
- Idempotent path: re-running the skill on the same content within a minute produces a different filename (timestamp includes HHMM), so nothing gets clobbered.
- Not committed by default. The user decides what to keep. If the artefact lives inside a vault under git, mention that in the status line; do not auto-`git add`.

## Failure modes to avoid

- **Rendering markdown raw inside `<pre>`**. Always convert to semantic HTML.
- **Writing to a hidden folder**. `artifacts/html/` is intentionally visible. Never use `.artifacts/`.
- **Verbose status messages after the render**. The artefact is the deliverable; the chat reply should be three short lines max.
- **Asking the user for permission to open the browser.** They opted into auto-open during skill design. Just do it.
- **Trying to be a Markdown-to-HTML converter for arbitrary files.** This skill operates on the current conversation context, not on `*.md` files on disk. For converting wiki pages or vaults into HTML mini-sites, use `/generate-portal` or a future `/skill-md-to-html`.
