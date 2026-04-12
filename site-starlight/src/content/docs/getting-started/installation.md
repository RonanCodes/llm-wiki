---
title: Installation
description: Dependencies and setup for LLM Wiki.
---

## Required Tools

| Tool | Install | Purpose |
|------|---------|---------|
| **Claude Code** | `npm i -g @anthropic-ai/claude-code` | The AI engine |
| **Obsidian** | `brew install --cask obsidian` | Wiki viewer |
| **Git** | `brew install git` | Version control |
| **Node.js** | `brew install node` | Runtime |

## Optional (auto-installed on first use)

| Tool | Install | Used by |
|------|---------|---------|
| yt-dlp | `brew install yt-dlp` | YouTube ingest |
| Poppler | `brew install poppler` | PDF ingest |
| Pandoc | `brew install pandoc` | Office doc ingest |
| qmd | `brew install qmd` | Wiki search |
| Marp CLI | `pnpm add -g @marp-team/marp-cli` | Slide generation |

## Install Script

The install script handles everything interactively:

```bash
./install.sh
```

It checks each tool and offers to install anything missing via Homebrew.

## Obsidian Plugins

Recommended plugins for the best experience:

- **Graph View** (built-in) — visualize wiki connections
- **Backlinks** (built-in) — see what links to current page
- **Dataview** — query pages by frontmatter
- **Local Images Plus** — download remote images
- **Marp Slides** — view generated presentations
- **Web Clipper** (browser extension) — clip articles to raw/
