#!/usr/bin/env bash
# resolve-wikilinks.sh — convert Obsidian [[wikilinks]] to italic inline text.
#
# Usage:
#   resolve-wikilinks.sh < input.md > output.md
#   cat input.md | resolve-wikilinks.sh
#
# Transformations:
#   [[page-name]]              → *page-name*
#   [[page-name|display text]] → *display text*
#
# This is the single source of truth for wikilink rendering across generate-*
# handlers. In Phase 2A-2B we render as italic inline text (portable across
# PDF, HTML, SVG). Phase 2C+ may layer internal anchors for formats that
# support them (e.g. `\hyperref` in LaTeX, `<a href>` in HTML).
#
# Do NOT copy the sed pattern into handlers — pipe through this helper.

set -euo pipefail
exec sed -E 's/\[\[([^|\]]+)\|([^\]]+)\]\]/*\2*/g; s/\[\[([^\]]+)\]\]/*\1*/g'
