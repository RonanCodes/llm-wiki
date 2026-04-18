---
title: "Search"
description: "Hybrid BM25/vector search with qmd."
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

## Slides — see `/generate slides`

The standalone `/slides` skill has been folded into the `/generate` router as of Phase 2B. Use `/generate slides <topic>` for Marp decks, or `/generate slides <topic> --format reveal` for Reveal.js.

See [generate-slides](./generate-slides) for the full docs.
