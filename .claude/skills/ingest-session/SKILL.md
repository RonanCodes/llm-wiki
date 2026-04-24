---
name: ingest-session
description: Ingest a Claude Code working session into a vault as a source-note. Captures the final artefacts (files produced), key decisions made, calibration notes (what was considered and rejected), and any knowledge or external research that informed the session. Intended for long multi-hour working sessions whose outcome is worth preserving for interview prep, future regeneration, or just paper trail. Used by /ingest session. Not user-invocable directly, go through /ingest.
user-invocable: false
allowed-tools: AskUserQuestion, Read, Write, Edit, Bash(ls *), Bash(git log *), Bash(mkdir *), Bash(date *), Glob, Grep
---

# Ingest Session

Turn a working session (a long Claude Code conversation that produced real artefacts) into a structured source-note. Useful when you've done several hours of positioning work, CV iteration, skill writing, or research-and-decide loops and want the outcomes captured somewhere greppable later.

## When to use

- You've been iterating with Claude Code for hours and want to close the loop with a paper trail.
- A recruiter or interviewer might reasonably ask "walk me through why your LinkedIn reads this way" and you want to answer from notes, not from memory.
- You plan to re-run a similar generation pass in a few months and want the skill to start from calibrated ground instead of rediscovering every lesson.
- You've learned something about a tool or model that future skills should encode (e.g., Gemini's aspect-ratio quirks).

## Usage (via /ingest router)

```
/ingest session [--vault <name>] [--title <slug>]
```

Examples:

```
/ingest session                                     # current session, default vault
/ingest session --title linkedin-overhaul           # explicit title for the note
/ingest session --vault personal-work --title cv-pass-for-stx
```

## Output

```
vaults/<vault>/wiki/sources/session-notes-<YYYY-MM-DD>-<slug>.md
```

Plus rows appended to `wiki/index.md` Sources table and `log.md`.

## Step 1: Resolve vault + title + date

- Default vault: whichever vault this session's work has been modifying (check recent file writes under `vaults/<name>/`).
- Date: today's date in `YYYY-MM-DD`.
- Title: short kebab-case slug describing the session (e.g. `linkedin-overhaul`, `cv-pass-for-stx`, `bio-v3-calibration`). If not passed, interview the user for one.

## Step 2: Interview for the outcomes (if needed)

If the session was entirely done by Claude in this conversation, Claude already knows the outcomes and should draft the note without asking. Just write it.

If the user is ingesting a session that happened partly off-conversation (e.g. they ran several commands themselves, or the conversation is fragmented), ask 2-3 focused questions via AskUserQuestion:

1. **Session focus** — what was the core goal (positioning, feature work, research pass, etc.)?
2. **Final artefacts** — any files to link? Any live targets (LinkedIn, GitHub, deployed app)?
3. **Calibration notes** — was there a "what-was vs what-is" change worth recording (words, framings, decisions rejected)?

Skip the interview when Claude has full context from the live session.

## Step 3: Extract the four canonical sections

Every session note has the same four sections. Claude fills them from the conversation history:

### 3a. Final settled artefacts

List every file / output that ended the session as the canonical one. Full paths inside the vault. Short one-line description each. This is what the user reaches for when they ask "where's the final X?"

### 3b. Decisions made

The positions, phrasings, titles, approaches that landed. Present tense. Direct quotes where useful.

### 3c. Calibration notes (what was considered and rejected)

A **table** of `what-was → what-is` plus a short reason per row. This is the single most valuable section for interview prep: each phrase was chosen over a stronger alternative for honest reasons.

Example:
```
| Was | Now | Reason |
|---|---|---|
| `Lead Engineer` | `Software Engineer` | Never formally Lead; bullets prove leadership |
| `co-leading X` | `helping with X` | Helping, not leading |
```

### 3d. Knowledge captured

External research, tool behaviours, and process-level learnings that inform future skills. Examples:
- Gemini Nano Banana 2 supports `21:9` but not `4:1`
- LinkedIn avatar covers `x=60-450, y=180-396` (observed, not the 568×264 the docs suggest)
- IBM's definition of `AI-native` (link + summary)

