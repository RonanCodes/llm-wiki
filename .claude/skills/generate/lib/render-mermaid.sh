#!/usr/bin/env bash
# render-mermaid.sh — pre-pass that renders mermaid code blocks in a
# markdown file to static SVG/PNG images and rewrites the markdown to
# reference them. Used by generate-book, generate-pdf, generate-slides
# so rendered artifacts show real diagrams instead of fenced code.
#
# Usage:
#   render-mermaid.sh <input.md> <output.md> <assets-dir> [format]
#
# Arguments:
#   input.md    — source markdown (unchanged).
#   output.md   — destination markdown with mermaid blocks replaced by
#                 image references (e.g. ![diagram-3](./assets/mmd-3.svg)).
#   assets-dir  — directory where rendered images are written.
#                 Created if missing. Images named mmd-<n>.<ext>.
#   format      — 'svg' (default, scalable, preferred for PDF/HTML)
#                 or 'png' (for readers that don't handle inline SVG well).
#
# Exit codes:
#   0 — success (or no mermaid blocks found; output.md is a straight copy).
#   1 — mermaid-cli unavailable AND couldn't be lazy-installed.
#   2 — bad arguments.
#   3 — render failure on one or more blocks.
#
# Installs mermaid-cli (`@mermaid-js/mermaid-cli`, binary `mmdc`) via
# pnpm/npm on first use. If the install fails, the script falls through
# to leave mermaid blocks as fenced code (graceful degradation — you get
# the current behaviour, not a hard failure).

set -euo pipefail

INPUT="${1:-}"
OUTPUT="${2:-}"
ASSETS_DIR="${3:-}"
FORMAT="${4:-svg}"

if [ -z "$INPUT" ] || [ -z "$OUTPUT" ] || [ -z "$ASSETS_DIR" ]; then
  echo "usage: render-mermaid.sh <input.md> <output.md> <assets-dir> [svg|png]" >&2
  exit 2
fi

if [ ! -r "$INPUT" ]; then
  echo "render-mermaid: cannot read: $INPUT" >&2
  exit 2
fi

# --- Fast-path: no mermaid blocks ---------------------------------------
if ! grep -q '^```mermaid' "$INPUT"; then
  cp "$INPUT" "$OUTPUT"
  exit 0
fi

# --- Ensure mermaid-cli is available ------------------------------------
MMDC_CMD=""
if command -v mmdc >/dev/null 2>&1; then
  MMDC_CMD="mmdc"
elif npx --no-install @mermaid-js/mermaid-cli --version >/dev/null 2>&1; then
  MMDC_CMD="npx --no-install @mermaid-js/mermaid-cli"
else
  echo "render-mermaid: installing @mermaid-js/mermaid-cli…" >&2
  if command -v pnpm >/dev/null 2>&1; then
    pnpm add -g @mermaid-js/mermaid-cli >&2 2>/dev/null || true
  fi
  if ! command -v mmdc >/dev/null 2>&1; then
    npm install -g @mermaid-js/mermaid-cli >&2 2>/dev/null || true
  fi
  if command -v mmdc >/dev/null 2>&1; then
    MMDC_CMD="mmdc"
  else
    echo "render-mermaid: ⚠️  mmdc unavailable — leaving mermaid blocks as code" >&2
    cp "$INPUT" "$OUTPUT"
    exit 1
  fi
fi

mkdir -p "$ASSETS_DIR"

# --- Write a puppeteer config so headless chrome runs in sandboxed envs -
PUPPETEER_CFG="$(mktemp -t puppeteer-config.XXXXXX.json)"
cat > "$PUPPETEER_CFG" <<'JSON'
{
  "args": ["--no-sandbox", "--disable-dev-shm-usage"]
}
JSON

# --- Observatory-themed mermaid config ----------------------------------
MMD_CFG="$(mktemp -t mermaid-config.XXXXXX.json)"
cat > "$MMD_CFG" <<'JSON'
{
  "theme": "base",
  "themeVariables": {
    "background": "#0b0f14",
    "primaryColor": "#1e293b",
    "primaryTextColor": "#e8eef6",
    "primaryBorderColor": "#5bbcd6",
    "lineColor": "#7dcea0",
    "secondaryColor": "#e0af40",
    "tertiaryColor": "#334155",
    "fontFamily": "Inter, system-ui, sans-serif",
    "fontSize": "15px"
  },
  "flowchart": { "curve": "basis" },
  "sequence":  { "actorFontFamily": "Inter", "noteFontFamily": "Inter" }
}
JSON

trap 'rm -f "$PUPPETEER_CFG" "$MMD_CFG"' EXIT

# --- Extract, render, rewrite -------------------------------------------
# We walk the input line-by-line; when we hit ```mermaid we collect the
# block until the closing ``` and emit a replacement image reference.
python3 - "$INPUT" "$OUTPUT" "$ASSETS_DIR" "$FORMAT" "$MMDC_CMD" "$PUPPETEER_CFG" "$MMD_CFG" <<'PY'
import os, subprocess, sys, tempfile

src, dst, assets_dir, fmt, mmdc_cmd, puppeteer_cfg, mmd_cfg = sys.argv[1:8]

with open(src, "r", encoding="utf-8") as f:
    lines = f.readlines()

out_lines = []
i = 0
counter = 0
failures = 0

while i < len(lines):
    line = lines[i]
    stripped = line.strip()
    if stripped.startswith("```mermaid"):
        # Collect the mermaid block body until the closing fence.
        body = []
        j = i + 1
        while j < len(lines) and not lines[j].strip().startswith("```"):
            body.append(lines[j])
            j += 1
        counter += 1
        # Write the body to a temp .mmd file and render.
        with tempfile.NamedTemporaryFile(
            "w", suffix=".mmd", delete=False, encoding="utf-8"
        ) as mmd:
            mmd.write("".join(body))
            mmd_path = mmd.name
        img_name = f"mmd-{counter}.{fmt}"
        img_path = os.path.join(assets_dir, img_name)
        cmd = mmdc_cmd.split() + [
            "-i", mmd_path,
            "-o", img_path,
            "-c", mmd_cfg,
            "-p", puppeteer_cfg,
            "-b", "#0b0f14",
            "-w", "1400",
        ]
        try:
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=60
            )
            if result.returncode != 0:
                raise RuntimeError(result.stderr)
            # Emit a markdown image reference. Use a relative path that
            # resolves from wherever the output markdown will be rendered.
            rel = os.path.relpath(img_path, os.path.dirname(os.path.abspath(dst)))
            out_lines.append(f"\n![diagram {counter}]({rel})\n\n")
        except Exception as e:
            sys.stderr.write(f"render-mermaid: block {counter} failed: {e}\n")
            failures += 1
            # Keep the original fenced block so the reader still sees the
            # source — better than silently dropping content.
            out_lines.append(line)
            out_lines.extend(body)
            if j < len(lines):
                out_lines.append(lines[j])
        finally:
            os.unlink(mmd_path)
        i = j + 1
    else:
        out_lines.append(line)
        i += 1

with open(dst, "w", encoding="utf-8") as f:
    f.writelines(out_lines)

if failures > 0:
    sys.exit(3)
PY

EXIT=$?
if [ $EXIT -ne 0 ]; then
  exit $EXIT
fi

echo "render-mermaid: wrote $OUTPUT (assets in $ASSETS_DIR)" >&2
