# Screenshots Needed for Promotional Videos

These screenshots need to be created for use in Remotion video compositions.
Generate at high resolution (1920x1080 minimum) with the Observatory color theme.

## Terminal Screenshots

- **ingest-command.png** — Terminal showing `/ingest` command running
  - Dark terminal background (#0a0a0a)
  - Show a realistic `claude> /ingest https://arxiv.org/abs/...` command
  - Include progress output (extracting, creating wiki page, updating index)
  - Green (#7dcea0) for success messages, cyan (#5bbcd6) for info

- **query-command.png** — Terminal showing `/query` command with results
  - Show `claude> /query "What do we know about transformer architectures?"`
  - Include a multi-paragraph response with wiki cross-references
  - Highlight `[[wikilinks]]` in cyan (#5bbcd6)

## Obsidian-Style Screenshots

- **wiki-page.png** — Obsidian-style wiki page (mock in HTML/CSS)
  - Dark theme matching Observatory colors
  - Show YAML frontmatter, headings, backlinks panel
  - Include wikilinks and a sources section

- **graph-view.png** — Obsidian-style graph view (mock in HTML/Canvas)
  - Network of connected nodes on dark background
  - Node colors: amber (#e0af40) for main topics, cyan (#5bbcd6) for subtopics
  - Edge lines in muted grey
  - Show 15-25 interconnected nodes

## Composite Screenshots

- **side-by-side.png** — Split view: terminal (left) + wiki output (right)
  - Left: terminal with `/ingest` command
  - Right: the resulting wiki page in Obsidian-style view
  - Thin divider line between panels

## Notes

- All screenshots should use the Observatory theme:
  - Background: #0a0a0a
  - Amber: #e0af40 (user/sources)
  - Cyan: #5bbcd6 (engine/skills)
  - Green: #7dcea0 (outputs/Obsidian)
- Consider creating these as React components in Remotion for animation
- Alternative: generate as static images and use Remotion's `<Img>` component
