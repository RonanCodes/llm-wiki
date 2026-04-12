# Obsidian Integration

## How LLM Wiki Works with Obsidian

Claude Code reads and writes markdown files directly on your filesystem. Obsidian watches the same directory and renders changes in real time. No middleware, no server, no MCP.

```
Claude Code ──writes──> vaults/<name>/wiki/*.md ──renders──> Obsidian
```

This is the same approach Karpathy describes: *"I have the LLM agent open on one side and Obsidian on the other. The LLM makes edits based on our conversation, and I browse the results in real time."*

## Why No MCP?

MCP (Model Context Protocol) servers for Obsidian exist — there are 15+ of them on GitHub. We evaluated them and decided against making one the default because:

1. **Claude Code already reads/writes files.** An MCP between Claude Code and a folder of markdown files adds a dependency for zero functional gain.
2. **Obsidian needs to be running** for most MCP servers. Our system works whether Obsidian is open or not.
3. **index.md does 80% of the navigation.** Claude reads the index to find relevant pages, then reads those pages. Simple and effective up to ~200 pages.
4. **Fewer moving parts = fewer things that break.** No server to start, no port to configure, no API key to manage.

The community agrees. Most Claude Code + Obsidian practitioners use direct file access. MCP is primarily useful for Claude Desktop users, who can't read local files without it.

## When You Might Want MCP

There are valid reasons to add an MCP server later:

| Situation | Recommended MCP |
|-----------|----------------|
| Wiki exceeds ~200 pages and index scanning is slow | **qmd** — hybrid BM25/vector search with MCP server mode. Already supported by our `/search` skill. |
| You use Claude Desktop (not Code) | **mcpvault** (`npx @bitbonsai/mcpvault@latest /path/to/vault`) — filesystem-based, no Obsidian plugins needed. |
| You want Dataview queries from Claude | **aaronsb/obsidian-mcp-plugin** — runs inside Obsidian, integrates Dataview and graph navigation. |
| You want multi-client access (Code + Desktop) | **obsidian-claude-code-mcp** by iansinnott — dual transport, auto-discovery via `/ide`. |

## qmd (the one tool worth adding)

[qmd](https://github.com/tobi/qmd) by Tobi Lutke is a local search engine for markdown files. Hybrid BM25 + vector search with LLM re-ranking, all on-device. It has both a CLI and an MCP server.

Add it when your wiki outgrows index.md scanning (~200+ pages):

```bash
brew install qmd

# CLI mode (our /search skill uses this):
qmd search "vaults/my-research/wiki" "deployment patterns"

# MCP server mode (add to Claude Code config):
# In .claude/settings.json:
{
  "mcpServers": {
    "qmd": {
      "command": "qmd",
      "args": ["mcp", "--dir", "vaults/my-research/wiki"]
    }
  }
}
```

## Obsidian CLI (v1.12+)

Obsidian has an official CLI with 130+ commands. It's useful for Obsidian-specific operations (daily notes, templates, commands) but not necessary for our wiki workflow since we handle everything through Claude Code skills.

If you want it:
1. Open Obsidian Settings → Command line interface → Toggle ON
2. Optionally install the [Obsidian-CLI-skill](https://github.com/pablo-mano/Obsidian-CLI-skill) Claude Code plugin

## Recommended Obsidian Setup

For the best experience browsing your llm-wiki vaults in Obsidian:

### Core settings
- Open your vault directory (`vaults/<name>/`) as an Obsidian vault
- Settings → Files and links → Default location for attachments → `raw/assets`

### Recommended plugins
- **Graph View** (built-in) — visualize wiki connections
- **Backlinks** (built-in) — see what links to the current page
- **Dataview** — query pages by frontmatter (see `docs/dataview-queries.md`)
- **Local Images Plus** — download remote images to local
- **Marp Slides** — view generated slide decks
- **Obsidian Web Clipper** (browser extension) — clip articles to raw/

### Graph view tips
- Filter by path: `wiki/` to hide raw sources
- Color nodes by folder: sources, entities, concepts, comparisons
- Increase link distance for readability on large wikis
