---
title: "Golden Corpus — Index"
date-created: 2026-04-18
date-modified: 2026-04-18
page-type: summary
domain:
  - llm-wiki
  - golden-corpus
tags:
  - corpus
  - index
  - testing
sources:
  - raw/golden-corpus-seed.md
related:
  - "[[attention-mechanism]]"
  - "[[retrieval-augmented-generation]]"
  - "[[context-window]]"
  - "[[transformer]]"
---

# Golden Corpus Index

Four concept/entity pages selected to exercise the full `/generate` surface without drifting over time.

## Concepts

- [[attention-mechanism]] — the core operation behind transformers
- [[retrieval-augmented-generation]] — grounding LLM output in retrieved context
- [[context-window]] — the fixed-size input buffer every model operates over

## Entities

- [[transformer]] — the architecture that ties attention and context window together

## Graph

All four pages cross-link into a connected subgraph:

- `attention-mechanism` ↔ `transformer` (attention is the transformer's core)
- `retrieval-augmented-generation` ↔ `context-window` (RAG exists because windows are finite)
- `transformer` ↔ `context-window` (windows are a transformer property)
- `transformer` ↔ `retrieval-augmented-generation` (RAG feeds into a transformer)

## Sources

This corpus was written from scratch as test fixtures — no external raw sources.
