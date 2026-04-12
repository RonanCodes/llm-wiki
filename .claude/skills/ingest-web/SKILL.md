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
   - Image references (see Image Handling below)

4. Save to vault's `raw/<descriptive-slug>.md` with a YAML header:
```yaml
---
source-url: <original-url>
title: <extracted-title>
author: <extracted-author>
date-fetched: <today>
images-downloaded: <count>
---
```

## Image Handling

After extracting the article content, download referenced images locally:

1. **Find image URLs** in the extracted markdown:
   - `![alt](https://...)` markdown image syntax
   - Common formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`, `.webp`

2. **Download each image** to vault's `raw/assets/`:
```bash
VAULT="vaults/<vault-name>"
mkdir -p "$VAULT/raw/assets"

# For each image URL:
FILENAME="<descriptive-name>-<hash>.<ext>"
curl -sL -o "$VAULT/raw/assets/$FILENAME" "<image-url>"
```

Use a descriptive filename derived from the article slug + image position:
`karpathy-llm-wiki-img-01.png`, `karpathy-llm-wiki-img-02.jpg`

3. **Replace remote URLs** with local paths in the raw markdown:
```markdown
# Before:
![diagram](https://remote-server.com/images/arch.png)

# After:
![diagram](assets/karpathy-llm-wiki-img-01.png)
```

4. **Skip images that are:**
   - Already local paths
   - Tracking pixels or tiny icons (< 1KB or 1x1 dimensions in the URL)
   - Data URIs (base64 embedded)

5. **Record count** in the raw file's frontmatter: `images-downloaded: 3`

## Fallback

If HTML extraction is poor (SPA, heavy JS), note this in the source-note and suggest the user use Obsidian Web Clipper for better extraction.

## Dependencies

None — uses only `curl` and Claude's text processing.
