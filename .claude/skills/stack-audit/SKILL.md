---
name: stack-audit
description: Audit a repo against the golden-stack canon in llm-wiki-research. Reads the Audit Checklist tables in ideal-tech-setup.md, runs each check against the target repo (file existence, package.json deps, wrangler.toml config, gh-api repo settings), and prints a prioritised punch list. Optionally ingests findings into llm-wiki-research/wiki/audits/. Also flags doc staleness vs /ro:new-tanstack-app. Use when the user says "audit this repo against canon", "stack-audit", "check this against the golden stack", "is this app on canon".
argument-hint: [<repo-path>] [--ingest] [--no-doc-staleness]
allowed-tools: Bash(git *) Bash(gh *) Bash(jq *) Bash(grep *) Bash(awk *) Bash(find *) Bash(test *) Bash(cat *) Bash(ls *) Bash(open *) Bash(date *) Read Write Edit Glob Grep
---

# Stack Audit

Read-side companion to `/stack-update`. Walks a target repo against the **Audit Checklist** in `vaults/llm-wiki-research/wiki/concepts/ideal-tech-setup.md` and prints a prioritised punch list.

## Usage

```
/stack-audit                      # audits the current working directory
/stack-audit ~/Dev/connections-helper
/stack-audit . --ingest           # also writes the report to llm-wiki-research/wiki/audits/
/stack-audit ~/Dev/foo --no-doc-staleness   # skip the meta-staleness check
```

## Step 1: Parse arguments + collect fuzzy-conditional answers up front

- `<repo-path>` (positional, optional, default `$PWD`): the repo to audit. Must be a directory.
- `--ingest`: also write a markdown report to `vaults/llm-wiki-research/wiki/audits/<repo-name>-<YYYY-MM-DD>.md` and update the audits index.
- `--no-doc-staleness`: skip the doc-staleness meta-check (Step 5).

Resolve the repo path to an absolute path. Verify it is a git repo (warn if not, continue).

**Then**, before running checks, ask the user via `AskUserQuestion` for the fuzzy `only-if` triggers that cannot be reliably inferred from the filesystem. Bundle them into one multi-question prompt:

1. **Public-facing?** (drives `opt-seo`, `opt-a11y-ci`, OG-image checks)
2. **Daily-return utility?** (drives `opt-pwa`)
3. **Multi-step UI with > 3 primary actions?** (drives `opt-keyboard-shortcuts`)
4. **Already deployed to production?** (drives `obs-sentry`, `obs-uptimerobot`, `obs-posthog`)
5. **Has user accounts / login?** (drives `opt-auth-better-auth`)

Skip a question if the filesystem already answers it (e.g. if `wrangler.toml` has a custom-domain route binding, treat as deployed). Default each question to "yes" when ambiguous; flagging false-positives is cheaper than missing real gaps.

## Step 2: Load the canon

