#!/usr/bin/env bash
# Cross-Platform Cleanup Script for Tools Hub (WSL / Linux / macOS)
# Usage: ./scripts/cleanup.sh [feature-name] [--task-id <id>] [--no-merge] [--merge-method <squash|merge|rebase>] [--base <branch>]
set -euo pipefail
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)"
PYTHON_CMD="python3"
if ! command -v python3 &>/dev/null; then
    PYTHON_CMD="python"
fi
exec "$PYTHON_CMD" "$DIR/tool_sprint.py" cleanup "$@"
