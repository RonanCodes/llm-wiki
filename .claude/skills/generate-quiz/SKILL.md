---
name: generate-quiz
description: Render a self-contained HTML quiz (multiple choice + short answer) from wiki pages. LLM writes the question set; a static template renders it. Output is single-file HTML, no server. Used by /generate quiz. Not user-invocable directly — go through /generate.
user-invocable: false
allowed-tools: Bash(which *) Bash(git *) Bash(mkdir *) Bash(date *) Bash(cat *) Bash(sed *) Bash(grep *) Bash(awk *) Bash(cp *) Read Write Glob Grep
---

# Generate Quiz

Produce a single-file HTML self-test from wiki pages — multiple-choice and short-answer questions, each linking back to its source page. No server, no dependencies at render time.

Artifact-first — output lands in `vaults/<vault>/artifacts/quiz/`.

## Usage (via /generate router)

```
/generate quiz <topic> [--vault <name>] [--count <n>] [--difficulty easy|medium|hard]
```

- `--count` — number of questions (default 10).
- `--difficulty` — nudges the LLM's question style. Easy = recall, medium = application, hard = comparison + synthesis.

## Pipeline

```
wiki pages  →  LLM writes questions.json  →  sed fills quiz.html template  →  self-contained .html
```

## Step 1: Dependency Check

None. This handler is pure text — cp + sed + file I/O.

## Step 2: Resolve Vault + Topic

```bash
mapfile -t PAGES < <(.claude/skills/generate/lib/select-pages.sh "$VAULT_DIR" "$TOPIC")
HASH=$(.claude/skills/generate/lib/source-hash.sh "${PAGES[@]}")
```

## Step 3: Write questions.json

The invoking LLM reads the selected pages and writes a `questions.json`. Schema:

```json
{
  "title": "Transformers Self-Test",
  "topic": "transformers",
  "difficulty": "medium",
  "generated_at": "2026-04-18",
  "questions": [
    {
      "id": "q1",
      "type": "mcq",
      "prompt": "Which term describes the weighted context mechanism in transformers?",
      "options": ["Recurrence", "Attention", "Convolution", "Gating"],
      "correct": 1,
      "explanation": "Attention lets each token query every other token directly — the innovation that replaced recurrence.",
      "source": "wiki/concepts/attention.md"
    },
    {
      "id": "q2",
      "type": "short",
      "prompt": "In one sentence, why does self-attention scale poorly with sequence length?",
      "correct_keywords": ["quadratic", "n^2", "token pairs"],
      "explanation": "Attention computes pairwise scores — O(n²) in sequence length.",
      "source": "wiki/concepts/self-attention.md"
    }
  ]
}
```

**Question-writing rules the LLM follows:**

- Every question carries a `source` wiki page — critical for Phase 2E's close-the-loop fidelity testing.
- MCQ options are 4 items. Exactly one correct. No "all of the above".
- Short-answer `correct_keywords` are match hints for client-side grading, not a strict answer key. The UI shows the explanation whichever way the user answers.
- Explanations cite the source when possible.
- Difficulty calibration:
  - `easy` — direct recall of a fact stated in the page.
  - `medium` — application: apply the concept to a slightly new scenario.
  - `hard` — synthesis: compare two pages, or derive an implication.

## Step 4: Fill the Template

Templates live at `.claude/skills/generate-quiz/templates/quiz.html`. The template includes a `<script id="quiz-data" type="application/json">…</script>` anchor and a `{{title}}` placeholder in the `<title>` and `<h1>`.

```bash
HTML_OUT="$VAULT_DIR/artifacts/quiz/<slug>-<date>.html"
TEMPLATE=".claude/skills/generate-quiz/templates/quiz.html"

# Embed the JSON into the HTML via awk (avoids sed escaping pain on braces/quotes).
awk -v data="$(cat "$QUESTIONS_JSON")" -v title="$TITLE" '
  /\{\{title\}\}/ { gsub(/\{\{title\}\}/, title) }
  /<!-- QUIZ_DATA_HERE -->/ { print; print data; next }
  { print }
' "$TEMPLATE" > "$HTML_OUT"
```

Vault-local override: `<vault>/.templates/quiz/quiz.html` wins over the shipped default.

## Step 5: Keep `.questions.json` Alongside

```bash
cp "$QUESTIONS_JSON" "${HTML_OUT%.html}.questions.json"
```

Same "re-renderable source next to binary" pattern as `.script.md`, `.outline.md`, `scenes.json`. Edit the JSON and re-run to regenerate without re-querying the wiki. Also what Phase 2E's `verify-artifact` re-ingests for fidelity testing.

## Step 6: Write the Sidecar

```bash
META="${HTML_OUT%.html}.meta.yaml"
cat > "$META" <<EOF
generator: generate-quiz@0.1.0
generated-at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
topic: "<raw topic argument>"
difficulty: ${DIFFICULTY:-medium}
count: $COUNT
generated-from:
$(for p in "${PAGES[@]}"; do echo "  - $p"; done)
source-hash: $HASH
EOF
```

## Step 7: Commit to Vault Repo

```bash
cd "$VAULT_DIR"
git add "artifacts/quiz/<slug>-<date>."{html,questions.json,meta.yaml}
git diff --cached --quiet || git commit -m "🎓 quiz: generate <topic> ($(date +%Y-%m-%d))"
```

## Step 8: Report to User

```
✅ Quiz generated
   Topic:       <topic>
   Difficulty:  <easy|medium|hard>
   Questions:   <N>
   Source hash: <first 12 chars>
   HTML:        vaults/<vault>/artifacts/quiz/<slug>-<date>.html
   Questions:   vaults/<vault>/artifacts/quiz/<slug>-<date>.questions.json
   Sidecar:     vaults/<vault>/artifacts/quiz/<slug>-<date>.meta.yaml
   Open with:   open <absolute path>
```

## Known Limitations (Phase 2D)

- **Grading is client-side and lenient.** Short-answer grading uses keyword match — good enough for self-study, not for assessment.
- **No progress persistence.** Reload the page and your answers are gone. LocalStorage hook is a one-liner to add when anyone asks.
- **No explanations hidden until answered.** The template reveals explanations after each attempt; that's the design, not a bug.
- **Question generation depth varies.** The LLM's quality on `hard` difficulty is much better when the wiki has multiple pages on the topic with explicit cross-references.

## See Also

- `.claude/skills/generate/SKILL.md` — router that dispatches here.
- `.claude/skills/generate/lib/select-pages.sh` — shared topic resolution.
- `.claude/skills/generate-flashcards/SKILL.md` — spaced-repetition sibling.
- `sites/docs/src/content/docs/reference/artifacts.md` — sidecar schema.
