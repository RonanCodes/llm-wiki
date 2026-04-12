---
title: "Obsidian Web Clipper"
description: "Clip web articles into your vault for ingestion using the Obsidian Web Clipper browser extension."
---

Clip web articles directly into your vault as markdown, then ingest them into your wiki.

## Install the Extension

Install [Obsidian Web Clipper](https://obsidian.md/clipper) for your browser (Chrome, Firefox, Safari, Edge) and connect it to your vault.

## Configure Obsidian

### Attachment Folder

1. **Settings** → **Files and links**
2. Set **"Default location for new attachments"** → **"In the folder specified below"**
3. Set path to: `raw/assets`

### Image Download Hotkey

1. Install the [Local Images Plus](https://github.com/catalystsquad/obsidian-local-images-plus) community plugin
2. **Settings** → **Hotkeys** → search "Download all remote images"
3. Bind to `Cmd+Shift+D`

### Web Clipper Settings

1. Set **"Folder"** to: `raw`
2. Set **"File name template"** to: `{{title|slugify}}`
3. Enable **"Include metadata"** (adds source URL, author, date)

## Workflow

### 1. Clip an Article

While reading a web article:
1. Click the Web Clipper extension icon
2. Select your vault
3. Verify folder is `raw/`
4. Click **"Add to Obsidian"**

### 2. Download Images

Open the clipped file in Obsidian:
1. Press `Cmd+Shift+D`
2. Images download to `raw/assets/`
3. Links update to local paths

### 3. Ingest

```bash
/ingest raw/article-name.md --vault my-research
```

Claude reads the article, creates wiki pages (source-note, entities, concepts), updates the index, and commits.

## Tips

- **Clip first, ingest later** — build up a batch in `raw/`, ingest one at a time with Claude
- **Review before ingesting** — check the clipped article in Obsidian, some sites clip poorly
- **The raw file is immutable** — once in `raw/`, don't edit it. The wiki pages are where Claude maintains knowledge
- **Download images** — remote URLs break over time. Local images let Claude view them directly

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Clipper saves to wrong folder | Check extension settings → folder is `raw` |
| Images not downloading | Install and enable Local Images Plus plugin |
| Poor extraction | Use browser Reader Mode before clipping |
| Frontmatter conflicts | Ingest skill merges existing frontmatter with wiki-templates |
