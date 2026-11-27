---
name: tool-sprint
description: "Autonomous multi-agent sprint cycle for Tools Hub: Gandalf (PM - interviews author & refines Todoist requirements) -> The Triad Recursive Loop (Gimli Dev ⇄ Legolas QA ⇄ Elrond Review until consensus) -> Gandalf (synthesis & author briefing) -> Agent-executed merge upon author sign-off. Trigger via `/tool-sprint`, `/tools-sprint`, or when asked to run a multi-agent sprint."
---

# Multi-Agent Development Sprint (`/tool-sprint`)

This skill orchestrates an autonomous multi-agent feature sprint for **Tools Hub** (a centralized static hub for modular web utilities deployed to Cloudflare Workers).

```
  ┌─────────────────────────────────────────────────────────────┐
  │ 🧙‍♂️ Phase 1: Gandalf (The Strategist / PM)                    │
  │ Queries Todoist backlog ('Tools 🛠️'),                        │
  │ interviews the author on implementation,                    │
  │ and secures explicit human sign-off on living spec.         │
  └──────────────────────────────┬──────────────────────────────┘
                                 │ (Human Sign-off)
                                 ▼
   ╔═══════════════════════════════════════════════════════════╗
   ║        🔄 The Triad Recursive Loop (Phases 2-4)           ║
   ║                                                           ║
   ║  ┌─────────────────────────────────────────────────────┐  ║
   ║  │ ⚒️ Phase 2: Gimli (The Code Smith / Dev)            │◄─╫──┐
   ║  │ Crafts feature & regression tests in worktree.      │  ║  │
   ║  └──────────────────────────┬──────────────────────────┘  ║  │
   ║                             │                             ║  │
   ║                             ▼                             ║  │
   ║  ┌─────────────────────────────────────────────────────┐  ║  │
   ║  │ 🏹 Phase 3: Legolas (The Scout / QA Tester)         │  ║  │
   ║  │ Runs test suite; if fail, loops back to Gimli       │  ║  │
   ║  │ until 100% green.                                   │  ║  │
   ║  └──────────────────────────┬──────────────────────────┘  ║  │
   ║                             │ (All tests green)           ║  ║
   ║                             ▼                             ║  ║
   ║  ┌─────────────────────────────────────────────────────┐  ║  │
   ║  │ 🧝‍♂️ Phase 4: Elrond (The Wise Arbiter / Review)       │  ║  │
   ║  │ Independent code review with fresh eyes;            │  ║  │
   ║  │ audits React 19, TS, CSS, and edge cases.           │  ║  │
   ║  └──────────────────────────┬──────────────────────────┘  ║  │
   ║                             │                             ║  ║
   ║               [Elrond requests changes / flags issues]    ║  ║
   ║                             └─────────────────────────────╫──┘
   ║                             │                             ║
   ║                             │ (Unanimous Consensus:       ║
   ║                             │  Tests Green + 🟢 Approved) ║
   ╚═════════════════════════════╪═════════════════════════════╝
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 🧙‍♂️ Phase 5: Gandalf (Final Synthesis & Gate)                 │
  │ Verifies consensus; updates living spec; posts PR comment;  │
  │ spins up dual-port preview (:5174 feature vs :5173 main);   │
  │ presents comprehensive briefing to author for sign-off.     │
  └──────────────────────────────┬──────────────────────────────┘
                                 │
                                 ▼
  ┌─────────────────────────────────────────────────────────────┐
  │ 🚀 Phase 6: Human Sign-off, Merge & Cleanup                 │
  │ Author reviews live on :5174 vs :5173 and gives sign-off;   │
  │ Gandalf merges PR via gh, cleans worktree & closes task.   │
  └─────────────────────────────────────────────────────────────┘
```

---

## The Fellowship (Agent Personas)

1. 🧙‍♂️ **Gandalf (The Strategist / Living Spec Custodian):**
   - **Motto:** *"All we have to decide is what to do with the time that is given us."*
   - **Role:** Queries Todoist, analyzes hub architecture, interviews the human author with clarifying questions and design tradeoffs, authors `docs/specs/<feature-name>.md`, and **continuously maintains and updates the specification** as requirements evolve throughout development, iteration, and author review.
