# AI Agent Guidelines & Architecture Guide for Tools Hub

This repository contains **Tools Hub**, a centralized static hub for hosting multiple small, self-contained utilities built with **React 19**, **TypeScript**, and **Vite**, and deployed to **Cloudflare Workers** using Workers Assets.

---

## 1. Core Principles & Philosophy

- **Modular Tool Isolation:** Each tool operates independently inside its dedicated module directory (`src/tools/<tool-name>/`). It must contain its own component (`<ToolName>.tsx`), styles (`<ToolName>.css`), companion tests (`<ToolName>.test.tsx`), and specification (`SPEC.md`).
- **Hub Navigation & View Switching:** Seamless navigation between the hub and individual tools is managed via a centralized state-based switcher in `src/App.tsx`. Every tool MUST provide a clear, accessible way to return to the hub (e.g. `onBack={() => setView('hub')}`).
- **Zero Backend / Cloudflare Workers Assets:** The entire application is strictly client-side static output. Builds output to `./dist` and are deployed via Cloudflare Workers Assets (`wrangler.json`). Never introduce server-side Node runtime dependencies into client bundles.
- **Performance & Zero Bloat:** Fast load times, minimalist aesthetics, and responsive layouts across mobile and desktop. Rely on native CSS and React state; avoid heavy third-party UI libraries unless explicitly justified.
- **High-Contrast & Usable UI:** Minimalist, card-based layout for the hub. Tools must maintain high contrast, clean typography, accessible controls, and responsive scaling.
- **Living Specifications:** The master specification is in `SPEC.md`. Sprint feature specifications are formulated in `docs/specs/<feature-name>.md`, and modular tool specifications live in `src/tools/<tool-name>/SPEC.md`. Specifications are continuously maintained as living sources of truth.

---

## 2. Directory Layout

- `src/`:
  - `App.tsx`: Central Tools Hub dashboard and view switcher.
  - `App.test.tsx`: Companion tests for hub rendering and view transitions.
  - `main.tsx`: React entry point.
  - `index.css`: Hub global styles, layout containers, and theme variables.
  - `test/setup.ts`: Vitest global test setup and DOM matchers (`@testing-library/jest-dom`).
  - `tools/`: Modular tool implementations.
    - `tools/<tool-name>/`:
      - `<ToolName>.tsx`: Main tool component.
      - `<ToolName>.css`: Scoped stylesheet.
      - `<ToolName>.test.tsx`: Companion unit and component tests.
      - `SPEC.md`: Tool-specific specification and acceptance criteria.
- `docs/specs/`: Feature specifications authored during sprints (`docs/specs/<feature-name>.md`).
- `.devcontainer/`: Containerized development environment config (`devcontainer.json`).
- `scripts/`: Development, testing, and sprint automation tooling:
  - `tool_sprint.py`: Core CLI for Todoist backlog query, preview servers, PR creation, and cleanup.
  - `test.ps1` / `test.sh`: Strict local test pipeline (build, lint, vitest coverage, CI parity, tool structure, cleanup tooling).
  - `cleanup.ps1` / `cleanup.sh`: Automated post-review teardown (merges PR, stops preview servers, removes worktree, syncs main, marks Todoist task complete).
  - `test_ci_parity.py`: Verifies parity between local tests and GitHub Actions CI.
  - `test_tools_structure.py`: Validates modular tool directories, specs, and tests.
  - `test_cleanup_tooling.py`: Regression tests for sprint cleanup helpers and CLI arguments.
- `SPEC.md`: Master specification for the hub.
- `REVIEW.md`: Adversarial code review doctrine and review gates governed by Elrond.
- `wrangler.json`: Cloudflare Workers Assets deployment configuration.
- `.gitattributes`: Line ending normalization across Windows and Unix platforms.

---

## 3. The Fellowship (Agent Personas)

1. 🧙‍♂️ **Gandalf (The Strategist / Living Spec Custodian):**
   - **Motto:** *"All we have to decide is what to do with the time that is given us."*
   - **Role:** Queries Todoist backlog (`Tools 🛠️`), analyzes hub architecture, interviews the human author with clarifying questions and design tradeoffs, authors `docs/specs/<feature-name>.md`, and **continuously maintains and updates the specification** as requirements evolve throughout development, iteration, and author review.