## Step 4: Pick a source-type and related pages

- `source-type: session`
- `tags: [session-notes, <topic-tags>]`
- `related` should link to every entity or comparison page the session produced or updated. This makes the session note a hub in the graph.
- `sources` field: `"Claude Code session, <date>"` plus any external URLs the session pulled from.

## Step 5: Write the source-note

Template:

```markdown
---
title: "Session Notes — <Topic> (<YYYY-MM-DD>)"
date-created: <date>
date-modified: <date>
page-type: source-note
domain:
  - <vault-default>
  - session-notes
tags:
  - session-notes
  - <topic-tags>
sources:
  - "Claude Code session, <date>"
  - <any external URLs>
related:
  - "[[<entity-a>]]"
  - "[[<comparison-b>]]"
source-type: session
author: "<user> + Claude"
date-accessed: <date>
---

# Session Notes — <Topic> (<YYYY-MM-DD>)

<One-paragraph overview. What this session covered, what drove it, what's different after it.>

## Final settled artefacts

<List.>

## Final positioning / final outputs

<Copy-paste-ready blocks of headlines, bios, role lines, CV pointers, etc. — whatever the user will reach for later.>

## Calibration notes

<The what-was → what-is table.>

## Knowledge captured

<External research summary. Tool-behaviour learnings. Anything future skills should encode.>

## Skills created or updated

<If the session produced engine-repo skill work, list them with versions.>

## Peripheral ingests

<If the session pulled in other source-notes or entities, list them.>

## Why this matters later

<Two or three bullet points. Usually: interview prep, next-regeneration baseline.>

## Sources

- **This session:** Claude Code conversation on <date>, driven by <context>.
- **Related source material:** [[...]]
- **External:** [...]
```

## Step 6: Update the vault

- Add a row to `wiki/index.md` under `## Sources` with `[[session-notes-<date>-<slug>]]`, a one-line summary, domain tags, date.
- Append an entry to `log.md`: `## [<date>] ingest | Session notes — <topic>` with the source link and a paragraph of context.

## Step 7: Commit and report

Auto-commit in the vault's repo using the standard emoji + conventional-commit format from `~/CLAUDE.md` (`✨ feat: ingest ...`). Add only the files just written: the source-note, `wiki/index.md`, and `log.md`. Respect the weekday commit-timestamp rule (`GIT_AUTHOR_DATE` / `GIT_COMMITTER_DATE` outside 08:30–18:00 Mon–Fri).

Then report one paragraph: what got written, what paths, what the user can grep for later, and the commit SHA.

## Rules

- **Auto-commit** the ingest. The session note, index row, and log entry are always committed together so the paper trail is the commit. User can amend later if they want edits.
- **Write in present tense** for decisions (`headline uses X`) and **past tense** for rejected paths (`considered Y, dropped because...`).
- **No em-dashes, no banned AI-tell vocabulary.** Apply `/ro:write-copy` rules.
- **Cross-vault refs** as plain markdown links: `[vault-short:page-slug](obsidian://open?vault=llm-wiki-<short>&file=<url-encoded-path>)`. Do NOT use `[[vault:page]]` wikilink form (unresolved-red, bad UX).
- **The calibration table is the most valuable artefact.** Fill it even if thin — one or two rows is better than none.
- **Link every artefact the session produced** under `related` so the session note becomes a hub in the graph.
- **Date in filename.** Format: `session-notes-<YYYY-MM-DD>-<slug>.md`. One session note per day per topic; if two sessions cover the same topic in one day, append `-a`, `-b`.

## Why this source-type exists

Most Claude Code sessions produce artefacts but not paper trail. When the user comes back in three months and asks "why did I change my LinkedIn to say X?", the CV / bio / cover files don't answer — the *reasoning* lived in the conversation and is lost. Session notes capture the reasoning in a format that travels: decisions, rejected alternatives, and learnings that should inform future generations.

It's the mirror of `rough-notes`: rough-notes captures a meeting *with someone else*; ingest-session captures a working session *with Claude*.
