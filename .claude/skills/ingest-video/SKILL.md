---
name: ingest-video
description: Ingest local video files (meetings, screen recordings, presentations). Transcribes audio, extracts keyframes, creates structured wiki pages.
user-invocable: false
allowed-tools: Bash(*) Read Write Edit Glob Grep
content-pipeline:
  - pipeline:input
  - platform:agnostic
  - role:primitive
---

# Ingest Local Video

Transcribe local video files and create wiki pages with keyframe screenshots.

## Dependency: FFmpeg (lazy-install)
```bash
which ffmpeg >/dev/null 2>&1 || brew install ffmpeg
```

## Step 1: Extract Audio
```bash
ffmpeg -i "$VIDEO_PATH" -vn -acodec pcm_s16le -ar 16000 -ac 1 /tmp/llm-wiki-audio.wav
```

## Step 2: Transcribe (use first available provider)

**Tier 1 — Local Whisper** (free, no key):
```bash
# Try whisper-cpp first, then python whisper
whisper-cpp -m /usr/local/share/whisper-cpp/models/ggml-base.en.bin \
  -f /tmp/llm-wiki-audio.wav --output-format txt -of /tmp/llm-wiki-transcript
# OR: whisper /tmp/llm-wiki-audio.wav --model base.en --output_format txt --output_dir /tmp
```

**Tier 2 — OpenAI Whisper API** ($0.006/min, needs `OPENAI_API_KEY` in env or `.env`):
```bash
curl -s https://api.openai.com/v1/audio/transcriptions \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -F file=@/tmp/llm-wiki-audio.wav -F model=whisper-1 -F response_format=text
```

**Tier 3 — AssemblyAI** ($0.01/min, has speaker diarization, needs `ASSEMBLYAI_API_KEY`):
Upload file to `/v2/upload`, POST to `/v2/transcript` with `speaker_labels: true`, poll until `status: completed`. Returns `utterances` with speaker labels.

**No provider?** Tell user to install whisper-cpp (`brew install whisper-cpp`) or set an API key. Stop.

## Step 3: Extract Keyframes
```bash
mkdir -p "$VAULT/raw/assets"
ffmpeg -i "$VIDEO_PATH" -vf "select=gt(scene\,0.3),scale=1280:-1" \
  -vsync vfr "$VAULT/raw/assets/${VIDEO_SLUG}-frame-%03d.png"
```
If fewer than 3 frames, fall back to I-frame extraction (`select=eq(ptype\,I)`). Cap at 20 keyframes.

## Step 4: Save Raw Transcript

Save to `$VAULT/raw/<video-slug>-transcript.md`:
```yaml
---
source-url: "file://<absolute-path>"
title: "<video-filename>"
date-fetched: <today>
source-type: video
transcription-provider: <whisper-cpp|openai|assemblyai>
has-diarization: <true|false>
keyframes: <count>
---
```
Include full transcript below frontmatter. With diarization, format as `Speaker A: ...`.

## Step 5: Create Wiki Source Note

Create `$VAULT/wiki/sources/<video-title>.md` with sections:
- **Frontmatter:** title, date-created/modified, page-type: source-note, domain, tags: [video, ...], sources, source-type: video, raw-file
- **Overview** — 2-3 sentence summary
- **Attendees** — speaker list if diarization available
- **Key Decisions** — extracted from transcript
- **Action Items** — tasks, follow-ups, deadlines
- **Key Takeaways** — 3-5 main points
- **Screenshots** — embedded keyframe images: `![Frame 1](../raw/assets/<slug>-frame-001.png)`
- **Full Transcript** — wrapped in `<details><summary>` for collapsibility
- **Sources** — link to original file

## Post-Extraction Report

Tell the user which provider was used, keyframe count, diarization availability, and content summary.

## Dependencies

- **FFmpeg** — audio extraction + keyframes (lazy-installed)
- **One of:** whisper-cpp, whisper, OpenAI API key, or AssemblyAI API key
