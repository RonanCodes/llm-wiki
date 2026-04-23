---
name: rough-notes
description: Scaffold and clean up rough meeting notes in a vault's scratchpad/. Two modes — prep (creates a pre-meeting template from a short brief) and cleanup (reads a rough dump, asks clarifying questions, writes a clean summary above a Raw notes divider without touching the raw content below).
argument-hint: prep <topic> [--vault <name>] | cleanup [<file>] [--vault <name>]
allowed-tools: AskUserQuestion, Read, Write, Edit, Bash(ls *), Bash(mkdir *), Bash(date *)
---

# Rough Notes

Pre- and post-meeting skill for rough notes. Feeds the `scratchpad/` folder of an LLM Wiki vault.

## Usage

```
/rough-notes prep <topic> [--vault <name>]       # scaffold pre-meeting template
/rough-notes cleanup [<file>] [--vault <name>]   # clean up raw dump after the meeting
```

Examples:

```
/rough-notes prep stx --vault llm-wiki-career-moves
/rough-notes prep "book club session 3"
/rough-notes cleanup
/rough-notes cleanup scratchpad/2026-04-23-stx.md --vault llm-wiki-career-moves
```

## When to use

- **Prep mode** — user says they have a meeting coming up ("I have a meeting", "set up notes for X", "create a doc in scratchpad for Y"). Produce a pre-meeting scratchpad template.
- **Cleanup mode** — user just finished and wants to process the rough dump ("clean up that note", "process the scratchpad", "write a summary from my notes").

## Vault resolution

If `--vault <name>` is passed, use it. Otherwise:

1. If the current conversation clearly references a vault (user just opened one, mentioned it by name), use that.
2. If the topic sounds career/recruiter/interview/offer-related, default to `llm-wiki-career-moves`.
3. If ambiguous, ask via AskUserQuestion listing the top candidate vaults from `vaults/`.

All vault paths are `vaults/<vault-name>/` relative to the repo root.

## Mode: `prep`

Creates `<vault>/scratchpad/<yyyy-mm-dd>-<slug>.md` with a typing-ready template.

### Step 1 — derive slug and date

- **Slug:** kebab-case from topic. 1-3 words, lowercase. (`stx` → `stx`; `"Acme intro call"` → `acme-intro`.)
- **Date:** today in `YYYY-MM-DD`.

If the target file already exists, append `-2`, `-3`, etc.

### Step 2 — short brief interview

Batch via AskUserQuestion (2-3 questions max — keep prep fast):

1. **Meeting type** — Recruiter intro chat / Interview round / Client call / Team meeting / Other.
2. **Who** — short free text (name of person or company); pre-fill from the topic arg where it fits. Skip if topic already identifies them.
3. **Context** — one line: what's the meeting about / what do you want out of it? Skip if obvious from the topic.

Keep it snappy — the user is usually prepping minutes before a call.

### Step 3 — write the scratchpad file

Path: `vaults/<vault>/scratchpad/<yyyy-mm-dd>-<slug>.md`.

