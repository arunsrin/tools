# Specification: Tools Hub Home Page Tweaks & Theme Unification

**Feature Name:** `tools-home-page-tweaks`  
**Todoist Task ID:** `6hrx2f7H745qj6jF`  
**Status:** In Development (Refined per Author Review)  

---

## 1. User Story & Overview

As a user and visitor to Tools Hub, I want:
1. Clear references to the GitHub repository (icon-only button in top-right chrome) and attribution indicating these tools are authored by Arun and co-authored by LLM.
2. A consistent, high-contrast **Dark Theme by Default** across the Hub and tools matching the dark theme of `arunsr.in` (`#0f172a`, `#1e293b`, `#38bdf8`), without an unnecessary global light/dark theme toggle.
3. A cohesive visual identity with cyan accents and a subtle SVG chessboard watermark fading in from the top-right corner.
4. Playful easter eggs aligned with the digital garden aesthetic: an ASCII art banner hidden in the HTML source code, and an interactive chess watermark featuring authentic, famous quotes from legendary chess players and Marcel Duchamp.
5. An established specification rule requiring `README.md` to be updated whenever a new tool is introduced, along with bringing `README.md` up to date with the Timezone Converter.

---

## 2. Acceptance Criteria

### 2.1 Theme & Dark Mode Standard
- **AC-1 (Default Dark Theme):** Tools Hub strictly adopts a dark theme by default matching `arunsr.in` dark mode:
  - Deep slate/navy background (`#0f172a`), card background (`#1e293b`), card borders (`#334155`).
  - High-contrast text (`#f1f5f9`, `#94a3b8`), vibrant cyan/sky-blue accents (`#38bdf8`, `#7dd3fc`).
- **AC-2 (Tool Theme Autonomy):** Tools Hub does not force a global light/dark toggle. Individual tools like `Big Text` retain their own specialized display presets, while `Timezone Converter` operates in its polished dark interface.

### 2.2 Top Chrome & Footer Attribution
- **AC-3 (Icon-Only GitHub Link):** The top-right chrome contains an icon-only GitHub link pointing to `https://github.com/arunsrin/tools` with `aria-label="GitHub Repository"` and `title="GitHub Repository"`.
- **AC-4 (Attribution Footer):** The Hub footer displays only:
  - *"Authored by Arun · Co-authored by LLM"* (with a link to `https://www.arunsr.in/`).
  - No auxiliary link bar below it.

### 2.3 Chessboard Watermark & Easter Eggs
- **AC-5 (Subtle SVG Chessboard Watermark):** An SVG watermark fixed in the top-right corner renders an 8×8 checkered board with a smooth radial gradient fade mask, mirroring `arunsrin.mkdocs`. Uses `--chess-dark-sq`, `--chess-light-sq`, and `--chess-border`.
- **AC-6 (Interactive Chess Knight & Famous Quotes):** The watermark features a subtle chess piece (♞) in the corner. Clicking it activates a playful hop animation and displays an authentic chess quote in an accessible popover toast.
- **AC-7 (Authentic Chess Quotes):** Quotes are sourced from famous chess figures and thinkers (Marcel Duchamp, Garry Kasparov, Savielly Tartakower, Siegbert Tarrasch, Wilhelm Steinitz, Bobby Fischer, Emanuel Lasker, José Raúl Capablanca, Mikhail Tal).
- **AC-8 (HTML Source ASCII Banner):** Embedded in `index.html`, an ASCII art toolbox banner and philosophical quote are visible to curious developers viewing page source.

### 2.4 Specification & Documentation Integrity
- **AC-9 (Mandatory README Tool Registration):** Master `SPEC.md` and `AGENTS.md` are updated to enforce that whenever a new tool is introduced, `README.md` must be updated under Featured Tools and Project Structure.
- **AC-10 (README Sync):** `README.md` is updated to include the Timezone Converter and link to GitHub and live previews.

---

## 3. Technical Constraints & Guardrails
- **React 19 & TypeScript Strictness:** Zero `any` types; all props, state hooks, and events explicitly typed.
- **Client-Side Only / Cloudflare Workers Assets:** Builds strictly to `./dist` with zero Node runtime dependencies.
- **Performance & Zero Bloat:** SVG and CSS-driven animations; native Web APIs.
- **Automated Regression Tests:** All functionality covered with companion Vitest tests maintaining >80% coverage.
