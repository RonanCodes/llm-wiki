---
name: generate-flashcards
description: Render an Anki .apkg deck from wiki pages for spaced-repetition study. LLM writes card pairs; genanki packages them. CSV sidecar is the re-ingestable source. Used by /generate flashcards. Not user-invocable directly — go through /generate.
user-invocable: false
allowed-tools: Bash(which *) Bash(brew *) Bash(pip *) Bash(pipx *) Bash(python3 *) Bash(git *) Bash(mkdir *) Bash(date *) Bash(cat *) Bash(sed *) Bash(grep *) Read Write Glob Grep
---

# Generate Flashcards

Produce an Anki `.apkg` deck from wiki pages — front/back card pairs, each tagged with the source wiki page. Import into Anki desktop or mobile.

Artifact-first — output lands in `vaults/<vault>/artifacts/flashcards/`.

## Usage (via /generate router)

```
/generate flashcards <topic> [--vault <name>] [--count <n>] [--difficulty easy|medium|hard]
```

- `--count` — number of cards (default 20).
- `--difficulty` — nudges card style. Easy = term↔definition; medium = concept↔application; hard = comparison and synthesis cards.

## Pipeline

```
wiki pages  →  LLM writes cards.csv  →  genanki script →  .apkg deck
```

## Step 1: Dependency Check

```bash
HAS_GENANKI=0
python3 -c "import genanki" 2>/dev/null && HAS_GENANKI=1

if [ "$HAS_GENANKI" = "0" ]; then
  echo "genanki not found. Installing via pipx…"
  if which pipx >/dev/null 2>&1; then
    pipx install genanki || pipx inject genanki genanki
  else
    pip install --user genanki
  fi
fi
```

Anki import itself requires no local Anki install — `.apkg` is just a SQLite file Anki reads on import.

## Step 2: Resolve Vault + Topic

```bash
mapfile -t PAGES < <(.claude/skills/generate/lib/select-pages.sh "$VAULT_DIR" "$TOPIC")
HASH=$(.claude/skills/generate/lib/source-hash.sh "${PAGES[@]}")
```

## Step 3: Write cards.csv

CSV over JSON because Anki's own import path is CSV-native, and because `awk`/`cut` make the sidecar the most diffable option for Phase 2E re-ingest.

Schema — 4 columns, RFC 4180 quoting:

```csv
front,back,source,tags
"What is attention in transformers?","A mechanism that computes a weighted sum over all tokens in a sequence, letting each position directly attend to every other.","wiki/concepts/attention.md","transformers attention"
"Why is self-attention O(n²)?","Because it computes pairwise scores between all token pairs — cost grows quadratically with sequence length.","wiki/concepts/self-attention.md","transformers attention scaling"
```

**Card-writing rules the LLM follows:**

- `front` is a question or cue; `back` is a complete answer (1–3 sentences).
- Atomic facts — one idea per card. Split compound facts across multiple cards.
- Tags: always includes the vault name and the topic; optionally adds concept tags.
- `source` is the wiki page path — mandatory. Used in the footer of every card.
- Difficulty calibration:
  - `easy` — term ↔ definition, single fact.
  - `medium` — apply the concept to a scenario ("Given X, which pattern fits?").
  - `hard` — compare two concepts, or derive an implication (cloze-style).

## Step 4: Build the Deck

Generation is a small Python helper. Either invoked inline:

```bash
PY_SCRIPT="/tmp/generate-flashcards-$$.py"
cat > "$PY_SCRIPT" <<'PY'
import csv, hashlib, sys, genanki
csv_path, out_path, deck_name, vault_name = sys.argv[1:5]

# Stable IDs derived from deck name so re-renders update the same deck in Anki.
deck_id  = int(hashlib.sha256(deck_name.encode()).hexdigest()[:8], 16) & 0x7fffffff
model_id = int(hashlib.sha256(b"llm-wiki-basic-v1").hexdigest()[:8], 16) & 0x7fffffff

model = genanki.Model(
    model_id, "llm-wiki basic (v1)",
    fields=[{"name": "Front"}, {"name": "Back"}, {"name": "Source"}],
    templates=[{
        "name": "Card 1",
        "qfmt": "{{Front}}",
        "afmt": "{{FrontSide}}<hr id=answer>{{Back}}<div style='margin-top:1em;color:#888;font-size:.85em'>source: {{Source}}</div>",
    }],
    css=".card{font-family:system-ui;font-size:20px;color:#e8eef6;background:#0b0f14;padding:1.2em}hr#answer{border:0;border-top:2px solid #e0af40;margin:1em 0}",
)

deck = genanki.Deck(deck_id, deck_name)
with open(csv_path, newline="") as f:
    reader = csv.DictReader(f)
    for row in reader:
        tags = (row.get("tags") or "").split() + [vault_name.replace(" ", "_")]
        deck.add_note(genanki.Note(
            model=model,
            fields=[row["front"], row["back"], row["source"]],
            tags=tags,
        ))
genanki.Package(deck).write_to_file(out_path)
PY

DECK_NAME="llm-wiki::$VAULT_NAME::$TOPIC_SLUG"
python3 "$PY_SCRIPT" "$CSV_PATH" "$APKG_OUT" "$DECK_NAME" "$VAULT_NAME"
rm "$PY_SCRIPT"
```