2. ⚒️ **Gimli (The Code Smith / Developer):**
   - **Motto:** *"Faithless is he that says farewell when the road darkens."*
   - **Role:** Works in the background inside an isolated worktree (`.worktrees/<feature-name>`). Implements modular tools, React components, CSS, and companion automated tests in strict compliance with `docs/specs/<feature-name>.md`, `AGENTS.md`, and `SPEC.md` (React 19, TypeScript, CSS, Cloudflare Workers Assets safety, and mandatory automated test authoring).
3. 🏹 **Legolas (The Sharp-Eyed Scout / QA & Spec Compliance Enforcer):**
   - **Motto:** *"A red sun rises. Blood has been spilled this night... or a test has failed."*
   - **Role:** Ruthlessly tests the worktree with `./scripts/test.ps1` (PowerShell) or `./scripts/test.sh` (WSL). **Enforces spec compliance:** systematically verifies that every acceptance criterion in `docs/specs/<feature-name>.md` has companion automated regression tests that pass cleanly with >80% coverage. Sends precise reproduction steps and error logs back to Gimli until zero defects remain.
4. 🧝‍♂️ **Elrond (The Wise Arbiter / Code Reviewer & Chronicle Custodian):**
   - **Motto:** *"The house of Elrond was a refuge for the weary and the oppressed, and a treasury of good counsel and wise lore."*
   - **Role:** Independently audits the codebase with fresh eyes before human review, governing the 12 Adversarial Review Gates in `REVIEW.md`. Audits edge cases, accessibility, React 19 hooks, and TypeScript strictness. Codifies session friction and new patterns into `AGENTS.md`, `REVIEW.md`, and `SKILL.md`.

---

## 4. Testing & Verification

The author requires rigorous local verification first. Always test changes locally and verify on the local preview server. **NEVER commit or push changes to git until tests pass and the author has reviewed and explicitly approved.**

```bash
# Run the complete strict test suite (Build, Lint, Vitest coverage, CI parity, Structure audit, Cleanup tooling)
./scripts/test.ps1                           # Windows PowerShell
./scripts/test.sh                            # WSL / Linux / macOS

# Or execute individual commands:
npm run build                                # TypeScript compilation & Vite build
npm run lint                                 # ESLint static analysis
npm run coverage                             # Vitest with v8 coverage
python scripts/test_ci_parity.py             # Validate CI parity with .github/workflows/test.yml
python scripts/test_tools_structure.py       # Validate tool directory structure and specs
python scripts/test_cleanup_tooling.py       # Validate sprint teardown and cleanup helpers

# Local preview servers (automatically managed by agent in background)
# Main baseline: http://localhost:5173/
npm run dev -- --port 5173 --host 0.0.0.0

# Active feature worktree preview: http://localhost:5174/
cd .worktrees/<feature-name> && npm run dev -- --port 5174 --host 0.0.0.0
```

---

## 5. Rules of Thumb for Changes

1. **Always Pull Latest `main` First:**
   Because multiple tasks and fixes may proceed in parallel, agents MUST ALWAYS run `git pull origin main` in the root tree before branching or starting any new task.
2. **STRICTLY Use Git Worktrees for Parallel Development (Never Switch Branches in Main Tree):**
   NEVER switch branches (`git checkout` or `git switch`) in the root repository tree. The main working tree must permanently remain on `main`. All feature development, bug fixes, refactoring, and experiments must strictly take place in an isolated worktree created under `.worktrees/<feature-name>`:
   ```bash
   git worktree add -b <feature-name> .worktrees/<feature-name> main
   ```
   - **Parallel Feature Execution:** Git worktrees enable multiple features, tools, or bug fixes to proceed in parallel simultaneously without branch collision, dirty state contamination, or stash juggling.
   - **Independent State & Isolated Builds:** Each worktree operates as an independent checkout with its own working files, allowing concurrent testing and verification across parallel tasks.
3. **ABSOLUTE PROHIBITION ON DIRECT COMMITS OR PUSHES TO `main`:**
   Agents must NEVER execute `git commit` or `git push` directly on `main` or to `origin/main`. The `main` branch is strictly read-only for agents during development. All work—including `docs/specs/<feature-name>.md`, components, CSS, tests, and configuration—MUST be authored and committed strictly within `.worktrees/<feature-name>` on the feature branch. `main` only advances via GitHub PR merges (`gh pr merge`) upon explicit human sign-off.
