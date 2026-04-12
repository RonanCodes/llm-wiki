# Vision

## The Problem

Most people's experience with LLMs and documents is stateless. RAG systems re-derive knowledge from scratch on every query. Ask a subtle question that requires synthesizing five documents, and the LLM has to find and piece together the relevant fragments every time. Nothing compounds. NotebookLM, ChatGPT file uploads, and most RAG systems work this way.

## The Solution

Instead of retrieving from raw documents at query time, the LLM **incrementally builds and maintains a persistent wiki** — a structured, interlinked collection of markdown files. When you add a new source, the LLM reads it, extracts key information, and integrates it into the existing wiki — updating entity pages, revising topic summaries, noting contradictions, strengthening the synthesis.

**The wiki is a persistent, compounding artifact.** Cross-references are already there. Contradictions have been flagged. Synthesis reflects everything you've read. It gets richer with every source you add and every question you ask.

You never write the wiki yourself — the LLM writes and maintains all of it. You curate sources, explore, and ask the right questions. The LLM does the grunt work — summarizing, cross-referencing, filing, and bookkeeping.

## Why This Works

The tedious part of maintaining a knowledge base is not the reading or thinking — it's the bookkeeping. Updating cross-references, keeping summaries current, noting when new data contradicts old claims. Humans abandon wikis because maintenance grows faster than value. LLMs don't get bored and can touch 15 files in one pass. Maintenance cost drops to near zero.

## Use Cases

- **Personal**: goals, health, psychology, self-improvement — journal entries, articles, podcast notes
- **Research**: deep-dive on a topic over weeks/months — papers, articles, reports
- **Reading a book**: chapter-by-chapter wiki with characters, themes, plot threads
- **Business/team**: internal wiki fed by Slack threads, meeting transcripts, customer calls
- **Cross-project knowledge**: tech patterns, strategy playbooks, vendor evaluations that carry forward

## Our Differentiators

Compared to existing implementations (30+ projects spawned from Karpathy's gist):

1. **Multi-vault with cross-pollination** — most implementations are single-wiki. We support multiple vaults with a meta vault and promote/reference flow for cross-project knowledge transfer.
2. **Mobile-first** — most implementations are CLI-only. We solve "use it from my phone" with a Next.js PWA.
3. **Open source + SaaS** — same codebase, two deployment models. OSS is the marketing engine, SaaS is the business.
4. **One engine, many vaults** — Claude Code skills are the centralized engine. Vaults are dumb data. No per-vault tooling to maintain.

## Inspiration

- [Karpathy's LLM Wiki gist](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) (April 4, 2026) — the original idea file
- [Karpathy's viral tweet](https://x.com/karpathy/status/2039805659525644595) — 55K likes, 6.5K retweets
- Vannevar Bush's Memex (1945) — private, curated knowledge store with associative trails between documents
