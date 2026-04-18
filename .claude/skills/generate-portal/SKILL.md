---
name: generate-portal
description: Generate an HTML artifact portal (index page) for a vault. Auto-discovers all artifacts, groups by type, shows version history. Links open in new tabs. Regenerate after producing new artifacts to keep the portal current.
user-invocable: false
allowed-tools: Bash(git *) Bash(ls *) Bash(mkdir *) Bash(date *) Bash(find *) Bash(cat *) Bash(sed *) Bash(grep *) Bash(awk *) Bash(wc *) Read Write Glob Grep
---

# Generate Portal

Produce a self-contained HTML index page that links to every artifact in a vault. Auto-discovers artifacts by scanning `artifacts/*/`, groups them by type, and shows version history when multiple versions of the same artifact exist.

This is the "home page" for a vault's generated outputs — one link to open in a browser, everything else is navigable from there.

## Usage (via /generate router)

```
/generate portal [--vault <name>]
```

No topic argument needed — the portal always covers the entire vault.

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

## See Also

- `.claude/skills/generate/SKILL.md` — router that dispatches here.
- All `generate-*/SKILL.md` handlers — produce the artifacts this portal indexes.
