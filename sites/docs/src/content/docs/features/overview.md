---
title: Features Overview
description: Everything LLM Wiki can do.
---

## Core Operations

| Command | Description |
|---------|-------------|
| `/ingest <source>` | Process any source into wiki pages (7 types) |
| `/generate <type> <topic>` | Emit artifacts (books, PDFs, slides, …) — the mirror of `/ingest` |
| `/query "question"` | Ask questions, get cited answers |
| `/lint` | Health-check wiki (8 checks, auto-fix) |
| `/promote <vault>` | Graduate knowledge between vaults |
| `/search "terms"` | Full-text search via qmd |
| `/slides "topic"` | Generate Marp presentations |

## Artifact Generation

`/generate` is a thin router that dispatches to per-type handler skills. Phase 2A foundation shipped these handlers:

| Type | Status | Description |
|------|--------|-------------|
| `book` | ✅ 2A | Pandoc-rendered PDF book with title page + TOC |
| `pdf` | ✅ 2A | Single page or folder → quick shareable PDF |
| `slides` / `mindmap` / `infographic` | 🚧 2B | Presentation-format artifacts |
| `podcast` / `video` | 🚧 2C | Multimedia artifacts |
| `quiz` / `flashcards` / `app` | 🚧 2D | Interactive artifacts |

See the full [generate overview](./generate) and per-handler docs ([book](./generate-book), [pdf](./generate-pdf)).

## Vault Management

| Command | Description |
|---------|-------------|
| `/vault-create <name>` | Create new vault (interactive or direct) |
| `/vault-import <path>` | Import existing Obsidian vault |
| `/vault-status` | Show all vaults with stats |
| `/vault-archive <name>` | Archive completed vault |

## Utilities

| Command | Description |
|---------|-------------|
| `/read-tweet <url>` | Read X/Twitter post |
| `/read-gist <url>` | Read GitHub gist |
| `/yt-transcript <url>` | Extract YouTube transcript |
| `/setup` | First-time machine setup |
| `/ralph` | Autonomous build loop |
