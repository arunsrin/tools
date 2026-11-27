# Big Text - Modular Tool Specification

## 1. Overview
Big Text is a high-visibility full-screen text display utility designed for noisy environments, presentations, or communicating across a distance. Users enter or select text, choose a high-contrast color theme, and toggle into a distraction-free display mode that automatically scales typography to fill the viewport.

## 2. Functional Requirements
- **Text Input**: Users can enter text into a clear, prominent input field, and submit via button click or `Enter` key.
- **Quick-Select Presets**: A set of commonly used text/emoji buttons (e.g., `'Yes'`, `'No'`, `'🍺 1 more please'`) for instant display.
- **Theme Selection**: A concise set of high-contrast themes (e.g., Light on Dark, Dark on Light, Green on Black, Yellow on Black), scoped cleanly to `.bigtext-root` / `.theme-*` classes without overriding global `:root` tokens.
- **Dynamic Font Sizing**: The entered text automatically resizes to fill as much of the viewport as possible without overflowing. Responsive padding (minimum 16px to 5% of viewport width) is maintained so text never touches screen edges. Natural words do not break mid-word; font size scales down so each word fits horizontally on a single line, while extremely long unbroken strings that exceed container width at minimum font size (16px) apply graceful wrapping (`force-break`).
- **Toggle Display Mode**: Clear switching between `"Editing"` and `"Displaying"` modes.
- **Persistence**: Store the last entered text and theme in `localStorage` via `usePersistedState` with `try/catch` safety.

## 3. Acceptance Criteria
- **Empty/Whitespace Guard**: Submitting empty or whitespace-only input displays an inline validation error (`InlineAlert` with `role="alert"`) rather than entering display mode silently.
- **Display Mode Accessibility**: Display Mode provides keyboard and pointer exit controls (`role="button"`, `tabIndex={0}`, `Escape` / `Enter` / `Space` handling) and a visible high-contrast `"← Back to Tools Hub"` / exit affordance meeting WCAG AA contrast (>= 4.5:1).
- **Hub Navigation**: Editor mode renders the shared `ToolHeader` (`"← Back to Tools Hub"` calling `onBack()`).
- **Direct Route & Registration**: Direct route `/big` is registered in `src/routes.ts`, `src/App.tsx`, `src/App.test.tsx`, `SPEC.md`, and `README.md`.
- **Responsive Design & Tokens**: Editor UI consumes shared design tokens (`src/styles/tokens.css`), uses `type="button"` on non-submit buttons, and scales cleanly from 320px mobile to desktop viewports.
- **Lifecycle Cleanup & Coverage**: Resize listeners and transient timers (`useTimeoutRegistry`) clean up on unmount, and companion tests in `BigText.test.tsx` exceed 80% coverage including negative/storage error cases.

## 4. Technical Constraints & Hub Integration
- **Modular Component**: Lives within `src/tools/big/` (`BigText.tsx`, `BigText.css`, `BigText.test.tsx`, `constants.ts`, `SPEC.md`).
- **Single Default Export**: `BigText.tsx` exports only `default BigText` (`react-refresh/only-export-components`).
- **Zero Backend**: Client-side only with zero external runtime dependencies.
