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

For `--target`: also read `<target-vault>/wiki/entities/company-<target>.md` and any related source-notes (e.g. `chat-<target>-<date>.md`) from that vault. Cross-vault references in the baseline CV (`[[career-moves:...]]`) are resolved by reading the target vault directly.

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

## Step 6: Open PDF

```bash
open "$OUT.pdf"
```

macOS only for now. Linux: `xdg-open`. Windows: `start`.

## Step 7: Report

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
- **No auto-commit.** Scratchpad for CVs: tracked HTML lives with vault changes. Commit is the user's call.
