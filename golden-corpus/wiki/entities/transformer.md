---
title: "Transformer"
date-created: 2026-04-18
date-modified: 2026-04-18
page-type: entity
entity-type: architecture
domain:
  - llm-wiki
  - golden-corpus
tags:
  - transformer
  - neural-network
  - architecture
  - attention
sources:
  - raw/golden-corpus-seed.md
related:
  - "[[attention-mechanism]]"
  - "[[context-window]]"
  - "[[retrieval-augmented-generation]]"
---

# Transformer

The Transformer is the neural-network architecture introduced in "Attention Is All You Need" (Vaswani et al., 2017). It replaced recurrence with stacked self-attention layers and became the dominant architecture for language, code, audio, and increasingly vision.

## Shape

A Transformer is a stack of N identical blocks. Each block contains:

1. **Multi-head self-attention** — the [[attention-mechanism]] run in parallel across multiple subspaces, outputs concatenated.
2. **Feed-forward network** — a position-wise MLP, usually with a hidden dimension 4× the model dimension.
3. **Residual connections** around each sublayer, plus layer normalisation.

Inputs are token embeddings plus positional encodings. Outputs are either a probability distribution over the next token (decoder-only, like GPT) or a rich representation per input position (encoder-only, like BERT), or both (encoder-decoder, like T5).

## Why it won

Three reasons:

- **Parallelism.** Every position computes independently, so training scales with GPU count. Recurrent networks couldn't.
- **Depth.** Residual connections let the stack grow to 100+ layers without gradient collapse.
- **Uniformity.** The same block shape handles any sequence task — language, code, music, protein structures. No task-specific wiring.

## What it's bounded by

The [[context-window]] is the fundamental constraint — attention's quadratic cost is what caps how much input a Transformer can see at once. Practical systems work around this with [[retrieval-augmented-generation]], hierarchical summarisation, or efficient-attention variants (sparse, linear, sliding-window).

## Sources

Fixture entity page for the golden corpus. See `golden-corpus/README.md`.
