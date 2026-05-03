---
name: capture-mode
description: Free-form chat as journaling. When the user opens a session in llm-wiki by chatting in narrative/life style (not asking for code or research), enter Capture Mode. Confirm once on the first message, buffer through the session, propose batched multi-vault writes at close. Routes content to personal-journal (always) + personal-life (entities, principles) + work spokes when work content surfaces. Aggressive entity extraction. Auto-loads when working dir is llm-wiki.
allowed-tools: Bash(git *) Bash(grep *) Bash(ls *) Read Write Edit Glob Grep
---

# Capture Mode

Free-form chat as journaling. The user just talks; you route, extract, buffer, and write at the end.

## When to enter Capture Mode

**Trigger** on the FIRST message of a session when ALL of these are true:
- Working directory is `llm-wiki` (or a subpath)
- Message reads as narrative, autobiographical, or life-event content
- Message is NOT a code/dev/research/skill task

### Reads as capture-worthy

- Narrative: "today I…", "I just…", "I've been thinking about…", "had a chat with…"
- Subjective: "I'm worried about…", "I noticed I…", "feeling…"
- Life events: people, milestones, relationships, health, home, money, travel, family
- Day or week recap, monthly reflection
- Decisions about life (not about code architecture)

### Reads as a normal task: DO NOT enter Capture Mode

- Code/dev: "fix…", "build…", "refactor…", "test…", "deploy…"
- Research: "look up…", "what does X mean", "explain…"
- Skill / vault ops: "create a vault for…", "ingest this URL", "run /lint"
- Meta about LLM Wiki: "how does this skill work", "where is X stored"
- Any explicit slash-command or tool ask

If genuinely ambiguous, default to NOT entering and let the user direct.

## Step 0: First-message handshake

On detecting a capture-worthy opener, respond with a single short confirm, no other content yet:

> Capture mode? I'll route to:
> - `personal-journal`: today's entry (always)
> - `personal-life`: entities (people, places) and principles/protocols/goals as they come up
> - any work spoke if work content surfaces (Yellowtail / Taskforce / a side project)
>
> I'll buffer through the session and propose all writes at the end. Cancel any time by saying "stop capturing" or asking me a code/research question.

Wait for user confirmation. Acceptable confirms: "yes", "go", "do it", "👍", any positive signal. If they decline or pivot to a task, drop into normal mode.

## Step 1: Buffer through the session

Once confirmed, converse naturally. React, ask follow-ups, push back, suggest framings. **Do NOT write to disk yet.** Keep an internal buffer with these fields:

```
journal_entry:
  date: <today YYYY-MM-DD>
  raw_chunks: [<verbatim user passages worth quoting>, ...]
  themes: [<short bullets of what this entry is about>]
  mood: <if user expresses one>
  status: draft

entities:
  people:
    - name: <name>
      aliases: [<other names>]
      first_mention: <verbatim first-mention sentence>
      context: <relationship: friend, colleague, family, recruiter…>
      mentions: [<each utterance that references them>]
      last_seen: <date>
  places: [...]
  organisations: [...]

concepts:
  - title: <e.g. "principle: default to action">
    type: <principle | protocol | habit | goal>
    summary: <one or two sentences>
    raised_by: <which user passage surfaced it>

cross_routes:
  work_spokes: [<vault-short>: <why>, ...]
  other_hubs: [<vault-short>: <why>, ...]
```

Maintain the buffer silently. Don't narrate buffer state every message.

### During the session

- If user pivots to a clear non-capture task ("now help me debug X", "let's run /lint"), pause Capture Mode, serve the task, resume buffering when they switch back. Acknowledge the pivot only briefly.
- If user mentions a name not yet in the buffer, add it. If they mention an existing name, append to that person's mention list and update last-seen.
- If user articulates a principle or protocol ("I think the rule for me is…"), capture it as a concept.
- If user mentions a work topic (Yellowtail, Taskforce, a specific side project), record the cross-route hint.

## Step 2: Detect close

Trigger Step 3 when the user signals close:
- Says: "wrap up", "save it", "ok let's commit", "I'm done", "write it up", "ingest this"
- Invokes `/ingest session` or `/ingest text` directly
- Says they have to go and the conversation has reached natural closure

If they pause without signalling close, do not write: wait. They may resume. Capture Mode persists across pauses within a single Claude Code session.

## Step 3: Propose the batched write

Before writing anything, surface a single confirmation summary listing every planned change:

