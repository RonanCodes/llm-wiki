---
title: "Retrieval-Augmented Generation"
date-created: 2026-04-18
date-modified: 2026-04-18
page-type: concept
domain:
  - llm-wiki
  - golden-corpus
tags:
  - rag
  - retrieval
  - grounding
  - information-retrieval
sources:
  - raw/golden-corpus-seed.md
related:
  - "[[context-window]]"
  - "[[transformer]]"
---

# Retrieval-Augmented Generation

Retrieval-augmented generation (RAG) pairs a [[transformer]]-based language model with an external retriever. At query time the retriever fetches relevant documents from a corpus; those documents are concatenated into the model's prompt alongside the user's question. The model answers conditioned on both.

## Why it exists

LLMs memorise what's in their training set and nothing newer. Fine-tuning to add knowledge is slow, expensive, and degrades other capabilities. RAG sidesteps the problem: keep the model fixed, change the documents. New information flows in by updating the corpus.

It also works around the [[context-window]] limit — rather than trying to fit the whole corpus in the prompt, retrieve only the top-k relevant chunks per query.

## Typical pipeline

1. **Index** — split the corpus into chunks, embed each chunk with a dense retriever, store vectors in an index.
2. **Retrieve** — at query time, embed the user's question, pull the nearest-neighbour chunks.
3. **Generate** — prepend the retrieved chunks to the prompt, let the LLM answer.

## Failure modes

RAG is lossy. Retrieval can miss the right chunk; chunking can split the right fact across two chunks that don't both surface; the LLM can still hallucinate despite grounded context. Evaluating a RAG pipeline means measuring retrieval precision/recall **and** answer faithfulness — one without the other hides regressions.

## Sources

Fixture page for the golden corpus. See `golden-corpus/README.md`.