2. ⚒️ **Gimli (The Code Smith / Developer):**
   - **Motto:** *"Faithless is he that says farewell when the road darkens."*
   - **Role:** Works in the background inside an isolated worktree (`.worktrees/<name>`). Implements modular tools in `src/tools/<tool-name>/` in **strict compliance** with `docs/specs/<feature-name>.md`, `AGENTS.md`, and `SPEC.md` (React 19, TypeScript, CSS, Cloudflare Workers Assets compatibility, and mandatory companion automated test authoring).
3. 🏹 **Legolas (The Sharp-Eyed Scout / QA & Spec Compliance Enforcer):**
   - **Motto:** *"A red sun rises. Blood has been spilled this night... or a test has failed."*
   - **Role:** Ruthlessly tests the worktree with `./scripts/test.ps1` (PowerShell) or `./scripts/test.sh` (WSL). **Enforces spec compliance:** systematically verifies that every acceptance criterion in `docs/specs/<feature-name>.md` has companion automated regression tests that pass cleanly with >80% coverage. Sends precise reproduction steps and error logs back to Gimli until zero defects remain.
4. 🧝‍♂️ **Elrond (The Wise Arbiter / Code Reviewer & Chronicle Custodian):**
   - **Motto:** *"The house of Elrond was a refuge for the weary and the oppressed, and a treasury of good counsel and wise lore."*
   - **Role:** Independently audits the codebase with a fresh pair of eyes before human review. Scrutinizes architectural elegance, edge cases, accessibility, visual contrast, React 19 hooks, and TypeScript strictness. Identifies session friction, annoyances, and pitfalls to codify as permanent rules in `AGENTS.md` and `SKILL.md`. Posts actionable code review comments directly on the GitHub PR for Gimli to iterate on.

---

## Sprint Execution Procedure

### Phase 1: Interactive Scoping & Human Sign-off (🧙‍♂️ Gandalf)

1. **Backlog Inspection:**
   Inspect Todoist for groomed tasks ready for execution:
   ```bash
   python scripts/tool_sprint.py pick-next
   # or: td task list --project "Tools 🛠️" --filter "@llm-task & @next" --json
   ```
   - **Groomed Tasks (`llm-task` + `next`):** Pick the highest-priority task that has been reviewed and groomed by the author (tagged with both `llm-task` and `next`).
   - **If no groomed tasks are found:** Check `python scripts/tool_sprint.py status`. Inform the author of any pending ungroomed AI tasks (`llm-task` only) awaiting their review and `next` tag, or propose candidate tools based on backlog ideas.
   - Do NOT pick or execute tasks that lack the `next` tag without explicit human instruction.

2. **Codebase & Architectural Analysis:**
   Inspect related files, `SPEC.md`, `src/routes.ts`, `src/App.tsx`, `src/shared/`, `src/styles/tokens.css`, and existing tools in `src/tools/`. Identify reusable shared primitives (`ToolHeader`, `Modal`, `SegmentedControl`, `InlineAlert`, `Toast`, `usePersistedState`, `useTimeoutRegistry`, `useCopyFeedback`, `useDocumentTitle`, `createAudioController`), UX/accessibility tradeoffs, or edge cases.

3. **Interactive Human Interview & Sign-off Gate:**
   - Present the proposed feature, approach, and options to the author.
   - Ask clarifying implementation questions (e.g. UX preferences, presets, theme choices, scope limits).
   - **CRITICAL GATE:** Do NOT dispatch background agents until the human author answers and explicitly confirms/signs off (e.g. "Proceed", "Looks good", or specific direction).

