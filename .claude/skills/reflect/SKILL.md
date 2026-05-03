---
name: reflect
description: Cross-cutting synthesis over personal-journal entries. Reads structured frontmatter (mood, energy, weight, sleep, themes, people, wins, drains) plus body content across a date range, surfaces trends and patterns the user can't see day-to-day, and writes a review-YYYY-Qn.md (or weekly/monthly/yearly) page back to the journal vault. Use when the user wants a weekly/monthly/quarterly/yearly reflection, says "what patterns am I seeing", "look at the last month", "give me a year-in-review", or invokes /reflect.
argument-hint: [week|month|quarter|year|today|YYYY-MM-DD..YYYY-MM-DD]
allowed-tools: Bash(grep *) Bash(find *) Bash(ls *) Bash(date *) Read Write Edit Glob Grep
---

# /reflect

Pattern synthesis across a window of journal entries. Aggregates structured frontmatter, surfaces cross-cuts (mood vs people, weight vs food, sleep vs energy), proposes hypotheses, writes a review page, optionally promotes stable insights to the `personal-life` Hub.

## Usage

```
/reflect                         # interactive: ask which window
/reflect week                    # last 7 days
/reflect month                   # current calendar month (or last 30 if pre-7th)
/reflect quarter                 # current calendar quarter
/reflect year                    # current year (YTD)
/reflect today                   # single-day reflection (rare)
/reflect 2026-04-01..2026-04-30  # explicit range
```

Defaults to the `personal-journal` vault. Pass `--vault <name>` only if you've extended capture-mode to a different vault.

## Step 1: Resolve the window

- `week` → today minus 6 days, inclusive (7-day window ending today)
- `month` → if today is on or after the 7th of the month, current month start to today; else last 30 days
- `quarter` → current calendar quarter start to today
- `year` → Jan 1 of current year to today
- `today` → today only
- explicit range → parse `YYYY-MM-DD..YYYY-MM-DD`
- interactive → ask the user with AskUserQuestion (week / month / quarter / year / custom)

Save the window as `start_date` and `end_date`. Decide the output filename:
- weekly: `review-YYYY-Wnn.md` (ISO week number of `end_date`)
- monthly: `review-YYYY-MM.md`
- quarterly: `review-YYYY-Qn.md`
- yearly: `review-YYYY.md`
- custom: `review-YYYY-MM-DD-to-YYYY-MM-DD.md`

If the file already exists, ask the user: overwrite, append a new section, or write a versioned `-v2` file.

## Step 2: Collect entries

```bash
find vaults/llm-wiki-personal-journal/wiki/sources/ -name 'entry-*.md' -type f
```

For each file, extract frontmatter and parse:
- date (from `date-created` or filename)
- mood, energy, weight, sleep (numbers or null)
- themes, people, places, food (lists)
- wins, drains (lists of strings)

Filter to those whose date is in `[start_date, end_date]`. Read body content for each.

If fewer than 3 entries match, surface that to the user before writing: a reflection over 1, 2 days is not meaningful. Offer to widen the window.

## Step 3: Compute aggregates

### Numeric trends
- `mood`: mean, min, max, count of days at each score (1-5 distribution)
- `energy`: mean, min, max, distribution
- `weight`: first reading, last reading, delta, slope per week (linear)
- `sleep`: mean, min, max, count of nights below 6h

### Categorical aggregates
- Top 10 themes by frequency (which kebab-slugs recur)
- Top 10 people by frequency (cross-vault link to their entity page)
- Top 10 places
- Top 10 food items (if populated)

### Wins / drains
- Pull all `wins` and `drains` items across entries, deduplicate near-identical lines, group by similarity
- Surface the top 5 wins and top 5 drains by recurrence

