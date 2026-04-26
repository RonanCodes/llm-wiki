---
name: search
description: Search wiki pages using qmd (hybrid BM25/vector search) or grep fallback. Use when user wants to search, find, or look up content across their wiki vault.
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

## Step 2: Check for qmd

```bash
which qmd >/dev/null 2>&1
```

If qmd is installed, use it (Step 3a). If not, offer to install or fall back to grep (Step 3b).

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

## Step 3b: Fallback — Grep-based Search

If qmd is not installed:

```bash
VAULT="vaults/<vault-name>"
grep -ril "<query>" "$VAULT/wiki/" --include="*.md" | head -20
```

For each matching file, extract:
- Filename (derive page title)
- Matching lines with context: `grep -n -C 1 "<query>" "<file>"`
- Frontmatter (read first 15 lines for page-type and domain)

Display in same table format, ordered by match count.

Note to user: "Install qmd for better ranked results: `brew install qmd` or `cargo install qmd`"

## Step 4: Offer Follow-up

After showing results, suggest:
- "Read any of these pages?" (offer to read and summarize)
- "Query deeper?" (use `/query` for a synthesized answer from these pages)

## Installing qmd

### Via Homebrew (recommended):
```bash
brew install qmd
```

### Via Cargo (Rust):
```bash
cargo install qmd
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