4. **Draft Living Feature Specification (Zero Pre-Commit to Main):**
   Once human sign-off on direction is received, formulate the living specification (`docs/specs/<feature-name>.md`).
   **CRITICAL ZERO-MAIN-COMMIT RULE:** The specification file must NEVER be committed or pushed to `main`. `main` is strictly read-only for agents. The spec must be written and committed strictly inside the isolated worktree (`.worktrees/<feature-name>`) on the feature branch. It accumulates in `main` exclusively upon PR merge via `gh pr merge`. The spec must contain:
   - User Story & Context
   - Numbered, verifiable Acceptance Criteria
   - Shared Architecture & UX/Accessibility Plan: `src/shared/*` primitives to reuse, `src/styles/tokens.css` compliance, WCAG AA contrast (`>= 4.5:1`), `:focus-visible`, 320px mobile responsiveness, and `InlineAlert`/`Modal` error handling (zero `window.alert`).
   - Core Guardrails from [AGENTS.md](../../AGENTS.md) (React 19 hooks & RAF/AudioContext/timer cleanup discipline, single-default-export Rule 25, TypeScript strictness, Cloudflare Workers Assets safety).

---

### Phase 2: Background Code Crafting (⚒️ Gimli)

1. **Always Pull Latest Main & Isolated Worktree Creation for Parallel Sprints:**
   Ensure the main repository tree permanently stays on `main` and incorporate any parallel merges before branching:
   ```bash
   git pull origin main
   git worktree add -b <feature-name> .worktrees/<feature-name> main
   ```
   - **Parallel Worktree Execution:** Multiple feature worktrees can coexist concurrently under `.worktrees/`, enabling parallel development and testing across distinct tasks without branch contention or workspace collisions.
   - **ABSOLUTE RULE:** ZERO commits or pushes directly to `main`. All work—including `docs/specs/<feature-name>.md`, components, CSS, tests, config, and `SPEC.md` updates—is created, modified, and committed strictly within `.worktrees/<feature-name>` on the feature branch. Main advances exclusively through pull requests approved by the author.

2. **Implementation:**
   Gimli implements all requirements specified in `docs/specs/<feature-name>.md` within `.worktrees/<feature-name>`:
   - Create modular directory: `src/tools/<tool-name>/` (zero cross-tool imports).
   - Main component: `src/tools/<tool-name>/<ToolName>.tsx` exporting ONLY `export default` (Rule 25; put types in `types.ts`, subcomponents in separate `.tsx` files, engines/helpers in `<tool>Engine.ts`), using shared `ToolHeader` (`"← Back to Tools Hub"`), `Modal`, `SegmentedControl`, `InlineAlert`, `Toast`, and hooks/utils from `src/shared/`.
   - Styles: `src/tools/<tool-name>/<ToolName>.css` consuming `src/styles/tokens.css` variables (`var(--...)`), prefixing all classes (`.<tool>-*`), never redeclaring `:root {` or `.back-btn`, preserving `:focus-visible`, and wrapping cleanly down to 320px.
   - Tool Spec: `src/tools/<tool-name>/SPEC.md` with standardized `Overview`, `Functional Requirements`, and `Acceptance Criteria` sections.
   - Registration & Tests: Register in `src/routes.ts`, wire alphabetical card & view switcher in `src/App.tsx` (inside `ToolErrorBoundary`), add direct route + card tests in `src/App.test.tsx`, update master `SPEC.md` (`Current Tools`), and update `README.md` (`Featured Tools` + `Project Structure`).

3. **Mandatory Companion Automated Test Authoring & CI Parity:**
   Whenever new code, components, or tools are introduced, Gimli MUST author corresponding automated regression tests in `src/tools/<tool-name>/<ToolName>.test.tsx` satisfying `vite.config.ts` thresholds (`lines: 80`, `functions: 80`, `branches: 75`, `statements: 80`).
   *Test Authoring Criteria:*
   - **Component Rendering:** Assert all primary interactive elements, `ToolHeader`, and ARIA roles render cleanly.
   - **Interactions & State:** Test user inputs, presets, keyboard shortcuts (including input/modal focus guards and `Modal` `Escape`), and resets.
   - **Persistence & Corrupt Storage:** Verify `localStorage` `getItem` and `setItem` (`QuotaExceededError`) error tolerance, corrupt JSON, and invalid/partial schema sanitization.
   - **Lifecycle Cleanup & Negative Cases:** Test empty states, invalid inputs (`role="alert"`), `AudioContext`/`getContext('2d') === null`/clipboard failures, and unmount cleanup (`cancelAnimationFrame`, timers, `document.title` restore).
   - **Scoped Mock Restoration:** Save and restore any patched globals/prototypes (`HTMLCanvasElement.prototype`, `navigator.clipboard`, `window.AudioContext`, `document.execCommand`) in `afterEach()`.
   - **Zero Untested Features:** A feature is NEVER considered complete without accompanying automated test coverage.

