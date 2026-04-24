---
name: generate-linkedin-content
description: Generate calibrated LinkedIn content (headline, top-fold bio, About section, optionally paired ringed profile photo) from a vault's personal-work entities. Honest-calibration pass by default — challenges overclaiming language before writing. Honours /ro:write-copy rules. Pairs with /generate linkedin-cover for consistent banner + headline + bio. Used by /generate linkedin-content. Not user-invocable directly, go through /generate.
user-invocable: false
allowed-tools: AskUserQuestion, Read, Write, Edit, Bash(python3 *), Bash(mkdir *), Bash(date *), Bash(open *), Bash(git *), Glob, Grep
---

# Generate LinkedIn Content

Produce a matched LinkedIn headline + bio (+ optional ringed profile photo) from a vault's positioning work. Designed to iterate — each run is a new versioned draft saved alongside prior drafts, so the evolution of positioning is legible.

## Usage (via /generate router)

```
/generate linkedin-content [--vault <name>] [--person <slug>] [--include-photo]
```

Examples:

```
/generate linkedin-content                                  # default person + vault
/generate linkedin-content --include-photo                  # also regen profile photo with ring
/generate linkedin-content --person ronan-connolly
```

## Output

```
vaults/<vault>/wiki/comparisons/
  headline-bio-drafts-v<N>.md                               # versioned draft with rationale

vaults/<vault>/artifacts/profile-photos/   (if --include-photo)
  profile-<person>-ring-<colour>-<YYYY-MM-DD>-<HHMM>.png    # ringed photo variant
```

The drafts page is the source of truth; copy-paste-ready blocks live inside it.

## Step 1: Resolve vault + person

Default vault: `personal-work`. Default person: the self-entity (usually matches the vault owner).

Read these from the vault for context:

- `wiki/entities/<person>.md` — positioning, aliases, palette hints
- `wiki/sources/linkedin-profile-<person>*.md` — current LinkedIn snapshot (headline + bio verbatim)
- `wiki/sources/cv-<person>-*.md` — latest CV source-note
- `wiki/comparisons/headline-bio-drafts-v*.md` — all prior drafts (determine next version number)
- `wiki/entities/*` for companies named in the CV (so you can reference them accurately)
- `vaults/career-moves/scratchpad/` and `wiki/sources/chat-*` via cross-vault refs, if the user is iterating after a recruiter conversation

## Step 2: The honest-calibration interview (MANDATORY)

Before generating, run a short AskUserQuestion pass to catch overclaiming. Precedent from prior sessions: the person often claims more scope than is true, and catching it in a draft is less painful than catching it after they paste the bio.

Ask 3-4 of the following, picking the ones that the current CV/bio actually trigger:

1. **Title / role-level claim** — "Your current bio says 'Lead Engineer' / 'Staff Engineer' / 'AI Transformation Lead'. What's your actual title, and which of those are you comfortable claiming?"
2. **Leadership scope** — "You say 'co-leading the AI transformation'. Are you actually the lead or co-lead, or helping contribute? Honest calibration matters for interviews."
3. **Product vs project language** — "The draft says 'building AI-native products'. Are those productised offerings or client projects and POCs? 'Products' sets an expectation; 'software' or 'work' doesn't."
4. **Team vs org scope** — "You say 'helping my team adopt AI'. Is it really just your team, or the wider org?"
5. **Hands-on vs enabling** — "Are you building production agents for customers, or building agents for internal POCs and sales demos, or doing agentic engineering (using AI in how the team ships)? These sound similar but read very differently."

If the user has clearly already calibrated these in the vault (e.g. the most-recent `headline-bio-drafts-v*.md` answers these questions explicitly), skip the questions and use those answers.

## Step 3: Draft the headline

**Format:**
```
<active verb phrase> · <primary skill or tech anchor> · <current role framing> · <credibility anchor> · <personality beat>
```

