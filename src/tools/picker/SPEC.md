# Random Picker - Modular Tool Specification

## 1. Overview
Random Picker is a playful, responsive, visual-first random decision maker utility with three interactive modes: Coin Toss, Multi-Dice Roll, and Multiple Choice Picker (Spinning Wheel & Card Draw).

## 2. Functional Requirements
- **Coin Toss**: 3D flip animation, Heads/Tails outcome, streaks, flip statistics (Heads/Tails counts and percentages), and reset stats.
- **Dice Roll**: 1 to 6 six-sided dice with classic dot pips, tumbling animation, sum calculation, and roll history.
- **Multiple Choice Picker**:
  - **Spinning Wheel View**: Smooth deceleration rotation, pointer alignment, and slice labels (including single-slice fallback).
  - **Instant Draw / Card Picker**: Card shuffle/flip animation with fluid card width (`min(220px, 100%)`).
  - **Quick Presets**: `"Yes / No / Maybe"`, `"What to Eat"`, `"Who Goes First"`, `"Numbers 1-10"`.
  - **Elimination Mode**: Draw without replacement (raffle mode) with remaining items tracker and pool reset.
  - **Confetti Celebration**: Canvas particle burst on selection with safe null-canvas guard and animation cleanup.
  - **History**: Pick history with clear button.
- **Visuals Only**: High-contrast animations, zero audio dependencies.

## 3. Acceptance Criteria
- **Hub Navigation & Direct Route**: Uses shared `ToolHeader` (`"← Back to Tools Hub"` calling `onBack()`), shared `SegmentedControl` for mode switching, and registers `/picker` in `src/routes.ts`, `src/App.tsx`, and `src/App.test.tsx`.
- **Mid-Spin Guard & Exhaustion Handling**: `Reset Pool` and `Elimination Mode` controls are disabled while `isChoosing` is active (`finalizePick` guards against mid-spin corruption), and exhausting the elimination pool handles 0 remaining items cleanly.
- **Timer & RAF Cleanup**: Active timeouts use `useTimeoutRegistry` (never leaking on unmount) and `confettiAnimRef.current` resets to `null` when particles finish.
- **Persistence & Shape Validation**: Pool, coin stats, dice history, and choice history use `usePersistedState` with runtime shape validators and `try/catch` protection against corrupt or partial JSON.
- **Responsive Dark Theme & CSS Isolation**: Consumes `src/styles/tokens.css`, prefixes classes (`.picker-*`), wraps tabs cleanly on 320px viewports, and maintains WCAG AA text contrast (>= 4.5:1).
- **Modular Isolation & Test Coverage**: `ChoicePicker.tsx` exports only `default function ChoicePicker`, with `ChoicePicker.test.tsx` restoring mocks in `afterEach` and exceeding 80% coverage.