> **Ready to write:**
>
> **`personal-journal`** (Activity)
> - `wiki/sources/entry-2026-05-03.md`: today's entry, ~<word count> words, themes: <list>
>
> **`personal-life`** (Hub)
> - `wiki/entities/person-sarah.md`: created (first mention; relationship: friend, last-seen 2026-05-03)
> - `wiki/entities/person-mom.md`: updated (added today's call, status note)
> - `wiki/concepts/principle-default-to-action.md`: created (one principle articulated today)
>
> **`simplicity-taskforce-partnership`** (Spoke): only if work content surfaced
> - `wiki/sources/note-2026-05-03-thursday-meeting.md`: meeting notes captured during chat
>
> Each vault's `log.md` and `wiki/index.md` will be updated; `ROADMAP.md` updated where relevant.
>
> Confirm and I'll write everything.

On confirm, proceed to Step 4. If user wants edits ("skip the principle page", "rename person-sarah to person-sarah-cohen"), apply, re-summarise, confirm again.

## Step 4: Write

For each vault touched, in order: journal first, then life, then any spokes.

### Per-vault write protocol

1. **Resolve the file paths.** Use the vault's CLAUDE.md naming convention (e.g. `entry-YYYY-MM-DD.md`, `person-<first-name>.md`).
2. **Deduplicate entities.** Before creating an entity page, check `vaults/<vault>/wiki/entities/` for existing pages by name or alias. If a match exists, **update** it; do not create a duplicate.
3. **Write or edit each file** with proper frontmatter (see `wiki-templates` for spec).
   - Journal entries: `page-type: entry`, `status: draft`, frontmatter date set to today, narrative body, inline wikilinks to entities created in this session, `## Sources` section pointing to `[capture-mode session 2026-05-03]` (no external source).
   - Person pages: `page-type: entity`, `domain: [personal-life, relationships]`, fields for `first-met`, `last-seen`, `relationship`, `notes` section that prepends new mentions at the top with date headers.
   - Concept pages: `page-type: concept`, `domain: [personal-life, principles|habits|protocols|goals]`, body explains the principle and links back to journal entries that surfaced it.
4. **Cross-vault links.** Journal entries reference Hub pages via the markdown-link form:
   `[personal-life:person-sarah](obsidian://open?vault=llm-wiki-personal-life&file=wiki%2Fentities%2Fperson-sarah)`
   The Hub pages reference back to journal entries via the same form.
5. **Update `wiki/index.md`** L1 Topic Map with one line per new page.
6. **Append to `log.md`** with a structured entry:
   ```
   ## [2026-05-03] capture | session
   - Journal entry: entry-2026-05-03 (themes: <list>)
   - Entities created: person-sarah, person-mom
   - Concepts created: principle-default-to-action
   ---
   ```
7. **Update `ROADMAP.md`** Recently completed (rolling 10) with one line per session.

### After all writes

Report a tight summary:

> Wrote:
> - personal-journal: 1 entry, 0 reviews
> - personal-life: 2 entities, 1 concept
> - simplicity-taskforce-partnership: 1 source-note
>
> Open the vaults in Obsidian to review. Run `/lint --vault personal-journal` if you want a health check.

## Edge cases

- **No work content but user asked to also route to a spoke**: only do it if there's actual content for that vault. Don't create empty placeholder pages.
- **Sensitive content** (therapy, very private): user can flag with "this is private, don't extract entities". Respect; write only the journal entry, skip Hub propagation.
- **Multi-day session** (rare; spans midnight): use the date the user references most. If unclear, ask.
- **Existing today's entry**: if `entry-YYYY-MM-DD.md` already exists, append a new section under a `## <time>` header rather than overwrite.
- **User contradicts an existing principle/protocol page**: do NOT silently overwrite. Surface the contradiction in the close summary; let user choose: update, fork to a new page, or note the contradiction inline.
- **User opens with what looks like capture but is actually research** (e.g. "I'm thinking about whether to use Postgres or D1"): treat as a research/decision task, not capture. Capture is for life content, not technical thinking.
- **Repeated names that turn out to be different people** (two Sarahs): when adding the second, ask once: "another Sarah, or the one already on file?" If different, qualify both with surnames or context.

## Disable / opt out

If user says "stop capturing", "drop capture mode", or asks a code task that runs long, exit Capture Mode for the rest of the session. Buffered content held until close: surface it once and offer to write or discard.

To skip Capture Mode for a whole session, the user can open with a clear task message ("help me with X"): the trigger won't fire.

## Why this exists

The user's stated goal: open a Claude Code session in `llm-wiki` and just talk. Have Claude figure out where it lands across vaults: daily entry to journal, people pulled into life Hub, work content split to the right spoke. No `/ingest` flag typing, no per-utterance friction. Confirms once, buffers, batches at close.

This skill is the routing layer that makes that work.
