# Cute Pomo / Focus Timer - Modular Tool Specification

## 1. Overview
Cute Pomo is a distraction-free, aesthetically pleasing Pomodoro and focus timer featuring "Pomo" the Sprouting Tomato Buddy mascot (`PomoMascot`). It provides classic Pomodoro cadence (25m Focus / 5m Short Break / 15m Long Break across 4 cycles), audio chimes synthesized via native Web Audio API, dynamic tab title countdowns, quick micro-adjustments, and customizable durations.

## 2. Functional Requirements

### 2.1 Cadence & Cycles
- **Focus Interval**: 25 minutes default (customizable 1–90m).
- **Short Break**: 5 minutes default (customizable 1–30m).
- **Long Break**: 15 minutes default (customizable 1–60m).
- **4-Session Cycle**: After 4 completed focus sessions, the timer transitions to Long Break.
- **Cycle Indicators**: Visual display of 4 session indicators (`🍅 🍅 ⚪ ⚪`) showing progress in the current cycle, alongside total lifetime completed focus sessions.

### 2.2 Sprouting Tomato Buddy ("Pomo")
- Custom animated SVG mascot (`PomoMascot.tsx`) responding to timer phases:
  - **Focus**: Alert eyes, focused smile, gentle rhythmic breathing pulse.
  - **Short Break**: Relaxed eyes, peaceful smile, steaming mug of tea/coffee.
  - **Long Break / Complete**: Bouncing celebratory animation, sparkle stars, cheering expression.

### 2.3 Visual Progress & Display
- Circular SVG progress ring tracking elapsed time versus total phase duration.
- Large numerical display (`MM:SS`) with high-contrast font.
- Dynamic tab title: `(MM:SS) 🍅 Mode · Tools Hub` managed via `useDocumentTitle`, restoring the prior `document.title` on unmount.
- Visual pulse glow animation upon timer reaching `00:00`.

### 2.4 Controls & Quick Adjustments
- **Start / Pause**: Toggle running state using wall-clock target timestamp (`Date.now()`) to prevent background-tab timer drift.
- **Reset**: Restore current phase duration.
- **Skip**: Immediately jump to the next phase in the Pomodoro cycle.
- **Micro-adjustments**: `+1m` and `-1m` buttons to tweak active or paused session time on the fly.
- **Auto-start Next Phase**: Toggle to automatically begin the next interval (default: manual).

### 2.5 Audio & Settings
- **Web Audio API Chimes**: Dual-tone synthesized chime via shared `createAudioController` / `playWithAudio` on timer expiration (zero external audio files, proper `AudioContext.close()` cleanup, graceful fallback if unsupported).
- **Mute Toggle**: Prominent sound toggle button with visual state indicator.
- **Settings Modal**: Shared `Modal` dialog (`Escape` close, focus restoration) with strict numeric input validation and `InlineAlert` (`role="alert"`) error reporting.

## 3. Acceptance Criteria
- **Hub Navigation & Direct Route**: Uses shared `ToolHeader` (`"← Back to Tools Hub"` calling `onBack()`), shared `SegmentedControl` for phase switching, and registers `/pomo` in `src/routes.ts`, `src/App.tsx`, and `src/App.test.tsx`.
- **Wall-Clock Accuracy & Lifecycle Cleanup**: Countdown computes remaining seconds from target wall-clock timestamp; intervals, `useTimeoutRegistry` alerts, `document.title`, and `AudioContext` clean up on unmount.
- **Persistence & Validation**: Durations, sound preference, auto-start setting, and completed tally are stored under `tools_hub_pomo_prefs` via `usePersistedState` with runtime validation and `try/catch` error safety.
- **Responsive Dark Theme & CSS Isolation**: Consumes `src/styles/tokens.css`, prefixes classes (`.pomo-*`), wraps `.pomo-controls` on 320px viewports, and maintains WCAG AA contrast.
- **Modular Isolation & Test Coverage**: `PomoTimer.tsx` exports only `default function PomoTimer` (types in `types.ts`, mascot in `PomoMascot.tsx`), with `PomoTimer.test.tsx` verifying corrupt JSON, `QuotaExceededError`, invalid settings, Web Audio errors, and unmount cleanup (>80% coverage).
