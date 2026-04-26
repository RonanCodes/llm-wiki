---
name: read-tweet
description: Read full text of an X/Twitter post from a URL. Use when user shares an x.com or twitter.com link, asks to read a tweet, or needs tweet content extracted.
argument-hint: <tweet-url>
---

# Read Tweet

Fetch and display the full text of an X/Twitter post. No auth required.

## Usage

```
/read-tweet https://x.com/username/status/1234567890
```

## Steps

1. Extract username and tweet ID from `$ARGUMENTS`:
   - Pattern: `https://x.com/{user}/status/{id}` or `https://twitter.com/{user}/status/{id}`
   - Strip query params (`?s=46`, `?t=...`)

2. Fetch via FXTwitter API (returns full text, including long "note tweets"):

```bash
curl -s "https://api.fxtwitter.com/{user}/status/{id}"
```

3. Parse the JSON and display:
   - **Author**: `tweet.author.name` (@`tweet.author.screen_name`)
   - **Date**: `tweet.created_at`
   - **Text**: `tweet.text` (NOT `raw_text` which has t.co URLs)
   - **Engagement**: `tweet.likes`, `tweet.retweets`, `tweet.replies`
   - **Quoted tweet**: if `tweet.quote` exists, show its text too
   - **Media**: list image/video URLs if present

4. Format as clean markdown.

## Fallback

If FXTwitter fails, use oEmbed (truncates long tweets but very reliable):

```bash
curl -s "https://publish.x.com/oembed?url={original-url}"
```
