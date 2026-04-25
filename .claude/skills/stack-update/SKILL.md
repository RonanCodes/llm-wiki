---
name: stack-update
description: Update the golden-stack docs in llm-wiki-research when a tech decision is made. Appends rows to the decision tree, audit checklist, or AI/agent layers; replaces tools; opens the target page in Obsidian; commits. Use when the user says "update the golden stack", "add X to the stack", "we've decided on Y", "in llm wiki update the stack doc", "record a stack decision".
argument-hint: [<decision summary>]
allowed-tools: Bash(git *) Bash(open *) Bash(grep *) Bash(find *) Bash(awk *) Bash(date *) Read Write Edit Glob Grep
---

# Stack Update

Single entry point for updating the **golden-stack** docs in the `llm-wiki-research` vault. Makes it easy for any Claude Code session to record a decision without hunting through files. Pairs with `/stack-audit` (planned): this skill writes canon, that one checks repos against it.

## Target documents

Three canonical pages under `vaults/llm-wiki-research/wiki/concepts/`:

| Alias | Filename | Covers |
|---|---|---|
| `ideal`, `main`, `stack`, `golden` | `ideal-tech-setup.md` | Core stack table, decision tree, audit checklist, CI / GH workflow, DR |
| `runtime`, `workers`, `tanstack` | `tanstack-on-cloudflare-workers.md` | V8 isolate, TanStack build, SSR, server functions, runtime limits |
| `agent`, `ai`, `llm` | `ai-agent-stack.md` | AI SDK, XState, LangGraph, RAG, vector stores, queues, DO vs BullMQ |

If the user asks to update something that does not fit any of these, ask whether to create a new concept page (do not silently extend the wrong doc).

## Usage

```
/stack-update "use R2 for all object storage"
/stack-update "switched from CF Queues to BullMQ on Upstash Redis"
/stack-update "add k6 for load testing"
/stack-update "replace Sentry with Highlight"
/stack-update                                        # fully interactive
```

## Step 1: Parse the decision

If an argument is given, treat it as the decision summary. If not, ask the user: "What did you decide?"

## Step 2: Auto-route to the right doc

Match keywords in the decision to a target doc. When ambiguous, ask the user via `AskUserQuestion` with the three targets as options.

**Agent doc signals** (route to `ai-agent-stack.md`):

`ai`, `llm`, `agent`, `langgraph`, `langsmith`, `rag`, `vector`, `embedding`, `semantic search`, `turbopuffer`, `pgvector`, `sqlite-vec`, `openai`, `anthropic`, `gemini`, `bullmq`, `redis`, `durable object`, `queue`, `sse`, `websocket`, `xstate`, `ai sdk`, `tool calling`, `retriever`, `eval`, `trace`.

**Runtime doc signals** (route to `tanstack-on-cloudflare-workers.md`):

`v8`, `isolate`, `nitro`, `server function`, `createServerFn`, `env binding`, `wrangler.toml`, `nodejs_compat`, `miniflare`, `ssr`, `cloudflare worker limits`.

**Default to `ideal-tech-setup.md`** for everything else: `auth`, `posthog`, `sentry`, `uptime`, `ci`, `eslint`, `prettier`, `commitlint`, `husky`, `d1`, `neon`, `drizzle`, `tailwind`, `shadcn`, `vitest`, `playwright`, `bruno`, `backup`, `disaster recovery`, `load testing`, `k6`, `lighthouse`, `cdn`, etc.

## Step 3: Pick the update kind

Present via `AskUserQuestion`:

