---
name: rubric
description: Score generated artifacts (books, slides, podcasts, etc.) against per-type quality rubrics. PREFER over inline quality checks — `/rubric` is the single source of truth that verify-quick.sh, /verify-artifact, and /ralph all read from. Use when you need to audit an artifact, score it, produce a report, or close the generation loop. Triggers include "score this book", "audit the artifact", "is this good enough", "what's the quality of <output>", "rubric check".
argument-hint: <subcommand> [args] — list | audit <type> <artifact> | report <type> <artifact>
allowed-tools: Bash(bash *) Bash(python3 *) Bash(pdftotext *) Bash(file *) Bash(ls *) Bash(stat *) Read Write Edit Glob Grep
---

# Rubric — Per-type Quality Scoring

The single source of truth for "is this artifact good enough to ship?". Each artifact type (book, pdf, slides, …) has a YAML rubric in `types/<type>.yaml` defining dimensions, weights, gates, and how-measured. The scoring engine in `lib/score-rubric.sh` reads the YAML and applies it to a given artifact.

`verify-quick.sh` (in `.claude/skills/generate/lib/`) and `/verify-artifact` both delegate to /rubric for typed checks, so generate-* handlers all close the loop against the same standard. Ralph autonomous loops use the rubric overall verdict to decide when to iterate vs stop.

## Subcommands

### `list`
Show all defined rubric types.

```bash
/rubric list
```

Output:
```
Defined rubrics:
  book      → 8 dimensions, hard-gate on ai-slop
  pdf       → 5 dimensions
  slides    → 6 dimensions (when added)
  …
```

### `audit <type> <artifact-path>`
Score one artifact. Reads `types/<type>.yaml`, runs each dimension's measurement, prints a structured report, and patches the artifact's sidecar with a `rubric:` block.

```bash
/rubric audit book vaults/llm-wiki-research/artifacts/book/golden-stack-2026-04-26.pdf
```

Output:
```
📊 Rubric: book@1
   Artifact: golden-stack-2026-04-26.pdf

   ✓ scope-fidelity      pass    (jaccard=0.71, threshold≥0.5)
   ✓ depth               pass    (words=7528, chapters=4, floor 3000+3)
   ⚠ voice-fit           warn    (3 of 5 template signatures present)
   ✓ template-fit        pass    (all required structural elements found)
   ✓ layout              pass    (1.2% widow lines, threshold ≤5%)
   ✓ cover               pass    (697KB cover, aspect 2:3)
   ✗ ai-slop             FAIL    (1 hit: "leverage" appears 1x — HARD GATE)
   ⚠ source-coverage     warn    (78% paragraph coverage, threshold ≥80%)

Overall: ❌ FAIL (1 hard-gate failure: ai-slop)
Hard failures must be fixed before shipping.
```

### `report <type> <artifact-path>`
Same scoring as `audit`, but emits a markdown report file alongside the artifact: `<artifact>.rubric-report.md`. Useful for portal display or PR comments.

## Rubric YAML schema

Each `types/<type>.yaml` has:

```yaml
type: book
version: 1
description: "Quality rubric for /generate book artifacts"
overall:
  policy: any-hard-fail-fails    # any-hard-fail-fails | weighted-pass | all-pass
  warn_count_for_warn: 1         # ≥N warns → overall warn (only matters if policy is all-pass)
dimensions:
  - name: scope-fidelity
    weight: 1
    hard_gate: false
    how_measured: jaccard         # name of a Python function in lib/score-rubric.sh
    args:
      compare: "topic"            # compare chapter titles to the topic argument
    gates:
      pass: ">=0.5"
      warn: ">=0.3"
  - name: ai-slop
    weight: 1
    hard_gate: true               # any failure here = overall FAIL
    how_measured: blacklist_scan
    args:
      target: bundle.md
      blacklist:
        - "delve"
        - "leverage"
        - "robust"
        - "tapestry"
        - "elevate"
        - "unlock"
        - "streamline"
        - "—"  # em-dash
        - "–"  # en-dash
        - "in today's fast-paced world"
        - "not only.+but also"
        - "it's not just.+it's"
    gates:
      pass: "==0"
      warn: "<=2"
```

Schema fields:

- `type` — short name (matches filename minus `.yaml`).
- `version` — bump when dimensions change incompatibly.
- `description` — human-readable.
- `overall.policy` — how to combine dimension scores into the overall verdict.
- `dimensions[]` — each one has `name`, `weight` (1.0 default), `hard_gate` (bool), `how_measured` (function name), `args` (function-specific), `gates` (pass + warn thresholds).

