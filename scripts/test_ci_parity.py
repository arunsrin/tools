#!/usr/bin/env python3
"""
Validates CI Parity: Dynamically discovers all `scripts/test_*.py` suites and
ensures both GitHub Actions CI (`.github/workflows/test.yml`) and local test runners
(`scripts/test.ps1`, `scripts/test.sh`) execute every required check and test script.
"""
import os
import sys

# Ensure UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(ROOT_DIR, "scripts")
WORKFLOW_FILE = os.path.join(ROOT_DIR, ".github", "workflows", "test.yml")
PS1_FILE = os.path.join(SCRIPTS_DIR, "test.ps1")
SH_FILE = os.path.join(SCRIPTS_DIR, "test.sh")


def discover_python_tests() -> list[str]:
    return sorted(
        f for f in os.listdir(SCRIPTS_DIR)
        if f.startswith("test_") and f.endswith(".py") and os.path.isfile(os.path.join(SCRIPTS_DIR, f))
    )


def main():
    targets = [
        (".github/workflows/test.yml", WORKFLOW_FILE),
        ("scripts/test.ps1", PS1_FILE),
        ("scripts/test.sh", SH_FILE),
    ]

    contents: dict[str, str] = {}
    for label, path in targets:
        if not os.path.exists(path):
            print(f"Error: Required runner file not found at {path}", file=sys.stderr)
            sys.exit(1)
        with open(path, "r", encoding="utf-8") as f:
            contents[label] = f.read()

    core_checks = [
        ("npm run lint", "ESLint static analysis check"),
        ("npm run coverage", "Vitest test suite with coverage"),
        ("npm run build", "TypeScript compilation & Vite production build"),
    ]

    discovered_scripts = discover_python_tests()
    if not discovered_scripts:
        print("Error: No scripts/test_*.py files discovered.", file=sys.stderr)
        sys.exit(1)

    dynamic_checks = [
        (script_name, f"Python verification suite ({script_name})")
        for script_name in discovered_scripts
    ]

    all_checks = core_checks + dynamic_checks
    failures = []

    for label, text in contents.items():
        for snippet, desc in all_checks:
            if snippet not in text:
                failures.append(f"  - [{label}] Missing {desc} ('{snippet}')")

    if failures:
        print("❌ CI Parity Failure! Local runners and GitHub Actions CI are out of sync:", file=sys.stderr)
        for failure in failures:
            print(failure, file=sys.stderr)
        sys.exit(1)

    print(
        f"✓ CI Parity verified: All {len(core_checks)} core checks and "
        f"{len(discovered_scripts)} discovered Python test script(s) "
        f"({', '.join(discovered_scripts)}) are aligned across "
        f".github/workflows/test.yml, scripts/test.ps1, and scripts/test.sh."
    )


if __name__ == "__main__":
    main()
