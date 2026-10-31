# Specification: Tools Hub Home Page Tweaks & Theme Unification

**Feature Name:** `tools-home-page-tweaks`  
**Todoist Task ID:** `6hrx2f7H745qj6jF`  
**Status:** In Development  

---

## 1. User Story & Overview

As a user and visitor to Tools Hub, I want:
1. Clear references and links to the GitHub repository and attribution indicating these tools are authored by Arun and co-authored by LLM.
2. A persistent light/dark mode toggle in the top-right corner that seamlessly switches the color scheme across the Hub home page and all existing and future tools.
3. A cohesive, elegant visual identity matching `arunsrin.mkdocs`, featuring a cyan accent palette, crisp slate/white light mode, deep slate/navy dark mode, and a subtle SVG chessboard watermark fading in from the top-right corner.
4. Playful easter eggs aligned with the digital garden aesthetic: an ASCII art banner hidden in the HTML source code, and an interactive chess watermark featuring authentic, famous quotes from legendary chess players and Marcel Duchamp.
5. An established specification rule requiring `README.md` to be updated whenever a new tool is introduced, along with bringing `README.md` up to date with the Timezone Converter.

---

## 2. Acceptance Criteria

### 2.1 Theme & Dark/Light Mode Management
- **AC-1 (Theme Persistence):** A centralized theme state (`'light'` | `'dark'`) persists across sessions in `localStorage` (`tools_hub_theme`). If not previously saved, it defaults to the system preference via `window.matchMedia('(prefers-color-scheme: dark)')`.
- **AC-2 (Global & Tool-Wide Application):** The active theme is applied via `data-theme="light"` or `data-theme="dark"` on `document.documentElement` (or top container), cascading CSS custom properties to both the Hub dashboard and all child tools (`Big Text`, `Timezone Converter`).
- **AC-3 (Top-Right Toggle Button):** A persistent, accessible button (☀️ / 🌙) is prominently rendered in the top-right corner of the Hub and tools navigation chrome, with `aria-label="Toggle dark/light mode"`. Clicking it smoothly toggles between modes with zero flash of unstyled content (FOUC).
- **AC-4 (Cyan Palette Alignment with `arunsrin.mkdocs`):**
  - **Light Mode:** Crisp backgrounds (`#ffffff`, `#f8fafc`), dark slate text (`#1e293b`, `#64748b`), sky-blue/azure accents (`#0284c7`), borders (`#e2e8f0`).
  - **Dark Mode:** Deep slate/navy backgrounds (`#0f172a`, `#1e293b`), bright text (`#f1f5f9`, `#94a3b8`), bright cyan accents (`#38bdf8`), borders (`#334155`).
  - Tools Hub cards, buttons, inputs, and tool components respect these theme variables.

### 2.2 Chessboard Watermark & Interactive Easter Egg
- **AC-5 (Subtle SVG Chessboard Watermark):** An SVG watermark fixed in the top-right corner renders an 8×8 checkered board with a smooth radial gradient fade mask, mirroring `arunsrin.mkdocs/layouts/partials/chess-watermark.html`. Uses `--chess-dark-sq`, `--chess-light-sq`, and `--chess-border`.
- **AC-6 (Interactive Chess Knight & Famous Quotes):** The watermark features a subtle chess piece (♞) or clickable trigger square in the corner. Clicking it activates a playful micro-interaction (subtle hop animation) and displays an authentic chess quote in an accessible toast or balloon.
- **AC-7 (Authentic Chess Quotes):** Quotes are sourced from famous chess figures and thinkers, such as:
  - Marcel Duchamp: *"While all artists are not chess players, all chess players are artists."*
  - Garry Kasparov: *"Tactics is knowing what to do when there is something to do; strategy is knowing what to do when there is nothing to do."*
  - Savielly Tartakower: *"The blunders are all there on the board, waiting to be made."*
  - Siegbert Tarrasch: *"Chess, like love, like music, has the power to make men happy."*
  - Wilhelm Steinitz: *"Chess is not for timid souls."*
  - Bobby Fischer: *"I don't believe in psychology. I believe in good moves."*

### 2.3 Header, Footer & GitHub Attribution
- **AC-8 (GitHub Links):** A GitHub icon and link pointing to `https://github.com/arunsrin/tools` is positioned in the top-right chrome alongside the theme toggle.
- **AC-9 (Author Attribution & Footer):** The Hub footer displays:
  - *"Authored by Arun · Co-authored by LLM"*
  - Links to GitHub repo (`https://github.com/arunsrin/tools`), digital garden (`https://www.arunsr.in/`), and license info (GPLv3).

### 2.4 Hidden ASCII Art Banner
- **AC-10 (HTML Source ASCII Banner):** Embedded in `index.html` (or root comment block), an ASCII art toolbox banner and philosophical quote are visible to curious developers viewing page source.

### 2.5 Specification & Documentation Integrity
- **AC-11 (Mandatory README Tool Registration):** Master `SPEC.md` and `AGENTS.md` are updated to enforce that whenever a new tool is introduced, `README.md` must be updated under Featured Tools and Project Structure.
- **AC-12 (README Sync):** `README.md` is updated to include the Timezone Converter and link to GitHub and live previews.

---

## 3. Technical Constraints & Guardrails
- **React 19 & TypeScript Strictness:** Zero `any` types; all props, state hooks, and events explicitly typed.
- **Client-Side Only / Cloudflare Workers Assets:** Builds strictly to `./dist` with zero Node runtime dependencies.
- **Performance & Zero Bloat:** SVG and CSS-driven animations; native Web APIs for theme detection and storage.
- **Automated Regression Tests:** All new functionality (theme toggling, persistence, quotation cycling, footer links, accessibility) covered with companion Vitest tests maintaining >80% coverage.
