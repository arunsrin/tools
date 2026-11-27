#!/usr/bin/env python3
"""
Validates Modular Tool Structure, Governance Guardrails, and Specifications for Tools Hub:
- Every tool in `src/tools/<tool>` must have `<ToolName>.tsx`, `<ToolName>.css`,
  `<ToolName>.test.tsx`, and `SPEC.md` (with Overview, Functional Requirements,
  and Acceptance Criteria sections).
- Master `SPEC.md`, `README.md` (`Featured Tools` & `Project Structure`), `src/routes.ts`,
  `src/App.tsx`, and `src/App.test.tsx` must register and test every tool consistently.
- Structural guardrails across `src/tools/<tool>/`:
  * No cross-tool imports (`src/shared/` and `src/styles/` are allowed).
  * Single default export per `.tsx` component file (Rule 25).
  * No blocking browser dialogs (`alert`, `confirm`, `prompt`).
  * No unguarded `localStorage.` calls outside `try/catch` (prefer `usePersistedState`).
  * Tool CSS must not redeclare `:root {`, must not define unprefixed `.back-btn`,
    and `<ToolName>.css` must consume design tokens (`var(--`).
  * `<ToolName>.tsx` must use `ToolHeader` or standardized `"← Back to Tools Hub"` navigation.
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
SRC_DIR = os.path.join(ROOT_DIR, "src")
TOOLS_DIR = os.path.join(SRC_DIR, "tools")
MASTER_SPEC = os.path.join(ROOT_DIR, "SPEC.md")
README_FILE = os.path.join(ROOT_DIR, "README.md")
ROUTES_FILE = os.path.join(SRC_DIR, "routes.ts")
APP_FILE = os.path.join(SRC_DIR, "App.tsx")
APP_TEST_FILE = os.path.join(SRC_DIR, "App.test.tsx")

REGEX_PRECEDERS = set("=([,:;!&|?{}~^+-*%<>")


def strip_css_comments(text: str) -> str:
    """Replace CSS /* ... */ comments with spaces while preserving newlines."""
    return re.sub(
        r"/\*.*?\*/",
        lambda m: "".join("\n" if ch == "\n" else " " for ch in m.group(0)),
        text,
        flags=re.DOTALL,
    )


def mask_ts_code(text: str, keep_strings: bool = False) -> str:
    """
    Mask comments (and optionally string/template/regex literal bodies) in TS/TSX
    while preserving newlines and character offsets.
    When `keep_strings=False`, template expression blocks `${...}` remain unmasked
    so code inside them is still checked.
    """
    out: list[str] = []
    n = len(text)
    i = 0
    last_sig_token = ""
    template_expr_depths: list[int] = []

    def push_masked(start: int, end: int) -> None:
        for ch in text[start:end]:
            out.append("\n" if ch == "\n" else " ")

    while i < n:
        ch = text[i]
        nxt = text[i + 1] if i + 1 < n else ""

        # Line comment
        if ch == "/" and nxt == "/":
            end = text.find("\n", i)
            if end == -1:
                end = n
            push_masked(i, end)
            i = end
            continue

        # Block comment
        if ch == "/" and nxt == "*":
            end = text.find("*/", i + 2)
            end = n if end == -1 else end + 2
            push_masked(i, end)
            i = end
            continue

        # Single or double quoted string
        if ch in ("'", '"'):
            quote = ch
            j = i + 1
            while j < n:
                if text[j] == "\\":
                    j += 2
                    continue
                if text[j] == quote or text[j] == "\n":
                    j += 1
                    break
                j += 1
            if keep_strings:
                out.append(text[i:j])
            else:
                out.append(quote)
                push_masked(i + 1, j - 1 if j > i + 1 and text[j - 1] == quote else j)
                if j > i + 1 and text[j - 1] == quote:
                    out.append(quote)
            last_sig_token = quote
            i = j
            continue

        # Template literal start or continuation after '}'
        if ch == "`" or (ch == "}" and template_expr_depths and template_expr_depths[-1] == 0):
            is_resume = ch == "}"
            if is_resume:
                template_expr_depths.pop()
                out.append("}")
                i += 1
            else:
                out.append("`" if not keep_strings else "`")
                i += 1
            while i < n:
                c = text[i]
                if c == "\\":
                    if keep_strings:
                        out.append(text[i : i + 2])
                    else:
                        push_masked(i, min(i + 2, n))
                    i += 2
                    continue
                if c == "$" and i + 1 < n and text[i + 1] == "{":
                    out.append("${")
                    i += 2
                    template_expr_depths.append(0)
                    last_sig_token = "{"
                    break
                if c == "`":
                    out.append("`")
                    i += 1
                    last_sig_token = "`"
                    break
                if keep_strings:
                    out.append(c)
                else:
                    out.append("\n" if c == "\n" else " ")
                i += 1
            continue

        # Regex literal heuristic (only when not keeping strings, to avoid masking division)
        if not keep_strings and ch == "/" and nxt not in ("/", "*"):
            is_regex = (
                last_sig_token == ""
                or last_sig_token in REGEX_PRECEDERS
                or last_sig_token in ("return", "throw", "case", "typeof", "void", "delete", "in", "of", "else")
            )
            if is_regex:
                j = i + 1
                in_class = False
                closed = False
                while j < n:
                    rc = text[j]
                    if rc == "\\":
                        j += 2
                        continue
                    if rc == "[":
                        in_class = True
                    elif rc == "]" and in_class:
                        in_class = False
                    elif rc == "/" and not in_class:
                        j += 1
                        while j < n and text[j].isalpha():
                            j += 1
                        closed = True
                        break
                    elif rc == "\n":
                        break
                    j += 1
                if closed:
                    out.append("/")
                    push_masked(i + 1, j - 1)
                    out.append("/")
                    last_sig_token = "/"
                    i = j
                    continue

        # Track brace depth for template ${...}
        if template_expr_depths:
            if ch == "{":
                template_expr_depths[-1] += 1
            elif ch == "}":
                template_expr_depths[-1] -= 1

        out.append(ch)
        if not ch.isspace():
            if ch.isalnum() or ch in "_$":
                k = i + 1
                while k < n and (text[k].isalnum() or text[k] in "_$"):
                    out.append(text[k])
                    k += 1
                last_sig_token = text[i:k]
                i = k
                continue
            last_sig_token = ch
        i += 1

    return "".join(out)


def find_unguarded_localstorage_lines(masked_code: str) -> list[int]:
    """
    Return 1-based line numbers where `localStorage.` is used outside an active
    `try { ... }` block that is followed by `catch`.
    """
    # Tokenize into identifiers, braces, and other non-space chars
    tokens: list[tuple[str, int]] = []
    n = len(masked_code)
    i = 0
    while i < n:
        ch = masked_code[i]
        if ch.isspace():
            i += 1
            continue
        if ch.isalpha() or ch in "_$":
            j = i + 1
            while j < n and (masked_code[j].isalnum() or masked_code[j] in "_$"):
                j += 1
            tokens.append((masked_code[i:j], i))
            i = j
            continue
        tokens.append((ch, i))
        i += 1

    # Map each `try` token index -> matching `{ ... }` offset span if followed by `catch`
    try_spans: list[tuple[int, int]] = []
    idx = 0
    while idx < len(tokens):
        tok, _ = tokens[idx]
        if tok == "try" and idx + 1 < len(tokens) and tokens[idx + 1][0] == "{":
            brace_depth = 0
            start_offset = tokens[idx + 1][1]
            j = idx + 1
            end_offset = None
            while j < len(tokens):
                if tokens[j][0] == "{":
                    brace_depth += 1
                elif tokens[j][0] == "}":
                    brace_depth -= 1
                    if brace_depth == 0:
                        end_offset = tokens[j][1]
                        if j + 1 < len(tokens) and tokens[j + 1][0] == "catch":
                            try_spans.append((start_offset, end_offset))
                        break
                j += 1
        idx += 1

    unguarded_lines: list[int] = []
    for m in re.finditer(r"(?<![\w$])localStorage\.", masked_code):
        pos = m.start()
        if not any(start <= pos <= end for start, end in try_spans):
            line_no = masked_code[:pos].count("\n") + 1
            unguarded_lines.append(line_no)
    return unguarded_lines


def check_cross_tool_imports(tool: str, file_path: str, text: str, is_css: bool) -> list[str]:
    """Ensure a file inside `src/tools/<tool>/` never imports from another `src/tools/<other>/`."""
    errors: list[str] = []
    cleaned = strip_css_comments(text) if is_css else mask_ts_code(text, keep_strings=True)

    specs: list[str] = []
    if is_css:
        specs.extend(re.findall(r"""@import\s+(?:url\(\s*)?['"]([^'"]+)['"]""", cleaned))
    else:
        specs.extend(re.findall(r"""(?:import|export)\s+[^'"]*?\bfrom\s+['"]([^'"]+)['"]""", cleaned))
        specs.extend(re.findall(r"""import\s+['"]([^'"]+)['"]""", cleaned))
        specs.extend(re.findall(r"""\bimport\(\s*['"]([^'"]+)['"]\s*\)""", cleaned))

    file_dir = os.path.dirname(file_path)
    for spec in specs:
        target_tool = None
        if spec.startswith("."):
            resolved = os.path.normpath(os.path.join(file_dir, spec))
            rel = os.path.relpath(resolved, TOOLS_DIR)
            if not rel.startswith("..") and not os.path.isabs(rel):
                first_part = rel.split(os.sep)[0]
                if first_part != tool:
                    target_tool = first_part
        else:
            m = re.match(r"^(?:@/|src/)?tools/([^/]+)", spec)
            if m and m.group(1) != tool:
                target_tool = m.group(1)

        if target_tool:
            rel_file = os.path.relpath(file_path, ROOT_DIR).replace("\\", "/")
            errors.append(
                f"Cross-tool import forbidden in '{rel_file}': imports '{spec}' from sibling tool '{target_tool}' "
                f"(share common code via 'src/shared/' or 'src/styles/' instead)."
            )
    return errors


def check_single_default_export(file_path: str, tsx_text: str) -> list[str]:
    """Enforce `react-refresh/only-export-components` / single default export in tool .tsx files."""
    errors: list[str] = []
    masked = mask_ts_code(tsx_text, keep_strings=False)
    rel_file = os.path.relpath(file_path, ROOT_DIR).replace("\\", "/")

    if not re.search(r"(?m)^\s*export\s+default\b", masked):
        errors.append(f"Component file '{rel_file}' must have an 'export default' declaration.")

    secondary_patterns = [
        (r"(?m)^\s*export\s+(?:declare\s+)?(?:type|interface|enum)\b", "type/interface/enum"),
        (r"(?m)^\s*export\s+(?:async\s+)?function\b", "named function"),
        (r"(?m)^\s*export\s+(?:const|let|var|class)\b", "named value/class"),
        (r"(?m)^\s*export\s*\{", "named export list"),
    ]
    for pattern, kind in secondary_patterns:
        if re.search(pattern, masked):
            errors.append(
                f"Rule 25 violation in '{rel_file}': secondary {kind} export detected. "
                f"Export only the React component via 'export default' (move types/helpers to companion .ts/.tsx files)."
            )
    return errors


def main():
    for label, path in [
        ("Master specification", MASTER_SPEC),
        ("README.md", README_FILE),
        ("src/routes.ts", ROUTES_FILE),
        ("src/App.tsx", APP_FILE),
        ("src/App.test.tsx", APP_TEST_FILE),
        ("Tools directory", TOOLS_DIR),
    ]:
        if not os.path.exists(path):
            print(f"Error: {label} not found at {path}", file=sys.stderr)
            sys.exit(1)

    with open(MASTER_SPEC, "r", encoding="utf-8") as f:
        master_spec_text = f.read()
    with open(README_FILE, "r", encoding="utf-8") as f:
        readme_text = f.read()
    with open(ROUTES_FILE, "r", encoding="utf-8") as f:
        routes_text = f.read()
    with open(APP_FILE, "r", encoding="utf-8") as f:
        app_text = f.read()
    with open(APP_TEST_FILE, "r", encoding="utf-8") as f:
        app_test_text = f.read()

    tool_dirs = sorted(
        d for d in os.listdir(TOOLS_DIR)
        if os.path.isdir(os.path.join(TOOLS_DIR, d)) and not d.startswith((".", "_"))
    )

    errors: list[str] = []
    print(f"Checking {len(tool_dirs)} modular tool(s) in {TOOLS_DIR}...")

    # Extract README sections once
    featured_match = re.search(
        r"##\s*🚀?\s*Featured Tools\s*\n(.*?)(?=\n##|\n---|\Z)", readme_text, re.DOTALL
    )
    featured_section = featured_match.group(1) if featured_match else ""

    structure_match = re.search(
        r"##\s*📖?\s*Project Structure\s*\n(.*?)(?=\n##|\n---|\Z)", readme_text, re.DOTALL
    )
    structure_section = structure_match.group(1) if structure_match else ""

    current_tools_match = re.search(
        r"##\s*\d*\.?\s*Current Tools\s*\n(.*?)(?=\n##|\n---|\Z)", master_spec_text, re.DOTALL
    )
    current_tools_section = current_tools_match.group(1) if current_tools_match else ""

    # Extract routes.ts blocks
    tool_key_match = re.search(r"export\s+type\s+ToolKey\s*=\s*([^;]+);", routes_text)
    tool_key_text = tool_key_match.group(1) if tool_key_match else ""
    tool_routes_match = re.search(r"export\s+const\s+TOOL_ROUTES\b[^=]*=\s*\{(.*?)\};", routes_text, re.DOTALL)
    tool_routes_text = tool_routes_match.group(1) if tool_routes_match else ""
    route_to_tool_match = re.search(r"const\s+ROUTE_TO_TOOL\b[^=]*=\s*\{(.*?)\};", routes_text, re.DOTALL)
    route_to_tool_text = route_to_tool_match.group(1) if route_to_tool_match else ""

    for tool in tool_dirs:
        tool_path = os.path.join(TOOLS_DIR, tool)
        files = sorted(os.listdir(tool_path))

        # 1. Identify main component name <ToolName> from src/App.tsx import
        app_import_match = re.search(
            rf"""import\s+(\w+)\s+from\s+['"]\./tools/{re.escape(tool)}/([^'"]+)['"]""",
            app_text,
        )
        if app_import_match:
            main_stem = app_import_match.group(2)
        else:
            errors.append(f"src/App.tsx does not import main component from './tools/{tool}/<ToolName>'.")
            tsx_candidates = [f[:-4] for f in files if f.endswith(".tsx") and not f.endswith(".test.tsx")]
            main_stem = tsx_candidates[0] if tsx_candidates else None

        if main_stem:
            main_tsx = f"{main_stem}.tsx"
            main_css = f"{main_stem}.css"
            main_test = f"{main_stem}.test.tsx"
            if main_tsx not in files:
                errors.append(f"Tool '{tool}' is missing main component file '{main_tsx}'.")
            if main_css not in files:
                errors.append(f"Tool '{tool}' is missing companion stylesheet '{main_css}'.")
            if main_test not in files:
                errors.append(f"Tool '{tool}' is missing companion test file '{main_test}'.")
        else:
            errors.append(f"Tool '{tool}' has no main component file (*.tsx).")

        # 2. Check SPEC.md presence and standardized required sections
        spec_file = os.path.join(tool_path, "SPEC.md")
        if "SPEC.md" not in files:
            errors.append(f"Tool '{tool}' is missing its specification file ('SPEC.md').")
        else:
            with open(spec_file, "r", encoding="utf-8") as f:
                tool_spec_text = f.read()
            for heading in ("Overview", "Functional Requirements", "Acceptance Criteria"):
                if not re.search(rf"(?im)^##\s+(?:\d+\.\s*)?{re.escape(heading)}\b", tool_spec_text):
                    errors.append(
                        f"Tool '{tool}/SPEC.md' is missing required section heading '## ... {heading}'."
                    )

        # 3. Check master SPEC.md Current Tools links to ./src/tools/<tool>/SPEC.md
        if not re.search(rf"\(\./src/tools/{re.escape(tool)}/SPEC\.md\)", current_tools_section):
            errors.append(f"Master SPEC.md 'Current Tools' does not link './src/tools/{tool}/SPEC.md'.")

        # 4. Check README.md Featured Tools & Project Structure
        if not re.search(rf"https://tools\.arunsr\.in/{re.escape(tool)}\b", featured_section):
            errors.append(f"README.md 'Featured Tools' does not link 'https://tools.arunsr.in/{tool}'.")
        if not re.search(rf"src/tools/{re.escape(tool)}/", structure_section):
            errors.append(f"README.md 'Project Structure' does not document 'src/tools/{tool}/'.")

        # 5. Check src/routes.ts registration (ToolKey, TOOL_ROUTES, ROUTE_TO_TOOL)
        if f"'{tool}'" not in tool_key_text and f'"{tool}"' not in tool_key_text:
            errors.append(f"src/routes.ts ToolKey does not include '{tool}'.")
        if not re.search(rf"\b{re.escape(tool)}\s*:\s*['\"]/{re.escape(tool)}['\"]", tool_routes_text):
            errors.append(f"src/routes.ts TOOL_ROUTES does not register {tool}: '/{tool}'.")
        if not re.search(rf"\b{re.escape(tool)}\s*:\s*['\"]{re.escape(tool)}['\"]", route_to_tool_text):
            errors.append(f"src/routes.ts ROUTE_TO_TOOL does not register {tool}: '{tool}'.")

        # 6. Check src/App.tsx semantic card link
        if f"href={{TOOL_ROUTES.{tool}}}" not in app_text:
            errors.append(f"src/App.tsx does not render a semantic link card with href={{TOOL_ROUTES.{tool}}}.")

        # 7. Check src/App.test.tsx route & navigation test coverage
        has_route_path_test = f"'/{tool}'" in app_test_text or f'"/{tool}"' in app_test_text
        has_route_const_test = f"TOOL_ROUTES.{tool}" in app_test_text
        if not (has_route_path_test and has_route_const_test):
            errors.append(
                f"src/App.test.tsx must verify both 'TOOL_ROUTES.{tool}' hub link and '/{tool}' direct route."
            )

        # 8. Structural guardrails across all files in src/tools/<tool>/
        for root_dir, _, dir_files in os.walk(tool_path):
            for fname in sorted(dir_files):
                fpath = os.path.join(root_dir, fname)
                rel_fpath = os.path.relpath(fpath, ROOT_DIR).replace("\\", "/")
                is_test = fname.endswith((".test.ts", ".test.tsx"))

                if fname.endswith((".ts", ".tsx")):
                    with open(fpath, "r", encoding="utf-8") as f:
                        ts_text = f.read()

                    errors.extend(check_cross_tool_imports(tool, fpath, ts_text, is_css=False))

                    if not is_test:
                        masked = mask_ts_code(ts_text, keep_strings=False)

                        # Single-component-export rule for .tsx component files
                        if fname.endswith(".tsx"):
                            errors.extend(check_single_default_export(fpath, ts_text))

                        # No blocking browser dialogs (alert / confirm / prompt)
                        dialog_matches = re.findall(
                            r"(?:\bwindow\.(?:alert|confirm|prompt)|(?<![.\w$])(?:alert|confirm|prompt))\s*\(",
                            masked,
                        )
                        if dialog_matches:
                            errors.append(
                                f"Blocking browser dialog forbidden in '{rel_fpath}': found {dialog_matches[0].strip()} "
                                f"(use shared InlineAlert / Modal instead)."
                            )

                        # No unguarded localStorage. calls outside try/catch
                        unguarded_lines = find_unguarded_localstorage_lines(masked)
                        if unguarded_lines:
                            line_str = ", ".join(str(ln) for ln in unguarded_lines)
                            errors.append(
                                f"Unguarded localStorage call in '{rel_fpath}' at line(s) {line_str}: "
                                f"wrap in try/catch or use shared usePersistedState()."
                            )

                        # Main tool component must use ToolHeader or standardized "← Back to Tools Hub" navigation
                        if main_stem and fname == f"{main_stem}.tsx":
                            uses_tool_header = bool(re.search(r"<ToolHeader\b", ts_text))
                            has_standard_back = "← Back to Tools Hub" in ts_text
                            overrides_nonstandard_back = bool(
                                re.search(r"""backLabel\s*=\s*['"](?!← Back to Tools Hub['"])[^'"]*['"]""", ts_text)
                            )
                            if (not uses_tool_header and not has_standard_back) or overrides_nonstandard_back:
                                errors.append(
                                    f"Navigation inconsistency in '{rel_fpath}': must use shared <ToolHeader> "
                                    f"or standardized '← Back to Tools Hub' back navigation."
                                )

                elif fname.endswith(".css"):
                    with open(fpath, "r", encoding="utf-8") as f:
                        css_text = f.read()

                    errors.extend(check_cross_tool_imports(tool, fpath, css_text, is_css=True))
                    css_clean = strip_css_comments(css_text)

                    if re.search(r":root\s*\{", css_clean):
                        errors.append(
                            f"Global :root redeclaration forbidden in '{rel_fpath}': "
                            f"consume src/styles/tokens.css variables and scope tool themes to a root class."
                        )

                    if re.search(r"(?<![\w-])\.back-btn(?![\w-])", css_clean):
                        errors.append(
                            f"Unprefixed '.back-btn' selector forbidden in '{rel_fpath}': "
                            f"use shared ToolHeader or a tool-prefixed class (e.g. '.{tool}-back-btn')."
                        )

                    if main_stem and fname == f"{main_stem}.css" and "var(--" not in css_clean:
                        errors.append(
                            f"Design tokens missing in '{rel_fpath}': tool stylesheet must consume CSS variables (var(--...)) from src/styles/tokens.css."
                        )

    # 9. Check README Featured Tools links, format, and alphabetical ordering
    featured_titles: list[str] = []
    if not featured_match:
        errors.append("README.md is missing 'Featured Tools' section.")
    else:
        featured_lines = [
            line.strip()
            for line in featured_section.strip().splitlines()
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

    # 10. Check src/App.tsx tool cards alphabetical ordering and parity with README.md
    grid_match = re.search(r'<main className="tools-grid">\s*(.*?)\s*</main>', app_text, re.DOTALL)
    if not grid_match:
        errors.append('src/App.tsx is missing <main className="tools-grid">.')
    else:
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

    print(f"✓ All {len(tool_dirs)} tool(s) comply with modular specification, guardrails, and testing standards.")


if __name__ == "__main__":
    main()