---

### Phase 3: Background QA Verification Loop (🏹 Legolas)

1. **Automated Test Run & Coverage Audit:**
   Legolas audits that automated regression tests exist for all newly introduced code in the diff, and executes the strict test suite inside the worktree:
   ```bash
   python scripts/tool_sprint.py run-tests .worktrees/<feature-name>
   # or: cd .worktrees/<feature-name> && ./scripts/test.ps1 (PowerShell) / ./scripts/test.sh (WSL)
   ```
   Legolas verifies `npm run build`, `npm run lint`, `npm run coverage` (`vite.config.ts` thresholds: 80% lines/statements/functions, 75% branches), `python scripts/test_ci_parity.py`, `python scripts/test_tools_structure.py` (all modular/CSS/export/spec/registration gates), and `python scripts/test_cleanup_tooling.py` all pass cleanly. If new code lacks companion automated tests or fails any coverage/structural gate, Legolas rejects the build and instructs Gimli to fix it before certifying approval.

2. **Automated Feedback Loop to Gimli:**
   - **On Any Failure (Exit code != 0 or missing test coverage):**
     1. Legolas captures exact failing logs, stack traces, and affected files.
     2. Formulates a targeted bug report for Gimli.
     3. Gimli applies fixes and adds missing tests in the worktree.
     4. Legolas re-tests. (Repeats seamlessly in the background until green).
   - **On Complete Pass (Build green, ESLint clean, 100% tests pass, >80% coverage):**
     Legolas issues a QA sign-off certification, handing off to Elrond.

---

### Phase 4: Independent Code Review & Retrospective Loop (🧝‍♂️ Elrond)

1. **Zero-Interruption Invocation & Context Provisioning:**
   - Gandalf pre-generates the branch git diff against main (`git diff main`) and commit summary.
   - Gandalf invokes Elrond with **read-only tools** (`enable_write_tools: false`), passing the branch diff, PR number/URL, and living spec directly in the prompt.
   - This ensures Elrond operates completely interruption-free without triggering interactive CLI permission prompts for `git log` or `git diff`.

2. **Adversarial Code Audit (Governed by `REVIEW.md`):**
   Elrond assumes the code is broken until proven bulletproof, ruthlessly auditing the diff across the 12 Adversarial Review Gates defined in `REVIEW.md`:
   - Gate 1: CI Parity & Silent Test Omission.
   - Gate 2: React 19 State, Hooks & Memory Discipline.
   - Gate 3: UI/UX & Responsive Scaling.
   - Gate 4: TypeScript Strictness & Type Safety.
   - Gate 5: Cross-Platform & Terminal Console Safety.
   - Gate 6: Cloudflare Workers Assets Compatibility.
   - Gate 7: Modular Isolation & Spec Compliance.
   - Gate 8: Performance, Zero Bloat & Minimal Dependencies.
   - Gate 9: Test Coverage & Negative Assertions.
   - Gate 10: Interruption-Free Subagent Protocol.
   - Gate 11: Main Branch Inviolability & Zero Direct Push Protocol.
   - Gate 12: Worktree Isolation & Clean Teardown.

3. **Session Retrospective & Rule Codification:**
   - Evaluates friction, annoyances, and gotchas experienced during the session.
   - Codifies lasting solutions permanently into `AGENTS.md` and `SKILL.md` so the team never encounters the same friction again.

