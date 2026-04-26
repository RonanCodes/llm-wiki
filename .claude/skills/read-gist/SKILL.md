---
name: read-gist
description: Read raw content of a GitHub gist from a URL or gist ID. Use when user shares a gist.github.com link, asks to read a gist, or references a gist ID.
argument-hint: <gist-url-or-id>
---

# Read Gist

Fetch and display raw content of a GitHub gist.

## Usage

```
/read-gist https://gist.github.com/user/abc123def456
/read-gist abc123def456
```

## Steps

1. Extract gist ID and username from `$ARGUMENTS`:
   - Full URL: `https://gist.github.com/{user}/{id}` -> extract both
   - Bare ID: 32-char hex string, use directly

2. Fetch via raw URL (most reliable, bypasses API rate limits and 502s):

```bash
curl -sL "https://gist.githubusercontent.com/{user}/{id}/raw/"
```

3. If username unknown, get it via API first:

```bash
gh api "/gists/{id}" --jq '.owner.login'
```

4. Display the full raw content.

## Multi-file Gists

If gist has multiple files, list them first then show each:

```bash
gh gist view {id} --files
```

## Fallback Chain

1. Raw URL (`gist.githubusercontent.com`) — best, no API needed
2. `gh gist view {id} --raw` — uses gh CLI auth
3. `gh api "/gists/{id}" --jq '.files | to_entries[] | .value.content'` — structured JSON
