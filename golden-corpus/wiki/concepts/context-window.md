---
title: "Context Window"
date-created: 2026-04-18
date-modified: 2026-04-18
page-type: concept
domain:
  - llm-wiki
  - golden-corpus
tags:
  - context
  - prompt-engineering
  - scaling
  - transformer
sources:
  - raw/golden-corpus-seed.md
related:
  - "[[transformer]]"
  - "[[attention-mechanism]]"
  - "[[retrieval-augmented-generation]]"
---

# Context Window

The **context window** is the maximum number of tokens a language model can read in one pass — the fixed-size buffer that holds the prompt plus whatever output has been generated so far. Every token you add consumes one slot; once the buffer is full, older tokens fall off or the request fails.

## Where the limit comes from

It's a direct consequence of the [[attention-mechanism]]. Attention is O(N²) in sequence length, so doubling the window quadruples the compute and memory cost. Every [[transformer]] model is trained at a specific window size (2k, 8k, 32k, 128k, 1M …); extending that at inference requires either re-training, positional-encoding tricks, or sliding-window attention patterns.

## Why it matters in practice

Three capabilities depend on it:

- **Long-document question answering** — can the whole source fit? If not, you need [[retrieval-augmented-generation]] or chunking.
- **Multi-turn conversation** — each turn accumulates; at some point the system must forget or summarise earlier turns.
- **Tool use and agent loops** — tool call results return to the window as tokens; verbose tools burn it fast.

## The trade-off

Bigger windows reduce the need for external retrieval but cost more per request (linear-in-tokens at minimum, quadratic at the attention stage). There's no universally correct size — it depends on the task. Retrieval plus a modest window often beats a huge window for accuracy, because retrieval surfaces the *right* tokens rather than *all* of them.

## Sources

Fixture page for the golden corpus. See `golden-corpus/README.md`.
