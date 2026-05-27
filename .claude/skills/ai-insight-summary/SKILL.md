---
name: ai-insight-summary
description: Generate a calibrated "AI Insight Summary" callout for a wiki doc. Always invoked at the top of meeting, interview, discovery-call, and 1:1 source-notes; usable on demand at the top of any long synthesis page or mid-doc for a long section that needs orienting. Use when the user says "add an AI summary", "insight summary", "top-of-doc summary", "summarize this for me at the top", or after ingesting a meeting/interview/call.
argument-hint: <path-to-doc> [--position top|after-h1|before-heading <heading>] [--audience <who-it-is-for>] [--open]
allowed-tools: Bash(git *) Bash(open *) Read Write Edit Grep
---

# AI Insight Summary

Drop a short, sharp callout at the top of a wiki doc that tells a reader what the doc actually means, not just what it says. The summary is **synthesis**, not restatement. A reader who only reads the summary should walk away with the load-bearing read of the underlying material plus the open questions.

## When to fire this skill

**Always fire automatically after `/ingest` for these source types:**

- Meeting notes (`page-type: meeting-note`)
- Interview / discovery call / 1:1 / pitch call notes
- Session notes (`/ingest session`)
- Long-form podcast / video / talk transcripts (>2000 words extracted)
- Synthesis source-notes that aggregate multiple references

**Fire on demand when the user asks for any of:**

- "AI summary", "insight summary", "top-of-doc summary", "tldr at the top"
- "summarize this for me", "give me a read on this", "what does this actually mean"
- The user signals a doc has grown too long to skim and they want a reader-grade top section.

**Fire mid-doc (not at top) when:**

- A section is >800 words and would benefit from its own orienting callout above the H2.
- A comparison table or decision page needs a "here's the call" callout before the data dump.

**Do NOT fire when:**

- The doc is already <300 words (the doc IS the summary).
- The doc is a pure reference (a glossary, a config dump, frontmatter-only entity stub).
- The user explicitly says skip the summary.

## Output format (the shape that works)

Always an Obsidian callout block. Always at the placement specified. Five or six short paragraphs, each opening with a bolded lede phrase followed by a period.

```markdown
> [!summary] AI Insight Summary
>
> **What it is.** One-paragraph factual read of the underlying material. Names the thing, the date, the actor, the headline numbers.
>
> **What's actually happening underneath.** The mechanism, the signal, what the surface text is really pointing at. This is where you add value over a copy-paste summary.
>
> **Where the value / moat / leverage is and isn't.** Calibrated read of strengths AND weaknesses. Never one-sided.
>
> **The honest signal.** Red flags, caveats, things the source glossed over, claims that are asserted but not evidenced. Surface these, do not bury them.
>
> **For [reader / operator] specifically.** What this means for the person reading the wiki. Decision, action, or non-action.
>
> **Open questions worth answering.** The 3-5 things the doc does NOT settle and that a follow-up would target.
```

Not every doc needs all six paragraphs. A meeting note almost always uses all six. A long synthesis page might collapse the middle two. A mid-doc section callout might use only the first three. **Always include "Open questions"** if the doc is research-shaped — it's the anti-overclaiming pressure valve.

## Style rules (load-bearing — do not skip)

These mirror `/ro:write-copy` and the engine CLAUDE.md.

**Banned characters:**

- No em-dashes (`—`, U+2014).
- No en-dashes (`–`, U+2013).
- Use commas, colons, full stops, or parentheses for the intent.

**Banned vocabulary (AI-tell):**

- delve, leverage, robust, seamless, tapestry, landscape
- "in today's fast-paced world", "at the intersection of"
- "elevate", "empower", "unlock", "streamline" used as filler
- "not only X but also Y", "it's not just X, it's Y"
- gratuitous tricolons when one or two items would do

**Required tone:**

- Specific over abstract. Use the numbers and names from the doc.
- Calibrated over confident. Mark inferences as inferences.
- Plain English. A direct sentence beats a clever one.
- Honest about gaps. If the doc has weak evidence on a claim, say so in "The honest signal" paragraph.

**Anti-patterns to avoid:**

- Restating the doc verbatim instead of synthesizing.
- Burying red flags in the middle of a paragraph instead of giving them their own line.
- Hedge-language stacking ("it could possibly maybe be the case that") instead of marking uncertainty cleanly.
- Bolting on a generic "implications" paragraph when the doc didn't earn one.
- Naming the reader as "the user" when the doc has a clear named operator.

## Step 1: Parse arguments

