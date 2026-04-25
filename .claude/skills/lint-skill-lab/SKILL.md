---
name: lint-skill-lab
description: Validate the skill-lab vault catalog (vaults/llm-wiki-skill-lab/wiki/skills/) against the live production skill directories at ~/Dev/ronan-skills/skills/ and ~/Dev/ai-projects/llm-wiki/.claude/skills/. Catches broken output: pointers, lists production skills missing from the catalog, surfaces archived entries. Use after renaming or moving a production skill, after adding a new production skill, or as periodic vault hygiene.
---

# Lint Skill-Lab

## Purpose

Catch drift between the skill-lab vault catalog and the live production skills. Three failure modes:

- catalog page's `output:` path points to a directory that no longer exists (skill renamed, deleted, moved)
- production skill exists but no catalog page (decide: catalogue or leave uncatalogued)
- catalog page has malformed or missing `output:` field

## When to use

- After renaming or moving a production skill
- After adding a new production skill (decide whether to catalogue it)
- As periodic vault hygiene
- Auto-invoke from `/ingest session` close (planned hook, not wired yet)

## How to run

```bash
python3 ~/Dev/ai-projects/llm-wiki/.claude/skills/lint-skill-lab/audit.py
```

Exit code: `0` clean, `1` broken pointers found, `2` catalog or production dir missing.

## Output sections

- **BROKEN POINTERS** — catalog pages whose `output:` does not resolve. Fix by updating the path, or archiving the catalog page if the skill no longer exists in production.
- **ARCHIVED** — informational. These pages intentionally have no live production target.
- **PRODUCTION SKILLS NOT IN CATALOG** — warn-only. Decide per skill (rule below).

## Decision rule for uncatalogued skills

A production skill should get a catalog page when one of:

1. It carries (or should carry) a `content-pipeline:` tag (audio, copy, image, video, distribution, scan, review, orchestrator) used by [[launch-content-pipeline]] filtering.
2. It has a research / provenance story worth tracking (where the idea came from, what design decisions shaped it).
3. It composes into a workflow page in `wiki/workflows/`.

If none of those apply, leave it uncatalogued. The skill name itself is enough; `find ~/Dev/ronan-skills/skills/ -name SKILL.md` is the discovery mechanism for those cases.

## How to fix common drift

| Drift | Fix |
|-------|-----|
| `output: ronan-skills/src/<x>` (path does not exist) | Update to `ronan-skills/skills/<x>`; production layout dropped the `src/` subdir |
| `output: llm-wiki skills` (vague placeholder) | Update to `llm-wiki/.claude/skills/<x>` or `ronan-skills/skills/<x>` as appropriate |
| Catalog says implemented but no production found | If consolidated into another skill, set `skill-status: archived` and add a banner note pointing at the replacement. If genuinely unbuilt, set `skill-status: idea`. |
| Production skill exists, no catalog page | Either create a stub (use one of the existing ingest-* or generate-* pages as template) or accept it as deliberately uncatalogued |

## Sources

- Companion to [[launch-content-pipeline]] in skill-lab vault
- First introduced after a path-drift cleanup pass in 2026-04-26
