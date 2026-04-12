---
title: "Vision"
description: "Why LLM Wiki exists and what makes it different."
---

## The Problem

Most people's experience with LLMs and documents is stateless. RAG systems re-derive knowledge from scratch on every query. Ask a subtle question that requires synthesizing five documents, and the LLM has to find and piece together the relevant fragments every time. Nothing compounds.

## The Solution

Instead of retrieving from raw documents at query time, the LLM **incrementally builds and maintains a persistent wiki** — a structured, interlinked collection of markdown files. When you add a new source, the LLM reads it, extracts key information, and integrates it into the existing wiki — updating entity pages, revising summaries, noting contradictions.

**The wiki is a persistent, compounding artifact.** Cross-references are already there. Contradictions have been flagged. Synthesis reflects everything you've read. It gets richer with every source and every question.

You never write the wiki yourself — the LLM writes and maintains all of it. You curate sources, explore, and ask the right questions.

## Why This Works

The tedious part of maintaining a knowledge base is the bookkeeping — cross-references, summaries, consistency. Humans abandon wikis because maintenance grows faster than value. LLMs don't get bored and can touch 15 files in one pass. Maintenance cost drops to near zero.

## Use Cases

- **Personal** — goals, health, journal, self-improvement
- **Research** — deep-dive on a topic over weeks/months
- **Reading a book** — characters, themes, plot threads
- **Business/team** — internal wiki fed by Slack threads, meeting transcripts
- **Cross-project knowledge** — tech patterns, strategy playbooks that carry forward

## What Makes LLM Wiki Different

1. **Multi-vault with cross-pollination** — multiple vaults with promote/reference flow for knowledge transfer
2. **One engine, many vaults** — Claude Code skills are the centralized engine, vaults are just data
3. **Open source** — clone it, use it, contribute to it
4. **Lazy dependencies** — tools install themselves on first use

## Inspiration

- [Karpathy's LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) — the original idea file
- [Karpathy's viral tweet](https://x.com/karpathy/status/2039805659525644595) — 55K likes
- Vannevar Bush's Memex (1945) — private, curated knowledge store with associative trails
