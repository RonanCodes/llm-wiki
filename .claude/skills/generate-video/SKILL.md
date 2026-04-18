---
name: generate-video
description: Render an animated explainer MP4 for a topic. Picks a Remotion composition from the local remotion-studio (auto-detected, cached in ~/.claude/remotion.env, or via $REMOTION_STUDIO_DIR), parameterises it from wiki pages, optionally muxes generate-podcast voiceover. Used by /generate video. Not user-invocable directly — go through /generate.
user-invocable: false
allowed-tools: Bash(which *) Bash(brew *) Bash(git *) Bash(mkdir *) Bash(date *) Bash(cat *) Bash(sed *) Bash(grep *) Bash(awk *) Bash(ffmpeg *) Bash(node *) Bash(npm *) Bash(pnpm *) Bash(npx *) Read Write Glob Grep
---

# Generate Video

Produce an animated MP4 explainer from wiki pages. The invoking LLM writes a scene list, picks a Remotion composition, fills its props, and kicks off `npx remotion render`. Optional voiceover via `generate-podcast`.

Artifact-first — output lands in `vaults/<vault>/artifacts/video/`.

## Usage (via /generate router)

```
/generate video <topic> [--vault <name>] [--composition <id>] [--voiceover] [--length short|medium|long]
```

- `--composition <id>` — pick a Remotion composition by id (e.g. `KineticPitch`, `PromoV10`, `wiki-explainer`). Auto-picks if omitted.
- `--voiceover` — chain `generate-podcast` to produce an MP3 track, then mux into the video.
- `--length` — forwarded to the voiceover podcast pipeline.

## Pipeline

```
wiki pages → LLM scene list → pick composition → render MP4 (silent)
                                                     │
                                                     ├── if --voiceover: generate-podcast → MP3
                                                     └── ffmpeg mux → final MP4
```

## Step 1: Dependency Check

Resolve the remotion-studio location. Priority:

1. `$REMOTION_STUDIO_DIR` env var (explicit override — wins)
2. `~/.claude/remotion.env` cache file (set on first successful auto-detect)
3. Auto-detect in common clone locations (and cache the result)
4. Error with actionable fix

```bash
CACHE_FILE="$HOME/.claude/remotion.env"
REMOTION_ROOT="${REMOTION_STUDIO_DIR:-}"

# Load cached path if env var is unset
if [ -z "$REMOTION_ROOT" ] && [ -f "$CACHE_FILE" ]; then
  # shellcheck disable=SC1090
  . "$CACHE_FILE"
  REMOTION_ROOT="${REMOTION_STUDIO_DIR:-}"
fi

# If still unresolved (or the cached path is stale), auto-detect and re-cache
if [ -z "$REMOTION_ROOT" ] || [ ! -d "$REMOTION_ROOT" ]; then
  REMOTION_ROOT=""
  for candidate in \
    "$HOME/Dev/ai-projects/remotion-studio" \
    "$HOME/Dev/remotion-studio" \
    "$HOME/projects/remotion-studio" \
    "$HOME/code/remotion-studio" \
    "$HOME/src/remotion-studio" \
    "$HOME/remotion-studio"; do
    if [ -d "$candidate" ]; then
      REMOTION_ROOT="$candidate"
      break
    fi
  done

  if [ -n "$REMOTION_ROOT" ]; then
    mkdir -p "$(dirname "$CACHE_FILE")"
    printf 'REMOTION_STUDIO_DIR=%s\n' "$REMOTION_ROOT" > "$CACHE_FILE"
  fi
fi

if [ -z "$REMOTION_ROOT" ] || [ ! -d "$REMOTION_ROOT" ]; then
  cat <<EOF >&2
remotion-studio not found. Searched:
  \$REMOTION_STUDIO_DIR (unset)
  $CACHE_FILE (missing or stale)
  ~/Dev/ai-projects/remotion-studio
  ~/Dev/remotion-studio
  ~/projects/remotion-studio
  ~/code/remotion-studio
  ~/src/remotion-studio
  ~/remotion-studio

Fix (one of):
  git clone https://github.com/RonanCodes/remotion-studio.git ~/Dev/remotion-studio
  export REMOTION_STUDIO_DIR=/your/path/to/remotion-studio
  echo 'REMOTION_STUDIO_DIR=/your/path' > $CACHE_FILE
EOF
  exit 1
fi

# node_modules — warm the install once
[ -d "$REMOTION_ROOT/node_modules" ] || (cd "$REMOTION_ROOT" && pnpm install || npm install)

# ffmpeg for muxing (only if --voiceover)
[ -z "$VOICEOVER" ] || which ffmpeg >/dev/null || brew install ffmpeg
```

