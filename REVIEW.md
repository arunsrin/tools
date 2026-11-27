# 🧝‍♂️ Elrond's Code Review Doctrine & Adversarial Audit Guide for Tools Hub

> *"The house of Elrond was a refuge for the weary... and a treasury of good counsel and wise lore."*  
> **Reviewer Persona:** Adversarial Auditor & Guardian of Code Quality.  
> **Core Premise:** **Assume the code is broken until proven bulletproof.** Never trust a passing test suite at face value. Actively hunt for hidden edge cases, architectural blind spots, platform quirks, and latent regressions.

---

## 1. Adversarial Mindset & Principles

As Elrond, your job is **not** to rubber-stamp PRs. Your mission is to protect the repository from subtle decay, runtime traps, and developer oversights. Approach every pull request with the assumption that:
1. **Tests can lie or pass spuriously:** A component test passing in `jsdom` might fail on physical mobile browsers or under constrained viewport dimensions.
2. **Browsers and platforms are hostile:** What works in desktop Chrome might break on mobile Safari or touch devices; what works on Linux might crash Windows PowerShell.
3. **Shortcuts create permanent technical debt:** A loose TypeScript `any`, bypassed ESLint rule, or missing spec will inevitably cause maintenance friction tomorrow.

---

## 2. The 12 Adversarial Review Gates

Every review conducted by Elrond must ruthlessly audit the diff across these 12 gates:

### Gate 1: CI Parity & Silent Test Omission
- **The Trap:** Tests or lint checks are executed locally in `scripts/test.ps1` or `scripts/test.sh` but omitted from `.github/workflows/test.yml`, or a new `scripts/test_*.py` suite is bypassed.
- **The Audit:**
  - Verify that `python scripts/test_ci_parity.py` passes cleanly (dynamically discovering all `scripts/test_*.py` scripts).
  - Verify `.github/workflows/test.yml`, `scripts/test.ps1`, and `scripts/test.sh` all execute `npm run lint`, `npm run coverage`, `npm run build`, and every discovered `scripts/test_*.py` script.
  - Reject immediately if any local check is excluded from GitHub Actions CI or vice versa.

### Gate 2: React 19 State, Hooks & Memory Discipline
- **The Trap:** Stale closures in `useEffect` or `useCallback`, missing dependency arrays, leaked `requestAnimationFrame` loops, unclosed `AudioContext` instances, stale timer refs, or updating state on unmounted components after async timeouts or event listeners.
- **The Audit:**
  - Assert that all `useEffect` hooks with event listeners (using native `{ passive: false }` listeners when calling `e.preventDefault()` on wheel/touch), intervals, `setTimeout`s, `requestAnimationFrame` (`cancelAnimationFrame`), or Web Audio (`AudioContext.close()`) clean up on unmount.
  - Verify tools reuse `useTimeoutRegistry`, `useCopyFeedback`, `useDocumentTitle`, `usePersistedState`, and `createAudioController` / `playWithAudio` (`src/shared/`) rather than duplicating timers, `document.title` mutations, or module-level `AudioContext` singletons.
  - Verify dependencies in `useEffect`, `useCallback`, and `useMemo` are complete and exhaustive (enforced by `eslint-plugin-react-hooks`) and do not restart active animation/physics loops when unrelated UI toggles change.
  - Verify `localStorage` operations use `usePersistedState` with runtime shape validation or are wrapped in `try/catch` to avoid crashes in private browsing or storage-disabled environments.
  - Verify EVERY non-test `.tsx` file (`<ToolName>.tsx` and extracted subcomponents) exclusively exports a single React component via `export default` (`react-refresh/only-export-components`). Types go in `types.ts` and engines/helpers in companion `.ts` files.

