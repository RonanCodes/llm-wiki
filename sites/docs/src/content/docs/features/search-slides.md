---
title: "Search & Slides"
description: "Hybrid BM25/vector search with qmd, and Marp presentation generation."
---

## Search

The `/search` skill finds relevant wiki pages using [qmd](https://github.com/tobi/qmd) (hybrid BM25/vector search) with a grep fallback.

### Usage

```
/search "deployment patterns" --vault my-research
/search "Karpathy" --vault my-research
```

### How It Works

| Method | When | How |
|--------|------|-----|
| **qmd** (primary) | When installed | Hybrid BM25 + vector search with LLM re-ranking, all on-device |
| **grep** (fallback) | When qmd not installed | Pattern matching with match-count ranking |

qmd indexes your wiki locally -- no API calls, no external services. Install with `brew install qmd` or `cargo install qmd`.

### qmd as MCP Server

For seamless integration, qmd can run as an MCP server:

```json
{
  "mcpServers": {
    "qmd": {
      "command": "qmd",
      "args": ["mcp", "--dir", "vaults/my-research/wiki"]
    }
  }
}
```

Add this to `.claude/settings.json` to make search available as a native tool without invoking the skill.

### When You Need Search

At small scale (~100 pages), scanning `index.md` works fine. Once you pass ~200 pages, qmd provides much better discovery. Karpathy confirms index.md is adequate at moderate scale.

---

## Slides

The `/slides` skill generates [Marp](https://marp.app/)-format presentation decks from wiki content.

### Usage

```
/slides "LLM Knowledge Bases" --vault my-research
/slides "Deployment Patterns Comparison" --vault my-research
```

### How It Works

1. **Find relevant pages** -- concepts, comparisons, entities, source-notes
2. **Generate Marp deck** -- markdown with `marp: true` frontmatter, slides separated by `---`
3. **Save as wiki page** -- `wiki/slides-<topic>.md` with full frontmatter
4. **Update index and log** -- slides appear in a Presentations section

### Slide Conventions

- One idea per slide, separated by `---`
- Bullet points, not paragraphs
- 8-15 slides per deck
- Sources slide at the end with wikilinks
- Themes: `default`, `gaia`, `uncover`

### Exporting

```bash
npx @marp-team/marp-cli slides-topic.md --pdf   # PDF
npx @marp-team/marp-cli slides-topic.md --html   # HTML
```

### Viewing in Obsidian

Install the [Marp Slides](https://github.com/samuele-cozzi/obsidian-marp-slides) plugin. Any `.md` file with `marp: true` frontmatter renders as a slide deck.

Slides are wiki pages too -- they get frontmatter, appear in the index, and compound like everything else.
