---
name: query
description: Ask questions against an LLM Wiki vault and get synthesized answers with citations. Optionally save answers back into the wiki. Use when user wants to query, ask, search, or explore their knowledge base.
argument-hint: "<question>" [--vault <name>] [--save]
disable-model-invocation: true
allowed-tools: Bash(git *) Read Write Edit Glob Grep
---

# Query Wiki

Ask questions against a vault's wiki and get synthesized answers with citations.

## Usage

```
/query "What deployment patterns have we seen?" --vault my-research
/query "Compare framework A vs B" --vault my-research --save
/query "Who are the key people in this space?" --vault my-research
```

## Step 1: Parse Arguments

- Extract the question (quoted string)
- `--vault <name>` — target vault (if omitted, use sole vault or ask)
- `--save` — file the answer back into the wiki as a new page

## Step 2: Read the Index

Read `vaults/<vault>/wiki/index.md` to get an overview of all pages in the wiki. This is the primary discovery mechanism.

```bash
cat "vaults/<vault>/wiki/index.md"
```

## Step 3: Identify Relevant Pages

Based on the question and the index, identify which wiki pages are most likely to contain relevant information. Consider:
- Pages whose titles or summaries relate to the question
- Entity pages for people/tools mentioned in the question
- Concept pages for ideas/patterns in the question
- Comparison pages if the question asks for comparisons
- Source-notes that cover the topic

## Step 4: Read Relevant Pages

Read the identified pages (typically 3-10 pages depending on question complexity):

```bash
cat "vaults/<vault>/wiki/sources/<page>.md"
cat "vaults/<vault>/wiki/entities/<page>.md"
cat "vaults/<vault>/wiki/concepts/<page>.md"
```

## Step 5: Synthesize Answer

Provide a comprehensive answer that:
- **Directly answers the question** with specifics from the wiki
- **Cites sources** using wikilinks: "According to [[source-name]], ..."
- **Notes gaps** if the wiki doesn't fully cover the question
- **Suggests follow-ups** — related questions worth exploring, sources to ingest

Format the answer in clean markdown with headings and structure appropriate to the question.

## Step 6: Save (if --save flag)

If `--save` is set, file the answer into the wiki:

1. Determine page type:
   - Comparison question → `wiki/comparisons/<topic>.md`
   - General synthesis → `wiki/<topic>-analysis.md` (summary type)

2. Create the page with proper frontmatter per wiki-templates:
   - `page-type: comparison` or `summary`
   - `sources` lists all wiki pages cited in the answer
   - `domain` inherited from vault + any additional
   - `related` links to pages referenced

3. Update `wiki/index.md` with the new entry

4. Append to `log.md`:
```markdown
## [YYYY-MM-DD] query | <Question summary>
- Question: "<full question>"
- Answer saved to: [[page-name]]
- Pages referenced: [[page-1]], [[page-2]], ...
---
```

5. Auto-commit:
```bash
cd "vaults/<vault>"
git add .
git commit -m "📝 docs: query — <question summary>"
```

## Notes

- Good answers filed back into the wiki compound the knowledge base
- If the wiki is too small to answer meaningfully, say so and suggest sources to ingest
- For complex questions, break the answer into sections
- Always cite which wiki pages informed the answer
- When the wiki grows large, the `/search` skill (qmd) will provide better page discovery than scanning index.md
