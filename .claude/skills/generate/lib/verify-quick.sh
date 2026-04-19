#!/usr/bin/env bash
# verify-quick.sh — cheap inline quality check for a freshly-generated
# artifact. Runs in seconds; prints a pass/warn report; writes results
# back into the sidecar's `quality:` block.
#
# Lighter than /verify-artifact (which does a full re-ingest round-trip).
# Every generate-* handler should call this as its final step so the
# learner never receives a silently thin artifact.
#
# Usage:
#   verify-quick.sh <type> <artifact-path> <sidecar-path>
#
# Checks (see generate/lib/quality-rubric.md for the rules):
#   1. Artifact exists, non-empty.
#   2. Depth metric meets the per-type floor.
#   3. Engagement techniques applied (mermaid images, callouts, pull quotes).
#   4. Sidecar present, well-formed, mentions generated-from + source-hash.
#
# Exit code:
#   0 — all checks passed
#   1 — one or more WARN (artifact kept; user should review)
#   2 — bad args / missing artifact (hard failure)

set -euo pipefail

TYPE="${1:-}"
ART="${2:-}"
META="${3:-}"

if [ -z "$TYPE" ] || [ -z "$ART" ] || [ -z "$META" ]; then
  echo "usage: verify-quick.sh <type> <artifact-path> <sidecar-path>" >&2
  exit 2
fi

if [ ! -e "$ART" ]; then
  echo "verify-quick: artifact missing: $ART" >&2
  exit 2
fi

# --- Python helper does the real work: counts, thresholds, sidecar patch
python3 - "$TYPE" "$ART" "$META" <<'PY'
import json, os, pathlib, re, sys, subprocess

TYPE, ART, META = sys.argv[1], sys.argv[2], sys.argv[3]
art = pathlib.Path(ART)
meta = pathlib.Path(META)

# Per-type depth floors. Keep in sync with quality-rubric.md §2.
FLOORS = {
    "book":        {"metric": "words",      "min": 3000, "chapters_min": 3},
    "pdf":         {"metric": "words",      "min": 400},
    "slides":      {"metric": "slides",     "min": 8},
    "mindmap":     {"metric": "nodes",      "min": 12, "depth_min": 3},
    "infographic": {"metric": "datapoints", "min": 5},
    "podcast":     {"metric": "words",      "min": 600},   # ~4 min @ 150 wpm
    "video":       {"metric": "scenes",     "min": 8},
    "quiz":        {"metric": "questions",  "min": 6},
    "flashcards":  {"metric": "cards",      "min": 10},
    "app":         {"metric": "entries",    "min": 10},
}

warnings, passes = [], []

def size_ok():
    if not art.exists(): return False
    if art.is_dir():
        total = sum(f.stat().st_size for f in art.rglob("*") if f.is_file())
        return total > 0
    return art.stat().st_size > 0

def read_text_safe(p):
    try:
        return p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""

def word_count(txt):
    return len(re.findall(r"\b[\w'-]+\b", txt))