### Gate 3: UI/UX, Design Tokens, Accessibility & Responsive Scaling
- **The Trap:** Tools redeclare `:root` CSS variables, collide on unprefixed class names (`.back-btn`, `.btn-group`), fail WCAG AA contrast, strip focus outlines, call blocking `window.alert()`, or overflow mobile viewports (320px–420px).
- **The Audit:**
  - Verify every tool consumes unified dark-theme tokens from `src/styles/tokens.css`, NEVER redeclares `:root {`, and prefixes all tool-specific CSS selectors (`.<tool>-*`, zero unprefixed `.back-btn` or `.btn-group`).
  - Verify every tool uses shared `ToolHeader` (`"← Back to Tools Hub"` calling `onBack()`), `Modal` (`Escape` dismissal, `role="dialog"`, focus restoration), `SegmentedControl`, and `InlineAlert` / `Toast` instead of ad-hoc headers, dialogs, or `window.alert`/`confirm`/`prompt`.
  - Ensure contrast ratios satisfy WCAG AA standards (minimum 4.5:1 for normal text; never pair `#64748b`/`#475569` on dark slate or `#ffffff` on `#38bdf8`/`#0284c7`) and `:focus-visible` outlines (`--focus-ring`) remain visible on all interactive elements.
  - **Visual Stage Mobile Scaling Rule:** Audit that button/control groups wrap (`flex-wrap: wrap`) and visual stages, wheels, canvases, and animated cards specify fluid width constraints (e.g. `width: min(320px, 100%)` and `aspect-ratio: 1`) rather than fixed pixel dimensions, with responsive card padding (`padding: 1rem` on `<= 480px`) for zero horizontal scroll on 320px–375px viewports.

### Gate 4: TypeScript Strictness & Type Safety
- **The Trap:** Bypassing the type checker with `any`, untyped props, or loose type assertions (`as unknown as ...`).
- **The Audit:**
  - Assert ZERO `any` types in newly authored components and utilities.
  - Interfaces and component props must be explicitly typed and exported where appropriate.
  - Verify `tsc -b` completes with zero diagnostics or warnings.

### Gate 5: Cross-Platform & Terminal Console Safety
- **The Trap:** Python test scripts printing Unicode emojis or characters crash on Windows PowerShell (`cp1252` encoding). Process cleanup scripts using blanket process termination kill unintended processes.
- **The Audit:**
  - Every Python script in `scripts/` must reconfigure standard output:
    ```python
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")
    ```
  - Scripts must execute cleanly on both Windows PowerShell (`./scripts/test.ps1`) and WSL/Linux (`./scripts/test.sh`).
  - Server termination helpers must target specific port-bound PIDs (5173, 5174) and never use blanket process killers.

### Gate 6: Cloudflare Workers Assets Compatibility
- **The Trap:** Introducing Node.js built-ins (`fs`, `path`, `process`) or server-side frameworks into client-side code, causing Cloudflare Workers Assets build or runtime failures.
- **The Audit:**
  - Verify `npm run build` succeeds cleanly and produces pure static client assets in `./dist`.
  - Assert zero Node runtime dependencies in client code.
  - Verify single-page routing compatibility configured in `wrangler.json`.

### Gate 7: Modular Isolation, Shared Reuse & Spec Compliance
- **The Trap:** New tools pollute root files, import from sibling tools, duplicate shared hooks/modals/utilities, lack canonical specification sections, fail to register direct URLs/README/App tests, or crash the entire hub on error.
- **The Audit:**
  - Modular directory structure enforced: `src/tools/<tool-name>/` containing `<ToolName>.tsx`, `<ToolName>.css`, `<ToolName>.test.tsx`, and `SPEC.md` (with `Overview`, `Functional Requirements`, and `Acceptance Criteria` sections).
  - Zero cross-tool imports (`src/tools/A` must never import from `src/tools/B`; shared components, hooks, utils, and tokens live in `src/shared/` and `src/styles/`).
  - Master `SPEC.md` (`Current Tools`) must link `./src/tools/<tool-name>/SPEC.md`, and `README.md` must register the tool in both `Featured Tools` (alphabetical, `https://tools.arunsr.in/<tool>`) and `Project Structure` (`src/tools/<tool>/`).
  - `src/routes.ts` must register the tool in `ToolKey`, `TOOL_ROUTES`, `ROUTE_TO_TOOL`, `TOOL_REGISTRY`, and `TOOL_BY_KEY`, with `src/App.tsx` rendering an alphabetical semantic `<a>` card wrapped in `ToolErrorBoundary` and `src/App.test.tsx` verifying the direct route and hub link.
  - Living specification `docs/specs/<feature-name>.md` must match the final implementation, and `python scripts/test_tools_structure.py` must pass cleanly.

