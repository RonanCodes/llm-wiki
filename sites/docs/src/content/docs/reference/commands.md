---
title: "Commands"
description: "Full reference of all slash commands available in LLM Wiki."
---

All commands are Claude Code skills invoked with `/command-name`. Run them inside a Claude Code session from the `llm-wiki/` directory.

## Core Operations

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/ingest <source>` | `--vault <name>` | Process any source into wiki pages (detects type automatically) |
| `/query "question"` | `--vault <name>` `--save` | Ask questions, get cited answers. `--save` files the answer back into the wiki |
| `/lint` | `--vault <name>` `--fix` | Health-check wiki (8 checks). `--fix` auto-repairs what's fixable |
| `/promote <vault>` | `--to <target>` | Graduate reusable knowledge between vaults (default target: `meta`) |
| `/search "terms"` | `--vault <name>` | Full-text search via qmd (hybrid BM25/vector) with grep fallback |
| `/slides "topic"` | `--vault <name>` | Generate Marp slide deck from wiki content |

## Vault Management

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/vault-create <name>` | `--domain <domain>` | Create new vault (interactive if no args, direct otherwise) |
| `/vault-import <path>` | `--name <name>` `--domain <domain>` | Import existing Obsidian vault or markdown folder |
| `/vault-status` | (none) | Show all vaults with page counts, source counts, last activity, git status |
| `/vault-archive <name>` | `--promote-first` | Archive completed vault. `--promote-first` graduates knowledge before archiving |

## Utilities

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/read-tweet <url>` | (none) | Read full text of an X/Twitter post via FXTwitter API |
| `/read-gist <url>` | (none) | Read raw content of a GitHub gist |
| `/yt-transcript <url>` | (none) | Extract YouTube transcript as clean text via yt-dlp |
| `/setup` | (none) | First-time machine bootstrap: check tools, skills, Obsidian |
| `/ralph` | `--all` `--plan-only` `--single` | Autonomous build loop from `prd.json` |
| `/create-skill` | `[name]` | Meta-skill: guided creation of new Claude Code skills |

## Internal Skills (not user-invoked)

| Skill | Used By | Description |
|-------|---------|-------------|
| `wiki-templates` | ingest, query, lint | Page type templates and frontmatter conventions |
| `ingest-web` | ingest | Extract readable content from web URLs |
| `ingest-pdf` | ingest | Extract text from PDFs (lazy-installs poppler) |
| `ingest-office` | ingest | Extract text from Word/Excel/PowerPoint (lazy-installs pandoc) |
| `ingest-youtube` | ingest | Extract transcripts from YouTube (lazy-installs yt-dlp) |
| `ingest-tweet` | ingest | Extract tweet text via FXTwitter API |
| `ingest-gist` | ingest | Extract gist content via raw URL |
| `ingest-text` | ingest | Process pasted text or local markdown |
