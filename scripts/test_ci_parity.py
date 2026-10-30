#!/usr/bin/env python3
"""
Validates CI Parity: Ensures test and verification steps defined in local test scripts
are also executed in GitHub Actions CI (.github/workflows/test.yml).
"""
import os
import sys

# Ensure UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WORKFLOW_FILE = os.path.join(ROOT_DIR, ".github", "workflows", "test.yml")


def main():
    if not os.path.exists(WORKFLOW_FILE):
        print(f"Error: CI workflow not found at {WORKFLOW_FILE}", file=sys.stderr)
        sys.exit(1)

    with open(WORKFLOW_FILE, "r", encoding="utf-8") as f:
        workflow_content = f.read()

    required_checks = [
        ("npm run lint", "ESLint static analysis check"),
        ("npm run coverage", "Vitest test suite with coverage"),
        ("npm run build", "TypeScript compilation & Vite production build"),
        ("test_tools_structure.py", "Modular tool structure & spec validation"),
        ("test_cleanup_tooling.py", "Sprint cleanup tooling regression tests"),
    ]

    missing = []
    for snippet, desc in required_checks:
        if snippet not in workflow_content:
            missing.append(f"  - Missing {desc} ('{snippet}')")

    if missing:
        print("❌ CI Parity Failure! The following checks are missing from .github/workflows/test.yml:", file=sys.stderr)
        for m in missing:
            print(m, file=sys.stderr)
        sys.exit(1)

    print("✓ CI Parity verified: All local validation steps are present in GitHub Actions CI.")


if __name__ == "__main__":
    main()