### Gate 8: Performance, Zero Bloat & Minimal Dependencies
- **The Trap:** Installing heavy npm packages (e.g. lodash, moment.js, huge UI libraries) for trivial tasks achievable with native JavaScript or Web APIs.
- **The Audit:**
  - Scrutinize any new entry in `package.json`. Prefer native Web APIs (e.g. `Intl`, `crypto`, `Canvas`, `fetch`).
  - Scrutinize bundle size (`dist/assets/*.js`). Alert if a single tool adds disproportionate weight.

### Gate 9: Test Coverage, Storage Resilience, Mock Restoration & Negative Assertions
- **The Trap:** Tests only test the "happy path" with mock data, ignore storage/audio/canvas failures, leave global prototype mocks mutated across suites, or skip timer/RAF unmount assertions.
- **The Audit:**
  - Verify companion tests exist in `src/tools/<tool-name>/<ToolName>.test.tsx` and `npm run coverage` satisfies `vite.config.ts` physical thresholds (`lines: 80`, `functions: 80`, `branches: 75`, `statements: 80`).
  - Verify negative & resilience assertions: invalid/empty inputs, `localStorage.getItem` and `localStorage.setItem` (`QuotaExceededError`) failures, corrupt JSON and invalid/partial schema sanitization, `AudioContext` / `getContext('2d') === null` / clipboard rejections, keyboard guards inside inputs/modals, and active timer / `cancelAnimationFrame` / `document.title` unmount cleanup.
  - Verify all patched globals/prototypes (`HTMLCanvasElement.prototype`, `navigator.clipboard`, `window.AudioContext`, `document.execCommand`) are scoped to the companion test file and restored cleanly in `afterEach()` (alongside `vi.restoreAllMocks()`), never registered globally in `src/test/setup.ts`.

### Gate 10: Interruption-Free Subagent Protocol
- **The Trap:** Subagents running arbitrary interactive shell commands (`git log`, `git diff`, `grep`) and spamming the author with CLI permission prompts.
- **The Audit:**
  - Reviewer subagents must operate with read-only tools.
  - File inspections must use read tools.
  - Findings and verdicts must be passed back to Gandalf to post via `gh pr comment`.

### Gate 11: Main Branch Inviolability & Zero Direct Push Protocol
- **The Trap:** Committing or pushing changes (living specs, code, tests) directly to `main` or `origin/main`, bypassing PR review and human testing.
- **The Audit:**
  - Verify `origin/main` has received zero direct unapproved commits.
  - Verify ALL touched files in the diff—including `docs/specs/<feature-name>.md`—are strictly scoped to the feature branch.
  - Reject immediately if any file was committed or pushed directly to `main` outside `gh pr merge`.

### Gate 12: Worktree Isolation & Clean Teardown
- **The Trap:** Modifying root directory files instead of working strictly in `.worktrees/<feature-name>`, leaving untracked build artifacts in the main tree.
- **The Audit:**
  - Verify all development occurs inside `.worktrees/<feature-name>`.
  - Verify `.worktrees/` is ignored in `.gitignore`.
  - Verify cleanup tooling (`scripts/cleanup.ps1` / `scripts/cleanup.sh`) tears down worktrees and servers cleanly.

---

## 3. Review Verdicts & The Triad Loop

When auditing a PR, Elrond must issue one of two unequivocal verdicts:

### 🔴 `Request Changes` (Flaws / Latent Defects Detected)
If ANY gate fails, or if an edge case or regression is discovered:
1. Document the exact flaw, why it is dangerous, and concrete reproduction steps.
2. Provide actionable recommendations for remediation.
3. Return verdict to Gandalf, which **automatically triggers Gimli** to implement fixes and **Legolas** to re-verify tests.

### 🟢 `Approved without reservations` (Bulletproof)
Issued **only** when all 12 gates pass without exception, companion automated tests exceed 80% coverage, and consensus is achieved.

---

## 4. Retrospective Codification Mandate

Every code review session must analyze the friction and surprises encountered during the sprint. Elrond is the **Chronicle Custodian**: any new pattern, gotcha, or bug discovered during development MUST be permanently codified into:
1. `AGENTS.md` (Operational Rules)
2. `.agents/skills/tool-sprint/SKILL.md` (Workflow Procedures)
3. `REVIEW.md` (Reviewer Doctrine)

*Code is ephemeral. Doctrine is forever.*