4. **Automated Dual-Port & Multi-Port Preview Strategy for Parallel Worktrees:**
   The author must NEVER be expected to manually spin up or restart preview servers. The agent is strictly responsible for spinning up and maintaining preview servers in the background:
   - **Main Baseline (:5173):** Production baseline running from root on `http://localhost:5173/`.
   - **Feature Worktree Preview (:5174):** Candidate feature running from `.worktrees/<feature-name>` on `http://localhost:5174/`.
   - **Parallel Worktree Previews (:5175, :5176, etc.):** When multiple tasks proceed in parallel, each feature worktree binds to its own dedicated port via `python scripts/tool_sprint.py preview <feature-name> --port <port>`.
   - All server termination logic is strictly scoped to the exact port-bound process IDs without killing unrelated servers.
5. **Mandatory Companion Automated Test Authoring & CI Parity:**
   Zero untested features. Every new tool module must have a `<ToolName>.test.tsx` file asserting render behavior, user interactions, presets, persistence, and edge cases, maintaining >80% test coverage. Every check must also run in `.github/workflows/test.yml`.
6. **Dynamic CI Test Discovery & Parity Enforcement (`scripts/test_ci_parity.py`):**
   GitHub Actions CI (`.github/workflows/test.yml`) strictly mirrors the local verification pipeline. CI parity is enforced by `scripts/test_ci_parity.py`, which physically fails the local build if any test script or validation step is missing from CI. Never bypass CI parity.
7. **Cross-Platform Safety & Windows Python UTF-8 Stdout:**
   Windows PowerShell console defaults to `cp1252`. Python scripts that print Unicode symbols (e.g. checkmarks `✓` or emojis `🛠️`) will crash with `UnicodeEncodeError`. All Python scripts (`scripts/*.py`) MUST include at the top:
   ```python
   if hasattr(sys.stdout, "reconfigure"):
       sys.stdout.reconfigure(encoding="utf-8")
   if hasattr(sys.stderr, "reconfigure"):
       sys.stderr.reconfigure(encoding="utf-8")
   ```
8. **Scoped Port Termination & Anti-Blanket Process Killing:**
   Test suites and process termination helpers must NEVER execute blanket process killers (`taskkill /IM node.exe` or `pkill -f vite`). All termination logic must be strictly scoped to the exact process IDs bound to the specified TCP ports (5173, 5174). Blanket process killers collateral-damage and kill unrelated tools or services on the developer's machine.
9. **Modular Component Isolation Pattern:**
   Every tool must reside in its own folder under `src/tools/<tool-name>/` and contain:
   - `<ToolName>.tsx`
   - `<ToolName>.css`
   - `<ToolName>.test.tsx`
   - `SPEC.md`
   Root files must not be polluted with tool-specific styles or helper logic.
10. **Mandatory Hub Navigation & "Back to Hub" Button:**
    Every tool must provide an explicit, accessible, and high-contrast "Back to Hub" button calling `onBack()`. Users must never be trapped inside a tool view without an obvious way to return to the dashboard.
11. **React 19 State, Hooks & Memory Discipline:**
    - Every `useEffect` binding window event listeners, intervals, or timers MUST return a cleanup function (`return () => ...`).
    - Dependency arrays in `useEffect`, `useCallback`, and `useMemo` must be exhaustive (enforced by `eslint-plugin-react-hooks`).
    - `localStorage` operations must always be wrapped in `try/catch` to gracefully tolerate private browsing or restricted quota exceptions.
12. **TypeScript Strictness & Type Safety:**
    - Zero `any` types in newly authored components and utilities.
    - All props, state shapes, and event handlers must be explicitly typed.
    - Compiles with zero diagnostics via `tsc -b`.
13. **Zero Bloat & Minimalist Dependencies:**
    - Rely on native Web APIs (e.g. `Intl`, `crypto`, `Canvas`, `fetch`) and React state.
    - Avoid heavy third-party component libraries or utilities (e.g. lodash, moment.js) unless explicitly justified.
    - Scrutinize bundle sizes in `dist/assets/`.
