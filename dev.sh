#!/bin/bash
# LLM Wiki — Local development
# Runs both the Astro landing site and Starlight docs, then opens the browser.
# Usage: ./dev.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ASTRO_PORT=4321
STARLIGHT_PORT=4322

echo ""
echo "╔══════════════════════════════════════╗"
echo "║     LLM Wiki — Dev Servers          ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Kill any existing dev servers on these ports
lsof -ti:$ASTRO_PORT 2>/dev/null | xargs kill 2>/dev/null || true
lsof -ti:$STARLIGHT_PORT 2>/dev/null | xargs kill 2>/dev/null || true

# Start Astro landing site
echo "Starting Astro landing site on port $ASTRO_PORT..."
cd "$SCRIPT_DIR/site-astro"
pnpm dev --port $ASTRO_PORT &
ASTRO_PID=$!

# Start Starlight docs
echo "Starting Starlight docs on port $STARLIGHT_PORT..."
cd "$SCRIPT_DIR/site-starlight"
pnpm dev --port $STARLIGHT_PORT &
STARLIGHT_PID=$!

# Wait for servers to be ready
echo ""
echo "Waiting for servers..."
sleep 3

# Open the landing page
echo ""
echo "  Landing site:  http://localhost:$ASTRO_PORT/"
echo "  Starlight docs: http://localhost:$STARLIGHT_PORT/llm-wiki/docs/"
echo ""
open "http://localhost:$ASTRO_PORT/"

echo "Press Ctrl+C to stop both servers."
echo ""

# Trap Ctrl+C to kill both
trap "echo ''; echo 'Stopping servers...'; kill $ASTRO_PID $STARLIGHT_PID 2>/dev/null; exit 0" INT

# Wait for either to exit
wait