`REMOTION_STUDIO_DIR` env var short-circuits the lookup for CI, containers, or non-standard layouts. The cache file survives across skill invocations so the auto-detect only runs once per machine.

## Step 2: Resolve Vault + Topic

```bash
mapfile -t PAGES < <(.claude/skills/generate/lib/select-pages.sh "$VAULT_DIR" "$TOPIC")
HASH=$(.claude/skills/generate/lib/source-hash.sh "${PAGES[@]}")
```

## Step 3: Script the Scenes

The LLM reads selected pages and writes a `scenes.json` describing the video. Shape:

```json
{
  "title": "RAG vs Fine-Tuning",
  "subtitle": "When each pattern wins",
  "voiceover_script": "...full narration in spoken-word prose...",
  "scenes": [
    { "id": "intro",     "duration_s": 4, "props": { "headline": "RAG vs Fine-Tuning" } },
    { "id": "problem",   "duration_s": 6, "props": { "question": "Which should you pick when?" } },
    { "id": "side_by_side", "duration_s": 10, "props": {
        "left_name":  "RAG",        "left_bullets":  ["cheap updates", "no retraining"],
        "right_name": "Fine-tune",  "right_bullets": ["lower latency", "stylistic fidelity"]
    } },
    { "id": "verdict",   "duration_s": 5,  "props": { "verdict": "RAG for recall; fine-tune for voice" } },
    { "id": "sources",   "duration_s": 3,  "props": { "pages": ["wiki/concepts/rag.md", "..."] } }
  ]
}
```

## Step 4: Composition Picker

Remotion compositions currently available in `$REMOTION_ROOT/src/projects/llm-wiki/`:

| Composition id | Shape | Use when |
|---------------|-------|----------|
| `KineticPitch` | 32s typographic pitch | Topic summary with a strong hook |
| `PromoV10` | 56s long-form promo | Multi-concept walkthrough |
| `PromoV2..V9` | Variants (light/dark, screenshots, synth) | Style experiments — pick by taste |
| `AppDemo` | Screen-recording-style | Feature demos |
| `MarketingPromo` | Original marketing cut | Evergreen vault overview |
| `wiki-explainer` | *(to be added)* topic-overview template tuned for `/generate video` | Default for unknown topics |

Auto-pick rule:

- Topic contains `vs` / `versus` OR the LLM produces `side_by_side` scenes → **KineticPitch** (swap in a new comparison composition in a later iteration).
- Topic-as-feature-walkthrough → **AppDemo**.
- Otherwise → **wiki-explainer** (fallback: **PromoV10** until `wiki-explainer` lands).

`--composition <id>` overrides the auto-pick.

## Step 5: Render the Video

```bash
# scenes.json is the Remotion input props. Composition components should
# destructure from Remotion's getInputProps() or a wrapping <Composition
# defaultProps={...}/>. The wiki-explainer composition takes a scenes[]
# array and walks it.
PROPS_FILE="/tmp/generate-video-props-$$.json"
cp "$SCENES_JSON" "$PROPS_FILE"

SILENT_OUT="/tmp/generate-video-silent-$$.mp4"
(
  cd "$REMOTION_ROOT"
  npx remotion render "$COMPOSITION_ID" "$SILENT_OUT" --props="$PROPS_FILE"
)
```

Remotion's `--props` flag takes a JSON file path. The file stays on disk for debugging.

## Step 6: Voiceover (optional, if `--voiceover`)

Chain `generate-podcast` to produce the narration. We want the raw MP3, not the podcast artifact path:

```bash
# Invoke the sibling handler programmatically — same vault, same topic.
.claude/skills/generate-podcast/render.sh \
  --vault "$VAULT_NAME" \
  --topic "$TOPIC" \
  --length "${LENGTH:-medium}" \
  --script-from "$SCENES_JSON"        # pass scenes.voiceover_script as the pre-written script

VO_MP3="$VAULT_DIR/artifacts/podcast/<slug>-<date>.mp3"
```

