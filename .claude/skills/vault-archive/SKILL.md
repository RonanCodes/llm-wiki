---
name: vault-archive
description: Archive a completed vault by moving it out of the active vaults/ directory. Optionally promote reusable knowledge first. Use when user wants to archive, shelve, or finish a project vault.
argument-hint: <vault-name> [--promote-first]
disable-model-invocation: true
allowed-tools: Bash(mv *) Bash(mkdir *) Bash(git *) Bash(ls *) Read Write Edit Glob Grep
---

# Archive Vault

Move a completed vault from `vaults/` to `archive/` so it's no longer active but fully preserved.

## Usage

```
/vault-archive my-project
/vault-archive my-project --promote-first
```

## Steps

1. **Verify vault exists** at `vaults/<name>/`

2. **If `--promote-first`**: Run the promote workflow first to graduate reusable knowledge to meta vault before archiving. See `/promote` skill.

3. **Add final log entry**:

Append to the vault's `log.md`:
```markdown
## [YYYY-MM-DD] archive | Vault archived
- Reason: project complete
- Pages at archive time: <count>
- Sources at archive time: <count>
---
```

4. **Commit the vault**:
```bash
cd "vaults/<name>"
git add .
git commit -m "📦 chore: archive vault — project complete"
```

5. **Move to archive**:
```bash
mkdir -p archive
mv "vaults/<name>" "archive/<name>"
```

6. **Report**:
- Where the vault was moved to
- Page/source counts at time of archive
- Reminder that the vault is still a git repo with full history
- Reminder it can be reopened: `mv archive/<name> vaults/<name>`

## Notes

- The vault is moved, not deleted. Full git history is preserved.
- The vault's git repo stays intact — you can still `cd archive/<name> && git log`
- To reactivate: just move it back to `vaults/`
- Obsidian can still open archived vaults if you point it at `archive/<name>`
