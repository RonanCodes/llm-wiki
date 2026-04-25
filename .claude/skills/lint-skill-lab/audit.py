#!/usr/bin/env python3
"""Audit the skill-lab vault catalog against live production skill directories.

Three things are checked:
  1. Every catalog page with skill-status: implemented has an output: path
     that resolves to a real production skill directory.
  2. Every production skill directory has either a catalog page or a
     deliberate decision to leave it uncatalogued (we warn-only here).
  3. Catalog pages with skill-status: archived are surfaced for review.

Exit codes:
  0  clean (no broken pointers)
  1  broken pointers found
  2  catalog or production directory missing
"""

import re
import sys
from pathlib import Path

CATALOG = Path("/Users/ronan/Dev/ai-projects/llm-wiki/vaults/llm-wiki-skill-lab/wiki/skills")
RONAN = Path("/Users/ronan/Dev/ronan-skills/skills")
LLMWIKI = Path("/Users/ronan/Dev/ai-projects/llm-wiki/.claude/skills")

PATH_PREFIXES = [
    ("ronan-skills/skills/", RONAN),
    ("llm-wiki/.claude/skills/", LLMWIKI),
]


def resolve(out_value: str) -> Path | None:
    for prefix, base in PATH_PREFIXES:
        if out_value.startswith(prefix):
            return base / out_value[len(prefix):]
    return None


def main() -> int:
    if not CATALOG.is_dir():
        print(f"FATAL: catalog dir not found: {CATALOG}", file=sys.stderr)
        return 2

    ronan_set = {p.name for p in RONAN.iterdir() if p.is_dir()} if RONAN.is_dir() else set()
    llmwiki_set = {p.name for p in LLMWIKI.iterdir() if p.is_dir()} if LLMWIKI.is_dir() else set()

    catalogued: set[str] = set()
    broken: list[tuple[str, str]] = []
    archived: list[str] = []

    for fp in sorted(CATALOG.glob("*.md")):
        name = fp.stem
        catalogued.add(name)
        text = fp.read_text()

        st_m = re.search(r"^skill-status:\s*(\w+)$", text, re.M)
        out_m = re.search(r"^output:\s*(.+)$", text, re.M)

        status = st_m.group(1).strip() if st_m else "(none)"

        if status == "archived":
            archived.append(name)
            continue
        if status != "implemented":
            continue

        if not out_m:
            broken.append((name, "no output: field"))
            continue

        out_value = out_m.group(1).strip()
        target = resolve(out_value)
        if target is None:
            broken.append((name, f"unrecognised path format: '{out_value}'"))
            continue
        if not target.is_dir():
            broken.append((name, f"path does not exist: {out_value}"))

    missing_ronan = sorted(ronan_set - catalogued)
    missing_llmwiki = sorted(llmwiki_set - catalogued)

    print("=== Skill-lab catalog audit ===")
    print()
    print(f"Catalog pages:              {len(catalogued)}")
    print(f"  archived:                 {len(archived)}")
    print(f"  broken pointers:          {len(broken)}")
    print(f"Production skills (ronan):  {len(ronan_set)}")
    print(f"Production skills (llm-wiki):{len(llmwiki_set)}")
    print(f"Production not in catalog:  {len(missing_ronan) + len(missing_llmwiki)}")
    print()

    if broken:
        print("--- BROKEN POINTERS (action needed) ---")
        for name, reason in broken:
            print(f"  X {name}: {reason}")
        print()

    if archived:
        print("--- ARCHIVED (informational) ---")
        for name in archived:
            print(f"  - {name}")
        print()

    if missing_ronan or missing_llmwiki:
        print("--- PRODUCTION SKILLS NOT IN CATALOG (warn only) ---")
        print("Each entry needs a decision: catalog (if it has a research story or")
        print("filterable role per content-pipeline taxonomy), or leave uncatalogued.")
        print()
        if missing_ronan:
            print(f"  ronan-skills ({len(missing_ronan)}):")
            for n in missing_ronan:
                print(f"    - {n}")
        if missing_llmwiki:
            print(f"  llm-wiki ({len(missing_llmwiki)}):")
            for n in missing_llmwiki:
                print(f"    - {n}")
        print()

    if not broken:
        print("OK: all catalog pointers resolve to live production skills.")
    else:
        print(f"FAIL: {len(broken)} broken pointer(s).")

    return 1 if broken else 0


if __name__ == "__main__":
    sys.exit(main())