Canon location (absolute path on Ronan's machine):

```
CANON=~/Dev/ai-projects/llm-wiki/vaults/llm-wiki-research/wiki/concepts/ideal-tech-setup.md
```

If the file is missing, fail fast with the canonical-doc location and a pointer to `/stack-update` (which does not yet seed it).

Read the file. Find the `## Audit Checklist` section. The checklist is a series of markdown tables grouped by category (`### Core stack`, `### UI + design`, `### Testing + hygiene`, `### Deploy + CI`, `### Observability`, `### Backups + DR`, `### Optional add-ons`).

Each row has columns: `ID | Check | Signal | Severity | Fix` (Optional add-ons + Observability also include an `Only-if` column).

Parse each row into a structured check:

```
{
  id: "framework-tsstart",
  category: "Core stack",
  check: "TanStack Start",
  signal: "package.json dep @tanstack/react-start or @tanstack/start",
  severity: "critical",
  only_if: null,
  fix: "/ro:migrate-to-tanstack"
}
```

## Step 3: Run each check

For each parsed check, evaluate the `signal` against the target repo. The signal column is human-readable; you have to translate it to a concrete filesystem / grep / API call. Common signal patterns:

| Signal pattern | How to verify |
|---|---|
| `package.json dep <name>` | `jq -e '.dependencies["<name>"] // .devDependencies["<name>"]' <repo>/package.json` |
| `package.json dev dep <name>` | `jq -e '.devDependencies["<name>"]' <repo>/package.json` |
| `package.json dep starting with <prefix>` | `jq -r '(.dependencies // {}) + (.devDependencies // {}) \| keys[] \| select(startswith("<prefix>"))' <repo>/package.json` |
| `<file> exists` | `test -f <repo>/<file>` |
| `<file>/<.jsonc> exists` | check both extensions |
| `<dir> exists` | `test -d <repo>/<dir>` |
| `<file> contains <pattern>` | `grep -q '<pattern>' <repo>/<file>` |
| `tsconfig.json has <key>: <value>` | `tsconfig.json` is JSONC (comments + trailing commas), so plain `jq` fails. Use `pnpm exec tsc --showConfig 2>/dev/null \| jq` from the repo root, OR `node -e 'console.log(JSON.stringify(require("strip-json-comments")(require("fs").readFileSync(p,"utf8"))))'`, OR a tolerant grep on the raw file. |
| `wrangler.toml/.jsonc has <key>` | check BOTH extensions; signal patterns in the canon use TOML form (`[[d1_databases]]`) but the JSONC form (`"d1_databases": [...]`) is equally valid. Grep for the key name itself (`d1_databases`) rather than the syntax wrapper. |
| `gh api repos/<owner>/<repo>` | resolve owner/repo from `git remote get-url origin`, then run `gh api` |
| `UptimeRobot API returns ...` | requires `UPTIMEROBOT_API_KEY`; if unset, mark check `skipped (no API key)` |

For each check, assign one of:
- `✅ PASS` (signal verified)
- `❌ FAIL` (signal NOT verified, applicable check)
- `⚠️ WARN` (signal partially verified, e.g. dep present but version stale)
- `⏭ SKIP` (conditional check whose `only-if` did not fire, or external API key missing)

For conditional checks: the `only-if` column says when the check applies. Use heuristics:

- `repo has login/session/user concept` → look for `auth/`, `session/`, `users` table in `db/schema.ts`, or any `better-auth` import
- `repo has multi-step flows or agent decisions` → look for `xstate` dep already, or `machines/` directory
- `repo makes LLM calls` → look for `ai`, `@ai-sdk/*`, `openai`, `@anthropic-ai/sdk` deps
- `daily-return utility` → no automated detection; ask the user once
- `public-facing` → look for `og:`, `meta name="description"`, `sitemap.xml`; or ask once
- `app is deployed to prod` → assume yes if `wrangler.toml` exists with non-default name; ask once otherwise
- `UI app` → look for `react`, `vue`, `svelte` in `dependencies`

When in doubt, prefer to flag than to skip. The user can dismiss false positives.

## Step 4: Group + format the report

Output a punch list grouped by severity, then by category. Use this format:

```
═══════════════════════════════════════════════════════════════
Stack Audit Report: <repo-name>
Audited: 2026-04-25 09:30 BST
Canon: ideal-tech-setup.md (vaults/llm-wiki-research/wiki/concepts/)
═══════════════════════════════════════════════════════════════

CRITICAL (must-have, missing)
  ❌ ci-squash-only       Repo allows merge commits; canon requires squash-only
                          Fix: gh api -X PATCH repos/<owner>/<repo> -f allow_squash_merge=true ...
  ❌ hygiene-husky        .husky/ not present
                          Fix: pnpm exec husky init

RECOMMENDED (canon expects, missing)
  ⚠️ pkg-pnpm             yarn.lock present alongside pnpm-lock.yaml
                          Fix: rm yarn.lock

CONDITIONAL (only-if triggered, missing)
  ❌ opt-auth-better-auth Has users table but no better-auth dep
                          Fix: /ro:better-auth

PASSING (29 checks)
  ✅ framework-tsstart, ts-strict, orm-drizzle, db-d1-or-neon, validation-zod, ...

SKIPPED (3 checks)
  ⏭ obs-uptimerobot      No UPTIMEROBOT_API_KEY set
  ⏭ ci-branch-protection No origin remote
  ⏭ opt-pwa              Conditional only-if: daily-return utility (not assumed)

Summary: 24 critical, 8 recommended, 6 optional checks evaluated
         5 fail, 3 warn, 27 pass, 3 skip
═══════════════════════════════════════════════════════════════
```

Keep the punch list tight. Group repeats. Lead with critical fails so the user sees what to fix first.

## Step 5: Doc staleness meta-check (unless --no-doc-staleness)

Compare the canon doc against the live `/ro:*` skill catalog:

```bash
SKILLS_DIR=~/Dev/ronan-skills/skills
```

For each `/ro:<name>` reference in `ideal-tech-setup.md` and `ai-agent-stack.md`, verify `${SKILLS_DIR}/<name>/SKILL.md` exists. Report:

- `❌ DEAD` skills mentioned in canon but no longer in `ronan-skills/`
- `⚠️ NEW` skills in `ronan-skills/` (specifically those invoked by `/ro:new-tanstack-app`) that the canon does NOT mention

Print this as a separate "Doc staleness" section after the per-repo punch list.

## Step 6: Optional ingest (--ingest)

When `--ingest` is set:

1. Compose a wiki/audit report markdown file with:
   - Frontmatter (title, dates, page-type=source-note, domain=dev-research, tags includes `stack-audit`, related links to `[[ideal-tech-setup]]`)
   - The full punch-list output above
   - One-line per check with the rendered status
2. Write to `~/Dev/ai-projects/llm-wiki/vaults/llm-wiki-research/wiki/audits/<repo-name>-<YYYY-MM-DD>.md`. Create the `audits/` dir if missing.
3. Update `vaults/llm-wiki-research/wiki/index.md` to include the new audit row under `## Sources`.
4. Append a log.md entry.
5. Open the audit page in Obsidian.
6. Commit in the research vault, following the global CLAUDE.md commit-timestamp rule:
   ```bash
   cd vaults/llm-wiki-research
   git add wiki/audits/<file> wiki/index.md log.md
   git commit -m "📝 docs(audits): stack-audit <repo-name> <YYYY-MM-DD>"
   ```

## Step 7: Suggest follow-ups

After the report, suggest concrete next actions:

- For every critical fail, suggest the exact command (already in the `Fix` column of the canon).
- If multiple critical fails point at one orchestrator skill (e.g. `/ro:new-tanstack-app`), suggest running it.
- If the repo is on a non-canonical stack (no TanStack, no CF Workers), suggest `/ro:migrate-to-tanstack` once and stop reporting per-check fails for the migration items.
- **Even if the user wants to KEEP a non-TanStack framework** (Astro, Vite static, Remix, etc.) and only migrate the host to CF Workers, **the host-swap + hygiene + GH-Actions + secrets steps are identical to canon**. Reference `/ro:migrate-to-tanstack` § "Custom domain: pre-delete conflicting DNS" and `/ro:new-tanstack-app` §13 (CI workflow + `gh secret set --env production`) — those patterns transfer 1:1. Do **not** re-derive them.

## Step 8: When the user asks you to actually execute a fix

This skill is **read-only by design** (Anti-patterns), but the recommendations it produces often get acted on in the same conversation. Before pasting any "create CF API token" or "set GH secret" instructions, **first grep `~/.claude/.env` for existing creds**:

```bash
grep -iE "^(CLOUDFLARE_|SENTRY_|POSTHOG_|UPTIMEROBOT_|NEON_|GH_TOKEN|GITHUB_TOKEN)=" ~/.claude/.env
```

If a needed token is already there (it usually is for already-onboarded providers), source it and use it directly — do not ask the user to paste a token they already have. Pattern:

```bash
unset GH_TOKEN GITHUB_TOKEN  # ~/.claude/.env's GITHUB_TOKEN shadows gh CLI keychain auth — must unset
CF_TOKEN=$(grep "^CLOUDFLARE_API_TOKEN=" ~/.claude/.env | cut -d= -f2-)
CF_ACC=$(grep "^CLOUDFLARE_ACCOUNT_ID=" ~/.claude/.env | cut -d= -f2-)

# Create the GH production env (idempotent) before setting secrets that reference it
gh api -X PUT repos/$OWNER/$REPO/environments/production

# Set deploy creds + telemetry placeholders
printf '%s' "$CF_TOKEN" | gh secret set CLOUDFLARE_API_TOKEN --env production -R $OWNER/$REPO
printf '%s' "$CF_ACC"   | gh secret set CLOUDFLARE_ACCOUNT_ID --env production -R $OWNER/$REPO
printf '%s' ""          | gh secret set SENTRY_DSN            --env production -R $OWNER/$REPO
printf '%s' ""          | gh secret set POSTHOG_PROJECT_KEY   --env production -R $OWNER/$REPO

# Non-secret default
gh api -X POST repos/$OWNER/$REPO/environments/production/variables \
  -f name=POSTHOG_INGEST_HOST -f value=https://eu.i.posthog.com
```

Empty string secrets are intentional: the canon `src/lib/{sentry,posthog}.ts` SDKs gracefully no-op when keys are missing/empty, so deploys succeed before SaaS accounts exist.

## Heuristics

- **No `package.json`** → most checks N/A. Mark them all as `⏭ SKIP (no package.json)` and report only the file-existence checks. The user is probably auditing a non-Node repo.
- **Workdir is the engine repo (`llm-wiki/`)** → tell the user this is a meta-repo, not an app, and suggest auditing one of its sibling apps under `~/Dev/ai-projects/` instead. Stop.
- **Workdir is a vault (under `vaults/`)** → same: not an app. Stop.
- **No `wrangler.toml` AND no `package.json` says `@cloudflare/workers-types`** → assume the app is not CF-Workers-based. Skip the CF-specific checks.

## Anti-patterns

- Do not edit the target repo. This is a read-only audit.
- Do not make API calls without the relevant env var; mark the check `⏭ SKIP` instead.
- Do not silently skip checks. Always report what was skipped and why.
- Do not invent severity levels not in the canon. The canon's `critical / recommended / conditional` is the only vocabulary.
- Do not run if the canon doc is missing. Fail fast and direct the user to `/stack-update` (or to clone the research vault).

## See also

- `/stack-update` writes to the same canon docs that this skill reads.
- `/ro:new-tanstack-app` scaffolds a fresh app on canon (so a freshly-scaffolded app should pass this audit).
- `/ro:migrate-to-tanstack` migrates an existing app onto canon.
- `/ro:app-polish` covers post-launch polish (overlapping but distinct: that one is launch-readiness, this one is structural canon-conformance).