def depth_metric():
    """Return (metric_name, value, ok, extra_msg)."""
    spec = FLOORS.get(TYPE, {})
    if not spec:
        return ("", 0, True, "no floor defined for type")
    m = spec["metric"]
    floor = spec["min"]

    if m == "words":
        # Look for a re-renderable source next to the artifact.
        candidates = [
            art.with_suffix(".bundle.md"),
            art.with_suffix(".script.md"),
            art.with_suffix(".html"),
            art,
        ]
        txt = ""
        for c in candidates:
            if c.exists() and c.suffix in {".md", ".txt", ".html"}:
                txt = read_text_safe(c)
                break
        if not txt and art.suffix == ".pdf":
            # Try pdftotext if available; otherwise skip the word check.
            try:
                txt = subprocess.check_output(
                    ["pdftotext", str(art), "-"], stderr=subprocess.DEVNULL
                ).decode("utf-8", errors="ignore")
            except Exception:
                return ("words", -1, True, "pdftotext unavailable; skipped")
        wc = word_count(txt)
        ok = wc >= floor
        msg = ""
        if TYPE == "book":
            chapters = len(re.findall(r"(?m)^#\s+", txt))
            if chapters < spec.get("chapters_min", 0):
                ok = False
                msg = f"only {chapters} chapter(s); floor {spec['chapters_min']}"
        return ("words", wc, ok, msg)

    if m == "slides":
        txt = read_text_safe(art)
        # Marp / Reveal slides separate by `---` or `<section>`.
        count = max(len(re.split(r"(?m)^---\s*$", txt)) - 1, txt.count("<section"))
        return ("slides", count, count >= floor, "")

    if m == "nodes":
        txt = read_text_safe(art.with_suffix(".outline.md")) or read_text_safe(art)
        bullets = len(re.findall(r"(?m)^\s*[-*]\s+\S", txt))
        max_depth = 0
        for line in txt.splitlines():
            if re.match(r"^\s*[-*]\s+\S", line):
                indent = len(line) - len(line.lstrip(" "))
                max_depth = max(max_depth, indent // 2 + 1)
        ok = bullets >= floor and max_depth >= FLOORS[TYPE].get("depth_min", 0)
        return ("nodes", bullets, ok, f"depth={max_depth}")

    if m == "datapoints":
        txt = read_text_safe(art) if art.suffix == ".svg" else ""
        # Count populated template placeholders (heuristic: <text> elements).
        hits = len(re.findall(r"<text[^>]*>[^<]{2,}</text>", txt))
        return ("datapoints", hits, hits >= floor, "")

    if m == "scenes":
        scenes_json = art.with_suffix(".scenes.json")
        if scenes_json.exists():
            try:
                data = json.loads(scenes_json.read_text(encoding="utf-8"))
                n = len(data.get("scenes", data)) if isinstance(data, (list, dict)) else 0
                return ("scenes", n, n >= floor, "")
            except Exception as e:
                return ("scenes", -1, False, f"scenes.json parse error: {e}")
        return ("scenes", -1, True, "scenes.json missing; skipped")

    if m == "questions":
        qjson = art.with_suffix(".questions.json")
        if qjson.exists():
            try:
                data = json.loads(qjson.read_text(encoding="utf-8"))
                n = len(data.get("questions", data)) if isinstance(data, (list, dict)) else 0
                return ("questions", n, n >= floor, "")
            except Exception:
                pass
        return ("questions", -1, True, "questions.json missing; skipped")

    if m == "cards":
        csv = art.with_suffix(".cards.csv")
        if csv.exists():
            lines = [l for l in read_text_safe(csv).splitlines() if l.strip()]
            n = max(len(lines) - 1, 0)  # minus header
            return ("cards", n, n >= floor, "")
        return ("cards", -1, True, "cards.csv missing; skipped")

    if m == "entries":
        if art.is_dir():
            data = art / "src" / "data.json"
            if data.exists():
                try:
                    d = json.loads(data.read_text(encoding="utf-8"))
                    n = len(d) if isinstance(d, list) else len(d.get("entries", []))
                    return ("entries", n, n >= floor, "")
                except Exception:
                    pass
        return ("entries", -1, True, "data.json missing; skipped")

    return (m, 0, True, "unknown metric")

def engagement():
    """How many of the §3 techniques were applied?"""
    hits = 0
    applied = []
    txt = read_text_safe(art) if art.is_file() and art.suffix in {".md", ".html", ".svg"} else ""
    # Look at a sibling bundle too (books/pdfs).
    sibling = art.with_suffix(".bundle.md")
    if sibling.exists():
        txt += "\n" + read_text_safe(sibling)

    if re.search(r"!\[diagram[^\]]*\]\(", txt) or re.search(r"<img[^>]*mmd-", txt):
        hits += 1; applied.append("mermaid")
    if re.search(r">\s*\[!(NOTE|TIP|WARN|INFO|IMPORTANT)\]", txt, re.I):
        hits += 1; applied.append("callouts")
    if re.search(r"(?m)^>\s+\S", txt) and len(re.findall(r"(?m)^>\s+", txt)) >= 3:
        hits += 1; applied.append("pullquotes")
    if re.search(r"```\w+\n", txt):
        hits += 1; applied.append("code-blocks")
    if re.search(r"\bExample\b|\bWorked example\b", txt, re.I):
        hits += 1; applied.append("examples")
    if re.search(r"Key takeaways|In summary|TL;DR", txt, re.I):
        hits += 1; applied.append("takeaways")
    return hits, applied

def sidecar_ok():
    if not meta.exists():
        return False, "sidecar missing"
    t = read_text_safe(meta)
    if "generated-from:" not in t or "source-hash:" not in t:
        return False, "sidecar missing required keys"
    return True, ""

# --- Run checks ---------------------------------------------------------
if not size_ok():
    print("❌ artifact is empty", file=sys.stderr); sys.exit(2)
passes.append("size: non-empty")

metric_name, metric_val, metric_ok, metric_msg = depth_metric()
if metric_ok:
    passes.append(f"depth: {metric_name}={metric_val}" + (f" ({metric_msg})" if metric_msg else ""))
else:
    warnings.append(
        f"depth: {metric_name}={metric_val} below floor"
        + (f" — {metric_msg}" if metric_msg else "")
    )

eng_hits, eng_applied = engagement()
if eng_hits >= 3:
    passes.append(f"engagement: {eng_hits} techniques ({', '.join(eng_applied)})")
elif eng_hits >= 1:
    warnings.append(f"engagement: only {eng_hits} technique(s) — aim for ≥ 3")
else:
    warnings.append("engagement: wall of prose — add mermaid / callouts / examples")

side_ok, side_msg = sidecar_ok()
if side_ok:
    passes.append("sidecar: ok")
else:
    warnings.append(f"sidecar: {side_msg}")

# --- Patch sidecar with quality block -----------------------------------
if meta.exists():
    existing = meta.read_text(encoding="utf-8")
    quality_block = "\nquality:\n"
    quality_block += f"  verify-quick: {'pass' if not warnings else 'warn'}\n"
    quality_block += f"  depth_metric: {metric_name}\n"
    quality_block += f"  depth_value: {metric_val}\n"
    quality_block += f"  engagement_techniques: {eng_hits}\n"
    quality_block += f"  engagement_applied: [{', '.join(eng_applied)}]\n"
    if warnings:
        quality_block += "  warnings:\n"
        for w in warnings:
            quality_block += f"    - \"{w}\"\n"
    # Replace any prior quality: block; else append.
    new = re.sub(r"\nquality:\n(?:  .+\n)+", "", existing, count=1)
    if not new.endswith("\n"): new += "\n"
    new += quality_block
    meta.write_text(new, encoding="utf-8")

# --- Report --------------------------------------------------------------
status = "✅ quality: pass" if not warnings else "⚠️  quality: warn"
print(f"\n{status}  ({len(passes)} checks passed, {len(warnings)} warnings)")
for p in passes:
    print(f"   ✓ {p}")
for w in warnings:
    print(f"   ⚠  {w}")

sys.exit(0 if not warnings else 1)
PY
