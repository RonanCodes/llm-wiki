---
title: "Dependencies"
description: "All tools (required and optional), install methods, and which skill uses each."
---

LLM Wiki has 3 required tools and 5 optional tools. Optional tools lazy-install on first use -- you don't need them upfront.

## Required

| Tool | Install | Purpose |
|------|---------|---------|
| **Claude Code** | `npm i -g @anthropic-ai/claude-code` | The AI engine that runs all skills |
| **Git** | `brew install git` | Version control for vaults (each vault is a git repo) |
| **Node.js** | `brew install node` | Runtime for Claude Code and Marp CLI |

## Optional (auto-install on first use)

| Tool | Install | Used By | What Happens |
|------|---------|---------|-------------|
| **yt-dlp** | `brew install yt-dlp` | `/ingest` (YouTube), `/yt-transcript` | Auto-installs via Homebrew when you first ingest a YouTube URL |
| **Poppler** (pdftotext) | `brew install poppler` | `/ingest` (PDF) | Auto-installs when you first ingest a PDF file |
| **Pandoc** | `brew install pandoc` | `/ingest` (Office docs) | Auto-installs when you first ingest a .docx/.xlsx/.pptx |
| **qmd** | `brew install qmd` | `/search` | Falls back to grep if not installed. Install for ranked results. |
| **Marp CLI** | `pnpm add -g @marp-team/marp-cli` | `/slides` | Auto-installs or uses `npx` when you first generate slides |

## Recommended (not required)

| Tool | Install | Purpose |
|------|---------|---------|
| **Obsidian** | `brew install --cask obsidian` | Wiki viewer -- graph view, backlinks, Dataview queries |

## Skill-to-Tool Matrix

| Skill | git | curl | yt-dlp | poppler | pandoc | qmd | marp |
|-------|-----|------|--------|---------|--------|-----|------|
| `/vault-create` | x | | | | | | |
| `/ingest` (web) | x | x | | | | | |
| `/ingest` (PDF) | x | | | x | | | |
| `/ingest` (Office) | x | | | | x | | |
| `/ingest` (YouTube) | x | | x | | | | |
| `/ingest` (tweet) | x | x | | | | | |
| `/ingest` (gist) | x | x | | | | | |
| `/query` | x | | | | | | |
| `/lint` | x | | | | | | |
| `/promote` | x | | | | | | |
| `/search` | | | | | | x | |
| `/slides` | x | | | | | | x |

## Install Script

The included install script checks everything interactively:

```bash
./install.sh  # checks deps, installs via Homebrew
```

Or run `/setup` inside Claude Code for the same checks with a detailed report.

## Zero-Dependency Skills

These skills need nothing beyond `curl` (always available):
- `/ingest` (web articles, tweets, gists, text)
- `/read-tweet`
- `/read-gist`
- `/query`, `/lint`, `/promote` (filesystem only)
