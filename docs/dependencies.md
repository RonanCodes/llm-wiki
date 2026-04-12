# Dependencies

All tools used by the llm-wiki system, how to install them, and when they're needed.

## Core (required)

| Tool | Install | Purpose |
|------|---------|---------|
| Node.js 24 LTS | `brew install node` or [nvm](https://github.com/nvm-sh/nvm) | Runtime |
| Git | `brew install git` | Version control for engine + vaults |
| pnpm | `npm install -g pnpm` | Package manager (for future Next.js app) |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | `npm install -g @anthropic-ai/claude-code` | The engine — runs all skills |
| [Obsidian](https://obsidian.md) | Download from website | Wiki viewer/IDE |

## Optional (lazy-installed by skills on first use)

| Tool | Install | Purpose | Installed by |
|------|---------|---------|-------------|
| yt-dlp | `brew install yt-dlp` | YouTube transcript extraction | `ingest-youtube` skill |
| poppler | `brew install poppler` | PDF text extraction (pdftotext) | `ingest-pdf` skill |
| pandoc | `brew install pandoc` | Word/Excel/PowerPoint conversion | `ingest-office` skill |
| [qmd](https://github.com/tobi/qmd) | `brew install qmd` or `cargo install qmd` | Wiki search (BM25/vector hybrid) | `search` skill |
| @marp-team/marp-cli | `pnpm add -g @marp-team/marp-cli` | Slide deck generation from markdown | `slides` skill |

## Zero-dependency skills

These skills use only `curl` and standard CLI tools:

- `ingest-tweet` — FXTwitter API (no auth needed)
- `ingest-gist` — raw GitHub URL fetch
- `ingest-web` — basic URL fetch
- `ingest-text` — processes pasted text directly

## Obsidian Plugins (recommended)

| Plugin | Purpose |
|--------|---------|
| [Obsidian Web Clipper](https://obsidian.md/clipper) | Clip web articles to markdown for ingestion |
| Graph View (built-in) | Visualize wiki connections |
| Backlinks (built-in) | See what links to the current page |
| [Dataview](https://github.com/blacksmithgu/obsidian-dataview) | Query wiki pages by frontmatter |
| [Marp Slides](https://github.com/samuele-cozzi/obsidian-marp-slides) | View Marp slide decks in Obsidian |

## How Lazy Install Works

Each skill that needs an external tool checks for it on first use:

```bash
# Example: ingest-pdf checks for pdftotext
which pdftotext >/dev/null 2>&1 || {
  echo "Installing poppler for PDF support..."
  brew install poppler
}
```

You never need to install everything upfront. Tools are added as you need them.
