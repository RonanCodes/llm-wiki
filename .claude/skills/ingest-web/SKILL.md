---
name: ingest-web
description: Extract readable content from a web URL for wiki ingestion. Handles article extraction, HTML-to-markdown conversion.
user-invocable: false
allowed-tools: Bash(curl *)
---

# Ingest Web Article

Extract readable content from a web URL.

## Extraction Method

1. Fetch the page:
```bash
curl -sL -H "User-Agent: Mozilla/5.0" "<url>"
```

2. Extract readable content from the HTML. Focus on:
   - Article title (from `<title>`, `<h1>`, or `og:title` meta tag)
   - Author (from `<meta name="author">`, byline elements, or `article:author`)
   - Published date (from `<meta>` tags, `<time>` elements)
   - Main body text (strip nav, sidebar, footer, ads)

3. Convert to clean markdown preserving:
   - Headings hierarchy
   - Lists and blockquotes
   - Links (convert to markdown format)
   - Code blocks
   - Images (note URLs for potential local download)

4. Save to vault's `raw/<descriptive-slug>.md` with a YAML header:
```yaml
---
source-url: <original-url>
title: <extracted-title>
author: <extracted-author>
date-fetched: <today>
---
```

## Fallback

If HTML extraction is poor (SPA, heavy JS), note this in the source-note and suggest the user use Obsidian Web Clipper for better extraction.

## Dependencies

None — uses only `curl` and Claude's text processing.
