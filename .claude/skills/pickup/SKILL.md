---
name: pickup
description: Session-start briefing for an LLM Wiki vault. Reads the vault's ROADMAP.md, tails its log.md, and scans entity frontmatter for in-progress status to produce a one-screen "here's where you left off" summary. Use at the start of a new session when you want to know what was open, what's blocked, what's next. Typed as `/pickup <vault-short-name>` or just `/pickup` to pick the current vault by cwd.
---

# pickup

## Purpose

When you open a new session and ask "what was I doing in this vault?", this skill is the answer. Consolidates four sources into one short briefing:

1. **`ROADMAP.md`** at the vault root — the canonical "open tasks, next-up, blocked, recently completed" file.
2. **Last 3-5 entries of `log.md`** — chronological activity, most recent first.
3. **Entity pages with `status: in_progress | building`** — what's actively in flight per lifecycle.
4. **Entity pages with `status: ideation` count** — how many open ideas exist.

## When to invoke

- Start of a new Claude Code session, after `cd` into the repo.
- Any time the user asks "what's open in vault X?" or "where did I leave off?"
- After a long break from a vault (say, > 1 week).

## How to invoke

`/pickup <vault-short-name>` — explicit vault (e.g. `/pickup side-projects`).
`/pickup` — infer vault from current working directory; if cwd is inside `vaults/llm-wiki-<name>/`, use that.
`/pickup --all` — brief summary of every vault, one section each.

## Output format

```
═════════════════════════════════════════════════════════
Pickup — <vault-short-name> (last touched YYYY-MM-DD)
═════════════════════════════════════════════════════════

## In progress ({N})
- [ ] thing 1 ([[entity-page]])
- [ ] thing 2

## Next up (top 3)
1. first priority
2. second priority
3. third priority

## Blocked ({N})
- thing — reason

## Lifecycle snapshot
- ideation:  {X} projects
- building:  {Y} projects
- shipped:   {Z} projects

## Recent activity (last 3 log entries)
- YYYY-MM-DD: ...
- YYYY-MM-DD: ...
- YYYY-MM-DD: ...

→ Suggested next move: <based on Next up #1 + any blockers + lifecycle gaps>
═════════════════════════════════════════════════════════
```

## Implementation steps

1. **Resolve vault.** If argument given, use `vaults/llm-wiki-<arg>/`. Else derive from `pwd`. If not in a vault, list available vaults and ask.
2. **Read ROADMAP.md** at vault root. If missing, suggest running a ROADMAP seed (empty template from `vault-create` skill). Continue without it if user declines.
3. **Read last 3-5 entries from `log.md`.** Use `grep "^## \[" log.md | tail -5`.
4. **Scan entity frontmatter.** For every `.md` in `wiki/entities/` (and `wiki/skills/` for skill-lab): `grep -l "^status: in_progress\|^status: building" wiki/entities/*.md`. Count `ideation`, `building`, `shipped`, `paused`, `graduated`, `killed` separately.
5. **Print the briefing.** Format above. Keep it one-screen.
6. **Propose a suggested next move.** Heuristic:
   - If there's anything in `Next up`, suggest the top entry.
   - Else if there's anything `in_progress` / `building`, suggest picking it back up.
   - Else if there are many `ideation` projects and no `building`, suggest "pick one to spike."
   - Else "looks like this vault is idle; consider ingesting a new source or archiving."

## Edge cases

- **No ROADMAP.md:** explain what it is, offer to run the `vault-create` seed or create one in place (copy the template from `vault-create`).
- **No `log.md`:** vault is probably empty; briefing collapses to "fresh vault, nothing to pick up."
- **Multiple vaults open in parallel:** the `--all` flag; one section per vault, brief.
- **Cross-vault dependency:** if an entity has `status: blocked` and the reason cites another vault, surface that cross-vault reference in the Blocked section.

## Related skills

- `vault-create` — seeds new vaults with an empty ROADMAP.md template.
- `vault-status` — broader "what does this vault contain" report (page counts, domains, orphan pages). Use for vault health; use `pickup` for session-start briefing.
- `ingest-session` — at session end, updates ROADMAP.md (`Recently completed`, removes matching `In progress` entries, prompts for new `Next up`).

## Keep the briefing short

One screen, max. If ROADMAP.md is overflowing, suggest the user prune `Recently completed` to 10 rolling entries and move stale `Next up` items to a separate file.
