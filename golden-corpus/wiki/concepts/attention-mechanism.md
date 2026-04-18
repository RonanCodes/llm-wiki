---
title: "Attention Mechanism"
date-created: 2026-04-18
date-modified: 2026-04-18
page-type: concept
domain:
  - llm-wiki
  - golden-corpus
tags:
  - attention
  - transformer
  - neural-networks
  - sequence-modeling
sources:
  - raw/golden-corpus-seed.md
related:
  - "[[transformer]]"
  - "[[context-window]]"
---

# Attention Mechanism

Attention is the operation that lets a model weigh every input token against every other input token when producing an output. Instead of compressing a sequence into a fixed hidden state (as RNNs do), an attention layer looks at the whole sequence at once and decides, per-position, which other positions matter.

## Scaled dot-product attention

Given query, key, and value matrices (`Q`, `K`, `V`), a single attention head computes:

```
softmax(Q · Kᵀ / √d_k) · V
```

The softmax turns similarity scores into a probability distribution; the matrix multiply with `V` produces a weighted mixture of value vectors. Every output token is a re-mix of every input token.

## Why it replaced recurrence

Recurrent networks processed tokens sequentially, which made them slow and prone to vanishing gradients on long inputs. Attention is parallel — every position computes its output independently — so it trains orders of magnitude faster on modern hardware. It also produces **direct** dependencies between distant tokens rather than forcing signal through a chain of hidden states.

## Cost

Attention is quadratic in sequence length: an `N`-token input requires `N²` similarity scores. This is why context windows are a limited resource (see [[context-window]]) and why every [[transformer]] architecture has a scaling story around attention — sparse patterns, linear approximations, or chunked re-computation.

## Sources

Fixture page for the golden corpus. See `golden-corpus/README.md`.
