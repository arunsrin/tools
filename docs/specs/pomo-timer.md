# Cute Pomo / Focus Timer Specification

## 1. Overview & User Story
As a focused user or student working at a computer, I want a delightful, distraction-free Pomodoro timer featuring a cute companion mascot ("Pomo" the Sprouting Tomato Buddy) and classic interval pacing so that I can sustain deep focus, remember to take refreshing breaks, track my productivity cycles, and stay motivated without clutter or heavy dependencies.

---

## 2. Acceptance Criteria

### 2.1 Pacing, Modes & Mascot States
- **AC-1 (Classic Pomodoro Cadence):** The timer operates in three distinct phases:
  - **Focus Mode:** 25 minutes default.
  - **Short Break Mode:** 5 minutes default (triggered after sessions 1, 2, and 3).
  - **Long Break Mode:** 15 minutes default (triggered after completing the 4th focus session).
  - Completing a long break resets the 4-session cycle count back to session 1 while preserving the total completed Pomodoro tally.
- **AC-2 (Sprouting Tomato Mascot "Pomo"):** An animated SVG companion visually reflects the current phase:
  - **Focus State:** Concentrated facial expression with gentle rhythmic breathing animation and alert sprout.
  - **Short Break State:** Peaceful, relaxed expression enjoying a warm steaming cup of tea/coffee.
  - **Long Break / Celebration State:** Cheerful celebratory expression with bounce animation and sparkle effects.
- **AC-3 (Radial Progress Visualizer):** A high-contrast circular progress ring smoothly displays elapsed versus total time for the current mode, with clear numerical countdown (`MM:SS`).

### 2.2 Cycle & Productivity Tracking
- **AC-4 (Cycle Tokens & Lifetime Tally):**
  - Displays 4 visual session tokens (e.g. mini tomatoes or progress dots) indicating progress within the current 4-pomodoro set.
  - Displays a lifetime / daily completed Pomodoro counter with an option to reset stats.

### 2.3 Timer Controls & Micro-Adjustments
- **AC-5 (Playback Controls):**
  - Start / Pause button with clear status indication.
  - Reset button to restore the current phase to its full duration.
  - Skip button to advance to the next phase immediately.
- **AC-6 (Quick Time Adjustments):**
  - `+1m` and `-1m` buttons allow instant micro-adjustments to the active or paused timer without opening configuration menus.
- **AC-7 (Auto-Start Option):**
  - An optional "Auto-start next phase" toggle (default: false) allowing users to choose whether phases transition automatically or pause until manually resumed.

### 2.4 Customization & Settings
- **AC-8 (Custom Interval Durations):**
  - Accessible settings drawer or modal to customize interval lengths:
    - Focus duration: 1 to 90 minutes.
    - Short Break duration: 1 to 30 minutes.
    - Long Break duration: 1 to 60 minutes.
  - Input validation enforcing minimum (1 min) and maximum constraints.
  - "Reset to Defaults" option restoring 25 / 5 / 15.

### 2.5 Audio Alerts & Browser Integration
- **AC-9 (Zero-Bloat Web Audio Chimes):**
  - When a phase reaches 00:00, a pleasant chime sound is synthesized in real time using native `AudioContext` oscillators (zero external mp3/wav files).
  - Prominent sound toggle button (Mute / Unmute) with state indicator.
  - Graceful no-op fallback if `AudioContext` is unavailable or blocked by autoplay policies.
- **AC-10 (Document Title Countdown):**
  - Tab title dynamically updates during countdown (e.g. `(24:59) 🍅 Focus · Tools Hub`) so users can check remaining time from background tabs.
  - Restores hub title (`Tools Hub`) on unmount or return to hub.
- **AC-11 (Phase Completion Visual Alert):**
  - Visual pulse and glow highlight when timer reaches 00:00.

### 2.6 Persistence & Platform Standards
- **AC-12 (LocalStorage Persistence):**
  - Saves custom interval durations, mute preference, auto-start setting, and completed pomodoro count to `localStorage` under key `tools_hub_pomo_prefs`.
  - Operations wrapped in `try/catch` to gracefully tolerate private browsing or restricted quota exceptions.
- **AC-13 (Navigation & Hub Registration):**
  - Prominent "Back to Hub" button calling `onBack()`.
  - Tool card registered in `src/App.tsx` with icon 🍅, title, and descriptive summary.
  - Tool registered in `SPEC.md` and `README.md`.
- **AC-14 (Aesthetics & Accessibility):**
  - High-contrast dark theme adhering to `#0f172a` (background), `#1e293b` (cards), `#334155` (borders), `#f1f5f9` (text), `#f43f5e` (tomato coral), and `#10b981` (sprout green).
  - WCAG AA compliant contrast ratios and full keyboard navigation.
  - Fully responsive design scaling cleanly from mobile (320px) to desktop.
- **AC-15 (Cloudflare Workers Assets Compatibility):**
  - Strictly client-side static output, zero server dependencies, and zero third-party UI/audio libraries.
- **AC-16 (Automated Regression Test Suite):**
  - Comprehensive companion tests in `PomoTimer.test.tsx` verifying timer ticking, phase switching, cycle progression, mascot state changes, custom duration settings, audio triggering, localStorage error handling, and back navigation with >80% coverage.
