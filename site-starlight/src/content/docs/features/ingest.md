---
title: Ingest
description: Process any source into wiki pages.
---

The `/ingest` skill is the front door. It detects source type and delegates to specialized handlers.

## Usage

```
/ingest https://some-article.com --vault my-research
/ingest path/to/paper.pdf --vault my-research
/ingest https://youtube.com/watch?v=abc --vault my-research
```

## What happens

1. **Detect** source type (URL, PDF, YouTube, tweet, gist, Office, text)
2. **Extract** content via the appropriate handler
3. **Save** raw source to `raw/` with descriptive filename
4. **Create** source-note page in `wiki/sources/`
5. **Create/update** entity pages in `wiki/entities/` for people, orgs, tools mentioned
6. **Create/update** concept pages in `wiki/concepts/` for key ideas
7. **Update** `index.md` and append to `log.md`
8. **Auto-commit** the vault

A single source typically creates 3-7 wiki pages.

## 7 Source Types

| Source | Handler | Dependencies |
|--------|---------|-------------|
| Web articles | `ingest-web` | None (curl) |
| PDFs | `ingest-pdf` | poppler (auto) |
| Office docs | `ingest-office` | pandoc (auto) |
| YouTube | `ingest-youtube` | yt-dlp (auto) |
| Tweets | `ingest-tweet` | None (FXTwitter API) |
| GitHub Gists | `ingest-gist` | None (raw URL) |
| Text / notes | `ingest-text` | None |
