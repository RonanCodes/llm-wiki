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

qmd is the primary backend. Grep is an emergency fallback only — never the default. qmd is published as an npm package (`@tobilu/qmd`), not a Homebrew formula. If qmd isn't installed, install it now:

```bash
if ! which qmd >/dev/null 2>&1; then
  echo "qmd not installed — installing now (one-time)..."
  if which pnpm >/dev/null 2>&1; then
    pnpm add -g @tobilu/qmd
  elif which npm >/dev/null 2>&1; then
    npm install -g @tobilu/qmd
  elif which bun >/dev/null 2>&1; then
    bun add -g @tobilu/qmd
  else
    echo ""
    echo "ERROR: neither pnpm, npm, nor bun is available."
    echo "Install Node.js first (Homebrew is the easiest route on macOS):"
    echo "  brew install node"
    echo "Then re-run this command."
    exit 1
  fi
fi
```

Tell the user what happened in one line if you just installed it ("Installed qmd via pnpm"). If qmd was already present, no message needed.

Only fall through to Step 3b (grep) if no Node-package-manager is available AND the user can't install Node. That's a real edge case, not the default.

## Step 3a: Search with qmd

### First-time setup: Index the vault

Check if the vault has been indexed:
```bash
VAULT="vaults/<vault-name>"
qmd index --check "$VAULT/wiki" 2>/dev/null
```

If not indexed (or first run):
```bash
qmd index "$VAULT/wiki"
```

This creates a search index over all markdown files in the wiki. Re-index after significant changes.

### Query

```bash
qmd search "$VAULT/wiki" "<query>" --limit 10 --format json
```

qmd returns results ranked by relevance using hybrid BM25 + vector search. Parse the JSON output for:
- File path
- Relevance score
- Matching snippet

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

Suggest re-indexing if the vault has been modified since last index:
```bash
qmd index "$VAULT/wiki" --update
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