Or as a checked-in helper at `.claude/skills/generate-flashcards/build_deck.py` if you prefer not to heredoc each time. Same code either way.

### Why stable deck IDs matter

Anki updates cards in-place when you re-import a deck with the same `deck_id` + `model_id`. That's the right default: edit `cards.csv`, re-run `/generate flashcards`, re-import in Anki, and your review history stays intact. Using random IDs would create a duplicate deck on every render — painful.

## Step 5: Keep `.cards.csv` Alongside

```bash
cp "$CSV_PATH" "${APKG_OUT%.apkg}.cards.csv"
```

`.apkg` is a SQLite file and awkward to parse. The CSV is what Phase 2E's `verify-artifact` re-ingests for fidelity testing.

## Step 6: Version Detection

Before writing the sidecar, check for an existing artifact of the same type and topic:

```bash
ARTIFACT_TYPE="flashcards"
EXISTING=$(ls "$VAULT_DIR/artifacts/$ARTIFACT_TYPE/"*"$TOPIC_SLUG"*.meta.yaml 2>/dev/null | sort | tail -1)
if [ -n "$EXISTING" ]; then
  PREV_VERSION=$(grep '^version:' "$EXISTING" | awk '{print $2}')
  PREV_VERSION=${PREV_VERSION:-1}
  VERSION=$((PREV_VERSION + 1))
  PREV_SLUG=$(basename "$EXISTING" .meta.yaml)
else
  VERSION=1
  PREV_SLUG=""
fi
```

The old artifact stays in place — not deleted, not overwritten. Multiple files of the same type + topic = version history. The portal discovers and displays these automatically.

Small fixes (CSS tweaks, typo corrections) should update the file in-place without incrementing the version — use judgement based on whether the content meaningfully changed.

## Step 7: Write the Sidecar

```bash
META="${APKG_OUT%.apkg}.meta.yaml"
cat > "$META" <<EOF
generator: generate-flashcards@0.1.0
generated-at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
topic: "<raw topic argument>"
difficulty: ${DIFFICULTY:-medium}
count: $COUNT
deck-name: $DECK_NAME
genanki-version: $(python3 -c "import genanki; print(genanki.__version__)")
generated-from:
$(for p in "${PAGES[@]}"; do echo "  - $p"; done)
source-hash: $HASH
version: $VERSION
change-note: "<brief description of what changed, or 'Initial version' for v1>"
replaces: "$PREV_SLUG"
EOF
```

## Step 8: Commit to Vault Repo

```bash
cd "$VAULT_DIR"
git add "artifacts/flashcards/<slug>-<date>."{apkg,cards.csv,meta.yaml}
git diff --cached --quiet || git commit -m "🃏 flashcards: generate <topic> ($(date +%Y-%m-%d))"
```

## Step 9: Report to User

```
✅ Flashcards generated
   Topic:       <topic>
   Deck:        llm-wiki::<vault>::<topic>
   Cards:       <N>
   Difficulty:  <easy|medium|hard>
   Source hash: <first 12 chars>
   APKG:        vaults/<vault>/artifacts/flashcards/<slug>-<date>.apkg
   CSV:         vaults/<vault>/artifacts/flashcards/<slug>-<date>.cards.csv
   Sidecar:     vaults/<vault>/artifacts/flashcards/<slug>-<date>.meta.yaml

   Import:      Anki → File → Import → select the .apkg
   Mobile:      AirDrop / share the .apkg to AnkiMobile / AnkiDroid
```

## Importing into Anki

**Desktop:** `File → Import…` → pick the `.apkg`. Anki creates (or updates) the `llm-wiki::<vault>::<topic>` deck. Hierarchical name (`::` separator) keeps vaults organised.

**AnkiMobile / AnkiDroid:** AirDrop / share-sheet the `.apkg` to the mobile app. Same update-in-place behaviour.

**Second render, same topic:** stable deck + model IDs mean Anki updates existing cards and adds new ones. Your review scheduling history survives.

## Known Limitations (Phase 2D)

- **LLM-dependent card quality.** Great wiki pages → great cards. Sparse pages → repetitive cards.
- **No cloze cards yet.** Basic (front/back) only. Cloze deletion is a future card model — the `model_id` scheme leaves room.
- **No media support.** Text-only cards. Adding image/audio fields would mean teaching the LLM to emit media refs and the script to package them — deferred.
- **CSV escaping is RFC 4180** — if the LLM writes a back containing a raw double-quote, it must be doubled (`""`). The prompt instructs this.

## See Also

- `.claude/skills/generate/SKILL.md` — router that dispatches here.
- `.claude/skills/generate-quiz/SKILL.md` — one-shot self-test sibling.
- [genanki](https://github.com/kerrickstaley/genanki) — the upstream library.
- `sites/docs/src/content/docs/reference/artifacts.md` — sidecar schema.