Template (adapt section names to meeting type — e.g. a team meeting doesn't need "Questions to ask"):

```markdown
# <Topic display name> — <yyyy-mm-dd>

**Type:** <meeting type>
**Who:** <who>
**Context:** <one-line context>

---

## Notes



---

## Questions to ask



---

## Follow-ups / actions


```

### Step 4 — confirm

Report the file path. Suggest the user open it in Obsidian. Don't commit — scratchpad notes are the user's private drafts.

## Mode: `cleanup`

Reads the specified scratchpad file, asks clarifying questions, writes a clean summary **above** a `## Raw notes` divider. **Never modifies content below the divider.**

### Step 1 — locate the file

- If user passes a path, use it.
- Otherwise, list the most recently modified files in `vaults/<vault>/scratchpad/` (ignore `README.md` and `inbox.md` unless the user explicitly names them) and ask via AskUserQuestion which to process.
- If only one recently modified candidate exists, proceed with it (mention which one).

### Step 2 — check for prior cleanup

If the file already contains a `## Raw notes` heading, a cleanup has run before. Ask the user:

- **Replace the existing clean summary** (default) — regenerate from raw
- **Leave it alone** — abort

When replacing, preserve everything from `## Raw notes` onwards byte-for-byte.

### Step 3 — read and analyse

Read the full file. Extract:

- Entity names (companies, orgs)
- People (recruiter, interviewer, hiring manager)
- Role details: title, location, level
- Compensation: base, bonus, equity, benefits, currency
- Team & culture signals
- Tech stack
- Interview process steps
- Positive signals and watch-outs
- Action items the user wrote (look for `ACTION`, `TODO`, `follow up`, bullet-point imperatives)
- Open questions / unanswered items

### Step 4 — ask clarifying questions (facts)

Batch via AskUserQuestion (3-4 questions max). Target highest-ambiguity **factual** items:

- **Entity canonicalisation** — full/official company name if notes use an abbreviation.
- **Geography** — if the notes mix locations (office vs remote vs recruiter's home city), clarify which is the actual role location.
- **Uncertain facts** — tech stack confirmation, comp currency, title level, anything hinted but not spelled out.

Offer concrete shortlists where possible. "Other" is always available for freeform.

### Step 5 — ask personal-read questions (how you feel)

**Separate batch, ask after the factual batch** (don't merge — they're different modes of thinking). Batch 3-4 questions targeting the emotional read and lived context, not the facts:

- **Gut feel** — emotional read, separate from any logical verdict. Options like: Genuinely excited / Interested but cautious / Curious, need more info / Lukewarm. Do NOT use "Verdict" options here — verdicts are downstream of gut feel.
- **Top draw** — what pulled you in most? (Mission / tech / team / comp / tooling — pick options from the actual call content.)
- **Top concern** — biggest hesitation or what you most want to probe in the next stage? Often overlaps with watch-outs but lets the user rank them.
- **Next move** — what are you actually going to do right now? Schedule next round / research more / prep something first / sit on it. Drives the Action items section and clarifies momentum.

These answers typically reveal things the raw notes don't capture: comparison to current role, prior painful switches, self-doubt about interview stages, red lines, personal context. They reshape the whole summary — the header **Verdict** line should be derived from the gut feel answer, not asked as a separate question.

### Step 6 — write the clean version

Default structure for career-moves content (adapt for other content types):

- **Header block** — `**Type:** … **Company:** … **Recruiter/Who:** … **Role:** … **Verdict:** …` (verdict synthesised from gut feel + top concern)
- **Summary** — 1-2 paragraphs, factual narrative about the company/opportunity.
- **Gut feel & personal context** — the user's emotional read, pulls, reservations. Speaks in the user's voice (paraphrased from their answers). This section is the honest internal take — make it specific, not generic.
- **Red lines / conditions** — if the user surfaced non-negotiables ("needs to be organised Agile", "must be fully remote", "no on-call"), capture them explicitly. Drives negotiation posture at later stages.
- **Company & context** — what they do, their clients, business model.
- **Why hiring / tech story** — if present.
- **Team & culture** — if present.
- **Tech stack** — bullet list. Confirmed vs TBC clearly marked.
- **Compensation** — Markdown table if numbers mentioned. Include currency, bonus %, pension, holidays.
- **Interview process** — numbered list of stages.
- **Flags** — split into `**Positives**` and `**Watch-outs**` subsections. Watch-outs should lead with the user's top-concern answer.
- **Action items** — checkbox list (`- [ ]`). Lead with the user's Next move answer.
- **Open questions / TBC** — checkbox list.

**Adapt, don't force.** Omit empty sections. For non-career-moves vaults (team meetings, book club, research calls), pick sections that match the content — `Decisions`, `Action items`, `Open questions` is a good default skeleton.

For team-meeting / 1:1 / book-club contexts, the personal-read questions still apply but adapt: gut feel → "how did it land", top draw → "most valuable takeaway", top concern → "biggest unresolved thing", next move → "what you'll do differently / next".

### Step 7 — insert into file via Edit

Replace the block from the H1 (first line) through the last pre-raw line with:

```
# <Topic> — <yyyy-mm-dd>

<header block>

---

<clean summary sections>

---

## Raw notes

<ORIGINAL RAW CONTENT UNCHANGED>
```

**The raw content is IMMUTABLE.** Never edit, reformat, fix typos, or "tidy" the user's original text. It's the source of truth for what they actually typed during the meeting.

If the original file didn't have a `## Raw notes` heading yet, the raw content is everything that was in the file before (excluding just the top H1 line if we're replacing the header block).

### Step 8 — summarise & hand to user for review

Report in 3-5 bullets what the clean version captured (headline facts + verdict). Then **stop and explicitly hand control back for review** — do not jump to ingest.

Ask the user: "Review the clean version in the file. Any tweaks before we ingest?"

Expected review feedback patterns — apply via Edit as the user calls them out:

- **Over-assumption / false confirmation** — user heard something adjacent but not the specific claim. Soften to "implied" or flag as TBC.
  - *Example:* clean version said "Claude Max 20, OpenAI API confirmed"; user clarifies "she said frontier/all tools encouraged but didn't confirm specific tiers" → rewrite as "all tools and frontier models allowed/encouraged; specific tiers not individually confirmed but reasonable to assume".
- **Over-interpretation of tone** — "strong interest" → "interested but with concerns", "watch-out" reframed as "neutral signal", etc.
- **Missing nuance** — raw notes had a detail the clean version flattened. Restore it.
- **Corrections** — names, numbers, dates, titles. Fix and move on.
- **Reordering** — user wants Flags above Compensation, etc. Adjust.

Loop: apply edits → re-summarise what changed → ask again "good to go, or more tweaks?" Continue until the user signals they're done ("looks good", "ship it", "ingest now").

Do **not** touch the raw notes section during review. All edits apply to the clean block only.

### Step 9 — ingest to wiki (optional, user's call)

Once the user signals the clean version is final, ask via AskUserQuestion:

- **Ingest now** (default) — move file to `raw/meetings/` and generate wiki pages
- **Not yet** — leave in scratchpad as-is

If ingesting:

1. Move `vaults/<vault>/scratchpad/<file>.md` → `vaults/<vault>/raw/meetings/<file>.md` (keep both the clean summary and raw sections — they travel together as the meeting record).
2. Hand off to `/ingest raw/meetings/<file>.md --vault <vault>` which will:
   - Generate `wiki/sources/chat-<company-slug>-<date>.md` with full frontmatter (title, dates, page-type: source-note, domain, tags, sources pointing to the raw file, related wikilinks).
   - Create/update entity pages for the company, recruiter, and any hiring-manager / interviewer names mentioned.
   - Add rows to `wiki/index.md`.
   - Append to `log.md`.
3. Report the new wiki page paths and any entity pages created/updated.

Don't commit automatically — the user decides when to commit their vault changes.

## Rules

- **Never modify raw notes content.** Below `## Raw notes`, the user's exact text is sacred — typos, partial sentences, and stream-of-consciousness are expected and fine.
- **Ask before assuming.** If a key fact is ambiguous (company name, location, currency, verdict), ask via AskUserQuestion. Don't guess and write confidently-wrong summaries.
- **Pause for review before ingest.** Cleanup always has a review loop. Users will catch over-assumptions, misheard details, and tone errors. Don't skip straight to ingest.
- **Flag assumptions explicitly in the clean version.** If you inferred something the user didn't explicitly state, write it with hedging language ("implied", "reasonable to assume", "TBC", "mentioned but not confirmed"). Makes review faster.
- **Shape the summary to content.** Career-moves meetings get the rich template. Other meeting types (team meeting, book club, 1:1) need different sections — omit what isn't relevant.
- **Respect the scratchpad convention.** Files live at `vaults/<vault>/scratchpad/<yyyy-mm-dd>-<slug>.md`. Don't write anywhere else (until ingest moves to `raw/meetings/`).
- **No auto-commit.** Scratchpad and vault changes are the user's — leave committing to them.
