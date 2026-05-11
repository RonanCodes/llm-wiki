---
name: generate-cv
description: Render a one-page HTML + PDF CV from a vault's LinkedIn/CV/entity pages. Timestamped output so multiple generations on one day do not overwrite. Honours /ro:write-copy rules (no em/en dashes, no AI-tell vocabulary). Reads baseline from personal-work vault; optional --target company (from career-moves or similar) for tailored variants. Used by /generate cv. Not user-invocable directly, go through /generate.
user-invocable: false
allowed-tools: Bash(which *) Bash(ls *) Bash(mkdir *) Bash(date *) Bash(open *) Bash(git *) Read Write Edit Glob Grep
---

# Generate CV

Render a one-page, beautifully-typeset CV to HTML + PDF, sourced from wiki pages. Works in two modes:

1. **Baseline** (no `--target`): a polished, role-agnostic CV suitable for most applications.
2. **Tailored** (with `--target <company-slug>`): reshapes the profile paragraph, reorders bullets, and dials the AI/backend/frontend emphasis to fit a specific opportunity. Pulls target company detail from `career-moves` vault (or whichever vault holds the dossier).

## Usage (via /generate router)

```
/generate cv                                  # baseline, current vault defaults
/generate cv --target stx-group               # tailored to [[career-moves:company-stx-group]]
/generate cv --target stx-group --theme slate # alternative theme
/generate cv --person alice                   # multi-person vault: pick which
```

## Output naming convention

**Timestamped, always.** Files go to `<vault>/artifacts/cv/`:

```
cv-<person-slug>-<YYYY-MM-DD>-<HHMM>.html          # baseline
cv-<person-slug>-<YYYY-MM-DD>-<HHMM>-<target>.html # tailored
```

Examples:
- `cv-ronan-connolly-2026-04-23-2230.html`
- `cv-ronan-connolly-2026-04-23-2245-stx-group.html`

**Why timestamped:** running the generator multiple times in a day (iterating on phrasing, trying variants for different roles) must produce distinct files. No overwrites. No `-v2`, `-v3` counter hacks. HHMM from the system clock when the handler starts is the canonical stamp.

**PDF alongside HTML:** same filename, `.pdf` extension. The HTML is the tracked source (hand-polished, carried in git under a gitignore exception); the PDF is the rendered artifact (gitignored, regenerable).

## Step 1: Resolve inputs

