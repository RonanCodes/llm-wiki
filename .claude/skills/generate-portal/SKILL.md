---
name: generate-portal
description: Generate an HTML artifact portal. Two modes. Per-vault (default) scans a vault's artifacts/*/ and writes vaults/<name>/artifacts/portal/index.html. Root mode (--root) auto-discovers every vault under vaults/ and writes portal/index.html at the repo root, linking to each vault's per-vault portal. Regenerate after producing new artifacts.
user-invocable: false
allowed-tools: Bash(git *) Bash(ls *) Bash(mkdir *) Bash(date *) Bash(find *) Bash(cat *) Bash(sed *) Bash(grep *) Bash(awk *) Bash(wc *) Read Write Glob Grep
content-pipeline:
  - pipeline:review
  - platform:agnostic
  - role:orchestrator
---

# Generate Portal

Produce a self-contained HTML index page. Two modes:

- **Per-vault (default)** — links to every artifact in one vault. Written to `vaults/<name>/artifacts/portal/index.html`.
- **Root (`--root`)** — links to every vault in the repo. Written to `portal/index.html` at the repo root. Each card opens that vault's per-vault portal.

Together they form a two-level navigation: open the root portal → click a vault → click an artifact.

## Usage (via /generate router)

```
/generate portal [--vault <name>]   # per-vault mode
/generate portal --root             # root mode — ignores --vault
```

No topic argument in either mode — the portal always covers the entire vault (or the entire repo in root mode).

## Mode Selection

- If `--root` is present → **Root Mode** (jump to the Root Mode section below).
- Otherwise → **Per-Vault Mode** (the steps that follow immediately).

## Step 1: Resolve Vault

- `VAULT_DIR="vaults/<name>"`, `ARTIFACTS_DIR="$VAULT_DIR/artifacts"`.
- If `artifacts/` doesn't exist, exit with: "No artifacts found. Generate some first with `/generate <type> <topic>`."

## Step 2: Discover Artifacts

Scan `$ARTIFACTS_DIR/` for all generated files. Each artifact type lives in its own subdirectory:

```
artifacts/
├── slides/
├── mindmap/
├── infographic/
├── book/
├── quiz/
├── flashcards/
├── podcast/
├── app/
├── pdf/
├── video/
└── portal/          ← this skill writes here
```

For each subdirectory (excluding `portal/`):

1. Find all `.meta.yaml` sidecar files — these are the canonical artifact records.
2. If no sidecar exists, find renderable files (`.html`, `.pdf`, `.svg`, `.mp3`, `.mp4`) directly.
3. Group artifacts by **topic** (from sidecar `topic:` field or filename slug).
4. Within each topic, sort by **date** (from filename or sidecar `generated-at:`), newest first.

### Version Detection

Multiple artifacts of the same type + topic = **versions**. Versions are detected by:

- Same artifact type directory (e.g. `quiz/`)
- Same topic slug in the filename (e.g. `ecommerce-copilot-2026-04-18.html` and `ecommerce-copilot-2026-04-20.html`)
- Different dates = different versions

The newest version is the **current** version. Older ones appear in a collapsible "Previous versions" section.

### Artifact Type Metadata

Map each type to display info:

```
slides     → 🎞️  Slide Deck          → "Marp presentation deck"
mindmap    → 🧠  Interactive Mindmap  → "Zoomable Markmap visualization"
infographic→ 📊  Infographic          → "One-page visual summary"
book       → 📚  Book                 → "Full book combining wiki pages"
quiz       → 🧪  Knowledge Quiz       → "Interactive multiple-choice quiz"
flashcards → 🃏  Flashcards           → "Flip-card study tool"
podcast    → 🎙️  Podcast              → "Audio explainer"
app        → ⚛️   Explorer App         → "Interactive React application"
pdf        → 📄  PDF                  → "Print-ready document"
video      → 🎬  Video                → "Animated explainer"
```

## Step 3: Gather Vault Stats

Count for the portal header:

- Total wiki pages: `find $VAULT_DIR/wiki -name '*.md' ! -name 'index.md' | wc -l`
- Total artifacts: count of unique renderable files across all types
- Source documents: `find $VAULT_DIR/raw -type f ! -path '*/assets/*' | wc -l`
- Meeting notes: `find $VAULT_DIR/meeting-notes -name '*.md' ! -name 'README.md' 2>/dev/null | wc -l`

