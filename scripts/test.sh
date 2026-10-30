#!/usr/bin/env bash
# Strict test suite for Tools Hub (WSL / Linux / macOS)
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
ROOT_DIR="$(cd "$DIR/.." >/dev/null 2>&1 && pwd)"
cd "$ROOT_DIR"

PYTHON_CMD="python3"
if ! command -v python3 &>/dev/null; then
    PYTHON_CMD="python"
fi

echo "=== 1. TypeScript & Vite Production Build ==="
npm run build

echo -e "\n=== 2. ESLint Static Analysis ==="
npm run lint

echo -e "\n=== 3. Vitest Component & Unit Tests with Coverage ==="
npm run coverage

echo -e "\n=== 4. Validating CI Parity ==="
"$PYTHON_CMD" "$DIR/test_ci_parity.py"

echo -e "\n=== 5. Validating Modular Tool Structure & Specs ==="
"$PYTHON_CMD" "$DIR/test_tools_structure.py"

echo -e "\n=== 6. Validating Sprint Cleanup Tooling ==="
"$PYTHON_CMD" "$DIR/test_cleanup_tooling.py"

echo -e "\n==============================================="
echo " All strict verification checks passed (100% green)"
echo "==============================================="
