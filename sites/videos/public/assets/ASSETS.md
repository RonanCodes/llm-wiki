# Video Assets Registry

All assets in this directory are freely usable under their respective licenses.
Downloaded for use in Remotion promotional videos for the LLM Wiki project.

## Logos (`logos/`)

| File | Description | Source | License |
|------|-------------|--------|---------|
| `obsidian-logo.svg` | Obsidian 2023 icon (purple gem) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:2023_Obsidian_logo.svg) | CC BY 4.0 |
| `obsidian-logo-gradient.svg` | Obsidian official gradient icon | [obsidian.md/brand](https://obsidian.md/brand) | Brand usage (non-commercial OK with guidelines) |
| `claude-ai-logo.svg` | Claude AI wordmark | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Claude_AI_logo.svg) | Public Domain (below threshold of originality) |
| `claude-ai-icon.svg` | Claude AI app icon (rounded square) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Claude-ai-icon.svg) | CC0 1.0 (Public Domain) |
| `claude-ai-symbol.svg` | Claude AI starburst symbol (orange) | [Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Claude_AI_symbol.svg) | CC0 1.0 (Public Domain) |
| `github-mark.svg` | GitHub Invertocat mark (16px) | [Primer Octicons](https://github.com/primer/octicons) | MIT |
| `github-mark-24.svg` | GitHub Invertocat mark (24px) | [Primer Octicons](https://github.com/primer/octicons) | MIT |
| `terminal-icon.svg` | Terminal/CLI square icon | [Lucide Icons](https://lucide.dev) | ISC |

## Icons (`icons/`)

All icons from [Lucide Icons](https://lucide.dev) v1.8.0, licensed under ISC.
Fetched from `https://unpkg.com/lucide-static@latest/icons/`.

| File | Description | Use Case |
|------|-------------|----------|
| `link.svg` | Chain link | Wiki cross-references, backlinks |
| `search.svg` | Magnifying glass | /query command, search feature |
| `file-text.svg` | Document with text lines | Wiki pages, documents |
| `network.svg` | Connected nodes | Knowledge graph, connections |
| `download.svg` | Download arrow | /ingest command, source import |
| `check.svg` | Checkmark | /lint command, validation |
| `terminal.svg` | Terminal prompt | CLI interface, commands |
| `brain.svg` | Brain outline | AI/knowledge/intelligence |
| `lightbulb.svg` | Light bulb | Ideas, insights |
| `git-branch.svg` | Git branch | Version control, branching |
| `sparkles.svg` | Sparkle stars | AI magic, generation |
| `zap.svg` | Lightning bolt | Speed, performance |
| `book-open.svg` | Open book | Knowledge base, wiki |

## Screenshots (`screenshots/`)

See `screenshots/NEEDED.md` for the list of screenshots to generate.
These will be created as either static images or Remotion React components.

## Usage in Remotion

All SVG icons use `stroke="currentColor"` and can be recolored via CSS:

```tsx
// Apply Observatory theme colors
<img src="/assets/icons/brain.svg" style={{ filter: 'brightness(0) saturate(100%) ...' }} />

// Or inline the SVG and set stroke directly
<svg stroke="#5bbcd6" ...>  {/* cyan for engine/skills */}
<svg stroke="#e0af40" ...>  {/* amber for user/sources */}
<svg stroke="#7dcea0" ...>  {/* green for outputs */}
```

For best results with Remotion, consider inlining SVGs as React components
so you can animate individual paths and control colors programmatically.

## Observatory Color Theme

- Background: `#0a0a0a`
- Amber: `#e0af40` (user actions, sources)
- Cyan: `#5bbcd6` (engine, skills, processing)
- Green: `#7dcea0` (outputs, Obsidian, results)
