#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# UNLOCK 2026 — Auto Start Dev Server
# Double-click this file to start the app!
# ═══════════════════════════════════════════════════════════════

clear
echo ""
echo "  🔓 UNLOCK 2026 — Starting..."
echo "  ═══════════════════════════════"
echo ""

# Go to project root (where this script lives)
cd "$(dirname "$0")"

# Check if node_modules exist, install if not
if [ ! -d "node_modules" ]; then
  echo "  📦 First run — installing dependencies..."
  echo ""
  npm install
  echo ""
fi

if [ ! -d "apps/web/node_modules" ]; then
  echo "  📦 Installing web dependencies..."
  echo ""
  cd apps/web && npm install && cd ../..
  echo ""
fi

echo "  🚀 Starting dev server..."
echo "  Open your browser at: http://localhost:3005"
echo ""
echo "  Press Ctrl+C to stop."
echo "  ═══════════════════════════════"
echo ""

# Start the dev server
cd apps/web && npx vite --port 3005 --open
