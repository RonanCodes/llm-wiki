---
name: slides
description: Generate Marp presentation slide decks from wiki content. Use when user wants to create slides, a presentation, a deck, or export wiki knowledge as a talk.
argument-hint: "<topic>" [--vault <name>]
disable-model-invocation: true
allowed-tools: Bash(which *) Bash(npx *) Bash(pnpm *) Bash(git *) Read Write Edit Glob Grep
---

# Generate Slides

Create Marp-format presentation slide decks from wiki content.

## Usage

```
/slides "LLM Knowledge Bases" --vault my-research
/slides "Deployment Patterns Comparison" --vault my-research
```

## Step 1: Check for Marp CLI

```bash
which marp >/dev/null 2>&1 || npx @marp-team/marp-cli --version >/dev/null 2>&1
```

If not available:
```bash
echo "Installing Marp CLI..."
pnpm add -g @marp-team/marp-cli
```

Or use without installing: `npx @marp-team/marp-cli`

## Step 2: Find Relevant Wiki Pages

Read `vaults/<vault>/wiki/index.md` and identify pages related to the topic. Then read those pages to gather content.

Prioritize:
- Concept pages (main ideas)
- Comparison pages (if topic involves comparing things)
- Entity pages (key people/tools)
- Source-notes (for citations)

## Step 3: Generate Marp Slide Deck

Create a markdown file with Marp frontmatter at `vaults/<vault>/wiki/slides-<topic-slug>.md`:

```markdown
---
title: "<Topic>"
date-created: YYYY-MM-DD
date-modified: YYYY-MM-DD
page-type: summary
domain:
  - <vault-domain>
tags:
  - presentation
  - slides
sources:
  - "[[page-1]]"
  - "[[page-2]]"
related:
  - "[[concept-page]]"
marp: true
theme: default
paginate: true
---

# <Topic Title>

A presentation generated from the LLM Wiki vault.

---

## Overview

- Key point 1
- Key point 2
- Key point 3

---

## <Section Title>

Content from wiki pages, synthesized into slide-friendly format.

- Bullet points (not paragraphs)
- One idea per slide
- Visual hierarchy

---

## Key Takeaways

1. Takeaway 1
2. Takeaway 2
3. Takeaway 3

---

## Sources

- [[source-1]] — description
- [[source-2]] — description
```

### Slide Conventions

- **One idea per slide** — separated by `---`
- **Use bullet points** — not paragraphs
- **Include a Sources slide** at the end with wikilinks
- **Keep it to 8-15 slides** — concise, not exhaustive
- **Use headings for structure** — `##` for slide titles
- **Marp frontmatter** at the top: `marp: true`, `theme: default`, `paginate: true`

## Step 4: Update Index and Log

Add to `wiki/index.md` under a Presentations section (create if missing):

```markdown
## Presentations
| Page | Topic | Domain | Date Added |
|------|-------|--------|------------|
| [[slides-topic-slug]] | Topic title | domain | YYYY-MM-DD |
```

Append to `log.md`:
```markdown
## [YYYY-MM-DD] slides | <Topic>
- Generated slide deck: [[slides-topic-slug]]
- Pages referenced: [[page-1]], [[page-2]], ...
---
```

## Step 5: Export (optional)

If the user wants PDF/HTML output:

```bash
# PDF
npx @marp-team/marp-cli "vaults/<vault>/wiki/slides-<topic>.md" --pdf

# HTML
npx @marp-team/marp-cli "vaults/<vault>/wiki/slides-<topic>.md" --html
```

## Step 6: Auto-Commit

```bash
cd "vaults/<vault>"
git add .
git commit -m "📝 docs: generate slides — <topic>"
```

## Viewing in Obsidian

Install the [Marp Slides](https://github.com/samuele-cozzi/obsidian-marp-slides) plugin:
1. **Settings** → **Community plugins** → **Browse**
2. Search for "Marp Slides"
3. Install and enable
4. Open any `.md` file with `marp: true` frontmatter
5. Use the Marp preview to see rendered slides

## Notes

- Slides are wiki pages too — they get frontmatter, appear in the index, and compound
- Regenerate slides by running `/slides` on the same topic — it updates the existing file
- Marp supports themes: `default`, `gaia`, `uncover`. Change in frontmatter.
