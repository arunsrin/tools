# Feature Specification: Big Text Mobile View Wrapping & Sizing Fix

**Feature Branch:** `fix-big-text-mobile-wrap`  
**Todoist Task:** `6hrrqMcJ3RhHFV2m` ("bug in the 'Big Text' tool: too much wrap in mobile view")  
**Living Spec Custodian:** 🧙‍♂️ Gandalf  
**Status:** In Development

---

## 1. User Story & Context

When viewing the **Big Text** tool on mobile screens (especially portrait orientation), single words such as `"Coffee"` are broken across multiple lines (e.g. `Co / ffe / e`). This occurs because `.big-text` was configured with `overflow-wrap: break-word` and `hyphens: auto`, causing the measurement logic in `findBestFontSize` to see that `scrollWidth` fits the narrow container width while `scrollHeight` easily fits the tall viewport. As a result, the algorithm chooses an excessively large font size that fractures individual words.

The user requires:
1. Natural words must scale down so they never break mid-word (single words stay on one line).
2. Multi-word phrases wrap cleanly at spaces without breaking individual words.
3. Responsive padding that adapts gracefully across narrow mobile screens without clipping or touching edges.
4. Fallback handling for ultra-long continuous strings without spaces (scales down to a 16px floor before breaking/truncating).

---

## 2. Acceptance Criteria

1. **No Mid-Word Splitting:**
   - Single words (e.g. `"Coffee"`, `"HELLO"`, `"WAIT"`) MUST remain unbroken on a single line at all viewports.
   - CSS must enforce `word-break: normal` and `overflow-wrap: normal` for natural words, avoiding unnatural syllable breaks like `Co / ffe / e`.
2. **Dynamic Scale-Down on Mobile:**
   - When entering a word that is wider than the viewport at default/large font sizes, `findBestFontSize` must scale the font size down until the entire word fits horizontally within the available width (accounting for padding).
3. **Multi-Word Natural Wrapping:**
   - Phrases with multiple words (e.g. `"Coffee Please"`, `"Beer 1 more please"`) must wrap only at whitespace boundaries (spaces or explicit newlines). Individual words within the phrase must not break mid-word.
4. **Responsive Padding:**
   - Padding must be calculated responsively (e.g. `max(16px, min(32px, 5vw))` per axis, or minimum 24px-32px total horizontal margin) so that on narrow mobile viewports (e.g. 320px–420px), text does not waste horizontal space while never touching the screen boundary.
5. **Ultra-Long Unbroken Text Fallback:**
   - If an unbroken string exceeds width even when scaled down to a minimum font size floor (`16px`), it gracefully wraps or truncates without causing horizontal viewport scrollbars or layout breakage.
6. **Persistence & Presets Regression Safety:**
   - All existing presets (`Yes`, `No`, `🍺 1 more please`, `👋 Hi!`, `Help!`, `Bill please 💳`), themes, `localStorage` persistence, and back navigation must continue to function with zero regressions.
7. **Automated Regression Test Coverage:**
   - Companion tests in `BigText.test.tsx` must explicitly verify:
     - A single word does not break into multiple lines / is measured to fit available width.
     - Multi-word phrases wrap properly.
     - Responsive padding logic functions correctly.
     - Font size scaling respects container constraints.
   - Full test suite must pass with >80% test coverage.

---

## 3. Core Guardrails & Architecture Compliance

- **React 19 Hooks & Memory Discipline:** Proper cleanup in all `useEffect` listeners; exhaustive dependency arrays.
- **TypeScript Strictness:** Zero `any` types; strictly typed inputs and calculation parameters.
- **Pure Client-Side Static Safety:** 100% client-side compatible with Cloudflare Workers Assets.
- **Modular Isolation:** Changes confined to `src/tools/big/` and accompanying specs/tests.