1. **Add a decision-tree row** (the `### Product concerns` / `### Observability` / `### Platform concerns` tables in `ideal-tech-setup.md`, or a Layer's bullet list in `ai-agent-stack.md`)
2. **Add an audit-checklist row** (`ideal-tech-setup.md` § Audit Checklist only)
3. **Add / update a Stack-Table row** (`ideal-tech-setup.md` § The Stack, At A Glance only)
4. **Add a new layer or subsection** (larger edit; draft content, present for review before writing)
5. **Update the mermaid diagram** (read the existing block, propose the patch, apply)
6. **Replace an existing tool** (find the current row, ask for confirmation, replace in-place)

## Step 4: Row-shape templates

### Decision-tree row (ideal-tech-setup.md)

```
| <trigger condition> | <tool name> | <how to add: skill name or manual> |
```

### Audit-checklist row (ideal-tech-setup.md)

```
| <id> | <check> | <signal> | <severity> | <fix> |
```

Where:
- `id` is kebab-case, category-prefixed: `obs-highlight`, `hygiene-biome`, `test-k6`
- `severity` is `critical`, `recommended`, or `conditional` (add a sixth `only-if` column in the conditional table)
- `signal` is the grep-able hint: package dep name, file path, config line

### Stack-Table row (ideal-tech-setup.md)

```
| **<Layer>** | <Tool> | <Short "why" sentence> |
```

### AI/Agent layer bullet (ai-agent-stack.md)

Add under the nearest matching Layer (1 LLM calls, 2 Orchestration, 3 Memory, 4 RAG, 5 Queues, 6 Observability). If the decision does not fit any existing layer, propose a new "Layer 7: <topic>" and confirm with the user.

## Step 5: Guardrails (mandatory before write)

- **No em-dashes or en-dashes.** Replace `—` (U+2014) and `–` (U+2013) with `:`, `,`, parens, a full stop, or different phrasing.
- **No AI-tell vocabulary**: `leverage`, `seamless`, `robust`, `tapestry`, `delve`, `streamline`, `empower`, `unlock`, `elevate`, `fast-paced`, `intersection of`.
- **Update `date-modified`** in the target doc's frontmatter to today's date (`YYYY-MM-DD`).
- **Append-only by default.** Do not rewrite or reformat existing rows unless the user explicitly asked for a replace.

After writing, run sweeps on the affected sections:

```bash
awk '/<anchor-before-section>/,/<anchor-after-section>/' <file> | grep -nE '—|–' || echo "no em/en dashes"
awk '/<anchor-before-section>/,/<anchor-after-section>/' <file> | grep -inE 'leverage|seamless|robust|tapestry|delve|streamline|empower|unlock|elevate|fast-paced|intersection of' || echo "clean"
```

If either hits new lines, fix before committing.

## Step 6: Open in Obsidian

```bash
open "obsidian://open?vault=llm-wiki-research&file=wiki%2Fconcepts%2F<filename-without-.md>"
```

## Step 7: Commit

```bash
cd vaults/llm-wiki-research
git add wiki/concepts/<filename>
```

Follow the global CLAUDE.md commit-timestamp rule (weekdays outside 08:30-18:00). Use the emoji-conventional format:

```bash
git commit -m "📝 docs: <one-line decision summary>"
```

Check the last commit time first and stagger by ~5 minutes:

```bash
git log --oneline --format="%h %ai" -1
```

## Step 8: Report

One-line summary to the user:

> Added `<tool>` to `<doc>` § `<section>`. Committed as `<hash>`. Open in Obsidian for review.

## Triggers (for any Claude Code session)

Any of these phrasings should route the user's request to this skill:

- "update the golden stack"
- "update the stack doc" / "update the tech stack"
- "add X to the stack"
- "we've decided on Y" (in a stack context)
- "in llm wiki update the stack"
- "record a stack decision"
- "note that we're using Z now"

## Anti-patterns

- Do not create a new concept doc for small additions. A new tool is one row, not a new page.
- Do not silently overwrite existing rows. Always confirm for replace operations.
- Do not reformat neighbouring sections while inserting a row.
- Do not commit without the em-dash and AI-tell sweeps.
- Do not forget to update `date-modified` in the frontmatter.

## Examples

### Example 1: "use R2 for objects"

Routed to `ideal-tech-setup.md` (default). Kind: audit-checklist row. Append to the `### Backups + DR` or `### Core stack` table as appropriate. Result:

```
| storage-r2 | R2 object storage bound | `wrangler.toml` has `[[r2_buckets]]` entry | recommended | add R2 binding + upload server fn |
```

### Example 2: "add k6 for load testing"

Routed to `ideal-tech-setup.md` (load testing = default). Kind: audit-checklist row under Testing + hygiene. Result:

```
| test-k6 | k6 load tests | `k6/` directory with `.js` scripts; `pnpm k6` script in `package.json` | recommended | `brew install k6`; write `k6/baseline.js` |
```

### Example 3: "replace CF Queues with BullMQ"

Routed to `ai-agent-stack.md`. Kind: replace existing tool. Find the "Cloudflare Queues (default)" subsection; user confirms the replacement; edit the `Rule:` line and the decision-tree row in `ideal-tech-setup.md` to reflect the new default. Two-file edit.
