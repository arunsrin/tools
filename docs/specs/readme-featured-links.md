# Living Specification: README Tool Links, Alphabetical Ordering & Featured Callout

## 1. Context & Motivation
Currently, the "Featured Tools" section in `README.md` links to markdown specification files (`./src/tools/<tool>/SPEC.md`) instead of linking directly to the live deployed web tools. Furthermore, tools in both `README.md` and the Tools Hub dashboard (`src/App.tsx`) are listed in chronological development order, burying standout interactive tools like `Biomorphs` at the bottom of the page.

This specification defines the migration of README tool links to direct live deployment URLs, standardizes strict alphabetical ordering across the README and Hub dashboard to make future additions deterministic, adds a sleek "Featured" callout to the Biomorphs card, and introduces automated structure and unit tests to prevent order or link drift.

---

## 2. Acceptance Criteria

### AC-1: Live Tool Links in README.md
- Every tool listed under `## 🚀 Featured Tools` in `README.md` MUST link directly to its live deployed URL (`https://tools.arunsr.in/<tool-route>`, e.g., `https://tools.arunsr.in/biomorphs`).
- The link text MUST remain the display title of the tool (e.g. `[Big Text](https://tools.arunsr.in/big)`).
- The `## 📖 Project Structure` section MUST continue to document the repository source directories under `src/tools/<tool>/`.

### AC-2: Strict Alphabetical Order across README & Hub Dashboard
- Tools under `## 🚀 Featured Tools` in `README.md` MUST be sorted strictly alphabetically by their display name:
  1. **Big Text** (`/big`)
  2. **Biomorphs** (`/biomorphs`)
  3. **Cute Pomo** (`/pomo`)
  4. **Desktop Pals** (`/pals`)
  5. **Fractal Explorer** (`/fractal`)
  6. **Random Picker** (`/picker`)
  7. **Timezone Converter** (`/timezone`)
- The tool cards rendered within `<main className="tools-grid">` in `src/App.tsx` MUST be sorted in the identical strict alphabetical order by display name.
- The `## 📖 Project Structure` section in `README.md` SHOULD also list the modular tool paths in alphabetical order.

### AC-3: "Featured" Badge on Biomorphs Card
- The `Biomorphs` card in `src/App.tsx` MUST display a high-contrast, elegant "Featured" badge or callout (e.g., `<span className="tool-card-badge">Featured</span>`).
- The badge style in `src/index.css` MUST adhere to the dark theme standard (deep slate/navy `#0f172a` with subtle cyan accent `#38bdf8` or vibrant gradient, clean typography, WCAG AA contrast).
- The card styling MUST remain fully responsive across all viewports (down to 320px) without overflow or layout breakage.

### AC-4: Automated Verification & Regression Tests
- **Structure Audit Script (`scripts/test_tools_structure.py`):**
  - Validates that `README.md` links in `Featured Tools` point to `https://tools.arunsr.in/<tool>`.
  - Validates that tools listed under `Featured Tools` in `README.md` are in strict alphabetical order.
  - Validates that tool cards in `src/App.tsx` appear in strict alphabetical order.
- **Companion Hub Tests (`src/App.test.tsx`):**
  - Asserts that tool links rendered on the hub dashboard appear in strict alphabetical sequence.
  - Asserts that the "Featured" badge is present and accessible on the Biomorphs card.
  - Asserts that all navigation, direct routing, and SPA behavior remain 100% functional.

### AC-5: Zero Bloat, Parity & Quality Gates
- No extraneous dependencies added.
- Full test suite passes via `./scripts/test.ps1` (or `./scripts/test.sh`) with >80% test coverage and 0 ESLint / TypeScript diagnostics.
