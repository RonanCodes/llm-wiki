---
name: ingest-youtube
description: Extract transcript from YouTube videos for wiki ingestion. Lazy-installs yt-dlp on first use.
user-invocable: false
allowed-tools: Bash(which *) Bash(brew *) Bash(yt-dlp *) Bash(sed *) Bash(awk *) Read
---

# Ingest YouTube Video

Extract auto-generated or manual subtitles from a YouTube video.

## Dependency Check

```bash
which yt-dlp >/dev/null 2>&1 || {
  echo "Installing yt-dlp for YouTube transcript support..."
  brew install yt-dlp
}
```

## Extraction Method

1. Extract video metadata:
```bash
yt-dlp --dump-json --skip-download "<url>" 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
print(f'Title: {data.get(\"title\", \"Unknown\")}')
print(f'Channel: {data.get(\"channel\", \"Unknown\")}')
print(f'Upload Date: {data.get(\"upload_date\", \"Unknown\")}')
print(f'Duration: {data.get(\"duration_string\", \"Unknown\")}')
print(f'Description: {data.get(\"description\", \"\")[:500]}')
"
```

2. Download subtitles:
```bash
VIDEO_ID="<extracted-id>"
yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format srt \
  -o "/tmp/yt-ingest-${VIDEO_ID}" "<url>"
```

3. Clean SRT to readable text:
```bash
sed '/^[0-9]*$/d; /^$/d; /-->/d' "/tmp/yt-ingest-${VIDEO_ID}.en.srt" \
  | awk '!seen[$0]++' \
  > "/tmp/yt-ingest-${VIDEO_ID}.txt"
```

4. Read the cleaned transcript and pass to ingest router.

## Post-Extraction

- Save transcript to vault's `raw/<video-slug>-transcript.md` with YAML header:
```yaml
---
source-url: <youtube-url>
title: <video-title>
author: <channel-name>
date-fetched: <today>
source-type: video
---
```
- Set `source-type: video` in the source-note frontmatter
- Note in source-note that this is from auto-generated subtitles (may have transcription errors)

## Fallback

If no English subtitles available, try: `--sub-lang en,en-US,en-GB`
If still none, list available: `yt-dlp --list-subs --skip-download "<url>"`
