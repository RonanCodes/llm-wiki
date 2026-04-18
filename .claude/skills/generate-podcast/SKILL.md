---
name: generate-podcast
description: Render a spoken-word MP3 podcast from wiki pages — single-host by default or two-voice dialogue. Piper TTS default (local, free); falls back to ElevenLabs / OpenAI TTS when their API keys are present. Used by /generate podcast. Not user-invocable directly — go through /generate.
user-invocable: false
allowed-tools: Bash(which *) Bash(brew *) Bash(git *) Bash(mkdir *) Bash(date *) Bash(cat *) Bash(sed *) Bash(grep *) Bash(awk *) Bash(ffmpeg *) Bash(piper *) Bash(curl *) Bash(npm *) Bash(pnpm *) Bash(npx *) Read Write Glob Grep
---

# Generate Podcast

Produce a 3–10 minute MP3 explainer from wiki pages. The LLM writes a spoken-word narrative, TTS renders each line, ffmpeg concatenates into a single MP3.

Artifact-first — output lands in `vaults/<vault>/artifacts/podcast/`.

## Usage (via /generate router)

```
/generate podcast <topic> [--vault <name>] [--length short|medium|long] [--two-voice] [--voice <name>]
```

- `--length` — `short` (~3 min), `medium` (~6 min, default), `long` (~10 min).
- `--two-voice` — dialogue between two hosts instead of a monologue.
- `--voice` — override the default Piper voice. Ignored when the ElevenLabs / OpenAI fallback kicks in.

Same topic resolution as sibling handlers — reuses `.claude/skills/generate/lib/select-pages.sh`.

## Pipeline

```
wiki pages  →  LLM script writer  →  script.md  →  TTS per line  →  ffmpeg concat  →  podcast.mp3
```

Keep the `.script.md` alongside the MP3 — it's diffable, re-renderable, and the honest primary artifact.

## Step 1: Dependency Check

```bash
HAS_FFMPEG=0; HAS_PIPER=0
which ffmpeg >/dev/null 2>&1 && HAS_FFMPEG=1
which piper  >/dev/null 2>&1 && HAS_PIPER=1

if [ "$HAS_FFMPEG" = "0" ]; then
  echo "ffmpeg missing. Installing via Homebrew…"
  brew install ffmpeg
fi

# Piper is optional if ELEVENLABS_API_KEY or OPENAI_API_KEY is set.
if [ "$HAS_PIPER" = "0" ] && [ -z "$ELEVENLABS_API_KEY" ] && [ -z "$OPENAI_API_KEY" ]; then
  echo "Piper not found and no cloud TTS key present."
  echo "Installing Piper (local, free, robotic-but-serviceable)…"
  brew install piper-tts 2>/dev/null || {
    echo "Homebrew install failed. See https://github.com/rhasspy/piper for manual install."
    exit 1
  }
fi
```

## Step 2: Resolve Vault + Topic

```bash
mapfile -t PAGES < <(.claude/skills/generate/lib/select-pages.sh "$VAULT_DIR" "$TOPIC")
```

Exit 1 from the helper = no pages matched; surface verbatim.

## Step 3: Compute Source Hash

```bash
HASH=$(.claude/skills/generate/lib/source-hash.sh "${PAGES[@]}")
```

## Step 4: Write the Script

The invoking LLM reads the selected pages and writes a narrative **script.md**. Two shapes supported:

### Single-host monologue (default)

```md
# Podcast: {{topic}}

_Length target: {{length}} (~{{minutes}} min)._

[HOST]: Welcome. Today we're talking about {{topic}}. Here's why that matters…
[HOST]: First, the basics. According to {{cite: wiki/concepts/attention.md}}, attention is…
[HOST]: …
```

### Two-voice dialogue (`--two-voice`)

```md
# Podcast: {{topic}}

[A]: Alright, let's get into {{topic}}.
[B]: Why this, why now?
[A]: Because {{cite: wiki/concepts/rag.md}}…
[B]: Huh. I thought…
[A]: Right, but here's the nuance…
```

**Script-writing rules the LLM follows:**

- Spoken-word, not read-aloud-bullets. Full sentences with natural cadence.
- Cite wiki pages inline with `{{cite: path}}` — preprocessed to `*pagename*` before TTS sees them.
- Length target: ~150 words per minute. 3 min → ~450 words; 6 min → ~900; 10 min → ~1500.
- No "as we mentioned earlier" crutch unless the script actually mentioned it.
- End with a short sources spoken-list — TTS handles it fine.

Templates live at `.claude/skills/generate-podcast/templates/{single-host,two-voice}.md` and give the LLM a starting shape.

## Step 5: TTS Backend Selection

Priority order:

