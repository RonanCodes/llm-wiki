#!/usr/bin/env bash
# score-rubric.sh — score an artifact against a per-type YAML rubric.
#
# Usage:
#   score-rubric.sh <type> <artifact-path> <sidecar-path> [--human|--markdown|--json]
#
# Reads:
#   .claude/skills/rubric/types/<type>.yaml
#
# Writes:
#   <sidecar>'s `rubric:` block (idempotent — replaces any existing block)
#
# Output modes:
#   --human    (default) Coloured pass/warn/fail report.
#   --markdown Emits a markdown report on stdout.
#   --json     Emits the full score structure as JSON on stdout.
#
# Exit code: 0 = pass, 1 = warn, 2 = fail (any hard-gate failure).

set -euo pipefail

TYPE="${1:-}"
ART="${2:-}"
META="${3:-}"
MODE="${4:---human}"

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUBRIC_FILE="$SKILL_DIR/types/${TYPE}.yaml"

if [ -z "$TYPE" ] || [ -z "$ART" ] || [ -z "$META" ]; then
  echo "usage: score-rubric.sh <type> <artifact-path> <sidecar-path> [--human|--markdown|--json]" >&2
  exit 2
fi
if [ ! -f "$RUBRIC_FILE" ]; then
  echo "score-rubric: no rubric defined for type '$TYPE' (looking for $RUBRIC_FILE)" >&2
  exit 2
fi
if [ ! -e "$ART" ]; then
  echo "score-rubric: artifact missing: $ART" >&2
  exit 2
fi

# Need PyYAML for parsing YAML rubric. Lazy-install if missing.
python3 -c "import yaml" 2>/dev/null || {
  echo "score-rubric: installing PyYAML…" >&2
  python3 -m pip install --quiet --user pyyaml 2>/dev/null || pip3 install --quiet --user pyyaml 2>/dev/null
}

python3 - "$TYPE" "$ART" "$META" "$RUBRIC_FILE" "$MODE" <<'PY'
import sys, os, re, json, pathlib, datetime, subprocess
import yaml  # PyYAML

TYPE, ART, META, RUBRIC_FILE, MODE = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4], sys.argv[5]
art = pathlib.Path(ART)
meta = pathlib.Path(META)

rubric = yaml.safe_load(pathlib.Path(RUBRIC_FILE).read_text())

def read_text_safe(p):
    try:
        return p.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""

def get_bundle(art_path):
    """Resolve the bundle.md sibling for word/regex measurements."""
    candidates = [
        art_path.with_suffix(".bundle.md"),
        art_path.with_suffix(".html"),
    ]
    for c in candidates:
        if c.exists():
            return c
    # Fall back to pdftotext for PDFs
    if art_path.suffix == ".pdf":
        try:
            txt = subprocess.check_output(["pdftotext", str(art_path), "-"],
                                          stderr=subprocess.DEVNULL).decode("utf-8", errors="ignore")
            tmp = art_path.with_suffix(".pdftext.tmp")
            tmp.write_text(txt)
            return tmp
        except Exception:
            return None
    return None

def get_meta_field(meta_path, dotted_key):
    """Extract a dotted field from sidecar YAML."""
    if not meta_path.exists():
        return None
    try:
        data = yaml.safe_load(meta_path.read_text())
    except Exception:
        return None
    cur = data or {}
    for k in dotted_key.split("."):
        if not isinstance(cur, dict): return None
        cur = cur.get(k)
        if cur is None: return None
    return cur

bundle_path = get_bundle(art)
bundle_text = read_text_safe(bundle_path) if bundle_path else ""

# ============================================================
# Measurement functions — keyed by `how_measured` in the YAML.
# ============================================================

