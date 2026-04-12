# Workflow

How to use the llm-wiki system day-to-day.

## Setup (once per machine)

1. Clone the repo: `git clone https://github.com/RonanCodes/llm-wiki.git`
2. Run `/setup` in Claude Code to check/install dependencies
3. Install [Obsidian](https://obsidian.md) if you don't have it
4. Install Obsidian Web Clipper browser extension

## Create a Vault

```
/vault-create my-research
```

This creates a vault directory with the standard structure (raw/, wiki/, index.md, log.md, CLAUDE.md) and initializes it as a git repo. Open it in Obsidian as a vault.

## Daily Workflow

### Collecting Sources (you do this)

**From the web:**
1. Use Obsidian Web Clipper to save an article as markdown
2. Clipper saves it into your vault's `raw/` directory
3. In Obsidian: Settings → Hotkeys → "Download attachments" → download images locally

**From other formats:**
- Save PDFs, Word docs, Excel files into `raw/`
- YouTube URLs, tweet URLs, gist URLs — just copy the URL

### Ingesting Sources (Claude does this)

```
/ingest raw/some-article.md --vault my-research
/ingest https://youtube.com/watch?v=abc123 --vault my-research
/ingest https://x.com/user/status/123 --vault my-research
/ingest path/to/report.pdf --vault my-research
```

What happens:
- Claude reads the source, extracts key information
- Creates/updates wiki pages (summaries, entity pages, concept pages)
- Adds YAML frontmatter (title, date, sources, domain tags, page type)
- Updates `wiki/index.md` with new entries
- Appends to `log.md`
- Auto-commits the vault

A single source might touch 10-15 wiki pages.

### Browsing the Wiki (you do this in Obsidian)

- Open your vault directory in Obsidian
- Browse pages in `wiki/` — summaries, entities, concepts
- Use **Graph View** to see connections between pages
- Use **Backlinks** to see what references the current page
- Use **Search** to find specific content
- Use **Dataview** for structured queries over frontmatter

### Asking Questions (Claude does this)

```
/query "What deployment patterns have we seen?" --vault my-research
/query "Compare framework A vs B" --vault my-research --save
```

- Claude reads the wiki's index.md, finds relevant pages, synthesizes an answer
- With `--save`, the answer is filed back into the wiki as a new page
- Good questions compound — your explorations enrich the knowledge base

### Health Checks (Claude does this)

```
/lint --vault my-research
```

Run periodically. Claude checks for:
- Orphan pages with no inbound links
- Concepts mentioned but lacking their own page
- Missing cross-references
- Contradictions between pages
- Stale claims superseded by newer sources

### Graduating Knowledge (when finishing a project)

```
/promote my-research --to meta
```

Claude reads the project vault, identifies reusable learnings, files them into your meta vault. Tech patterns, strategy insights, vendor evaluations — anything not tied to the specific project.

## What You Do vs What Claude Does

### You:
- **Curate sources** — find articles, papers, videos worth reading
- **Clip and collect** — save sources into `raw/` via Web Clipper or file drops
- **Direct the analysis** — ask good questions, guide what to emphasize
- **Browse and think** — read the wiki in Obsidian, follow connections, form insights
- **Decide what's important** — you're the editor-in-chief

### Claude:
- **Extract and summarize** — reads sources, pulls out key information
- **Create wiki pages** — writes summaries, entity pages, concept pages
- **Cross-reference** — maintains links between pages, notes connections
- **Keep the wiki current** — updates index, logs activity, flags contradictions
- **Synthesize answers** — pulls from multiple pages to answer complex questions
- **Maintain quality** — lint checks, suggests gaps, recommends new sources

## Tips

- **Ingest one source at a time** and stay involved — read the summaries, check updates, guide emphasis (Karpathy's recommendation)
- **File good query answers back** into the wiki with `--save` — explorations should compound
- **Run lint periodically** — especially after batch-ingesting multiple sources
- **Use domain tags** in frontmatter from day one — shared entities across vaults become the most valuable nodes
- The wiki is just a git repo — you get version history, branching, and rollback for free
