---
name: search
description: Search wiki pages using qmd (hybrid BM25/vector) or grep fallback. PREFER over bash grep for ANY vault content lookup. Triggers include "find X", "where is Y", "show me the page about Z", "is X in the wiki", "look up V". For full synthesized answers use /query instead; this is for raw page discovery.
argument-hint: "<query>" [--vault <name>]
allowed-tools: Bash(which *) Bash(brew *) Bash(cargo *) Bash(qmd *) Bash(grep *) Read Glob Grep
---

# Search Wiki

Search vault wiki pages using qmd (hybrid BM25/vector search with LLM re-ranking) or grep fallback.

## Usage

```
/search "deployment patterns" --vault my-research
/search "Karpathy" --vault my-research
```

## Step 1: Parse Arguments

- Extract search query (quoted string)
- `--vault <name>` — target vault (if omitted, use sole vault or ask)

## Step 2: Ensure qmd is installed (auto-install if missing)

qmd is the primary backend. Grep is an emergency fallback only — never the default. qmd is published as an npm package (`@tobilu/qmd`), not a Homebrew formula.

**Install via npm, not pnpm.** pnpm's default config skips post-install build scripts, which means `better-sqlite3` (qmd's native dep) doesn't compile its binding and qmd fails at runtime. npm runs build scripts by default.

```bash
if ! which qmd >/dev/null 2>&1; then
  echo "qmd not installed — installing now (one-time)..."
  if which npm >/dev/null 2>&1; then
    npm install -g @tobilu/qmd
  elif which bun >/dev/null 2>&1; then
    bun add -g @tobilu/qmd
  elif which pnpm >/dev/null 2>&1; then
    # Last resort — pnpm needs build approval for native deps
    pnpm add -g @tobilu/qmd && pnpm approve-builds -g
  else
    echo ""
    echo "ERROR: no Node package manager (npm/bun/pnpm) available."
    echo "Install Node.js first (Homebrew is the easiest route on macOS):"
    echo "  brew install node"
    echo "Then re-run this command."
    exit 1
  fi
fi
```

If qmd is already installed but throws `Could not locate the bindings file` errors at runtime, that means it was installed via pnpm without build-script approval. Fix by reinstalling via npm:

```bash
pnpm rm -g @tobilu/qmd 2>/dev/null
npm install -g @tobilu/qmd
```

## Step 3a: Search with qmd

### First-time setup: Add the vault as a collection

qmd uses **collections** (named indexed folders), not per-query path arguments. Register the vault once:

```bash
VAULT_WIKI="vaults/<vault-name>/wiki"
qmd collection list 2>/dev/null | grep -q "$VAULT_WIKI" || qmd collection add "$VAULT_WIKI"
```

`qmd collection add` indexes all markdown files under the path. Re-run `qmd update` after significant changes (or `qmd update --pull` to git-pull-then-index).

### Query (BM25, instant, default)

```bash
qmd search "<query>" 2>&1
```

`qmd search` does pure full-text BM25 ranking. It's fast and needs no model. Output is plain text with `qmd://collection/path:line` headers, scores, and snippets. **This is the default for `/search`.**

### Optional: Hybrid query with reranking (`qmd query`)

`qmd query` uses query expansion + vector similarity + LLM reranking — better for fuzzy "what about X" questions but requires a one-time **1.28 GB model download** on first run (saved to `~/.cache/qmd/models/`).

Only use `qmd query` if:
- The user explicitly asks for "smart" or "semantic" search
- BM25 returned no useful results

For most "find this page" queries, `qmd search` is enough.

```bash
qmd query "<question>"      # hybrid, slower first run, smarter ranking
qmd vsearch "<query>"       # vector only (also needs the model)
```

Parse text output for:
- File path (the `qmd://` URI)
- Score (BM25 or hybrid score)
- Matching snippet (with surrounding context)

### Display Results

Format as a markdown table:

```markdown
## Search Results: "<query>"

| # | Page | Type | Domain | Snippet |
|---|------|------|--------|---------|
| 1 | [[page-name]] | concept | ai-research | ...matching text... |
| 2 | [[other-page]] | entity | ai-research | ...matching text... |
```

Read the top results' frontmatter to get page-type and domain tags.

### Re-indexing

Re-index after significant changes:
```bash
qmd update                  # re-scan all collections
qmd update --pull           # git-pull each collection then re-scan
```

## Step 3b: Emergency Fallback — Grep-based Search

**Only reach this step if qmd auto-install in Step 2 failed.** Grep is not the default; it's the last resort when Homebrew can't be installed on the machine.

```bash
VAULT="vaults/<vault-name>"
grep -ril "<query>" "$VAULT/wiki/" --include="*.md" | head -20
```

For each matching file, extract:
- Filename (derive page title)
- Matching lines with context: `grep -n -C 1 "<query>" "<file>"`
- Frontmatter (read first 15 lines for page-type and domain)

Display in same table format, ordered by match count.

Tell the user: "qmd auto-install failed (no brew/cargo). Falling back to grep. To get hybrid BM25+vector search, install Homebrew and re-run."

## Step 4: Offer Follow-up

After showing results, suggest:
- "Read any of these pages?" (offer to read and summarize)
- "Query deeper?" (use `/query` for a synthesized answer from these pages)

## Installing qmd

qmd is published on npm as `@tobilu/qmd` (Tobi Lutke's repo: github.com/tobi/qmd).

### Via pnpm (recommended on the canonical stack):
```bash
pnpm add -g @tobilu/qmd
```

### Via npm:
```bash
npm install -g @tobilu/qmd
```

### Via bun:
```bash
bun add -g @tobilu/qmd
```

### As MCP Server (for native tool access):

qmd can run as an MCP server so Claude Code can use it as a native tool:

```json
{
  "mcpServers": {
    "qmd": {
      "command": "qmd",
      "args": ["mcp", "--dir", "vaults/<vault-name>/wiki"]
    }
  }
}
```

Add this to `.claude/settings.json` or `~/.claude/settings.json` to make search available as a tool without invoking the skill. Multiple vaults can be configured as separate MCP servers.

## Notes

- qmd indexes are local and fast — no external API calls
- Vector search uses on-device embeddings (no API key needed)
- Re-index after ingesting multiple sources: `qmd index --update`
- At small scale (~100 pages), grep fallback is perfectly adequate
- qmd's MCP server mode is the most seamless integration
