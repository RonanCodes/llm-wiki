---
title: "Canonical Label System"
date-created: 2026-05-19
date-modified: 2026-05-19
page-type: concept
domain:
  - llm-wiki
  - golden-corpus
tags:
  - labels
  - github
  - agent-native
  - factory
  - day-shift
  - night-shift
sources:
  - "RonanCodes/ronan-skills@feat/canonical-label-system"
related:
  - "[[agent-native-stack-design]]"
  - "[[factory-overnight-coding-swarm]]"
---

# Canonical Label System

A single label vocabulary applied identically across every personal repo (factory, factory-testbench, llm-wiki, lekkertaal, dataforce) so the day-shift and night-shift orchestrators can pick up work without per-repo branching logic.

The authoritative source is in `RonanCodes/ronan-skills`:

- Human-readable: [`canon/labels.md`](https://github.com/RonanCodes/ronan-skills/blob/main/canon/labels.md)
- Machine-readable: [`canon/labels.yml`](https://github.com/RonanCodes/ronan-skills/blob/main/canon/labels.yml)
- Migration script: [`scripts/migrate-labels.sh`](https://github.com/RonanCodes/ronan-skills/blob/main/scripts/migrate-labels.sh)

This page is the wiki concept mirror: high-level intent + rationale, not the spec itself. If the two disagree, the ronan-skills canon wins.

## Why standardise

Before the canon there was drift. Different repos had different gate-label names (`ready-for-agent`, `Sandcastle`, `swarm`), different ways of marking parents vs slices (body shape only, no label), and different escalation words (`blocked-on-human`, `ready-for-human`, `hitl`, free-text comments). Every orchestrator skill had to encode the synonyms.

Result: bugs. A worker that thought `blocked-on-human` was the escalation word would silently keep retrying an issue labelled `hitl`. The night-shift retro would lose track because its query was `--label ready-for-agent` and the repo used `swarm`.

The canonical label system makes the vocabulary load-bearing instead of advisory.

## The shape

Three axes, mutually exclusive within each axis except modifiers:

- **Lifecycle** (exactly one set at all times): `needs-grilling`, `ready-for-agent`, `in-progress`, `needs-human`. The state machine has four nodes and well-defined transitions.
- **Kind** (exactly one set): `kind:prd`, `kind:slice`, `kind:incident`, `kind:chore`. Lets the orchestrator query by work-type without parsing body shapes.
- **Modifiers** (additive): `hitl-likely`, `parallel-eligible`, `repo-lock`, `bug-fix`, `phase-0..3`, `from-retro`, `needs-grilling-skipped`. These drive scheduler decisions (parallel/serial, HITL concurrency cap) and reviewer attention.

## The decision tree (rationale)

The shape above came out of a grill on 2026-05-19. The key decisions, in the order they were taken:

1. **Lifecycle vs kind vs modifier — pick a three-axis split.** Earlier attempts mixed them on one axis (`hitl`, `ready-for-agent`, `bug-fix` all sitting in the same set) which forced the orchestrator to compute intent from N labels with overlapping semantics. Three axes give each label one job.
2. **Mutually exclusive within an axis.** The state machine only works if `in-progress` precludes `ready-for-agent`. Workers swap them atomically on pickup. Tools that read labels can assert "exactly one lifecycle, exactly one kind" as an invariant.
3. **`needs-grilling` as the entry state, not `prd:draft`.** `prd:draft` was a body-shape marker, not a lifecycle. Renaming forces day-shift to be the one doing the grill and makes the transition `needs-grilling → ready-for-agent` an explicit ownership handoff.
4. **Closed state = absence of any lifecycle label.** No `done` label. Closing the issue (via PR merge) is the signal; the absence of a lifecycle label tells you it was completed cleanly. A re-opened issue gets relabelled.
5. **Identical vocabulary on every repo, including system repos.** System repos (ronan-skills, llm-wiki tooling) rarely fire `parallel-eligible` / `repo-lock`, but the labels exist there too. One migration script, one mental model.
6. **Branch flow is `gh issue develop`, not `git checkout -b`.** The dev-link is the canon. It makes `Closes #N` automatic and lets the night-shift retro walk issue→PR without title-matching.

## Examples per repo

- **factory**: `kind:prd` lives on the bigger architectural issues (#1, #98). `kind:slice` covers every ralph / planner-worker pickable issue (#99-#104). `phase-1` / `phase-2` markers distinguish the current vs deferred work. `hitl-likely` is set on the schema-migration and OAuth slices.
- **factory-testbench**: minimal surface. `kind:chore` on the two seed issues (#3, #5). Used as the migration script's first test bed.
- **llm-wiki**: largely empty issue queue (most planning happens in markdown vaults). The labels exist for when project work spins up there.
- **lekkertaal**: PWA work. `kind:slice` on user-story issues, `parallel-eligible` where the slicer asserts file disjointness.
- **dataforce**: largest issue queue. Mix of `kind:prd` (#157, #198, etc.), `kind:slice` (#199), and `kind:chore` (operational and handoff issues).

## See also

- `RonanCodes/ronan-skills` skills updated to consume the canon: `write-a-prd`, `slice-into-issues`, `ralph`, `planner-worker`, `night-shift`, `day-shift`, `close-the-loop`.
- `~/Dev/ai-projects/factory/src/lib/labels.ts` mirrors the YAML as a typed constant for the factory orchestrator.
