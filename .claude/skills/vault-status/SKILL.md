---
name: vault-status
description: Show status of all LLM Wiki vaults — page counts, source counts, last activity, and git status. Use when user wants to see vault status, list vaults, or check wiki health.
allowed-tools: Bash(find *) Bash(git *) Bash(grep *) Bash(wc *) Bash(ls *) Bash(tail *) Glob Grep Read
---

# Vault Status

Show an overview of all vaults and their current state.

**Sibling skill:** for a session-start briefing ("where did I leave off?") use `/pickup <vault>` instead. This skill is for vault health / catalogue stats; `/pickup` is for resuming work.

## Usage

```
/vault-status
```

## Steps

1. **Scan for vaults** in the `vaults/` directory. Each subdirectory with a `CLAUDE.md` is a vault.

2. **For each vault, gather stats** by running these commands:

```bash
VAULT="vaults/<name>"

# Page count (markdown files in wiki/, excluding index.md)
find "$VAULT/wiki" -name "*.md" ! -name "index.md" | wc -l

# Source count (files in raw/, excluding assets/)
find "$VAULT/raw" -maxdepth 1 -type f | wc -l

# Domain (from CLAUDE.md)
grep "Domain" "$VAULT/CLAUDE.md" | head -1

# Last log entry
grep "^## \[" "$VAULT/log.md" | tail -1

# Open ROADMAP items (count of unchecked checkboxes in In progress + Next up)
test -f "$VAULT/ROADMAP.md" && grep -cE "^- \[ \]|^[0-9]+\." "$VAULT/ROADMAP.md" || echo "no-roadmap"

# Git status
cd "$VAULT" && git status --porcelain | wc -l  # 0 = clean
```

3. **Display results** as a markdown table:

```
## LLM Wiki Vaults

| Vault | Domain | Pages | Sources | Last Activity | Git |
|-------|--------|-------|---------|---------------|-----|
| my-research | ai-research | 42 | 15 | 2026-04-13 ingest | clean |
| personal | personal | 8 | 3 | 2026-04-10 query | 2 dirty |
```

4. **If no vaults found**, suggest creating one:
   ```
   No vaults found. Create one with: /vault-create <name>
   ```

## Notes

- Only directories in `vaults/` containing a `CLAUDE.md` are treated as vaults
- "Pages" counts all `.md` files in `wiki/` subdirectories (concepts, entities, sources, comparisons), excluding `index.md`
- "Sources" counts files directly in `raw/` (not assets/)
- "Git" shows "clean" or the count of dirty files
- "Last Activity" is parsed from the last `## [date] type | Title` entry in `log.md`
