---
name: reference-clone
description: Clone a GitHub repo into the .reference/ folder for study and reference. Use when user wants to study a repo, clone for reference, look at someone's code, or pull down a project to learn from.
argument-hint: <github-url-or-org/repo> [--name <custom-name>]
allowed-tools: Bash(git clone *) Bash(mkdir *) Bash(ls *)
---

# Reference Clone

Clone a GitHub repo into `.reference/` for study. Shallow clone (depth 1) to save space. The `.reference/` directory is gitignored — clones are local-only, not committed.

## Usage

```
/reference-clone https://github.com/steipete/claude-code-skills
/reference-clone mattpocock/skills
/reference-clone snarktank/ralph --name snarktank-ralph
```

## Steps

1. **Parse arguments** from `$ARGUMENTS`:
   - Accept full URL (`https://github.com/org/repo`) or shorthand (`org/repo`)
   - `--name <name>`: optional custom directory name (default: `<repo-name>` or `<org>-<repo>` if ambiguous)

2. **Check if `.reference/` exists**, create if not:

```bash
mkdir -p .reference
```

3. **Check if already cloned**:
   - If `.reference/<name>/` already exists, tell the user and ask if they want to update it (`git pull`) or re-clone

4. **Clone** (shallow, depth 1):

```bash
git clone --depth 1 https://github.com/<org>/<repo>.git .reference/<name>
```

5. **Report what was cloned**:
   - Show the directory listing of the cloned repo (top-level files)
   - Note the repo description if available
   - Suggest: "You can now read files from `.reference/<name>/`"

## Naming Convention

Default name is `<org>-<repo>` to avoid collisions:
- `mattpocock/skills` → `.reference/mattpocock-skills/`
- `snarktank/ralph` → `.reference/snarktank-ralph/`
- `steipete/claude-code-skills` → `.reference/steipete-claude-code-skills/`

If user provides `--name`, use that instead.

## Updating

To update an existing reference:

```bash
cd .reference/<name> && git pull
```
