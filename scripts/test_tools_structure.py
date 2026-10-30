#!/usr/bin/env python3
"""
Validates Modular Tool Structure and Specifications for Tools Hub:
- Every tool in `src/tools/<tool>` must have a SPEC.md specification document.
- Every tool must have automated test files (*.test.tsx or *.test.ts).
- Master SPEC.md must reference all active tools.
"""
import os
import sys

# Ensure UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS_DIR = os.path.join(ROOT_DIR, "src", "tools")
MASTER_SPEC = os.path.join(ROOT_DIR, "SPEC.md")


def main():
    if not os.path.exists(MASTER_SPEC):
        print(f"Error: Master specification not found at {MASTER_SPEC}", file=sys.stderr)
        sys.exit(1)

    with open(MASTER_SPEC, "r", encoding="utf-8") as f:
        master_spec_text = f.read()

    if not os.path.exists(TOOLS_DIR):
        print(f"Error: Tools directory not found at {TOOLS_DIR}", file=sys.stderr)
        sys.exit(1)

    tool_dirs = [
        d for d in os.listdir(TOOLS_DIR)
        if os.path.isdir(os.path.join(TOOLS_DIR, d)) and not d.startswith((".", "_"))
    ]

    errors = []
    print(f"Checking {len(tool_dirs)} modular tool(s) in {TOOLS_DIR}...")

    for tool in tool_dirs:
        tool_path = os.path.join(TOOLS_DIR, tool)
        files = os.listdir(tool_path)

        # 1. Check for SPEC.md
        if "SPEC.md" not in files:
            errors.append(f"Tool '{tool}' is missing its specification file ('SPEC.md').")

        # 2. Check for companion tests
        tests = [f for f in files if f.endswith(".test.tsx") or f.endswith(".test.ts")]
        if not tests:
            errors.append(f"Tool '{tool}' has no companion test files (*.test.tsx or *.test.ts).")

        # 3. Check for component implementation
        components = [f for f in files if f.endswith(".tsx") and not f.endswith(".test.tsx")]
        if not components:
            errors.append(f"Tool '{tool}' has no main component file (*.tsx).")

        # 4. Check that master SPEC.md mentions this tool
        if tool.lower() not in master_spec_text.lower():
            errors.append(f"Master SPEC.md does not reference tool '{tool}'.")

    if errors:
        print("❌ Tool Structure Validation Failed:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)

    print(f"✓ All {len(tool_dirs)} tool(s) comply with modular specification and testing standards.")


if __name__ == "__main__":
    main()