- First argument is the path to the target doc (absolute or relative to a vault).
- `--position` controls placement. Default: `after-h1` (right after the doc's H1, before any other H2). Other values: `top` (above H1, rare — useful for docs without an H1), `before-heading <heading>` (place the callout immediately above a named H2 / H3).
- `--audience` overrides the "For X specifically." paragraph subject. Default: derive from the engine's CLAUDE.md operator context (the wiki owner). If the doc names a different reader, use that.
- `--open` (default true) opens the doc in Obsidian after the write. Pass `--no-open` to skip.

## Step 2: Resolve the vault

Derive the vault name from the doc's path: walk up until you hit a directory matching `vaults/<vault-name>/` or a directory whose parent is `vaults/`. The vault name is what comes after `vaults/` in the path. Hold the vault name in a shell var for the Obsidian-open step.

Do not hardcode any vault name. This skill must work for any vault in the user's setup.

## Step 3: Read the doc and extract signal

Read the full doc. Look for:

- `page-type` in frontmatter (drives whether all six paragraphs are needed).
- The H1 title (anchors "What it is.").
- Named entities, dates, traction numbers, pricing, quotes — these are the raw material for "What it is." and "What's actually happening underneath."
- Existing strategic-read / decision / open-questions sections — these are the inputs to "For X specifically." and "Open questions worth answering."
- Quoted material from the source actor (where it differs from the actor's marketing claims) — feeds "The honest signal."

If the doc has a `## Open Questions` or `## Decision` section already, the summary's matching paragraphs should be consistent with those — do not contradict the doc.

## Step 4: Build the context pack

Apply the `context-pack` reference skill — surface the top 2 related wiki pages by tag/domain/backlink. The summary should reference these via wikilinks where natural (e.g., "[[ai-startup-incubator-saas]]" in the Creatives Takeover summary). Default pack size 2 for this skill (it's a writing pass over an already-read source).

## Step 5: Draft the summary

Compose the callout following the format above. Apply the style rules. Six paragraphs maximum, usually five for non-research docs. Each paragraph one to four sentences.

The bolded lede phrase is mandatory — it gives the reader scannable structure. Phrasing examples (not a fixed lexicon — adapt to the doc):

- "What it is." / "What we're looking at." / "The thing."
- "What's actually happening underneath." / "The mechanism." / "Beneath the pitch."
- "Where the value is and isn't." / "Where the moat sits." / "Strengths and gaps."
- "The honest signal." / "Red flags." / "Caveats."
- "For [name] specifically." / "What this means for [name]."
- "Open questions worth answering." / "What this doc doesn't settle."

## Step 6: Place the callout

Default placement is right after the H1, before any other content. If a `> [!summary]` callout already exists at the top:

1. Compare the existing summary to the new draft.
2. If the existing summary is older than the doc's `date-modified`, **replace** it with the new draft.
3. If it's current, **skip the write** and report to the user that the summary is already up to date.

For `--position before-heading <heading>`, insert the callout immediately above the named heading line.

For `--position top`, insert at the very top of the file, before any frontmatter? No — never break frontmatter. The earliest placement is the line immediately after the closing `---` of the frontmatter and before the H1.

## Step 7: Update frontmatter

Bump `date-modified` to today's date. Append `ai-insight-summary` to the `tags` list if not present (lets `/lint` and `/query` find docs that already have a summary).

## Step 8: Commit (vault repo, not engine)

The doc lives in a vault repo, not the engine repo. Commit there:

```bash
cd <path-to-vault-repo-root>
git add <path-to-doc-relative-to-vault>
git commit -m "📝 docs: add AI insight summary to <doc-title>"
```

Honour the engine's weekday commit-hours rule: if `date +%u` returns 1-5 and `date +%H` is between 08:30 and 18:00, shift `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE` to the previous evening (after 18:00) or the same morning (before 08:30). Stagger 5 minutes after the last commit's timestamp.

Skip the commit if the doc is in `scratchpad/` — those are personal working drafts, not committed wiki content in most vaults. Check the vault's CLAUDE.md for the actual convention.

## Step 9: Open the doc in Obsidian

Unless `--no-open` was passed, open the doc:

```bash
# Strip the .md extension and URL-encode spaces
encoded_path=$(printf '%s' "<path-from-vault-root-without-.md>" | python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read()))')
open "obsidian://open?vault=<vault-name>&file=$encoded_path"
```

## Step 10: Report to the user

Two-line report:

1. Where the callout was placed (path + line number).
2. The five or six lede phrases used, so the user can scan-check the shape without reading the full callout.

Do not re-paste the full summary in the report. The user will see it in Obsidian.

## Auto-fire integration with `/ingest`

The `/ingest` router should call this skill after creating the source-note when any of the following are true:

- The detected source type is `meeting-call`, `interview`, `discovery-call`, `1-on-1`, `session`, `podcast`, `video` (transcript >2000 words).
- The user passed `--type founder-tool-review`, `--type meeting-note`, or any review-shaped custom type.

The router invokes:

```
/ai-insight-summary <path-to-newly-created-source-note> --position after-h1 --open
```

This skill is idempotent (Step 6 handles existing summaries), so an explicit re-fire by the user is safe.

## Examples

### Meeting note (the case this skill was extracted from)

Input: a discovery-call source-note in `vaults/<some-vault>/wiki/sources/`.

Output callout (paragraph ledes only, full body filled by the skill):

```markdown
> [!summary] AI Insight Summary
>
> **What it is.** ...
> **What's actually happening underneath.** ...
> **Where the moat is and isn't.** ...
> **The honest signal from a 30-minute demo.** ...
> **For <reader> specifically.** ...
> **Open questions worth answering.** ...
```

### Long synthesis comparison page

Five paragraphs, drop "The honest signal" or fold red flags into "Where the value is and isn't.":

```markdown
> [!summary] AI Insight Summary
>
> **What we're comparing.** ...
> **The mechanism behind each option.** ...
> **Where each option wins and loses.** ...
> **For <reader> specifically.** ...
> **What this doc doesn't settle.** ...
```

### Mid-doc section callout

Three paragraphs, no "For X" or "Open questions" (the parent doc already has those):

```markdown
> [!summary] Section read
>
> **What this section covers.** ...
> **The non-obvious takeaway.** ...
> **Caveat worth flagging.** ...
```

## Notes

- This skill writes only the callout, not the rest of the doc. If the underlying doc has weak content, the summary will read thin — that's a signal to improve the doc, not the summary.
- The summary should be regenerable. If the doc changes meaningfully (`date-modified` bump > 1 week old), a re-fire updates the summary in place.
- For very long docs (>5000 words), consider mid-doc section callouts in addition to the top summary. Use judgement; don't litter.
- Never use the summary to make claims the underlying doc doesn't support. If the doc is light on evidence for a claim, the summary's "honest signal" paragraph must say so.