def m_depth_book(args):
    floor_words = args.get("word_floor", 3000)
    floor_chap = args.get("chapter_floor", 3)
    words = len(re.findall(r"\b[\w'-]+\b", bundle_text))
    chapters = len(re.findall(r"(?m)^#\s+", bundle_text))
    ok = words >= floor_words and chapters >= floor_chap
    return {"score": {"words": words, "chapters": chapters},
            "verdict": "pass" if ok else ("warn" if words >= floor_words//1.5 and chapters >= max(floor_chap-1,1) else "fail"),
            "details": f"words={words}, chapters={chapters}"}

def m_blacklist_scan(args):
    blacklist = args.get("blacklist", [])
    target = args.get("target", "bundle.md")
    text = bundle_text if target == "bundle.md" else read_text_safe(art)
    hits = []
    for pat in blacklist:
        # Treat as regex (callers either use literal strings — which are valid regex —
        # or word-bounded regex like \bdelve\b).
        try:
            matches = re.findall(pat, text, re.IGNORECASE)
        except re.error:
            matches = re.findall(re.escape(pat), text, re.IGNORECASE)
        if matches:
            hits.append({"pattern": pat, "count": len(matches)})
    total_hits = sum(h["count"] for h in hits)
    return {"score": total_hits,
            "verdict": "pass" if total_hits == 0 else ("warn" if total_hits <= 2 else "fail"),
            "details": ", ".join(f"{h['pattern']!r}×{h['count']}" for h in hits[:5]) or "no hits"}

def m_voice_signatures(args):
    """Per-theme signature regex check."""
    sigs = args.get("signatures", {})
    theme_field = args.get("theme_field", "theme")
    theme = get_meta_field(meta, theme_field) or "observatory"
    theme_sigs = sigs.get(theme, {})
    if not theme_sigs:
        return {"score": "no signatures defined", "verdict": "pass", "details": f"theme={theme}, no checks"}
    matched, missed = [], []
    for sig in theme_sigs.get("present", []):
        if isinstance(sig, dict):
            pat = sig.get("regex")
            count_spec = sig.get("count", ">=1")
            if pat:
                count = len(re.findall(pat, bundle_text))
                if check_count(count, count_spec):
                    matched.append(f"{pat[:40]}×{count}")
                else:
                    missed.append(f"{pat[:40]} ({count}, want {count_spec})")
        elif isinstance(sig, str):
            # Treat as a literal description, not a regex
            matched.append(sig)
    for sig in theme_sigs.get("absent", []):
        if isinstance(sig, dict):
            pat = sig.get("regex")
            count = len(re.findall(pat, bundle_text)) if pat else 0
            if count == 0:
                matched.append(f"absent: {pat[:40]}")
            else:
                missed.append(f"absent: {pat[:40]} (×{count}, want 0)")
    total = len(matched) + len(missed)
    if total == 0:
        return {"score": "no checks", "verdict": "pass", "details": ""}
    pct = len(matched) / total
    return {"score": pct,
            "verdict": "pass" if pct >= 1.0 else ("warn" if pct >= 0.7 else "fail"),
            "details": f"theme={theme}, {len(matched)}/{total} signatures match. Missed: {missed[:3]}"}

def check_count(actual, spec):
    """Parse a spec like '>=1', '==0', '<=2' against actual."""
    spec = str(spec).strip()
    m = re.match(r"^(>=|<=|==|>|<)(\d+)$", spec)
    if not m:
        return False
    op, n = m.group(1), int(m.group(2))
    if op == ">=": return actual >= n
    if op == "<=": return actual <= n
    if op == "==": return actual == n
    if op == ">":  return actual > n
    if op == "<":  return actual < n
    return False

def m_jaccard(args):
    """Title-vs-topic Jaccard. Reads topic from sidecar."""
    topic = get_meta_field(meta, "topic") or ""
    titles = re.findall(r"(?m)^#\s+(.+)$", bundle_text)
    if not topic or not titles:
        return {"score": 0, "verdict": "warn", "details": f"topic={topic!r} titles={len(titles)}"}
    def tokens(s):
        return set(w.lower() for w in re.findall(r"\b\w+\b", s) if len(w) > 2)
    topic_words = tokens(topic)
    title_words = set()
    for t in titles:
        title_words |= tokens(t)
    inter = topic_words & title_words
    union = topic_words | title_words
    j = len(inter) / len(union) if union else 0
    return {"score": round(j, 2),
            "verdict": "pass" if j >= 0.5 else ("warn" if j >= 0.3 else "fail"),
            "details": f"jaccard={j:.2f}, topic_words={len(topic_words)}, title_words={len(title_words)}"}

def m_template_structure(args):
    required = args.get("required", [])
    missing = []
    if "chapter_opener_per_chapter" in required:
        chapters = len(re.findall(r"(?m)^#\s+", bundle_text))
        openers = len(re.findall(r'class="chapter-opener"', bundle_text))
        if chapters > 0 and openers < chapters - 1:  # -1 to allow intro
            missing.append(f"chapter_opener: {openers}/{chapters}")
    if "key_takeaways_per_chapter" in required:
        chapters = len(re.findall(r"(?m)^#\s+", bundle_text))
        takeaways = len(re.findall(r'class="key-takeaways"|Key takeaways', bundle_text))
        if chapters > 0 and takeaways < chapters - 1:
            missing.append(f"key_takeaways: {takeaways}/{chapters}")
    if "source_refs_present" in required:
        refs = len(re.findall(r'source-ref|^## Sources|file_path:\d', bundle_text, re.MULTILINE))
        if refs == 0:
            missing.append("no source-refs found")
    return {"score": len(required) - len(missing),
            "verdict": "pass" if not missing else ("warn" if len(missing) == 1 else "fail"),
            "details": f"missing: {missing}" if missing else "all present"}

def m_cover_quality(args):
    field = args.get("sidecar_field", "cover.path")
    min_bytes = args.get("min_bytes", 100000)
    rel_path = get_meta_field(meta, field)
    if not rel_path:
        return {"score": 0, "verdict": "warn", "details": "no cover path in sidecar"}
    abs_path = pathlib.Path(meta.parent.parent.parent / rel_path) if not pathlib.Path(rel_path).is_absolute() else pathlib.Path(rel_path)
    # Try sidecar's parent dir + relative
    if not abs_path.exists():
        candidates = [
            meta.parent / pathlib.Path(rel_path).name,
            pathlib.Path(rel_path),
        ]
        for c in candidates:
            if c.exists():
                abs_path = c; break
    if not abs_path.exists():
        return {"score": 0, "verdict": "warn", "details": f"cover not found at {rel_path}"}
    size = abs_path.stat().st_size
    return {"score": size,
            "verdict": "pass" if size >= min_bytes else ("warn" if size >= min_bytes // 2 else "fail"),
            "details": f"{size} bytes ({abs_path.name})"}

def m_pdf_layout(args):
    if art.suffix != ".pdf":
        return {"score": 0, "verdict": "pass", "details": "not a PDF; skipped"}
    try:
        out = subprocess.check_output(["pdftotext", "-layout", str(art), "-"],
                                      stderr=subprocess.DEVNULL).decode("utf-8", errors="ignore")
        # Widow detection: count single-word lines on page boundaries (form-feed \f)
        pages = out.split("\f")
        widow_count = 0
        for p in pages:
            lines = [l.strip() for l in p.splitlines() if l.strip()]
            if lines and len(lines[-1].split()) <= 2:
                widow_count += 1
        widow_pct = (widow_count / max(len(pages), 1)) * 100
        threshold = args.get("widow_threshold_pct", 5)
        return {"score": round(widow_pct, 1),
                "verdict": "pass" if widow_pct <= threshold else ("warn" if widow_pct <= threshold * 2 else "fail"),
                "details": f"widow_pct={widow_pct:.1f}%, pages={len(pages)}"}
    except FileNotFoundError:
        return {"score": -1, "verdict": "warn", "details": "pdftotext unavailable"}
    except Exception as e:
        return {"score": -1, "verdict": "warn", "details": f"layout check failed: {e}"}

def m_paragraph_coverage(args):
    """Stub — full impl reads source pages via generated-from sidecar field."""
    sources = get_meta_field(meta, "generated-from") or []
    sample = args.get("sample_size", 20)
    threshold = args.get("threshold", 0.8)
    if not sources:
        return {"score": -1, "verdict": "warn", "details": "no generated-from in sidecar"}
    paragraphs = [p for p in re.split(r"\n\s*\n", bundle_text) if len(p.split()) >= 20]
    if not paragraphs:
        return {"score": 0, "verdict": "warn", "details": "no substantial paragraphs"}
    import random
    random.seed(42)
    samples = random.sample(paragraphs, min(sample, len(paragraphs)))
    source_text = ""
    for s in sources[:10]:  # Cap to avoid huge IO
        sp = pathlib.Path(s)
        if not sp.is_absolute():
            sp = pathlib.Path("/Users/ronan/Dev/ai-projects/llm-wiki") / s
        if sp.exists():
            source_text += "\n" + read_text_safe(sp)
    hits = 0
    for para in samples:
        # Take a 10-word substring from the middle
        words = para.split()
        if len(words) < 10: continue
        mid = len(words) // 2
        substr = " ".join(words[mid-5:mid+5])
        if substr in source_text:
            hits += 1
    pct = hits / len(samples) if samples else 0
    return {"score": round(pct, 2),
            "verdict": "pass" if pct >= threshold else ("warn" if pct >= threshold * 0.75 else "fail"),
            "details": f"{hits}/{len(samples)} sampled paragraphs traceable to sources"}

def m_engagement_count(args):
    targets = args.get("targets_per_theme", {})
    theme_field = args.get("theme_field", "theme")
    theme = get_meta_field(meta, theme_field) or "observatory"
    target = targets.get(theme, 5)
    techniques = {
        "mermaid":          r"!\[diagram[^\]]*\]\(",
        "callouts":         r'(blockquote\.tip|class="(tip|note|warn|remember|technical|brain)")',
        "dropcap":          r'class="dropcap"',
        "cheatsheet":       r'class="cheatsheet"',
        "key_takeaways":    r'class="key-takeaways"',
        "chapter_opener":   r'class="chapter-opener"',
        "in_this_chapter":  r"In This Chapter|This chapter covers",
        "listing_numbered": r"Listing \d",
        "qa_block":         r'class="qa"|There are no Dumb Questions',
        "exercise":         r'class="exercise"|Sharpen Your Pencil|Brain Power',
        "source_refs":      r"source-ref|file_path:\d",
        "pull_quote":       r'class="pullquote"',
        "epigraph":         r'class="epigraph"',
    }
    requested = args.get("techniques", list(techniques.keys()))
    present = []
    for t in requested:
        pat = techniques.get(t)
        if pat and re.search(pat, bundle_text):
            present.append(t)
    count = len(present)
    return {"score": count,
            "verdict": "pass" if count >= target else ("warn" if count >= target * 0.75 else "fail"),
            "details": f"theme={theme}, {count}/{target} techniques present: {', '.join(present[:6])}"}

# Function lookup table
MEASURE_FUNCS = {
    "depth_book":          m_depth_book,
    "blacklist_scan":      m_blacklist_scan,
    "voice_signatures":    m_voice_signatures,
    "jaccard":             m_jaccard,
    "template_structure":  m_template_structure,
    "cover_quality":       m_cover_quality,
    "pdf_layout":          m_pdf_layout,
    "paragraph_coverage":  m_paragraph_coverage,
    "engagement_count":    m_engagement_count,
}

# ============================================================
# Run all dimensions
# ============================================================
results = []
for dim in rubric.get("dimensions", []):
    func = MEASURE_FUNCS.get(dim["how_measured"])
    if not func:
        results.append({"name": dim["name"], "score": -1, "verdict": "warn",
                       "details": f"unknown how_measured: {dim['how_measured']}",
                       "hard_gate": dim.get("hard_gate", False)})
        continue
    try:
        out = func(dim.get("args", {}))
    except Exception as e:
        out = {"score": -1, "verdict": "warn", "details": f"measurement error: {e}"}
    results.append({
        "name": dim["name"],
        "score": out["score"],
        "verdict": out["verdict"],
        "details": out["details"],
        "hard_gate": dim.get("hard_gate", False),
        "weight": dim.get("weight", 1.0),
    })

# Compute overall
hard_failures = [r for r in results if r["hard_gate"] and r["verdict"] == "fail"]
warns = [r for r in results if r["verdict"] == "warn"]
fails = [r for r in results if r["verdict"] == "fail"]
if hard_failures:
    overall = "fail"
elif fails:
    overall = "fail"
elif warns:
    overall = "warn"
else:
    overall = "pass"

# Patch sidecar
if meta.exists():
    existing = meta.read_text(encoding="utf-8")
    # Strip any existing `rubric:` block (top-level only — assumes rubric: is followed by indented lines)
    existing = re.sub(r"\nrubric:\n(?:[ \t]+.+\n)+", "", existing, count=1)
    if not existing.endswith("\n"):
        existing += "\n"

    rubric_block = "\nrubric:\n"
    rubric_block += f"  type: {TYPE}\n"
    rubric_block += f"  version: {rubric.get('version', 1)}\n"
    rubric_block += f"  scored-at: {datetime.datetime.utcnow().isoformat(timespec='seconds')}Z\n"
    rubric_block += f"  overall: {overall}\n"
    rubric_block += f"  hard_failures: {[r['name'] for r in hard_failures]}\n"
    rubric_block += f"  warnings: {[r['name'] for r in warns]}\n"
    rubric_block += "  dimensions:\n"
    for r in results:
        rubric_block += f"    - name: {r['name']}\n"
        rubric_block += f"      score: {r['score']!r}\n"
        rubric_block += f"      verdict: {r['verdict']}\n"
        if r['details']:
            rubric_block += f"      details: {r['details']!r}\n"
    meta.write_text(existing + rubric_block, encoding="utf-8")

# ============================================================
# Output
# ============================================================
def fmt_verdict(v):
    return {"pass": "✓", "warn": "⚠", "fail": "✗"}.get(v, "?") + f" {v.upper():4s}"

if MODE == "--json":
    print(json.dumps({
        "type": TYPE, "version": rubric.get("version", 1), "overall": overall,
        "hard_failures": [r["name"] for r in hard_failures],
        "warnings": [r["name"] for r in warns],
        "dimensions": results,
    }, indent=2, default=str))
elif MODE == "--markdown":
    print(f"# Rubric Report — {TYPE}@{rubric.get('version', 1)}\n")
    print(f"**Artifact:** `{art.name}`")
    print(f"**Scored:** {datetime.datetime.utcnow().isoformat(timespec='seconds')}Z\n")
    print(f"## Overall: **{overall.upper()}**\n")
    print("| Dimension | Verdict | Score | Details |")
    print("|---|---|---|---|")
    for r in results:
        print(f"| {r['name']}{' (HARD GATE)' if r['hard_gate'] else ''} | {r['verdict']} | `{r['score']!r}` | {r['details']} |")
else:
    print(f"\n📊 Rubric: {TYPE}@{rubric.get('version', 1)}")
    print(f"   Artifact: {art.name}\n")
    for r in results:
        gate = "  (HARD GATE)" if r["hard_gate"] else ""
        print(f"   {fmt_verdict(r['verdict'])} {r['name']:24s} {gate}")
        if r['details']:
            print(f"        {r['details']}")
    print()
    badge = {"pass": "✅ PASS", "warn": "⚠️  WARN", "fail": "❌ FAIL"}[overall]
    print(f"Overall: {badge}")
    if hard_failures:
        print(f"Hard-gate failures: {[r['name'] for r in hard_failures]}")
    print()

# Exit code
sys.exit({"pass": 0, "warn": 1, "fail": 2}[overall])
PY
