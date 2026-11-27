# Tools Hub - Master Specification

A centralized static hub for hosting multiple small, self-contained tools.

## 1. Functional Requirements
- **Centralized Navigation**: A main "Tools Hub" page that lists all available tools.
- **Tool Isolation & Shared Primitives**: Each tool operates independently inside `src/tools/<tool-name>/` with zero cross-tool imports, consuming shared components, hooks, and utilities from `src/shared/` (`ToolHeader`, `Modal`, `SegmentedControl`, `InlineAlert`, `Toast`, `ToolErrorBoundary`, `usePersistedState`, `useTimeoutRegistry`, `useCopyFeedback`, `useDocumentTitle`, `clipboard`, `canvas`, `audio`) rather than duplicating infrastructure.
- **Error Boundary Isolation**: Active tool views in `src/App.tsx` are wrapped in `ToolErrorBoundary` so runtime errors in a single tool never crash the entire hub and always offer a safe `"← Back to Tools Hub"` recovery action.
- **Routing/View Switching**: Seamless URL-synchronized routing between the hub and individual tools using the HTML5 History API (e.g. `/big`, `/timezone`, `/picker`, `/pomo`, `/pals`, `/fractal`, `/biomorphs`), supporting direct shareable links, exact single-segment route matching (preserving query parameters and non-route hashes), browser history navigation (back/forward), and semantic link cards with zero external router bloat.
- **Dark Theme Standard**: Tools Hub and modular tools adopt a high-contrast dark theme by default matching `arunsr.in` (`#0f172a`, `#1e293b`, `#38bdf8`), avoiding unnecessary global theme toggles.
- **Mandatory Registration & Test Parity**: Whenever a new tool is introduced to `src/tools/`, `README.md` (`Featured Tools` and `Project Structure`), `SPEC.md` (`Current Tools`), `src/routes.ts`, `src/App.tsx`, and `src/App.test.tsx` MUST be updated, and `src/tools/<tool-name>/SPEC.md` must define `Overview`, `Functional Requirements`, and `Acceptance Criteria`.
- **Scalability**: New tools can be added by creating a new module in `src/tools/`.

## 2. UI/UX Requirements
- **Clean Dashboard**: A minimalist, card-based layout for the hub.
- **Unified Design Tokens & Cyan Palette**: All surfaces, borders, text, semantic alerts, radii, z-index layers, and WCAG AA-safe cyan accents (`#0f172a` canvas, `#1e293b` surface, `#334155` border, `#f1f5f9` / `#94a3b8` text, `#38bdf8` / `#7dd3fc` / `#0369a1` accents) are standardized in `src/styles/tokens.css` and `src/styles/primitives.css`.
- **Keyboard Accessibility & Focus Rings**: All interactive elements (`button`, `a`, `input`, `select`, `textarea`, `[tabindex]`) preserve clear `:focus-visible` outlines (`--focus-ring`), modals support `Escape` dismissal and focus restoration, and blocking browser dialogs (`alert`/`confirm`/`prompt`) are banned in favor of `InlineAlert` / `Modal`.
- **Subtle Chessboard Watermark**: SVG 8×8 checkered watermark with radial fade mask anchored to the top-right corner, featuring an interactive chess knight easter egg with authentic chess quotes.
- **Standardized Back to Hub**: Every tool MUST provide an explicit, accessible `"← Back to Tools Hub"` control (via shared `ToolHeader` calling `onBack()`).
- **Responsive Hub & Tools**: Layouts scale gracefully across viewports from 320px mobile to desktop without horizontal overflow.
- **Attribution & Transparency**: Prominently displays author attribution ("Authored by Arun · Co-authored by LLM") and links to the GitHub repository and personal website.

## 3. Technical Constraints
- **Self-Contained Static Output**: Deployed to Cloudflare Workers using Workers Assets.
- **Technology Stack**: React 19 (TypeScript) + Vite.
- **No Backend**: Completely client-side.
- **License**: GPLv3.

## 4. Current Tools
1. **[Big Text](./src/tools/big/SPEC.md)**: A high-visibility full-screen text display.
2. **[Biomorphs](./src/tools/biomorphs/SPEC.md)**: Evolutionary Watchmaker artificial selection sandbox guiding morphology of generative alien organisms.
3. **[Cute Pomo](./src/tools/pomo/SPEC.md)**: A playful Pomodoro and focus timer featuring Sprouting Tomato Buddy, chimes & cycle tracking.
4. **[Desktop Pals](./src/tools/pals/SPEC.md)**: An interactive canvas companion toy with physics playgrounds, obstacles, toys & treats.
5. **[Fractal Explorer](./src/tools/fractal/SPEC.md)**: An interactive Mandelbrot, Julia & Burning Ship explorer with deep zoom & 4K wallpaper studio.
6. **[Random Picker](./src/tools/picker/SPEC.md)**: A playful decision maker with coin toss, multi-dice roll, and spinning wheel / raffle picker.
7. **[Timezone Converter](./src/tools/timezone/SPEC.md)**: A visual 3-day world clock, overlapping working hours & meeting planner.
