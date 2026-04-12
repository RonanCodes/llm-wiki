---
title: "Source Types"
description: "Seven source types with extraction methods, dependencies, and examples."
---

The `/ingest` command auto-detects source type and delegates to the appropriate handler. Each handler extracts content, saves to `raw/`, and creates wiki pages.

## Source Types at a Glance

| Type | Pattern | Handler | Dependencies |
|------|---------|---------|-------------|
| Web article | `https://...` (generic URL) | `ingest-web` | None (curl) |
| PDF | `*.pdf` file path | `ingest-pdf` | poppler (auto) |
| Office doc | `*.docx`, `*.xlsx`, `*.pptx` | `ingest-office` | pandoc (auto) |
| YouTube | `youtube.com/...`, `youtu.be/...` | `ingest-youtube` | yt-dlp (auto) |
| Tweet | `x.com/...`, `twitter.com/...` | `ingest-tweet` | None (FXTwitter API) |
| GitHub Gist | `gist.github.com/...` | `ingest-gist` | None (raw URL) |
| Text/notes | Pasted text or `*.md` file | `ingest-text` | None |

## Detailed Breakdown

### Web Article

```
/ingest https://some-article.com --vault my-research
```

- Fetches with `curl`, extracts readable content (title, author, body)
- Downloads images to `raw/assets/` and replaces remote URLs with local paths
- Saved as `raw/<descriptive-slug>.md`
- Fallback note if extraction is poor (SPAs, heavy JS) -- suggests Obsidian Web Clipper

### PDF

```
/ingest path/to/paper.pdf --vault my-research
```

- Extracts text via `pdftotext -layout` (preserves formatting)
- Copies original PDF to `raw/`
- Scanned PDFs (image-only) won't extract -- notes this for the user
- Lazy-installs poppler on first use: `brew install poppler`

### Office Documents

```
/ingest report.docx --vault my-research
```

- Word/PowerPoint via `pandoc -f docx/pptx -t markdown`
- Excel via `openpyxl` (Python) since pandoc doesn't handle `.xlsx`
- Lazy-installs pandoc on first use: `brew install pandoc`

### YouTube

```
/ingest https://youtube.com/watch?v=abc123 --vault my-research
```

- Extracts metadata (title, channel, duration) and auto-generated subtitles via yt-dlp
- Cleans SRT to readable text (deduplicates lines, strips timestamps)
- Notes that auto-generated subtitles may have transcription errors
- Lazy-installs: `brew install yt-dlp`

### Tweet

```
/ingest https://x.com/user/status/123 --vault my-research
```

- Fetches via FXTwitter API (free, no auth, returns full text including long note tweets)
- Captures author, date, engagement stats, quoted tweets, media URLs
- Fallback to oEmbed if FXTwitter fails (truncates long tweets)

### GitHub Gist

```
/ingest https://gist.github.com/user/abc123 --vault my-research
```

- Fetches raw content from `gist.githubusercontent.com` (no API key needed)
- Handles multi-file gists (lists files, fetches each)
- Fallback chain: raw URL, `gh gist view`, `gh api`

### Text / Notes

```
/ingest "Some pasted text or meeting notes" --vault my-research
```

- Pasted text or local markdown files processed directly
- Saved to `raw/<topic-slug>-notes.md`
- No external dependencies

## What Happens After Extraction

Regardless of source type, the ingest flow is the same:

1. Raw content saved to `raw/`
2. Source-note created in `wiki/sources/`
3. Entity pages created/updated in `wiki/entities/`
4. Concept pages created/updated in `wiki/concepts/`
5. Index and log updated
6. Vault auto-committed
