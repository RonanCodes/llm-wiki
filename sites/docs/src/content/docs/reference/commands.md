---
title: "Commands"
description: "Full reference of all slash commands available in LLM Wiki."
---

All commands are Claude Code skills invoked with `/command-name`. Run them inside a Claude Code session from the `llm-wiki/` directory.

## Core Operations

| Command | Arguments | Description |
|---------|-----------|-------------|
| `/ingest <source>` | `--vault <name>` | Process any source into wiki pages (detects type automatically) |
| `/generate <type> <topic>` | `--vault <name>` + handler flags | Emit an artifact from wiki pages. Dispatches to `generate-<type>` handlers. The mirror of `/ingest` |
| `/query "question"` | `--vault <name>` `--save` | Ask questions, get cited answers. `--save` files the answer back into the wiki |
| `/lint` | `--vault <name>` `--fix` | Health-check wiki (8 checks). `--fix` auto-repairs what's fixable |
| `/promote <vault>` | `--to <target>` | Graduate reusable knowledge between vaults (default target: `meta`) |
| `/search "terms"` | `--vault <name>` | Full-text search via qmd (hybrid BM25/vector) with grep fallback |
| `/slides "topic"` | `--vault <name>` | Deprecated shim — delegates to `/generate slides` |

### /generate Handler Types

| Type | Handler | Phase | Description |
|------|---------|-------|-------------|
| `book` | `generate-book` | 2A ✅ | Pandoc-rendered PDF book — title page, TOC, chapter-per-page |
| `pdf` | `generate-pdf` | 2A ✅ | Quick shareable PDF from a page or folder — no ceremony |
| `slides` | `generate-slides` | 2B ✅ | Marp (default) or Reveal.js deck |
| `mindmap` | `generate-mindmap` | 2B ✅ | Markmap HTML with Mermaid fallback |
| `infographic` | `generate-infographic` | 2B ✅ | Observatory-themed SVG + optional PNG |
| `podcast` | `generate-podcast` | 2C ✅ | TTS-rendered MP3 explainer (ElevenLabs / OpenAI / Piper) |
| `video` | `generate-video` | 2C ✅ | Remotion-rendered MP4 with optional voiceover mux |
| `quiz` | `generate-quiz` | 2D | Standalone HTML quiz |
| `flashcards` | `generate-flashcards` | 2D | Anki `.apkg` deck |
| `app` | `generate-app` | 2D | Interactive explorable web app |

See [artifact conventions](./artifacts) for storage paths, sidecar schema, and the source-hash algorithm.

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
| `generate-book` | generate | Render Pandoc PDF book from wiki pages |
| `generate-pdf` | generate | Render quick PDF from a page or folder |
| `generate-slides` | generate | Render Marp / Reveal.js slide deck |
| `generate-mindmap` | generate | Render Markmap HTML mindmap (Mermaid fallback) |
| `generate-infographic` | generate | Render Observatory-themed SVG infographic |
| `generate-podcast` | generate | Render MP3 podcast via Piper / OpenAI / ElevenLabs TTS |
| `generate-video` | generate | Render MP4 via Remotion; optional voiceover mux |