14. **High-Contrast & Responsive Accessibility:**
    - Contrast ratios must satisfy WCAG AA standards (minimum 4.5:1 for normal text).
    - Interfaces must scale gracefully across viewports, from compact mobile devices (320px) to desktop and ultrawide screens.
15. **Subagent Permission Minimization & The Interruption-Free Reviewer Principle:**
    Subagents should be granted the minimum tool privileges strictly required for their role. In particular, code review agents (like Elrond) must NOT be spawned with write/shell tools (`enable_write_tools: false`). Arbitrary shell commands (`git log`, `git diff`, `git status`) executed by subagents trigger interactive Antigravity CLI permission prompts that disrupt the author. Instead:
    - Gandalf pre-gathers the git diff, commit history, and living spec context and passes them directly in Elrond's prompt.
    - Elrond inspects files exclusively via built-in read tools (`read_file`), which are inherently non-destructive and never prompt for permission.
    - Elrond returns structured review markdown directly in his final response to Gandalf. Gandalf then posts the review comment to the GitHub PR using `gh pr comment`.
16. **Living Spec Branch Isolation & Zero Pre-Commit to `main`:**
    Feature specifications (`docs/specs/<feature-name>.md`) must NEVER be committed or pushed to `main` prior to branching or feature development. The specification is an integral part of the candidate feature and must be authored and iterated upon strictly within the feature branch inside the isolated worktree (`.worktrees/<feature-name>`). It accumulates in `main` exclusively upon PR merge via `gh pr merge`.
17. **Least-Privilege Permission Architecture:**
    To protect the workstation and git history from accidental destruction:
    - Blanket wildcard shell executors and destructive commands (`Remove-*`, `rm -rf`, `git reset --hard`, `git push --force`) are strictly prohibited.
    - Script execution is permitted exclusively via verified test runners (`./scripts/test.ps1`, `./scripts/test.sh`).
    - GitHub CLI commands are scoped to PR lifecycle management (`gh pr *`).
18. **Tool Specification Integrity:**
    Every tool must have its own specification in `src/tools/<tool-name>/SPEC.md`, and master `SPEC.md` must register the tool under the Current Tools section. Enforced automatically by `python scripts/test_tools_structure.py`.
19. **Negative Testing & Boundary Assertions:**
    Tests must verify failure modes, invalid inputs, empty states, and error handling—not merely the happy path.
20. **Cloudflare Workers Assets Compatibility:**
    The application outputs to `./dist` and is deployed as static assets via `wrangler.json`. Ensure `not_found_handling` is configured for single-page applications and no Node.js runtime APIs bleed into client bundles.
21. **Line Ending Normalization (`.gitattributes`):**
    All shell scripts (`*.sh`), Python scripts (`*.py`), TypeScript files (`*.ts`, `*.tsx`), markdown (`*.md`), and JSON (`*.json`) must use LF line endings. PowerShell scripts (`*.ps1`) use CRLF. Enforced by `.gitattributes`.
22. **Mandatory README Tool Registration:**
    Whenever a new tool is introduced, `README.md` MUST be updated under Featured Tools and Project Structure to maintain public documentation integrity. Enforced automatically by `python scripts/test_tools_structure.py`.

---

## 6. Backlog Management (Todoist Integration)

The backlog of Tools Hub features, new tools, and enhancements is tracked in Todoist under the project **`Tools 🛠️`** (ID: `6hrQPcRmRvXghGhF`) using the `td` CLI.

- **Actionable AI Tasks (`llm-task`):** Tasks designated for the agent to implement are tagged with the label `llm-task`.
- **Groomed & Execution-Ready (`next`):** Tasks in the backlog that have been reviewed, groomed, and explicitly approved by the author for execution are additionally tagged with the label `next`. The `/tool-sprint` workflow strictly scopes tasks matching **both** labels (`llm-task` AND `next`).
- **Capturing New Ideas:** Whenever we discuss or conceive new tool ideas, automatically create a corresponding task in `Tools 🛠️` with a detailed explanation and acceptance criteria in the description, tagged with `llm-task`:
  ```bash
  td task add "<Task Summary>" --project "Tools 🛠️" --labels "llm-task" --description "<Detailed explanation and acceptance criteria>"
  ```
