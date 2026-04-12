---
name: yt-transcript
description: Extract transcript from a YouTube video as clean readable text. Use when user shares a youtube.com or youtu.be link and wants the transcript, content summary, or to read what was said.
argument-hint: <youtube-url>
disable-model-invocation: true
allowed-tools: Bash(yt-dlp *) Bash(cat *) Bash(sed *) Read
---

# YouTube Transcript Extractor

Extract auto-generated or manual subtitles from YouTube videos as clean text.

## Usage

```
/yt-transcript https://www.youtube.com/watch?v=abc123
```

## Steps

1. Extract video ID from `$ARGUMENTS`:
   - `youtube.com/watch?v={id}`, `youtu.be/{id}`, `youtube.com/live/{id}`

2. Download subtitles with yt-dlp:

```bash
yt-dlp --write-auto-sub --sub-lang en --skip-download --sub-format srt \
  -o '/tmp/yt-transcript-{id}' '$ARGUMENTS'
```

3. Clean the SRT into readable text:

```bash
sed '/^[0-9]*$/d; /^$/d; /-->/d' '/tmp/yt-transcript-{id}.en.srt' \
  | awk '!seen[$0]++' \
  > '/tmp/yt-transcript-{id}.txt'
```

4. Read and display the cleaned transcript.

5. If the user wants a summary, provide one. Otherwise display the full transcript.

## Troubleshooting

- **No subtitles available**: Some videos have no auto-generated or manual captions. Try `--sub-lang en,en-US` or list available: `yt-dlp --list-subs --skip-download {url}`
- **yt-dlp version warnings**: Ignore version warnings, subtitles still download
- **JS challenge errors**: These affect video download, not subtitle extraction — subtitles still work

## Notes

- yt-dlp is required (`brew install yt-dlp` or `pip install yt-dlp`)
- Auto-generated subtitles have no punctuation — the transcript will be rough but readable
- For videos without English subs, try other language codes