*(If `render.sh` doesn't exist yet, the invoking LLM runs `/generate podcast` and captures the output MP3 path from the report — simpler, same effect.)*

Then mux:

```bash
FINAL_OUT="$VAULT_DIR/artifacts/video/<slug>-<date>.mp4"
ffmpeg -i "$SILENT_OUT" -i "$VO_MP3" \
  -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k -shortest \
  "$FINAL_OUT"
```

`-shortest` trims whichever stream finishes first. Match voiceover length to total composition duration at script-writing time — otherwise the video silently tails off or the narration gets clipped.

If `--voiceover` is not set, `mv "$SILENT_OUT" "$FINAL_OUT"`.

## Step 7: Version Detection

Before writing the sidecar, check for an existing artifact of the same type and topic:

```bash
ARTIFACT_TYPE="video"
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

## Step 8: Write the Sidecar

```bash
META="${FINAL_OUT%.mp4}.meta.yaml"
cat > "$META" <<EOF
generator: generate-video@0.1.0
generated-at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
composition: $COMPOSITION_ID
remotion-studio-commit: $(cd "$REMOTION_ROOT" && git rev-parse HEAD)
voiceover: ${VOICEOVER:-false}
length-target: ${LENGTH:-medium}
topic: "<raw topic argument>"
generated-from:
$(for p in "${PAGES[@]}"; do echo "  - $p"; done)
scenes-json: $(basename "$SCENES_JSON")
source-hash: $HASH
version: $VERSION
change-note: "<brief description of what changed, or 'Initial version' for v1>"
replaces: "$PREV_SLUG"
EOF
```

Pinning the `remotion-studio-commit` is essential for re-renderability — composition props can drift between commits.

## Step 9: Commit to Vault Repo

```bash
cd "$VAULT_DIR"
cp "$SCENES_JSON" "artifacts/video/<slug>-<date>.scenes.json"
git add "artifacts/video/<slug>-<date>."{mp4,scenes.json,meta.yaml} 2>/dev/null
git diff --cached --quiet || git commit -m "🎬 video: generate <topic> ($(date +%Y-%m-%d))"
```

Keep `scenes.json` alongside — it's the re-renderable source, like `.script.md` for podcasts and `.outline.md` for mindmaps.

## Step 10: Report to User

```
✅ Video generated
   Topic:       <topic>
   Composition: <id>
   Remotion at: <remotion-studio commit short-sha>
   Voiceover:   <yes|no>
   Pages in:    <N>
   Source hash: <first 12 chars>
   Scenes:      vaults/<vault>/artifacts/video/<slug>-<date>.scenes.json
   MP4:         vaults/<vault>/artifacts/video/<slug>-<date>.mp4
   Sidecar:     vaults/<vault>/artifacts/video/<slug>-<date>.meta.yaml
   Play:        open <absolute path>
```

## Authoring New Compositions

Add to `$REMOTION_ROOT/src/projects/llm-wiki/` (wherever remotion-studio is on this machine — see Step 1):

1. Create `YourComposition.tsx`. Destructure props from the component signature — these match scene props in `scenes.json`.
2. Register in `src/Root.tsx`:
   ```tsx
   <Composition
     id="YourComposition"
     component={YourComposition}
     durationInFrames={<N * 30>}  // N seconds at 30fps
     fps={30}
     width={1920}
     height={1080}
     defaultProps={{ /* sensible demo defaults */ }}
   />
   ```
3. Update the "Composition id" table in this SKILL.md.
4. Use the Observatory palette (amber, cyan, green on dark bg) for brand consistency.

Hot-reload via `npx remotion preview` from `$REMOTION_ROOT`.

## Known Limitations (Phase 2C)

- **No `wiki-explainer` template shipped yet.** Auto-pick falls through to `PromoV10` until it lands.
- **Render time**: 56s of 1080p Remotion typically takes 2–4 minutes on an M-series Mac. Document the wait before kicking off.
- **Voiceover sync** is open-loop — the script duration has to match composition duration manually. Phase 2E introduces a duration check.
- **Composition drift**: pinning `remotion-studio-commit` in the sidecar is the only defence. Treat `git log` of that repo as part of the artifact's provenance.

## See Also

- `.claude/skills/generate/SKILL.md` — router.
- `.claude/skills/generate-podcast/SKILL.md` — voiceover source.
- `.claude/skills/generate/lib/select-pages.sh` — shared topic resolution.
- `$REMOTION_ROOT/README.md` — upstream Remotion studio (path resolved by Step 1).
- `sites/docs/src/content/docs/reference/artifacts.md` — sidecar schema.
