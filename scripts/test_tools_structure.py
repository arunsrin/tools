#!/usr/bin/env python3
"""
Validates Modular Tool Structure and Specifications for Tools Hub:
- Every tool in `src/tools/<tool>` must have a SPEC.md specification document.
- Every tool must have automated test files (*.test.tsx or *.test.ts).
- Master SPEC.md must reference all active tools.
"""
import os
import re
import sys

# Ensure UTF-8 output
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOOLS_DIR = os.path.join(ROOT_DIR, "src", "tools")
MASTER_SPEC = os.path.join(ROOT_DIR, "SPEC.md")
README_FILE = os.path.join(ROOT_DIR, "README.md")
ROUTES_FILE = os.path.join(ROOT_DIR, "src", "routes.ts")


def main():
    if not os.path.exists(MASTER_SPEC):
        print(f"Error: Master specification not found at {MASTER_SPEC}", file=sys.stderr)
        sys.exit(1)

    with open(MASTER_SPEC, "r", encoding="utf-8") as f:
        master_spec_text = f.read()

    if not os.path.exists(README_FILE):
        print(f"Error: README.md not found at {README_FILE}", file=sys.stderr)
        sys.exit(1)

    with open(README_FILE, "r", encoding="utf-8") as f:
        readme_text = f.read()

    routes_text = ""
    if os.path.exists(ROUTES_FILE):
        with open(ROUTES_FILE, "r", encoding="utf-8") as f:
            routes_text = f.read()

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

        # 5. Check that README.md mentions this tool
        if tool.lower() not in readme_text.lower():
            errors.append(f"README.md does not reference tool '{tool}'.")

        # 6. Check that src/routes.ts registers direct route for this tool
        if routes_text and tool.lower() not in routes_text.lower():
            errors.append(f"src/routes.ts does not register direct route for tool '{tool}'.")

    # 7. Check README Featured Tools links and alphabetical ordering
    featured_match = re.search(
        r"##\s*🚀?\s*Featured Tools\s*\n(.*?)(?=\n##|\n---|\Z)", readme_text, re.DOTALL
    )
    featured_titles = []
    if not featured_match:
        errors.append("README.md is missing 'Featured Tools' section.")
    else:
        featured_lines = [
            line.strip()
            for line in featured_match.group(1).strip().splitlines()
            if line.strip().startswith("-")
        ]
        for line in featured_lines:
            m = re.match(r"^-\s*\*\*\[([^\]]+)\]\(([^)]+)\)\*\*:\s*(.+)$", line)
            if not m:
                errors.append(f"README.md featured tool line format invalid: '{line}'")
                continue
            title, url, _ = m.groups()
            featured_titles.append(title.strip())
            if not url.startswith("https://tools.arunsr.in/"):
                errors.append(
                    f"README.md tool '{title}' must link to live deployed URL (got: '{url}')"
                )

        if featured_titles:
            sorted_titles = sorted(featured_titles, key=lambda s: s.lower())
            if featured_titles != sorted_titles:
                errors.append(
                    f"README.md Featured Tools are not in alphabetical order. Expected: {sorted_titles}, got: {featured_titles}"
                )

    # 8. Check src/App.tsx tool cards alphabetical ordering and parity
    app_file = os.path.join(ROOT_DIR, "src", "App.tsx")
    if os.path.exists(app_file):
        with open(app_file, "r", encoding="utf-8") as f:
            app_text = f.read()

        grid_match = re.search(r'<main className="tools-grid">\s*(.*?)\s*</main>', app_text, re.DOTALL)
        if grid_match:
            h2_titles = re.findall(r"<h2>([^<]+)</h2>", grid_match.group(1))
            active_tool_titles = [t.strip() for t in h2_titles if t.strip() != "More Tools"]
            sorted_app_titles = sorted(active_tool_titles, key=lambda s: s.lower())
            if active_tool_titles != sorted_app_titles:
                errors.append(
                    f"src/App.tsx tool cards are not in alphabetical order. Expected: {sorted_app_titles}, got: {active_tool_titles}"
                )
            if featured_titles and active_tool_titles != featured_titles:
                errors.append(
                    f"Tool order mismatch between README.md ({featured_titles}) and src/App.tsx ({active_tool_titles})"
                )

    if errors:
        print("❌ Tool Structure Validation Failed:", file=sys.stderr)
        for e in errors:
            print(f"  - {e}", file=sys.stderr)
        sys.exit(1)

    print(f"✓ All {len(tool_dirs)} tool(s) comply with modular specification and testing standards.")


if __name__ == "__main__":
    main()
