---
name: ingest
description: Ingest a source into an LLM Wiki vault. Detects source type (URL, PDF, YouTube, tweet, gist, text), extracts content, creates wiki pages, updates index and log. Use when user wants to ingest, add, import, or process a source into their wiki.
argument-hint: <source> [--vault <name>]
allowed-tools: Bash(git *) Bash(curl *) Bash(mkdir *) Read Write Edit Glob Grep
---

# Ingest Source

Process any source into wiki pages. This is the main entry point for adding knowledge to a vault.

## Usage

```
/ingest https://some-article.com --vault my-research
/ingest raw/paper.pdf --vault my-research
/ingest https://youtube.com/watch?v=abc123 --vault my-research
/ingest https://x.com/user/status/123 --vault my-research
/ingest https://gist.github.com/user/abc123 --vault my-research
/ingest https://github.com/owner/repo/discussions/123 --vault my-research
/ingest "Some pasted text or notes" --vault my-research
```

## Step 1: Parse Arguments

- `$ARGUMENTS` contains the source and optional flags
- Extract source (first argument) and `--vault <name>` flag
- If no `--vault` specified, check if only one vault exists and use it. Otherwise ask.

## Step 2: Detect Source Type and Extract Content

Identify the source type and delegate to the appropriate extraction method:

| Pattern | Source Type | Extraction Method |
|---------|-----------|-------------------|
| `https://x.com/...` or `https://twitter.com/...` | Tweet | Use FXTwitter API: `curl -s "https://api.fxtwitter.com/{user}/status/{id}"` — parse JSON for `tweet.text`, `tweet.author`, `tweet.created_at`. See `ingest-tweet` skill. |
| `https://youtube.com/...` or `https://youtu.be/...` | YouTube | Extract transcript via yt-dlp subtitles. Check `which yt-dlp` first, install with `brew install yt-dlp` if missing. See `ingest-youtube` skill. |
| `https://gist.github.com/...` | Gist | Fetch raw content: `curl -sL "https://gist.githubusercontent.com/{user}/{id}/raw/"`. See `ingest-gist` skill. |
| `https://news.ycombinator.com/item?id=...` | Hacker News | Fetch thread via Algolia API: `curl -s "https://hn.algolia.com/api/v1/items/{id}"`. See `ingest-hackernews` skill. |
| `https://www.reddit.com/r/.../comments/...` or `https://old.reddit.com/...` | Reddit | Append `.json` to URL, parse post + comment tree. See `ingest-reddit` skill. |
| `https://github.com/.../discussions/...` | GitHub Discussion | Fetch via `gh api graphql`. See `ingest-github-discussions` skill. |
| `https://...` (other URLs) | Web Article | Fetch with `curl -sL`, extract readable content. For better extraction, use `@mozilla/readability` if available. See `ingest-web` skill. |
| `*.pdf` (file path) | PDF | Extract text with `pdftotext`. Check `which pdftotext` first, install with `brew install poppler` if missing. See `ingest-pdf` skill. |
| `*.docx`, `*.xlsx`, `*.pptx` (file path) | Office | Convert with `pandoc`. Check `which pandoc` first, install with `brew install pandoc` if missing. See `ingest-office` skill. |
| `*.md` (file path) | Markdown | Read the file directly. |
| Everything else | Text | Treat as pasted text/notes. |

## Step 3: Save Raw Source

Save the source material to the vault's `raw/` directory:

```bash
VAULT="vaults/<vault-name>"
```

- **For URLs**: Save the extracted content as markdown to `$VAULT/raw/<descriptive-name>.md`. Download referenced images to `$VAULT/raw/assets/` and replace remote URLs with local paths (see ingest-web skill for image handling details).
- **For files**: Copy the file to `$VAULT/raw/` if not already there
- **For text**: Save to `$VAULT/raw/<topic-slug>-notes.md`
- **For images in any source**: Download to `$VAULT/raw/assets/` with descriptive filenames. This lets the LLM view images directly for additional context.

Use descriptive, kebab-case filenames: `karpathy-llm-wiki-gist.md`, `react-server-components-paper.pdf`

## Step 4: Read Vault Conventions

Read the vault's `CLAUDE.md` to get:
- Default domain tag
- Any vault-specific conventions

Read `wiki-templates` skill (at `.claude/skills/wiki-templates/SKILL.md`) for page type definitions and frontmatter requirements.

## Step 5: Create/Update Wiki Pages

Based on the extracted content, create or update pages following the wiki-templates:

### 5a. Source Note (always created)
Create `wiki/sources/<source-name>.md` with:
- Full frontmatter per source-note template (title, dates, page-type, domain, tags, sources, related, source-url, source-type, author, date-accessed, raw-file)
- Overview, Key Takeaways, Detailed Notes, Sources sections
- Wikilinks to entities and concepts mentioned

### 5b. Entity Pages (create or update)
For each notable person, organization, tool, or framework mentioned:
- Check if `wiki/entities/<entity-name>.md` exists
- If exists: update with new information, add to sources/related
- If new: create per entity template with frontmatter (including entity-type, aliases)
- Link back to the source-note

### 5c. Concept Pages (create or update)
For each key idea, pattern, or technique discussed:
- Check if `wiki/concepts/<concept-name>.md` exists
- If exists: update with new information, add to sources/related
- If new: create per concept template with frontmatter
- Link back to the source-note

### 5d. Comparison Pages (if applicable)
If the source compares approaches, tools, or ideas:
- Check if a relevant comparison page exists in `wiki/comparisons/`
- If exists: update with new data points
- If new and the comparison is substantial: create per comparison template

**Important:** Don't over-create pages. Only create entity/concept pages for things that are meaningfully discussed in the source, not every passing mention.

## Step 6: Update Index

Add new entries to `wiki/index.md` in the appropriate table:

```markdown
| [[source-name]] | One-line summary | domain-tag | YYYY-MM-DD |
```

For entity and concept pages, add to their respective tables too.

## Step 7: Update Log

Append to `log.md`:

```markdown
## [YYYY-MM-DD] ingest | <Source Title>
- Source type: <type>
- Raw file: raw/<filename>
- Pages created: [[source-name]], [[entity-1]], [[concept-1]]
- Pages updated: [[existing-entity-2]]
---
```

## Step 8: Auto-Commit

```bash
cd $VAULT
git add .
git commit -m "✨ feat: ingest <source-title>"
```

## Step 9: Report

Show the user:
- Source summary (what was ingested)
- Pages created/updated (with wikilinks)
- Suggestions for follow-up (related sources to ingest, questions to explore)

## Notes

- Ingest one source at a time and stay involved (Karpathy's recommendation)
- A single source might create 1 source-note + 3-5 entity/concept pages
- Always discuss key takeaways with the user before/after creating pages
- When updating existing pages, preserve existing content and add new information — don't replace