Default inputs come from the `personal-work` vault (or whichever vault holds the person's identity pages). Handler reads:

- `wiki/sources/cv-<person>-*.md` — most recent baseline CV source-note. Gives the canonical experience, skills, education, achievements. If multiple exist, pick the newest by `date-created`.
- `wiki/sources/linkedin-profile-<person>.md` — supplementary context (headline, positioning).
- `wiki/entities/<person>.md` — the self-entity for overall framing.
- `wiki/entities/<employer>.md` for each past employer referenced in the CV source-note.
- `wiki/comparisons/headline-bio-drafts-*.md` — latest bio draft for tone/positioning alignment.
- `wiki/concepts/cv-*.md` (any matches) — vault-specific CV guidance: voice exemplars, calibration history, phrases to use or avoid, tagline / role-line conventions. Read all matches; treat as steering input alongside the source-note. This is where users park persistent pointers that should auto-apply to every generation.

For `--target`: also read `<target-vault>/wiki/entities/company-<target>.md` and any related source-notes (e.g. `chat-<target>-<date>.md`) from that vault. Cross-vault references in the baseline CV (`[[career-moves:...]]`) are resolved by reading the target vault directly.

## Step 1b: Honest-calibration interview (when emerging-tech claims are present)

Stage drift is the most common failure mode for AI / agent CV claims. The same overclaim ("building custom agents", "shipped MCP server") survives across regenerations because the source-note never gets challenged.

If the source-note (or the `concepts/cv-*.md` guidance) makes claims about emerging tech (AI agents, MCP, custom Agent Skills, agentic pipelines, autonomous workflows, etc.), pause and interview the user before generating. Don't trust an existing source-note blindly when AI claims are involved — even if it was "calibrated" yesterday, stages move.

For each emerging-tech claim, ask which stage tier it actually sits in:
- **Shipping with**: in production, defensible under probing.
- **Building**: active in-progress work, not yet shipped (e.g. "scaffolding", "prototype running").
- **Researching / Prototyping**: R&D, not a shipped artefact.
- **Exploring**: reading, watching, learning — not yet hands-on.

Bake the resulting tier split into the CV's Skills > Frontier AI (or equivalent) section. Don't conflate tiers.

If the interview reveals the source-note is stale or overclaims, **update the source-note to be truthful before generating**. The CV is built from the source-note; an honest CV needs an honest input.

Skip this step only if:
- No emerging-tech claims in the source-note (e.g. a pure backend CV with no AI mentions).
- `concepts/cv-*.md` guidance explicitly notes the source-note has been recently re-calibrated against the user's actual stage.

## Step 2: Build content model

Extract into a structured model before rendering:

```
{
  person: { name, role_line, contact, location, languages }
  profile: "one paragraph"
  experience: [{ title, company, company_url, period, bullets: [...] }]
  education: [{ qualification, institution, institution_url, period, note }]
  skills: [{ category, description }]
  achievements: [ "one line each" ]
}
```

For **tailored mode**, reshape the content model against the target:
- Reorder `skills` so the target's core stack leads.
- Rewrite `profile` to open with the strongest match to the target's priorities.
- Promote bullets that touch the target's domain (e.g. agentic engineering → lead bullet for an AI-forward role).
- Leave timestamps, education, achievements untouched.

Do not invent facts. Every claim must trace to a wiki page or CV source. If a gap is obvious (e.g. target uses tech X; CV never mentions X), flag it in the handler's final report to the user rather than papering over.

### Repetition guard (Profile vs Bullets vs Skills)

Three sections risk re-listing the same content:

- **Profile** = positioning paragraph. Job: identity, depth, current role at top level, optional aspiration line. Target ~85–100 words.
- **First experience bullet** = top-level role description. Job: what the role is, what the function is.
- **Skills > Frontier AI / equivalent** = tool list with stage tiers.

Common drift patterns:
- Profile lists tools → Bullet 1 lists same tools → Skills lists tools again. Reader sees the same tool list 3x.
- Profile lists projects → Bullets list same projects again. Bullets become redundant.

Cut rules:
- **Tool lists belong in Skills.** Profile may name a small subset (1–3 tools max) for recruiter-skim signal — Bullets must NOT then repeat that subset.
- **Projects belong in Bullets.** Profile names projects only when flagship-defining (one or two, max). "Profile lists everything I did at the company" is anti-pattern.
- **Aspiration goes in Profile, not Achievements.** Profile is positioning; Achievements is proof points.

After every render, before finalising, scan Profile and the first experience bullet for verbatim phrase overlap. If a noun phrase >= 3 words appears in both, cut from one.

## Step 3: Render HTML

Load the template: `.claude/skills/generate-cv/templates/<theme>.html` (future; v1 uses an inlined template — see this skill's example at `vaults/llm-wiki-personal-work/artifacts/cv/cv-ronan-connolly-2026-04-23-2230.html`).

Themes (planned):
- `slate` (default): dark navy sidebar, teal accent, serif headings, sans body. One page.
- `minimal`: single column, no sidebar, monochrome.
- `academic`: two column but wider body, traditional typography.

Substitute content-model fields into the template. Company and institution names wrap in `<a href="…">` tags (contact-information links — always clickable in the PDF). Clickable logos are NOT injected automatically; skip unless `--logo` is passed.

## Step 4: Apply write-copy rules

**Before rendering, scan the content model for banned patterns:**

```bash
rg -n '—|–|\bdelve\b|\bleverage\b|\brobust\b|\bseamless\b|\btapestry\b|\blandscape\b|\bnot only\b|\bit'\''s not just\b|\bmore than just\b|\bunlock\b|\bstreamline\b' <content>
```

If the scanner hits, rewrite the offending strings before rendering. The handler should not emit a CV containing these tokens. See `/ro:write-copy` for the full rule set.

Date ranges: use "to" (`Jul 2024 to present`, `2018 to 2024`) or naked years (`2012 - 2016` with a hyphen is NOT acceptable per write-copy: prefer "to"). No en-dashes.

Tricolons: allow when the three items are genuinely distinct (tool lists, concrete categories). Reject when they are three synonyms of the same idea.

## Step 5: Render PDF

```bash
chrome_bin="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
"$chrome_bin" --headless=new --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$OUT.pdf" "$OUT.html"
```

Fall back to `chromium` or `google-chrome` if Chrome is missing. If none available, emit instructions for the user to install Chrome rather than silently failing.

**Verify single-page** after rendering:
```bash
pdfinfo "$OUT.pdf" | awk '/^Pages:/ { print $2 }'
```

If page count > 1, report it clearly. Offer to tighten typography and re-render (rather than silently truncating).

## Step 6: Refresh source-note

After rendering, write back a markdown source-note that accurately describes the just-rendered artefact. This is the wiki's record of "what the CV currently says" — it MUST stay in sync with the latest artefact, otherwise subsequent generations read from a stale summary and re-introduce drift.

Path convention:

```
<vault>/wiki/sources/cv-<person>-<YYYY-MM-DD>.md          # baseline run
<vault>/wiki/sources/cv-<person>-<YYYY-MM-DD>-<target>.md # tailored run (--target)
```

Notes:
- Date is **today's date** (when the skill runs), not the artefact's `HHMM` timestamp. One source-note per date per variant.
- If a same-name file exists (because the skill ran earlier today on the same variant), **overwrite it**. The note should always describe the most recent same-date artefact. Iterating in a single day is normal.
- Older date source-notes stay in place. They form the historical record automatically — date-stamped filenames give you that for free, no archive folder needed.
- Baseline run does NOT touch any tailored note, and vice versa.

Required frontmatter:

```yaml
---
title: "CV — <Person Name> — <YYYY-MM-DD>[ — <Target>]"
date-created: <YYYY-MM-DD>
date-modified: <YYYY-MM-DD>
page-type: source-note
domain:
  - <vault-default-domain>
  - cv
  - positioning
tags:
  - cv
  - resume
  - <baseline-or-target-tag>
sources:
  - artifacts/cv/<filename>.pdf
  - artifacts/cv/<filename>.html
related:
  - "[[<person-entity>]]"
  - "[[linkedin-profile-<person>]]"
  - "[[<each-employer-referenced>]]"
source-type: pdf
author: "<Person Name>"
date-accessed: <YYYY-MM-DD>
raw-file: artifacts/cv/<filename>.pdf
---
```

Body — build by reading the just-emitted HTML, NOT by paraphrasing from memory or any prior source-note:

- `## Overview` — one paragraph: which variant, what it's for, headline framing.
- `## Key Takeaways` — bulleted: positioning, core specialisation, domain depth, expansion areas, AI framing, recent wins. Drawn from the rendered Profile + Skills + Achievements blocks.
- `## Positioning — CV vs LinkedIn` — short table comparing CV with the latest `linkedin-profile-<person>.md`. Same dimensions every run (Headline / Breadth / Tenure / AI framing / Quirks). If LinkedIn is unchanged, copy the prior table; if changed, refresh.
- `## Structure` — section-by-section summary of what's actually in the CV (Profile, Experience by employer with bullet summaries, Skills categories, Education, Achievements, Contact, Languages).
- `## Gaps / Things to consider for tailored versions` — flag stack mismatches, dial points (AI conservative vs bold), framing tensions. Honest. If a bullet in the artefact is borderline overclaim, flag it here so the next iteration can tighten.
- `## Cross-vault references` — for tailored variants, list the `[target-vault:page]` links to the company / chat / JD entities the variant was tuned against.
- `## Sources` — links to the rendered PDF and HTML in `artifacts/cv/`.

Update `wiki/index.md` so the canonical "current CV" entry points to the newest source-note. Older entries stay as historical.

**Why this step exists:** without it, the wiki source-note drifts away from the artefact across regenerations. On 2026-04-28 we caught this — the source-note still claimed the CV mentioned "Copilot" while three later generations had replaced that with "n8n". Building the source-note from the rendered HTML each time is the only way to guarantee the wiki tells the truth about what the CV actually says.

## Step 7: Open PDF

```bash
open "$OUT.pdf"
```

macOS only for now. Linux: `xdg-open`. Windows: `start`.

## Step 8: Report

Emit a concise summary:
- Output paths (HTML + PDF)
- Page count (must be 1)
- Any gaps the tailoring pass flagged (e.g. "target mentions Kubernetes; your CV has no Kubernetes experience — flag as TBC or add a side-project mention if honest")
- Any write-copy rule hits that were auto-fixed

Do not auto-commit. The user decides when to commit CV changes.

## Tracking convention

The HTML source lives in `<vault>/artifacts/cv/` with a gitignore exception:

```
artifacts/
!artifacts/
!artifacts/cv/
!artifacts/cv/*.html
artifacts/cv/*.pdf
```

This keeps every generated HTML in git history (so any past CV can be re-rendered) while keeping the rendered PDFs out (they are regenerable from the HTML via Chrome headless in seconds).

## Rules

- **Always timestamp output filenames** with `HHMM`. Never overwrite a prior CV.
- **No em or en dashes anywhere in output**, including in prose, date ranges, or separators. Apply `/ro:write-copy` rules fully.
- **Every fact traces to a wiki source.** No invented metrics, dates, or employers.
- **Single page default.** If content overflows, tighten typography before dropping facts. Drop facts only with user confirmation.
- **Clickable company and institution names** in the PDF. URLs come from the entity pages' frontmatter (`homepage`, `url`) or the source-note (`source-url`). Never guess.
- **Tailoring reshapes framing, not facts.** The same CV for different targets differs in emphasis and order, not in truth.
- **Source-note is regenerated alongside the artefact.** Step 6 is non-optional. The wiki source-note for the current date+variant always describes the latest matching artefact. Same-date overwrites; cross-date accumulates. Never hand-edit the source-note in a way that drifts from the rendered CV.
- **Stage-tier honesty for emerging tech.** Use the four-tier split (Shipping / Building / Researching / Exploring) under Skills > Frontier AI (or equivalent). Don't conflate. The overclaim trap: "AI Engineer" / "agent builder" framing in headline or Profile when the actual stage is "researching with the SDK". Calibrate via Step 1b.
- **Defensibility check.** Every CV claim must be defensible in interview. Vague-but-ambitious ("agentic system", "AI tooling") is weak; specific-and-concrete ("stage-routed multi-agent pipeline: planning by X, synthesis by Y in pods") is strong. Punchy + specific beats vague + impressive. After rendering, scan each bullet and ask "what answer would I give if a reviewer probes this?" — if no clear answer exists, rewrite or cut.
- **Filler-cut list.** Phrases that feel like positioning but read as filler — cut unless they carry concrete signal:
  - "lead or contribute alongside, whichever the work calls for"
  - "research, prototype, ship, share with the team"
  - "happy to pick up whatever ships" (or similar awkward verb-as-noun constructions)
  - "framework-agnostic and happy to pick up whatever the job needs" (without specifics following)
  - generic CV verbs as bullet leads: spearhead, drive, transform, deliver
  - parenthetical noise that doesn't add specificity (e.g. "(often with X)" where X is implicit from context)
- **Avoid sales-game vocabulary for client outcomes.** "Won the client", "won additional clients" reads gamey. Prefer factual: "POC led to a signed engagement", "led to additional client engagements", "selected for the build", or just "(signed)" inline. Hackathon "won" is fine — it's a literal competition.
- **Aspirational line.** Profile may include one short aspirational sentence ("would love to do X full-time") only if the proof points (Skills tier, achievements, projects) support it elsewhere in the CV. Without proof points, it reads as a wish.
- **Present-tense gerund for in-progress work.** "I'm building X" beats "I build X" or "I built X" when the work is mid-flight. Signals stage honestly.
- **Three tiers of positioning intensity.**
  - Role-line (sidebar, three words): MUST be defensible. Avoid aspirational claims.
  - Tagline (above Profile, four-item interest cluster): can include topic tags ("Frontier AI") without overclaiming, since it's framed as interests.
  - Profile: full positioning paragraph; may include one aspiration sentence.
- **Tailoring reshapes framing, not facts.** The same CV for different targets differs in emphasis and order, not in truth. If target uses tech X and CV never mentions X, flag the gap honestly in the report. If exposure exists but it's not fluency (e.g. "AWS exposure via personal projects"), say "exposure" not "experience".
- **No auto-commit.** Scratchpad for CVs: tracked HTML lives with vault changes. Commit is the user's call.
