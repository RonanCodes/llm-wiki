---
name: query
description: Ask questions against an LLM Wiki vault and get synthesized answers with citations. Optionally save answers back into the wiki. Use when user wants to query, ask, search, or explore their knowledge base.
argument-hint: "<question>" [--vault <name>] [--save]
allowed-tools: Bash(git *) Bash(which *) Bash(qmd *) Read Write Edit Glob Grep
---

# Query Wiki

Ask questions against a vault's wiki and get synthesized answers with citations.

## Usage

```
/query "What deployment patterns have we seen?" --vault my-research
/query "Compare framework A vs B" --vault my-research --save
/query "Who are the key people in this space?" --vault my-research
/query "What's our current LinkedIn voice?" --all-vaults    # search every vault under vaults/
```

## Step 1: Parse Arguments

- Extract the question (quoted string)
- `--vault <name>` — target vault (if omitted, use sole vault or ask)
- `--save` — file the answer back into the wiki as a new page
- `--all-vaults` — query every vault under `vaults/` and synthesise across them. Mutually exclusive with `--vault`. Useful when the question crosses domains (e.g. "what does my personal-work vault say about my LinkedIn voice, and how does that line up with the marketing playbooks I've ingested?").

## Step 2: Read the Index Progressively

The vault's `index.md` is structured in tiers (see `wiki-templates` § Progressive Index). Load only what the question warrants — this keeps `/query` fast as vaults grow past ~200 pages.

1. **Always read L0** (`## Purpose` section of `index.md`) — vault context, primary domain, anchor entities.
2. **Read L1** (`## Topic Map`) for any synthesis or cross-page question.
3. **Read L2** (`## Full Index`) only if L0+L1 don't surface enough candidate pages, or the question is structural ("what's missing", "list all X").

If the vault has been sharded into separate files (`index-l1.md`, `index-l2.md`), apply the same read-order to those files.

```bash
VAULT="vaults/<vault>"
# Always: read index.md (which contains L0, and L1+L2 unless sharded)
cat "$VAULT/wiki/index.md"
# If sharded: cat "$VAULT/wiki/index-l1.md" only when L1 needed, "$VAULT/wiki/index-l2.md" only when L2 needed
```

## Step 2b: Search with qmd (if available)

If `qmd` is installed, run a hybrid BM25 + vector search to surface relevant pages directly. Prepend qmd's top results to the candidate list from Step 2 — they typically beat title-based discovery on questions that reference content rather than page names.

```bash
if which qmd >/dev/null 2>&1; then
  qmd search "$VAULT/wiki" "<question>" --limit 10 --format json
fi
```

Parse the JSON for `path` and `score`. Use the top 3-5 as starting candidates. If qmd isn't installed, skip silently — the index-based discovery in Step 2 is sufficient at smaller scale.

## Step 2c: Build the context pack

Apply the algorithm from the `context-pack` reference skill — extract seed signals (tags, domains, named entities, page-type hint) from the question, score every wiki page, and return the top 5 with a "why" column. This is the deterministic answer to "which pages should I read?" and replaces ad-hoc title-matching.

The pack table feeds directly into Step 3 below — qmd hits and pack picks are merged, deduped, and prioritised together.

## Step 2d: Multi-vault discovery (`--all-vaults` only)

When `--all-vaults` is set, repeat Steps 2 / 2b / 2c for **every** `vaults/<name>/wiki/` directory. Track results per-vault so the final answer can cite cross-vault pages with the proper `[vault-short:page]` link form (see `wiki-templates` § Wikilinks).

Order of operations:
1. List vaults: `ls vaults/` (filter to directories that contain a `wiki/` subdirectory).
2. For each vault: read `wiki/index.md` L0 (always), L1 if the question is broad, run qmd if installed (qmd accepts a path argument so it queries each vault's wiki separately), build a context pack scoped to that vault.
3. Aggregate: keep top 3-5 pages per vault, label each with its vault short name.

The context pack from each vault is its own block — do **not** mix across vaults at the candidate-finding stage, because tag/domain overlap is a per-vault signal. Cross-vault synthesis happens in Step 5.

## Step 3: Identify Relevant Pages

Combine qmd results (Step 2b), context-pack picks (Step 2c), and (if applicable) per-vault packs (Step 2d). Deduplicate and prioritise:
- Context-pack top-3 — score-ranked, deterministic
- qmd top-3 (when available) — high recall on content-similar pages
- Pages whose index entries semantically match the question (titles, one-line summaries)
- Entity pages for people/tools named in the question
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

### `--all-vaults` synthesis

When in multi-vault mode, the answer is structured around the cross-cut:
- **Per-vault citations use the cross-vault link form**, not bare wikilinks. Example: `[personal-work:linkedin-profile-ronan-connolly](obsidian://open?vault=llm-wiki-personal-work&file=wiki%2Fsources%2Flinkedin-profile-ronan-connolly)`. See `wiki-templates` § Wikilinks for the canonical form.
- **Group by theme, not by vault.** Don't write four sections "what personal-work says" / "what marketing says". Synthesise across, then flag where vaults agree, disagree, or are silent.
- **Surface tensions explicitly.** If two vaults have contradicting facts, say so and link both.
- **Suggest cross-vault links the user should add.** If the answer reveals that personal-work would benefit from linking to a marketing concept page, recommend the link as a follow-up.

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