| Priority | Backend | Trigger | Cost | Quality |
|---------:|---------|---------|------|---------|
| 1 | ElevenLabs | `ELEVENLABS_API_KEY` set | ~$0.30 per 1k chars | Studio-grade |
| 2 | OpenAI TTS | `OPENAI_API_KEY` set | ~$0.015 per 1k chars | Very good |
| 3 | Piper (local) | always available once installed | free | Robotic but clean |

```bash
if [ -n "$ELEVENLABS_API_KEY" ]; then
  TTS_BACKEND="elevenlabs"
elif [ -n "$OPENAI_API_KEY" ]; then
  TTS_BACKEND="openai"
else
  TTS_BACKEND="piper"
fi
```

### Voice selection

- **Piper**: uses `en_US-lessac-medium` for [HOST] / [A]; `en_GB-alan-medium` for [B]. Override with `--voice <model>`.
- **OpenAI**: `alloy` for HOST/A, `onyx` for B.
- **ElevenLabs**: premade voices only — free-tier API blocks library voices (Rachel/Adam) with HTTP 402. Default: `Alice` (voice id `Xb7hH8MSUJpSbSDYk0k2`) for HOST/A, `Eric` (voice id `cjVigY5qzO86Huf0OWal`) for B. Other safe premade options: `Sarah`, `Brian`, `Bill`. Override with `ELEVENLABS_VOICE_A` / `ELEVENLABS_VOICE_B` env vars (pass voice IDs, not names).

## Step 6: Render Each Line

Walk the script, split by `[HOST]` / `[A]` / `[B]` tags. For each line:

```bash
# Piper example
echo "$LINE_TEXT" | piper \
  --model "$VOICE_MODEL" \
  --output_file "/tmp/podcast_${i}.wav"
```

Replace `{{cite: path}}` with the page's title (or filename stem) before TTS — the listener hears "as *attention* explains", not the raw path.

Short 250ms silence between lines. Longer 600ms silence when speaker changes in two-voice mode.

## Step 7: Concatenate with ffmpeg

```bash
# build a concat list
for w in /tmp/podcast_*.wav; do echo "file '$w'" >> /tmp/podcast_list.txt; done

# render MP3
ffmpeg -f concat -safe 0 -i /tmp/podcast_list.txt \
  -codec:a libmp3lame -qscale:a 2 \
  "$VAULT_DIR/artifacts/podcast/<slug>-<date>.mp3"
```

VBR q2 is the right quality for voice — bigger files aren't audibly better, smaller noticeably worse.

## Step 8: Version Detection

Before writing the sidecar, check for an existing artifact of the same type and topic:

```bash
ARTIFACT_TYPE="podcast"
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

## Step 9: Write the Sidecar

```bash
META="${MP3_OUT%.mp3}.meta.yaml"
cat > "$META" <<EOF
generator: generate-podcast@0.1.0
generated-at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
tts-backend: $TTS_BACKEND
voice: $VOICE_MODEL
format: $([ -n "$TWO_VOICE" ] && echo "two-voice" || echo "single-host")
length-target: $LENGTH
topic: "<raw topic argument>"
generated-from:
$(for p in "${PAGES[@]}"; do echo "  - $p"; done)
source-hash: $HASH
version: $VERSION
change-note: "<brief description of what changed, or 'Initial version' for v1>"
replaces: "$PREV_SLUG"
EOF
```

## Step 10: Commit to Vault Repo

```bash
cd "$VAULT_DIR"
git add "artifacts/podcast/<slug>-<date>."{mp3,script.md,meta.yaml} 2>/dev/null
git diff --cached --quiet || git commit -m "🎙 podcast: generate <topic> ($(date +%Y-%m-%d))"
```

## Step 11: Report to User

```
✅ Podcast generated
   Topic:       <topic>
   Format:      <single-host|two-voice>
   TTS:         <piper|openai|elevenlabs>
   Length:      <short|medium|long>  (~<N> min)
   Pages in:    <N>
   Source hash: <first 12 chars>
   Script:      vaults/<vault>/artifacts/podcast/<slug>-<date>.script.md
   MP3:         vaults/<vault>/artifacts/podcast/<slug>-<date>.mp3
   Sidecar:     vaults/<vault>/artifacts/podcast/<slug>-<date>.meta.yaml
   Listen:      open <absolute path>
```

## Known Limitations (Phase 2C)

- **Piper voices sound robotic.** Great for draft listens; less great for sharing. Users with API keys get automatic upgrade to OpenAI / ElevenLabs.
- **No music / intro stingers.** Pure voice. Phase 2C scope.
- **No chaptering.** ID3 chapters would be nice. Deferred.
- **Cost warning** — for long podcasts with ElevenLabs, print the projected cost **before** rendering and ask for confirmation.

## See Also

- `.claude/skills/generate/SKILL.md` — router that dispatches here.
- `.claude/skills/generate/lib/select-pages.sh` — shared topic resolution.
- `.claude/skills/generate-video/SKILL.md` — chains this handler for voiceover.
- `sites/docs/src/content/docs/reference/artifacts.md` — sidecar schema.
