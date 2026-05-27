---
name: grill-job
description: Grill the user on a job spec (URL or local file), then ingest it into the career-moves vault with a company dossier, JD source-note, fit analysis, and interview prep, and offer to generate application artefacts (tailored CV, cover letter). Moves or copies an attached spec file into the vault's raw/. Use when the user shares a job posting and wants to be grilled on it, assess fit, prep to apply, or "should I apply for this role".
argument-hint: <url-or-file> [--vault <name>] [--no-grill]
allowed-tools: AskUserQuestion, Read, Write, Edit, Bash(ls *), Bash(mkdir *), Bash(mv *), Bash(cp *), Bash(rmdir *), Bash(date *), Bash(pdftotext *), Bash(git *), WebFetch
---

# Grill on a Job

Turn a job spec into a grilled, evidence-grounded application: company dossier, fit analysis, interview prep, and the artefacts to apply. The mirror of a recruiter chat: the user brings a role, the skill stress-tests fit and produces what they need to act.

Routes to the **career-moves** archetype vault by default (the Activity vault for the job-search pipeline). Resolve the vault from `--vault`, else the cwd vault, else the lone `*career-moves*` vault under `vaults/`. If several match, ask.

## Usage

```
/grill-job https://company.com/jobs/role           # fetch + grill + ingest
/grill-job "~/Downloads/role.pdf"                   # local spec; will offer move/copy
/grill-job <url> --vault my-career-moves            # explicit vault
/grill-job <url> --no-grill                         # skip the grill, just ingest + artefacts
```

## Flow

### 1. Read the spec
- URL → `WebFetch` (or browser tools if it needs JS). Local file → read it (`pdftotext -layout` for PDFs, lazy-install poppler if missing).
- Extract: title, company, location, work model (remote/hybrid/onsite), employment type, the "you'll do" scope, hard requirements (must-haves / filters), nice-to-haves, disqualifiers, comp (often absent — note it), application mechanics (CV format, cover letter optional?, sponsorship question).

### 2. Grill (unless `--no-grill`)
Use **AskUserQuestion**, one round of up to 4 sharp questions at a time, each with a recommended option first. Follow the grill-me discipline: resolve the load-bearing branches, don't ask what you can read off the spec or the user's vault.

The branches that matter for almost every role:
- **Motivation / why this** vs the current role (pull vs push).
- **Hard-filter reality check** — every disqualifier and must-have in the spec, mapped to the user's actual situation (location, language, work authorisation/sponsorship, seniority, stack). Surface any that don't pass.
- **The honest gap** — what in the spec is the user weakest on; what they're most worried about being grilled on at interview.
- **Positioning** — strongest proof point, biggest differentiator, how hard to lean on it.
- **Application format** — cover letter yes/no and language; anything role-specific.

Pull prior context from the user's `personal-work` (or equivalent) bio entity and latest CV artefact so the grill is grounded, not generic. Read the **newest** CV artefact, not the wiki summary (it's often stale).

After the grill, reflect the calibration back in a few lines before writing anything.

### 3. Handle the spec file (move vs copy)
If the spec is a **local file**, decide move-vs-copy by folder specificity:
- **General/transient** folders (`~/Downloads`, `~/Desktop`, OS download dirs) → assume **move** into the vault's `raw/jds/`, but say so.
- **Specific/curated** folders (a named keep/archive folder, a dedicated subfolder like `ai job specs/`, anything that reads intentional) → **ask** move vs copy via AskUserQuestion.
- After a move that empties the source folder, `rmdir` it if empty.
Name the destination `raw/jds/<yyyy-mm-dd>-<company>-<role-slug>.pdf` and write a readable `.md` capture beside it. URLs need no file move; capture the text into `raw/jds/<...>.md`.

### 4. Ingest into the vault
Follow the target vault's own conventions (read its `CLAUDE.md` + `wiki/index.md` + an existing JD/fit-analysis page as the style spec — don't hardcode). Create, matching house frontmatter and naming:
- **Company entity** — `wiki/entities/company-<name>.md` (dossier, two-role tables if the spec spans roles, open questions incl. comp if unstated).
- **JD source-note** — `wiki/sources/jd-<company>-<role>-<date>.md` (key takeaways + a filter-mapping table user-vs-spec).
- **Fit analysis** — `wiki/sources/fit-analysis-<company>-<date>.md` (calibration note, why-it-fits, honest tensions, application angle ranked, a graded fit table, flip-the-verdict signals, action items). This is the centrepiece — match the depth of the vault's existing fit-analysis pages.
- **Interview prep** — `wiki/sources/interview-prep-<company>-<date>.md` (scripted spoken answers for each worry the grill surfaced + questions to ask them).
Then update `wiki/index.md` (L1 + L2), `ROADMAP.md` (add "submit application" to In progress / Next up), and prepend a `log.md` entry.

### 5. Suggest + generate artefacts
If applying needs outputs, suggest them and (on confirmation) generate. Common set:
- **Tailored CV** — base on the user's newest relevant CV artefact, re-point the role line / tagline / profile / skills ordering at the spec. Render HTML → PDF (headless Chrome `--print-to-pdf` or weasyprint). CVs live in the `personal-work` vault's `artifacts/cv/` by convention; confirm if ambiguous.
- **Cover letter** — honour `/ro:write-copy` (no em/en-dashes, no AI-tell vocab, no rhetorical-reversal filler). If the spec allows another language, offer a calibrated short intro in that language at the user's real level (see `/ro:calibrate-language-homework` if relevant) with the body in the strongest language. Store in the career-moves vault's `artifacts/cover-letters/`.
- Optionally flashcards from the interview-prep page, a one-pager, or a company-research deep-dive.

### 6. Commit
Commit each repo it touched separately (vaults are their own git repos): the career-moves vault, the personal-work vault (if a CV landed there), and the engine repo (only if the skill itself changed). Follow the user's commit conventions (emoji + conventional, weekday timestamp rule).

## Notes
- **Vault-agnostic.** Never hardcode a vault name; resolve at runtime. Read each vault's conventions rather than assuming them.
- **Honest calibration over flattery.** A fit analysis that only says "great fit" is useless. Name the real tensions and the unstated comp.
- **Don't overclaim the user's evidence.** If a project is shipped-but-not-client-used, say exactly that.
- If `WebFetch` can't read the posting (JS-gated career sites are common), fall back to asking the user to paste the text or save the page as PDF.