## How the scoring engine resolves dimensions

`lib/score-rubric.sh` is a thin wrapper around an embedded Python script. The Python parses the YAML, looks up each `how_measured` value as a function name, calls it with `args` + the artifact path, gets back a numeric or boolean score, compares to gates.

Built-in measurement functions (in `lib/score-rubric.sh`):

| Function | What it measures | Args |
|---|---|---|
| `wordcount_floor` | Word count in the bundle.md sibling | `floor: <int>` |
| `chapter_count` | Number of `^# ` H1 headings in bundle.md | `floor: <int>` |
| `regex_present` | At least N matches for a pattern | `pattern, count: <int>` |
| `regex_absent` | Zero matches for any pattern in a list | `patterns: [...]` |
| `blacklist_scan` | Counts hits across a blacklist of forbidden phrases | `target, blacklist: [...]` |
| `jaccard` | Title-vs-topic Jaccard similarity | `compare: "topic" \| "first-page"` |
| `file_exists` | A sibling file exists + is non-empty | `suffix: ".cover.png"` |
| `image_size` | Image dimensions / size on disk | `min_bytes, ratio` |
| `pdf_pageinfo` | Pages, widow rate, overflow | `widow_threshold` |
| `paragraph_coverage` | % of paragraphs traceable to source pages | `threshold` |
| `engagement_count` | Distinct techniques present per chapter | `target_per_chapter` |

Adding a new measurement = append a Python function to `lib/score-rubric.sh` + reference it from a YAML dimension's `how_measured`.

## Sidecar patch shape

After `audit` or `report`, the artifact's sidecar gains:

```yaml
rubric:
  type: book
  version: 1
  scored-at: 2026-04-26T03:36:00Z
  overall: pass | warn | fail
  hard_failures: []           # list of failed hard-gate dimension names
  warnings: []                # list of warned dimension names
  dimensions:
    - name: scope-fidelity
      score: 0.71
      verdict: pass
      threshold: ">=0.5"
    - name: ai-slop
      score: 1
      verdict: fail
      threshold: "==0"
      details: "blacklist hit: 'leverage' 1x"
    # …
```

Existing `quality:` block (legacy verify-quick) is preserved alongside until verify-quick is fully migrated to rubric.

## Cross-references with other tools

- **`.claude/skills/generate/lib/quality-rubric.md`** — prose version of the rubric philosophy (scope, depth floor, engagement, source refs, close-the-loop). Stays in sync with this skill; this skill is the executable form.
- **`.claude/skills/generate/lib/verify-quick.sh`** — the inline verifier called by every generate-* handler. Phase 4 / US-404 wires it to delegate to /rubric.
- **`/verify-artifact`** — heavier round-trip verifier (re-ingest + coverage). Should also delegate to /rubric for the typed dimensions.
- **`/ralph`** — autonomous loops use the rubric overall verdict as the stop / iterate signal.

## Steps to invoke

```bash
# Step 1: Parse subcommand from ARGUMENTS
SUB="$1"; shift

case "$SUB" in
  list)
    ls .claude/skills/rubric/types/*.yaml | xargs -n1 basename | sed 's/\.yaml$//'
    ;;
  audit)
    TYPE="$1"; ART="$2"
    META="${ART%.*}.meta.yaml"
    [ ! -f "$META" ] && META="$(dirname $ART)/$(basename $ART .pdf).meta.yaml"
    bash .claude/skills/rubric/lib/score-rubric.sh "$TYPE" "$ART" "$META" --human
    ;;
  report)
    TYPE="$1"; ART="$2"
    META="${ART%.*}.meta.yaml"
    REPORT="${ART%.*}.rubric-report.md"
    bash .claude/skills/rubric/lib/score-rubric.sh "$TYPE" "$ART" "$META" --markdown > "$REPORT"
    echo "Report: $REPORT"
    ;;
  *)
    echo "Usage: /rubric <list|audit|report> [args]"
    exit 1
    ;;
esac
```

## Currently-defined rubrics

- `book` — 8 dimensions including hard-gate ai-slop. See `types/book.yaml`.
- (more per-type rubrics arrive when each generate-* handler is exercised)

## See also

- `vaults/llm-wiki-book-craft/wiki/concepts/pedagogy-techniques.md` — engagement-dimension input
- `vaults/llm-wiki-book-craft/wiki/concepts/template-voice-*` — voice-fit-dimension input per theme
- `.claude/skills/generate/lib/quality-rubric.md` — prose companion