- **Picking Up Backlog Tasks:** To check for pending tasks:
  ```bash
  # Check groomed tasks ready for sprint execution:
  td task list --project "Tools 🛠️" --filter "@llm-task & @next" --json

  # Or check full backlog status (groomed vs ungroomed) using the sprint helper:
  python scripts/tool_sprint.py status
  ```

---

## 7. Multi-Agent Development Workflow (`/tool-sprint`)

When you trigger the `/tool-sprint` command (or ask to run an autonomous sprint), an end-to-end multi-agent pipeline is executed by **The Fellowship**:

1. **🧙‍♂️ Gandalf (The Strategist / Living Spec Custodian):**
   - Inspects the Todoist backlog (`python scripts/tool_sprint.py pick-next`).
   - Analyzes codebase, `SPEC.md`, and hub architecture.
   - **Interactive Human Gate:** Asks clarifying implementation questions, design choices, and tradeoffs.
   - **Living Spec Ownership:** Once you explicitly sign off, writes the approved specification to `docs/specs/<feature-name>.md`. Throughout development and review iterations, Gandalf **continuously updates the specification** as requirements evolve or edge cases are uncovered.

2. **🔄 The Triad Recursive Loop (Gimli ⇄ Legolas ⇄ Elrond):**
   Steps 2, 3, and 4 form an autonomous recursive convergence loop that runs iteratively in the background until unanimous consensus is achieved:
   - **⚒️ Gimli (The Code Smith / Dev):** Works seamlessly in an isolated worktree (`.worktrees/<feature-name>`), crafting modular components, styles, logic, and companion automated tests in strict compliance with `docs/specs/<feature-name>.md` and `AGENTS.md`.
   - **🏹 Legolas (The Sharp-Eyed Scout / QA & Spec Compliance Enforcer):** Executes the strict test suite (`./scripts/test.ps1` / `./scripts/test.sh`) inside the worktree. Audits that all new code has passing tests with >80% coverage. If any failure occurs, sends targeted bug reports back to Gimli; repeats until 100% green.
   - **🧝‍♂️ Elrond (The Wise Arbiter / Adversarial Code Reviewer & Chronicle Custodian):** Operates as an adversarial auditor governed by `REVIEW.md` ("assume code is broken until proven bulletproof"). Audits the green diff with fresh eyes across 12 strict review gates in a zero-interruption read-only context (`enable_write_tools: false`) using `read_file`.
     - **Recursive Trigger:** If Elrond flags feedback or requests changes (`🔴 Request Changes`), it **automatically triggers Gimli** to update code and tests, **Gimli's update triggers Legolas** to re-test, and **Legolas's green run triggers Elrond** to re-review.
     - Codifies session friction, gotchas, and annoyances permanently into `AGENTS.md`, `REVIEW.md`, and `SKILL.md`.
     - The Triad loop repeats until **unanimous consensus** is reached (all tests green + Elrond grants `🟢 Approved without reservations`).

3. **🧙‍♂️ Gandalf (Consensus Synthesis, Author Briefing & Gate):**
   - Confirms unanimous consensus among Gimli, Legolas, and Elrond.
   - Validates that `docs/specs/<feature-name>.md` and modular specs are completely up to date.
   - Commits atomically, pushes branch to origin, and posts Elrond's structured review directly to the PR via `gh pr comment`.
   - Automatically spins up and verifies background Vite servers on :5173 (main baseline) and :5174 (candidate feature worktree).
   - Synthesizes a comprehensive briefing to the author: problem/solution summary, consensus confirmation, live URLs (`http://localhost:5173/` vs `http://localhost:5174/`), PR link, and concrete testing checklist asking for final sign-off.

4. **🚀 Human Sign-off, Merge & Cleanup:**
   - Author reviews live on :5174 vs :5173 and grants sign-off.
   - If author requests changes during review, the Triad loop iterates (Gimli -> Legolas -> Elrond) while Vite HMR updates :5174 in real time.
   - Upon explicit author sign-off, Gandalf executes automated cross-platform sprint cleanup via `./scripts/cleanup.ps1 <feature-name>` (PowerShell) or `./scripts/cleanup.sh <feature-name>` (WSL/Linux), which stops servers, merges the PR, removes the worktree, syncs `main`, and completes the Todoist task.
