#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 🔓 UNLOCK 2026 — Double-click to start!
# ═══════════════════════════════════════════════════════════════

cd "$(dirname "$0")"

# Check if node_modules exist
if [ ! -d "node_modules" ] || [ ! -d "apps/web/node_modules" ]; then
  echo "📦 Instalando dependências (só na primeira vez)..."
  npm install
fi

echo ""
echo "🚀 UNLOCK 2026 rodando em: http://localhost:3005"
echo "   Ctrl+C para parar"
echo ""

cd apps/web && npx vite --port 3005 --open
