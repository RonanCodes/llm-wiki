---
title: "Promote"
description: "Graduate reusable knowledge between vaults with full traceability."
---

The `/promote` skill transfers reusable, cross-cutting knowledge from one vault to another -- typically from a project vault to a long-lived `meta` vault.

## Usage

```
/promote my-research --to meta
/promote project-alpha              # defaults to meta vault
```

| Flag | Description |
|------|-------------|
| `--to <vault>` | Target vault (defaults to `meta`) |

## When to Promote

- **Finishing a project** -- graduate learnings before archiving with `/vault-archive`
- **Cross-cutting knowledge** -- something in one vault would be useful across projects
- **Periodic maintenance** -- keep the meta vault current during long projects

## What Gets Promoted

| Promote | Skip |
|---------|------|
| Tech patterns and architecture decisions | Project-specific implementation details |
| Tool evaluations and comparisons | Source-notes for project-specific documents |
| Domain concepts that apply broadly | Entities only relevant to the project |
| Key people/orgs across projects | Temporary decisions or workarounds |

## How It Works

1. **Read source vault** -- index, concepts, comparisons, entities, source-notes
2. **Identify promotable knowledge** -- reusable beyond this specific project
3. **Check target vault** -- does a page for this topic already exist?
4. **Create or merge** -- new pages get created; existing pages get enriched
5. **Update both vaults** -- indexes, logs, auto-commits in both repos

## Traceability

Promoted pages include a `promoted-from` field in frontmatter:

```yaml
---
title: "LLM Knowledge Bases"
page-type: concept
promoted-from: my-research
sources:
  - "[[karpathy-llm-wiki-gist]]"
---
```

This traces knowledge back to its original vault and sources.

## Merging vs Creating

- **New topic in target**: creates a fresh page with proper frontmatter
- **Existing topic in target**: merges new information without duplicating, updates `sources` and `related`
- **Ambiguous cases**: asks you before proceeding

## Tips

- Promote is interactive -- it presents a plan and asks for confirmation
- Run `/lint` on the target vault after promoting to catch any gaps
- Promoting the same knowledge multiple times is safe -- merging handles deduplication
