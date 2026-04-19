---
name: generate-all
description: Meta-generator that runs every generate-* handler for a topic in one pass. Asks the user to pick a preset (fast, html-only, everything), then dispatches to each handler sequentially and regenerates the vault portal at the end. Used by /generate all.
user-invocable: false
allowed-tools: Bash(git *) Bash(ls *) Bash(mkdir *) Bash(date *) Bash(find *) Bash(cat *) Bash(grep *) Bash(awk *) Bash(wc *) Read Write Glob Grep
---

# Generate All

Run every available `generate-*` handler for a single topic in one go. This is the "give me the full bundle" command — useful when you want to produce a podcast, book, slides, quiz, flashcards, mindmap, and infographic for the same topic without typing ten commands.

Every handler applies `.claude/skills/generate/lib/quality-rubric.md` independently — scope filter, depth floor, engagement techniques, source refs, close-the-loop verify. This meta-handler adds one extra step: after all handlers run, optionally invoke `/verify-artifact` on the fidelity-sensitive ones (book, pdf, slides, podcast).

## Usage (via /generate router)

```
/generate all <topic> [--vault <name>] [--preset <name>] [--skip <list>] [--with <list>] [--verify]
```

- `<topic>` — same shape as any other handler (tag, folder path, single page path, or free-form phrase).
- `--preset <name>` — skip the interactive prompt; one of `fast`, `html`, `everything`.
- `--skip <list>` — comma-separated handler types to exclude (e.g. `--skip video,podcast`).
- `--with <list>` — comma-separated handler types to force-include on top of the chosen preset.
- `--verify` — after all handlers run, also invoke `/verify-artifact` on the fidelity-sensitive artifacts (book, pdf, slides, podcast). Off by default because round-trip verification is slow (~30s per artifact).

## Step 1: Resolve Vault + Topic

- The `/generate` router has already resolved `--vault <name>`. If it's missing, fall back to the same rule: single vault → use it, multiple vaults → ask.
- Keep the raw topic string intact — each handler parses it themselves.

## Step 2: Pick a Preset

If `--preset` was passed, skip to Step 3 with that preset.

Otherwise ask the user with `AskUserQuestion`:

**Question:** "Which artifacts should I generate for this topic?"

**Options:**

1. **Fast artifacts** (Recommended) — `book`, `pdf`, `slides`, `quiz`, `flashcards`, `mindmap`, `infographic`. No audio, no video, no app scaffolding. Finishes in a few minutes.
2. **HTML only** — `slides`, `quiz`, `mindmap`, `infographic`. Only self-contained HTML outputs — fastest, easiest to preview in a browser.
3. **Everything** — every handler including `podcast`, `video`, and `app`. Slow and expensive (TTS + Remotion + pnpm install); expect tens of minutes.

Store the choice as `$PRESET`.

## Step 3: Build the Handler List

Start from the preset:

| Preset | Handlers |
|--------|----------|
| `fast` | book, pdf, slides, quiz, flashcards, mindmap, infographic |
| `html` | slides, quiz, mindmap, infographic |
| `everything` | book, pdf, slides, quiz, flashcards, mindmap, infographic, podcast, video, app |

Then apply `--skip` (remove entries) and `--with` (add entries, deduped). Final list is `$HANDLERS`.

Filter out handlers whose skill directory doesn't exist:

```bash
for h in "${HANDLERS[@]}"; do
  [ -d ".claude/skills/generate-$h" ] && KEPT+=("$h")
done
HANDLERS=("${KEPT[@]}")
```

If `HANDLERS` ends up empty, exit with a clear message listing what was skipped and why.

## Step 4: Dispatch Sequentially

For each handler in `$HANDLERS`, invoke the corresponding skill the same way `/generate` does — pass `<topic> --vault <name>` and any handler-specific flags the user forwarded (e.g. `--count`, `--difficulty`).

Run them **sequentially**, not in parallel:

- Some handlers (pandoc, Playwright, Remotion, pnpm) are resource-heavy and fight over CPU/disk when parallel.
- Sequential output is easier to read in the transcript.
- If a handler fails, catch the error, log it, and **continue** with the next one. Don't abort the whole batch — partial success is still useful.

Track results in a summary table:

```
handler         status    output path                               duration
─────────────── ────────  ──────────────────────────────────────── ─────────
book            ✅ ok     artifacts/book/<topic>-<date>.pdf          42s
slides          ✅ ok     artifacts/slides/<topic>-<date>.html       18s
quiz            ⚠️ fail   —                                          5s (see error above)
...
```

## Step 4.5: Optional — Verify Fidelity-Sensitive Artifacts

Each handler already ran `verify-quick.sh` (the cheap check) — those results are in each sidecar's `quality:` block. The heavy round-trip (`/verify-artifact`) is opt-in.

If `--verify` was passed:

```bash
for type in book pdf slides podcast; do
  if [[ " ${HANDLERS[*]} " == *" $type "* ]]; then
    /verify-artifact "$type" "$TOPIC" --vault "$VAULT_NAME"
  fi
done
```

Record the result (coverage, Jaccard, normalised fidelity, pass/fail) in the summary table. Never abort the batch on a verify failure — the artifact is already written and is still usable even if round-trip fidelity dipped below target. Let the user decide.

## Step 5: Regenerate the Vault Portal

After all handlers finish (success or fail), always call `generate-portal` for the same vault so the vault's `artifacts/portal/index.html` reflects the new artifacts:

```
/generate portal --vault <name>
```

This is non-optional — the portal is how the user opens the artifacts, and a stale portal defeats the point of running `/generate all`.

## Step 6: Report

Print the summary table, then the portal path:

```
✅ /generate all complete
   Vault:       <vault-name>
   Topic:       <topic>
   Preset:      <preset>
   Handlers:    <N> ran · <S> succeeded · <F> failed
   Portal:      vaults/<vault>/artifacts/portal/index.html
   Open with:   open <absolute path to portal>
```

If any handlers failed, list them at the end with a one-line reason each.

## Step 7: Commit

Each handler commits its own artifact + sidecar. The portal regeneration in Step 5 commits the portal. `generate-all` itself does **not** make an extra commit — the per-artifact commits are the audit trail.

## Notes

- **No registry.** Handler discovery uses the same directory-presence convention as `/generate`. Adding a new `.claude/skills/generate-<type>/` directory makes it automatically available to presets that include it.
- **Presets are hints, not contracts.** If the user runs `--preset html --with podcast`, honour it — the preset is a starting point.
- **Idempotent.** Running `/generate all <topic>` twice produces two versioned copies of each artifact (per the sidecar versioning convention in `generate-portal/SKILL.md`) — not duplicates that overwrite.
- **Close-the-loop.** Every per-type handler runs `verify-quick.sh` on its own output (cheap, inline, mandatory). Pass `--verify` to this meta-handler to *also* run the heavy `/verify-artifact` round-trip on the fidelity-sensitive artifacts.

## See Also

- `.claude/skills/generate/lib/quality-rubric.md` — canonical rubric every handler applies.
- `.claude/skills/generate/lib/verify-quick.sh` — cheap close-the-loop check each handler runs inline.
- `.claude/skills/verify-artifact/SKILL.md` — the opt-in round-trip invoked by `--verify`.
- `.claude/skills/generate/SKILL.md` — router that dispatches here.
- `.claude/skills/generate-portal/SKILL.md` — the vault portal this skill regenerates at the end, and the root portal (via `--root`).
- All `generate-*/SKILL.md` handlers — the building blocks this skill chains together.