4. **The Recursive Triad Loop (Elrond ──> Gimli ──> Legolas ──> Elrond):**
   - **If Elrond flags feedback or requests changes (`🔴 Request Changes`):**
     - Elrond returns structured, actionable feedback items.
     - **Recursion Step A:** Elrond's feedback directly triggers **Gimli (Phase 2)** to update the implementation and tests in the worktree.
     - **Recursion Step B:** Gimli's update directly triggers **Legolas (Phase 3)** to re-run the full test suite and verify no regressions.
     - **Recursion Step C:** Legolas's green run triggers **Elrond (Phase 4)** to re-review the updated diff with fresh eyes.
     - This recursive loop runs iteratively in the background until **unanimous consensus** is reached.
   - **When Elrond issues approval (`🟢 Approved without reservations`):**
     Consensus is reached across Dev (Gimli), QA (Legolas), and Review (Elrond). Elrond returns his final review markdown to Gandalf.

---

### Phase 5: Consensus Synthesis & Author Presentation Gate (🧙‍♂️ Gandalf)

Once the Triad (Gimli, Legolas, Elrond) has reached unanimous consensus:

1. **Spec Accuracy Check:**
   Gandalf confirms `docs/specs/<feature-name>.md` and `src/tools/<tool-name>/SPEC.md` are completely up to date.

2. **Commit Atomically & Push Branch:**
   ```bash
   cd .worktrees/<feature-name>
   git add -A
   git commit -m "feat(<scope>): <concise description>"
   git push -u origin <feature-name>
   ```

3. **Create Pull Request & Link to Todoist:**
   Raise the PR using `gh pr create` and post the PR URL to the Todoist task:
   ```bash
   python scripts/tool_sprint.py create-pr --task-id <task-id> --title "feat(<scope>): <title>" --body "<description>" --branch <feature-name>
   ```
   - **Clean & Meaningful PR Description:** PR descriptions must be concise and explain what is being built and how. Never include internal Todoist task IDs or localhost URLs in the PR body. Localhost preview URLs belong exclusively in the chat review briefing to the author.
   - Post Elrond's structured review directly to the PR: `gh pr comment <pr-number> --body "<markdown>"`.

4. **Automatic Dual-Port Server Management (Agent-Managed, Zero Author Effort):**
   The author must NEVER be expected to manually spin up or restart preview servers. The agent is strictly responsible for spinning up and maintaining both servers in the background:
   - **Main Baseline (:5173):** Check if port 5173 is active. If not, launch `npm run dev -- --port 5173 --host 0.0.0.0` in the background from the root repository.
   - **Feature Preview (:5174):** Launch `npm run dev -- --port 5174 --host 0.0.0.0` in the background from `.worktrees/<feature-name>`.
   - Verify both ports respond before notifying the author.
   - Keep both servers active so the author can immediately click and review the live URLs.

5. **Structured Review Briefing for Author:**
   Present the author with:
   - **Live Feature URL:** `http://localhost:5174/` (already running and live)
   - **Main Comparison URL:** `http://localhost:5173/` (already running and live)
   - **PR Link:** GitHub Pull Request URL.
   - **Verification Checklist:** Step-by-step checklist of interactions to test, explicitly asking for final human sign-off.

---

### Phase 6: Human Sign-off, Merge & Cleanup

1. **Living Spec Iteration Loop (When author requests tweaks or changes):**
   - **Step 1 (Gandalf):** Whenever the author provides feedback, questions, or iterates on requirements, Gandalf **immediately updates `docs/specs/<feature-name>.md`**.
   - **Step 2 (Gimli):** Gimli implements the changes directly inside `.worktrees/<feature-name>`.
   - **Step 3 (Vite HMR):** Vite Hot Module Replacement on `:5174` updates the author's browser instantly.
   - **Step 4 (Legolas):** Legolas audits that all new or updated spec criteria have passing automated tests in the test suite inside the worktree.
   - **Step 5 (Push):** Updated commits are pushed to the PR branch.

2. **Sign-off, Merge & Cleanup:**
   Once the author explicitly reviews and gives sign-off, Gandalf automatically executes the merge and cleanup:
   ```bash
   # Automated cross-platform sprint cleanup (stops preview servers, merges PR, deletes worktree, syncs main, completes task):
   ./scripts/cleanup.ps1 <feature-name> -TaskId <task-id>    # Windows PowerShell
   ./scripts/cleanup.sh <feature-name> --task-id <task-id>   # WSL / Linux / macOS
   # or: python scripts/tool_sprint.py cleanup <feature-name> --task-id <task-id>
   ```
