---
title: "Ralph Wiggum Technique"
description: "The autonomous AI coding loop: what it is, how it works, Matt Pocock's workflow."
---

The Ralph Loop (aka Ralph Wiggum technique) is an autonomous AI coding pattern used to build LLM Wiki. Named after Ralph Wiggum from The Simpsons -- lovable but forgetful, which mirrors how AI agents behave without persistent memory.

## The Core Concept

```bash
while :; do cat PROMPT.md | claude-code ; done
```

A bash loop that repeatedly spawns fresh AI agent instances. Each iteration gets a clean context window. Memory persists only through files on disk -- git history, progress files, PRD documents.

## Origins

| Who | Role |
|-----|------|
| **Geoffrey Huntley** | Created the pattern (~May 2025). "Sit on the loop, not in it." |
| **Matt Pocock** | Popularized it (Dec 2025). 11 tips, skills repo, Sandcastle library. |
| **Ryan Carson** (Snarktank) | Built the most starred implementation (15,861 stars). Runs 3 parallel instances. |

## How It Works

### Phase 1: Define Requirements
Human + LLM produce a PRD (Product Requirements Document). Break work into user stories, each small enough for one context window.

### Phase 2: The Ralph Loop
Each iteration:

1. **Read** `prd.json` and `progress.txt`
2. **Pick** highest priority incomplete story
3. **Implement** the story
4. **Validate** (typecheck, lint, test -- "backpressure")
5. **Commit** with passing checks
6. **Update** `prd.json` (mark `passes: true`) and append learnings to `progress.txt`
7. **Context cleared** -- next iteration starts fresh

### Key Files

| File | Purpose |
|------|---------|
| `prd.json` | User stories with `passes: true/false` status |
| `progress.txt` | Append-only learnings for future iterations |
| `CLAUDE.md` | Prompt fed to agent each iteration |

## Matt Pocock's Workflow

```
Idea -> /write-a-prd -> PRD -> /prd-to-issues -> Ralph Loop -> Manual QA
```

### His Key Tips

1. Start hands-on, then go AFK -- watch Ralph before letting it run unsupervised
2. Define scope as end state, not implementation steps
3. Use feedback loops -- types, tests, linting must pass ("backpressure")
4. Take small steps -- each PRD item fits in one context window
5. Prioritize risky tasks first -- architecture before UI polish
6. Explicitly define quality expectations -- "Agents amplify what they see"
7. Tune it like a guitar -- observe failures, add guardrails reactively

## Key Resources

### Articles
- [Geoffrey Huntley: ghuntley.com/ralph/](https://ghuntley.com/ralph/)
- [Matt Pocock: aihero.dev/tips-for-ai-coding-with-ralph-wiggum](https://aihero.dev/tips-for-ai-coding-with-ralph-wiggum)

### Repos
- [snarktank/ralph](https://github.com/snarktank/ralph) (15,861 stars)
- [mattpocock/skills](https://github.com/mattpocock/skills) (write-a-prd, grill-me, tdd)

### Videos
- Matt Pocock overview: youtube.com/watch?v=_IK18goX4X8
- Geoffrey Huntley deep dive: youtube.com/watch?v=SB6cO97tfiY

## Relevance to LLM Wiki

The Ralph Loop is used in two ways:
1. **Build methodology** -- LLM Wiki itself was built using Ralph loops (`/ralph` skill, `prd.json`, `progress.txt`)
2. **Wiki operations** -- ingest/lint could run as a Ralph-style loop: process sources one at a time, each in a fresh context, progress tracked in `log.md`
