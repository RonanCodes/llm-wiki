---
name: reference-clone
description: Add a repo to the .reference/ folder for study — either shallow-clone a GitHub repo or symlink a local path. Use when user wants to study a repo, clone for reference, look at someone's code, pull down a project to learn from, or make a local repo grep-able alongside their other references.
argument-hint: <github-url-or-org/repo-or-local-path> [--name <custom-name>] [--symlink]
allowed-tools: Bash(git clone *) Bash(git pull *) Bash(mkdir *) Bash(ls *) Bash(ln *) Bash(readlink *) Bash(realpath *)
---

# Reference Clone

Add a repo to `.reference/` so you can grep, glob, and read across external codebases alongside this one. Two modes:

- **Clone** (default) — shallow `git clone --depth 1` of a remote GitHub repo.
- **Symlink** (`--symlink`) — link a local path into `.reference/` so edits in the source show up instantly and no disk is duplicated.

The `.reference/` directory is gitignored — nothing here ever commits to this repo.

## Why `.reference/` is its own thing

It's the canonical "other people's code and my other repos, gathered in one place" pattern. Keeping external material under a single gitignored directory means:

- Grep/glob naturally find it when you want cross-repo context, and skip it otherwise.
- Subagents (Explore, general-purpose) can be pointed at `.reference/<name>/` for targeted research without leaking the paths into commits.
- The directory travels with the project — onboard a new machine by running `/reference-clone` a few times rather than remembering which repos matter.

This skill is the only place this pattern lives; replicate the structure in new projects by copying the `.gitignore` entry and this skill.

## Usage

```
# Clone remote (shallow)
/reference-clone https://github.com/steipete/claude-code-skills
/reference-clone mattpocock/skills
/reference-clone snarktank/ralph --name snarktank-ralph

# Symlink a local repo
/reference-clone ~/Dev/ai-projects/remotion-studio --symlink
/reference-clone /Users/ronan/Dev/ronan-skills --symlink --name ronan-skills
```

## Steps

1. **Parse arguments** from `$ARGUMENTS`:
   - First positional arg is either a remote (`https://github.com/org/repo`, `git@github.com:org/repo.git`, or shorthand `org/repo`) or a local path (absolute, `~`-relative, or starts with `./` / `../`).
   - `--symlink`: treat the positional arg as a local path and `ln -s` it into `.reference/` instead of cloning.
   - `--name <name>`: optional custom directory name (default naming below).

2. **Create `.reference/` if missing**:

```bash
mkdir -p .reference
```

3. **If `--symlink`** — local path mode:
   - Resolve to an absolute path: `TARGET=$(realpath "<path>")`. Fail clearly if the path doesn't exist.
   - Default `<name>` is the basename of the resolved path (e.g. `~/Dev/ronan-skills` → `ronan-skills`).
   - If `.reference/<name>` already exists, check whether it's a symlink to the same target (`readlink` match → already-linked, report and stop); otherwise ask before replacing.
   - Create the link:

```bash
ln -s "$TARGET" ".reference/<name>"
```

   - Report: symlink path, target, and that edits in the target repo show through automatically.

4. **Else (remote clone)** — default mode:
   - Default `<name>` is `<org>-<repo>` to avoid collisions (e.g. `mattpocock/skills` → `mattpocock-skills`).
   - If `.reference/<name>/` already exists, tell the user and offer to `git pull` (cd in and pull) or re-clone (ask before removing).
   - Shallow clone:

```bash
git clone --depth 1 https://github.com/<org>/<repo>.git ".reference/<name>"
```

5. **Report what was added**:
   - Top-level directory listing.
   - Repo description / README first line if readily available.
   - Suggest: "You can now read/grep files under `.reference/<name>/`. Agents spawned via the Explore subagent can be pointed here for cross-repo research."

## Naming Convention

| Source | Default `<name>` |
|--------|------------------|
| Remote `org/repo` | `org-repo` (e.g. `mattpocock-skills`) |
| Local path | `basename(path)` (e.g. `~/Dev/ronan-skills` → `ronan-skills`) |

`--name` overrides both.

## Updating

- **Cloned**: `cd .reference/<name> && git pull`
- **Symlinked**: nothing to do — the source is the source.

## Removing

```bash
# Symlinks: use unlink (NOT rm -rf — that would walk into the target)
unlink .reference/<name>

# Clones: regular removal is fine
rm -rf .reference/<name>
```