### Cross-cuts (the actual insight work)
For each pair below, compare the high-mood-day group against the low-mood-day group (high = mood ≥4, low = mood ≤2):
- People that appear disproportionately in one group
- Places that appear disproportionately in one group
- Themes that appear disproportionately in one group
- Sleep average for high vs low mood days
- Weight delta during a high-mood streak vs low-mood streak

Also:
- Sleep vs mood next-day correlation (eyeball, no formal stats)
- Weight trend annotated with food themes that dominated each phase
- Day-of-week patterns (are Sundays low? are Fridays high?)

Look for any themes that appear in BOTH `themes` and `drains` repeatedly: those are stable annoyances.
Look for any themes that appear in BOTH `themes` and `wins` repeatedly: those are stable energy-sources.

## Step 4: Write the review page

Use this structure:

```markdown
---
title: "Review: <period label>"
date-created: <today>
date-modified: <today>
page-type: review
period: <week | month | quarter | year | custom>
range: [<start_date>, <end_date>]
domain: [personal-journal]
tags: [review]
sources: [<entry-YYYY-MM-DD>, ...]   # all entries aggregated
related: [<previous review page if exists>]
stats:
  entries: <count>
  mood-mean: <e.g. 3.4>
  energy-mean: <e.g. 3.1>
  sleep-mean-hours: <e.g. 7.2>
  weight-start: <e.g. 78.4>
  weight-end: <e.g. 77.6>
  weight-delta: <e.g. -0.8>
---

# <Period> Review: <e.g. Q2 2026 / Week 18 of 2026>

<one-paragraph overview: what kind of period this was, in plain language>

## Numbers

| Metric | Value |
|--------|-------|
| Entries logged | <n> / <expected days> |
| Avg mood | <x.x> / 5 |
| Avg energy | <x.x> / 5 |
| Avg sleep | <x.x> h |
| Weight delta | <±x.x> kg |

```mermaid
%% Optional: mood/energy line chart over the window if 7+ entries.
%% Use observatory colour theme (amber #e0af40 user, cyan #5bbcd6 engine).
```

## What lifted me

<top 3-5 wins / energy sources, in plain language; cite source entries>

## What drained me

<top 3-5 drains / annoyances; cite source entries; flag any that recur>

## People in the picture

| Person | Mentions | Most often appears on |
|--------|----------|------------------------|
| [personal-life:person-sarah](obsidian://...) | 5 | high-mood days |
| ... | ... | ... |

## Patterns I noticed

<3-6 bullets of cross-cut findings: concrete and falsifiable. Examples:
- "Mood was lower on days when sleep was under 6.5 hours (4 of 5 such days were mood ≤2)"
- "Sarah appeared in 4 of 5 high-mood entries; Mom appeared in 3 of 4 low-mood entries"
- "Weight ticked up the week food-theme `eating-out` dominated"
- "Sundays were the lowest-mood day three of four weeks"

Be specific. Cite entry filenames. Do not invent correlations from sparse data: if N is small, say so.>

## Open questions for you

<3-5 questions Claude has from reading the entries. Genuinely unclear things,
not rhetorical. The user should be able to answer these next session.>

## Suggested experiments for the next period

<2-4 concrete tries the user could run, each grounded in a specific pattern above.
Keep them small and falsifiable.
- "Try a 6-day stretch of sleep-by-11pm and see if morning mood lifts"
- "Schedule a Sarah catch-up in week 3 (her absence correlates with low-mood weeks)"
Do not prescribe big life changes; suggest experiments.>

## Source entries

<numbered list of all entries aggregated, as wikilinks: `[[entry-2026-04-01]]` ...>

## Sources

This review was synthesised from <n> entries in `personal-journal/wiki/sources/` between <start_date> and <end_date>, generated by `/reflect <period>` on <today>.
```

### Tone rules

- Plain. Direct. No clinical jargon. The user reads this to themselves; don't write like a therapist or a self-help book.
- No em or en dashes (per repo no-em-dash rule). Use commas, colons, full stops, parentheses.
- No AI-tell vocabulary (delve, leverage, robust, seamless, "in today's", "at the intersection of", etc.).
- Do not lecture, moralise, or warn. Do not say "remember to be kind to yourself". The user is an adult.
- If the period was hard, say it was hard. If it was good, say it was good. Match the user's own register from the entries.
- Falsifiable > vague. "Mood ≤2 on 4 of 5 sub-7h-sleep days" beats "your mood seems related to sleep".
- N matters. With <7 entries call it tentative; with <14 call it provisional; with 30+ you can speak with more confidence.
- Cite entries by filename so the user can verify any claim.

## Step 5: Cross-vault promotion candidates

After writing the review, scan for stable insights worth graduating to the `personal-life` Hub. Surface a short list to the user, not auto-promote:

> Found these recurring patterns that look stable. Promote to `personal-life` Hub?
> - **Drain pattern**: "slow mornings, doom-scrolling" recurs in 6 of 12 entries → would create `personal-life/wiki/concepts/drains-pattern-slow-mornings.md`
> - **Energy source**: "deep-work blocks" recurs in 8 of 12 entries → would create `personal-life/wiki/concepts/energy-source-deep-work.md`
> - **Person**: Sarah strongly correlates with high-mood days → would update `personal-life/wiki/entities/person-sarah.md` with a note
>
> Confirm any to promote, or skip.

Only promote on user confirmation. Use `/promote --from personal-journal --to personal-life` or write the Hub pages directly.

## Step 6: Update journal vault metadata

After writing the review:
1. Update `personal-journal/wiki/index.md` L1 Topic Map with the new review page
2. Append to `personal-journal/log.md`:
   ```
   ## [<today>] reflect | <period>
   - Wrote: <review-filename>
   - Aggregated <n> entries from <start_date> to <end_date>
   - Promoted <m> insights to personal-life (if any)
   ---
   ```
3. Update `ROADMAP.md` Recently completed with: `<today>: /reflect <period> → <review-filename>`

## Step 7: Report

Tight summary:

> Wrote: `vaults/llm-wiki-personal-journal/wiki/sources/<review-filename>`
>
> <n> entries aggregated. Mood mean: <x>. Weight delta: <±x>. <m> patterns surfaced. <k> insights flagged for Hub promotion.
>
> Open in Obsidian to read; reply with answers to the "Open questions" section to feed the next reflection.

## Edge cases

- **No entries in window**: tell the user, suggest widening or running capture-mode for a few days first. Do not write an empty review.
- **Very sparse frontmatter** (most entries lack mood/energy/weight): focus the review on body content, themes, people, wins/drains. Skip the numeric tables. Do not invent numbers.
- **Single very long entry on one day**: this is not a reflection window. Suggest the user use that entry as is, or wait.
- **Privacy / sensitive content flagged in entries**: respect any `private: true` or `private: <field>` frontmatter: exclude that content from the review or aggregate without quoting body text. If the entire entry was marked private, skip it entirely and note in the review that N entries were excluded.
- **Big mood drop / red flags**: if entries show sustained low mood (e.g. mood ≤2 for 5+ days), surface it factually in "Patterns I noticed" with the dates, but do NOT diagnose, advise treatment, or push therapy talk. Just name it and let the user decide.
- **Year reviews on a fresh vault**: if a year review is requested with <30 entries, write it but title it "Partial-year review" and flag the sample size at the top.

## Why this exists

Daily journal entries are too close to see patterns. The user can't tell that they're low-mood every Sunday, or that Sarah always appears in good weeks, or that weight ticks up specifically when "eating-out" dominates a week. Across N entries with structured frontmatter, those patterns are computable. `/reflect` does that compute, writes the answer back as a wiki page, and (over time) graduates stable patterns to the `personal-life` Hub so they shape the user's own knowledge of themselves.

The output is permanent (committed wiki page); the synthesis is repeatable; the user can grill the review next session and feed corrections back as a new entry.