**Rules:**
- Stay under 120 characters (LinkedIn's hard limit).
- Verb-first opening drives motion ("Shipping", "Building", "Designing") — not a noun-list.
- Primary anchor is a specific tech or depth marker ("10y Angular", "Rust since 2019") — avoid vague "Senior Engineer".
- Current role framing matches the person's honest calibration: not "Lead X" if they're "helping with X".
- Credibility anchor is a past-role signal ("Ex-Fidelity", "Ex-Google", specific exit) in 2 words.
- Personality beat is one emoji or one short phrase ("Hot Sauce Sommelier 🌶"). Never more than one.
- Use `·` as the separator throughout. Never use em-dash, en-dash, or pipe mixed with dots.

**Examples from the vault** (see `headline-bio-drafts-v*.md` for context):
- v2: `Lead Engineer shipping AI into FinTech · 10y Angular · AI Lead @ Yellowtail · Ex-Fidelity · Amsterdam 🌶`
- v3: `Shipping AI-native software · 10y Angular · Agentic engineering @ Yellowtail · Ex-Fidelity · Hot Sauce Sommelier 🌶`

v3 shows the honest-calibration outcome: `AI Lead` → `Agentic engineering` (real activity, not claimed title).

## Step 4: Draft the top-fold bio (50-150 words)

Structure per R-A-V-P-P (Role, Audience, Value, Proof, Personality):

- **Opening sentence (Value + Audience):** what you ship, for whom. One line, confident, verb-first. Match the cover phrase for consistency.
- **Paragraph 2 (Role + Proof):** current role with honest scope; specific work items; 1-2 concrete wins with outcomes.
- **Paragraph 3 (Proof continued):** past role; tech stack / tenure anchors.
- **Closing (Personality):** location, side venture, one personality beat max.

Keep total to 50-150 words. Anything longer belongs in the About section (Step 5).

## Step 5: Draft the About section (below-the-fold, up to 2600 chars)

Expands on the top-fold with:

- Opening hook (1-2 paragraphs): the problem the person works on, why.
- Current role deep dive: specific projects, wins, technologies, approach.
- Past role deep dive: one major accomplishment or thematic arc.
- Tech stack breakdown: frontend, backend, AI/agentic, cloud, testing, etc.
- Values / working style: 2-3 sentences, not a list.
- Close: location, availability, contact, one personality beat.

## Step 6: Apply /ro:write-copy rules (MANDATORY SCAN)

Before writing the draft, scan every line of headline + bio + About for banned patterns:

```
— (em-dash, U+2014)
– (en-dash, U+2013)
delve, leverage, robust, seamless, tapestry, landscape, empower, unlock, streamline (as filler)
"not only X but also Y"
"it's not just X, it's Y"
"more than just a tool"
"at the intersection of"
gratuitous tricolons (three parallel items where one or two would do)
```

If any hit, rewrite before saving. See `/ro:write-copy` for the full rule set.

## Step 7: Save as a versioned draft

Find the highest existing `headline-bio-drafts-v<N>.md` and write `v<N+1>`. File structure:

```markdown
---
title: "Headline + Bio Drafts v<N+1> (<YYYY-MM-DD>)"
date-created: <date>
date-modified: <date>
page-type: comparison
domain: [personal-work, linkedin, drafts]
tags: [draft, linkedin, headline, bio, v<N+1>]
sources: [..., raw/cv-<person>-*.pdf]
related: [..., "[[headline-bio-drafts-v<N>]]"]
---

# Headline + Bio Drafts v<N+1> (<YYYY-MM-DD>)

## Context for this version

What changed since v<N>. What the user calibrated / corrected during the interview. One paragraph.

## Recommended Headline

`...` (code block, copy-paste ready)

Character count: ~<N>/120.

Changes from v<N>:
- ...

## Recommended Bio — Top Fold

> ... (blockquote, copy-paste ready)

Word count: ~<N>.

Changes from v<N>:
- ...

## About Section

> ... (below-the-fold expansion)

## Calibration notes

What was too strong in the previous version and got softened:
- "co-leading X" → "working on X"
- "products" → "software" or "work"
- etc.

## Sources

- [[headline-bio-drafts-v<N>]] — previous version
- [[linkedin-profile-<person>]] — canonical live snapshot
- [[cv-<person>-*]] — matching CV
- [[career-moves:<relevant source>]] — if feedback drove the calibration

```

Update the vault `wiki/index.md` with a row pointing to the new draft.

## Step 8: Optional — generate ringed profile photo

If `--include-photo`, generate a matching profile photo with a teal ring sized for LinkedIn.

```python
from PIL import Image, ImageDraw
src = Image.open("<source-photo>").convert("RGBA")
w, h = src.size
side = min(w, h)
left, top = (w - side) // 2, (h - side) // 2
sq = src.crop((left, top, left + side, top + side)).resize((1024, 1024), Image.LANCZOS)
draw = ImageDraw.Draw(sq)
ring_color = (20, 184, 166, 255)  # #14b8a6 — match cover accent
thickness = 30  # 30px on 1024 canvas = visible at small LinkedIn sizes without dominating
inset = 2
draw.ellipse([inset, inset, 1023 - inset, 1023 - inset], outline=ring_color, width=thickness)
sq.save("<output>.png", "PNG")
```

**Ring thickness guide:**
- 14px: too thin at small avatar sizes
- 30px: default — visible at all sizes, not dominant
- 42-50px: thick, impactful, can read as over-designed

Ring colour should match the cover accent (stored in `wiki/concepts/brand-palette.md` or inferred from the latest cover's prompt sidecar).

## Step 9: Cross-consistency check

Before reporting, grep the vault to ensure headline, bio, CV, and cover tagline all use consistent language:

```bash
grep -r "AI Transformation Lead\|AI Transformation co-lead\|co-leading.*transformation" vaults/<vault>/artifacts/ vaults/<vault>/wiki/
```

If the CV or cover still has stronger language than the new headline/bio, either:
- Flag it to the user and offer to reconcile (preferred on first run).
- Auto-update both (only if the user has said "keep everything consistent" as a standing preference).

## Step 10: Report

Copy-paste-ready blocks for the user:

```
Headline:
<headline>

Bio (top fold):
<bio>

Saved to: wiki/comparisons/headline-bio-drafts-v<N+1>.md
```

If `--include-photo`, also include the profile photo path.

If the user's CV or cover needs matching updates (detected in Step 9), call them out with a clear prompt: "Do you want me to reconcile the CV Yellowtail bullet and cover tagline to match?"

## Rules

- **Always run the honest-calibration interview** before writing v1 or any major-change iteration. Save the user from pasting overclaim copy.
- **Version every draft.** Never overwrite a prior `headline-bio-drafts-v<N>`. History matters for interview prep ("why did you change your LinkedIn?").
- **Match the cover phrase.** If the latest cover headline is "Shipping AI-native software", the bio opener should echo it. Consistency is a trust signal.
- **Character budget hard.** 120 for headline, 150 words for top fold, 2600 chars for About.
- **One personality beat max** — either emoji or short phrase, not both stacked.
- **No em or en dashes anywhere.** `·` as separator.
- **Apply /ro:write-copy rules to every line before saving.**
- **Prefer verbs over nouns** for openings. "Shipping" beats "Engineer specialising in".
- **No auto-commit.** Leave commits to the user.

## Pairing with /generate linkedin-cover

This skill and `/generate linkedin-cover` share the same person + palette + headline phrase. Recommended flow:

1. Run `/generate linkedin-content` first — calibrates the language honestly.
2. Use the calibrated headline phrase in `/generate linkedin-cover` so the banner and the headline agree.
3. Run `/generate linkedin-content --include-photo` to produce the matching ringed avatar.

All three outputs share the navy + teal palette, so the user's LinkedIn profile reads as a coherent brand stack rather than three disconnected pieces.

## Changelog

- **v0.1.0 (2026-04-24):** initial skill. Honest-calibration interview as the distinguishing pattern — learned from the v1 → v2 → v3 iterations where each round caught an overclaim the previous had missed.