## Safety Gate — MANDATORY before any write

Portal output references **private vault names**. If it gets committed to a non-private repo, it leaks client/project identity (e.g. "llm-wiki-aviva" → Aviva is a client).

Before writing ANY output file, verify the path is gitignored:

```bash
git check-ignore -q "$OUTPUT_PATH" || {
  echo "❌ Refusing to write: $OUTPUT_PATH is not gitignored."
  echo "   The portal references private vault names."
  echo "   Add the output directory to .gitignore before running this skill."
  exit 1
}
```

Known safe output paths (already gitignored by project convention):
- `vaults/<name>/artifacts/portal/index.html` — covered by `vaults/*`
- `portal/index.html` at repo root (cross-vault landing, if implemented) — must be covered by `/portal/`

If generating a cross-vault root portal at `portal/index.html`, the gate above catches a missing `/portal/` rule in `.gitignore` and aborts the write.

## Step 4: Build the Portal HTML

Write `$ARTIFACTS_DIR/portal/index.html` — a self-contained HTML file with:

### Design Requirements

- Dark theme using Observatory colours (amber #e0af40, cyan #5bbcd6, green #7dcea0)
- All links open in new tabs (`target="_blank"`)
- Responsive grid layout for artifact cards
- Stats bar showing vault metrics
- Grouped by artifact type with section headers
- Version badges on cards when multiple versions exist
- Collapsible "Previous versions" sections
- Obsidian deep-links for wiki pages (`obsidian://open?vault=<name>&file=<path>`)
- Footer with generation timestamp

### Card Structure

Each artifact card shows:

```html
<a class="card" href="<relative path>" target="_blank">
  <div class="card-icon">🎞️</div>
  <div class="version-badge">v3</div>          <!-- only if multiple versions -->
  <h3>Slide Deck — <topic></h3>
  <p><description from sidecar or auto-generated></p>
  <div class="card-meta">
    <span class="tag">HTML + PDF</span>
    <span class="date">2026-04-18</span>
  </div>
</a>
```

### Version History

When a topic has multiple versions, show the latest as the main card with a version badge, and add a collapsible section below:

```html
<details class="version-history">
  <summary>Previous versions (2)</summary>
  <ul>
    <li><a href="..." target="_blank">v2 — 2026-04-16</a> <span class="change-note">Updated partnership phases</span></li>
    <li><a href="..." target="_blank">v1 — 2026-04-14</a> <span class="change-note">Initial version</span></li>
  </ul>
</details>
```

Change notes come from the sidecar `change-note:` field if present.

## Step 5: Write Sidecar

```bash
META="$ARTIFACTS_DIR/portal/index.meta.yaml"
cat > "$META" <<EOF
generator: generate-portal@0.1.0
generated-at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
vault: "<vault-name>"
artifact-count: <N>
artifact-types:
$(for type in "${TYPES[@]}"; do echo "  - $type"; done)
EOF
```

## Step 6: Commit

```bash
cd "$VAULT_DIR"
git add artifacts/portal/index.html artifacts/portal/index.meta.yaml 2>/dev/null
git diff --cached --quiet || git commit -m "�Portal: regenerate artifact index ($(date +%Y-%m-%d))"
```

## Step 7: Report

```
✅ Portal generated
   Vault:       <vault-name>
   Artifacts:   <N> across <M> types
   Versions:    <V> artifacts have multiple versions
   Output:      vaults/<vault>/artifacts/portal/index.html
   Open with:   open <absolute path>
```

## Sidecar Versioning Convention

To support versioning across ALL artifact types, the `.meta.yaml` sidecar gains two optional fields:

```yaml
version: 3                          # auto-incremented when same type+topic is regenerated
change-note: "Updated partnership phase details"   # short note on what changed
replaces: "ecommerce-copilot-2026-04-16"           # filename slug of previous version
```

When a generate-* handler creates an artifact and finds an existing artifact of the same type + topic:

1. Read the existing sidecar's `version:` field (default 1 if absent).
2. Increment it for the new artifact.
3. Set `replaces:` to the previous artifact's filename slug.
4. The old artifact stays in place — not deleted, not overwritten.

Small fixes (CSS tweaks, typo fixes) should update the file in-place without incrementing the version — use judgement based on whether the content meaningfully changed.

## Root Mode (`--root`)

When invoked with `--root`, the skill writes a repo-level portal that lists every vault and links to each vault's own per-vault portal. This is the "home page" of the whole LLM Wiki — one URL to bookmark, everything else is navigable from there.

### Step R1: Discover Vaults

```bash
for dir in vaults/*/; do
  [ -d "$dir/wiki" ] || continue                 # skip non-vault dirs
  NAME=$(basename "$dir")
  VAULTS+=("$NAME")
done
```

Skip entries that don't look like vaults (no `wiki/` subdir, no `.git/`). Do not fail if `vaults/` is empty — still emit a portal with an empty state that says "No vaults yet — run `/vault-create <name>` to start."

### Step R2: Gather Per-Vault Stats

For each vault, collect:

- **Display name** — read from `vaults/<name>/CLAUDE.md` frontmatter or first H1; fall back to the vault directory name with `llm-wiki-` stripped and dashes replaced with spaces.
- **Domain** — from `vaults/<name>/CLAUDE.md` frontmatter `domain:` field if present.
- **Icon** — from `vaults/<name>/CLAUDE.md` frontmatter `icon:` field (emoji) if present; otherwise pick a sensible default (📖 for `llm-wiki`, 🧪 for `skill-lab`, 🔬 for `research`, 🤝 for partnership vaults, 📚 generic fallback).
- **One-line description** — from `vaults/<name>/CLAUDE.md` frontmatter `summary:` or first paragraph under the H1.
- **Page count** — `find vaults/<name>/wiki -name '*.md' ! -name 'index.md' ! -name 'log.md' | wc -l`
- **Artifact count** — count of renderable files under `vaults/<name>/artifacts/` excluding `portal/` and `.meta.yaml` sidecars.
- **Has per-vault portal?** — test `vaults/<name>/artifacts/portal/index.html` exists.

### Step R3: Build the Root HTML

Write `portal/index.html` at the repo root (same path as the existing hand-crafted file — it is replaced in full).

Design requirements match per-vault mode (Observatory dark theme, responsive grid, Inter font) with these differences:

- **Header** reads "LLM Wiki Vaults" (amber "LLM Wiki", cyan "Vaults").
- **Stats bar** aggregates across all vaults: vault count, total wiki pages, total artifacts, distinct domains.
- **Cards** represent vaults, not artifacts. Each card has:
  - Icon, display name, domain tag, description.
  - Stats row: `<N> pages · <M> artifacts`.
  - "Artifact Portal" link (green tag) → `../vaults/<name>/artifacts/portal/index.html` if it exists; otherwise a dashed-border `no-portal` card with "No portal yet" tag.
  - "Obsidian" link (purple tag) → `obsidian://open?vault=<name>`.
- **Footer** shows the generation timestamp and regenerate hint: `/generate portal --root`.

Keep the styling consistent with the existing `portal/index.html` in the repo — use it as a reference template, but rebuild the grid and stats from live data rather than copying fixed numbers.

### Step R4: Write Sidecar

```bash
META="portal/index.meta.yaml"
cat > "$META" <<EOF
generator: generate-portal@0.2.0
mode: root
generated-at: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
vault-count: <N>
vaults:
$(for v in "${VAULTS[@]}"; do echo "  - $v"; done)
EOF
```

### Step R5: Commit

```bash
git add portal/index.html portal/index.meta.yaml
git diff --cached --quiet || git commit -m "✨ feat: regenerate root vault portal ($(date +%Y-%m-%d))"
```

(The root portal lives in the main repo, unlike per-vault portals which commit inside each vault's own git repo.)

### Step R6: Report

```
✅ Root portal generated
   Vaults:      <N>
   Pages:       <total>
   Artifacts:   <total>
   Output:      portal/index.html
   Open with:   open <absolute path>
```

## See Also

- `.claude/skills/generate/SKILL.md` — router that dispatches here.
- `.claude/skills/generate-all/SKILL.md` — regenerates the per-vault portal at the end of every batch run, so vault portals stay fresh automatically.
- All `generate-*/SKILL.md` handlers — produce the artifacts this portal indexes.
