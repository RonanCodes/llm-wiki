---
title: "Obsidian Integration"
description: "Why no MCP, direct file access, recommended plugins, and qmd for search at scale."
---

## How It Works

Claude Code reads and writes markdown files directly on your filesystem. Obsidian watches the same directory and renders changes in real time. No middleware, no server, no MCP.

This is the approach Karpathy describes: *"I have the LLM agent open on one side and Obsidian on the other. The LLM makes edits based on our conversation, and I browse the results in real time."*

## Why No MCP

MCP (Model Context Protocol) servers for Obsidian exist -- there are 15+ on GitHub. We evaluated them and decided against requiring one:

1. **Claude Code already reads/writes files.** An MCP adds a dependency for zero functional gain.
2. **Obsidian doesn't need to be running.** Our system works whether Obsidian is open or not.
3. **index.md does 80% of navigation.** Claude reads the index to find pages, then reads those pages. Simple and effective up to ~200 pages.
4. **Fewer moving parts.** No server to start, no port to configure, no API key.

## When You Might Want MCP

| Situation | Recommended MCP |
|-----------|----------------|
| Wiki exceeds ~200 pages | **qmd** -- hybrid BM25/vector search with MCP server mode |
| You use Claude Desktop (not Code) | **mcpvault** -- `npx @bitbonsai/mcpvault@latest /path/to/vault` |
| You want Dataview queries from Claude | **aaronsb/obsidian-mcp-plugin** -- runs inside Obsidian |
| Multi-client access (Code + Desktop) | **obsidian-claude-code-mcp** by iansinnott |

## qmd: The One Tool Worth Adding

[qmd](https://github.com/tobi/qmd) by Tobi Lutke is a local markdown search engine. Hybrid BM25 + vector search, all on-device. It has both a CLI and an MCP server.

```bash
brew install qmd

# CLI (used by /search skill):
qmd search "vaults/my-research/wiki" "deployment patterns"

# MCP server (add to .claude/settings.json):
{ "mcpServers": { "qmd": { "command": "qmd", "args": ["mcp", "--dir", "vaults/my-research/wiki"] } } }
```

## Recommended Plugins

| Plugin | Type | Purpose |
|--------|------|---------|
| **Graph View** | Built-in | Visualize wiki connections |
| **Backlinks** | Built-in | See what links to current page |
| **Dataview** | Community | Query pages by frontmatter fields |
| **Local Images Plus** | Community | Download remote images to local |
| **Marp Slides** | Community | Preview generated slide decks |
| **Web Clipper** | Browser ext | Clip articles to `raw/` |

## Setup Tips

- Open `vaults/<name>/` as an Obsidian vault (not the engine root)
- Set default attachment location to `raw/assets` in Obsidian settings
- In Graph View, filter by `wiki/` to hide raw sources
- Color graph nodes by folder for visual distinction between page types
