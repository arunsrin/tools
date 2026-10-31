# Cute Pomo / Focus Timer - Modular Tool Specification

## 1. Overview
Cute Pomo is a distraction-free, aesthetically pleasing Pomodoro and focus timer featuring "Pomo" the Sprouting Tomato Buddy mascot. It provides classic Pomodoro cadence (25m Focus / 5m Short Break / 15m Long Break across 4 cycles), audio chimes synthesized via native Web Audio API, dynamic tab title countdowns, quick micro-adjustments, and customizable durations.

---

## 2. Acceptance Criteria & Features

### 2.1 Cadence & Cycles
- **Focus Interval:** 25 minutes default (customizable 1-90m).
- **Short Break:** 5 minutes default (customizable 1-30m).
- **Long Break:** 15 minutes default (customizable 1-60m).
- **4-Session Cycle:** After 4 completed focus sessions, the timer transitions to Long Break.
- **Cycle Indicators:** Visual display of 4 session indicators (`🍅 🍅 ⚪ ⚪`) showing progress in the current cycle, alongside total lifetime completed focus sessions.

### 2.2 Sprouting Tomato Buddy ("Pomo")
- Custom animated SVG mascot responding to timer phases:
  - **Focus:** Alert eyes, focused smile, gentle rhythmic breathing pulse.
  - **Short Break:** Relaxed eyes, peaceful smile, steaming mug of tea/coffee.
  - **Long Break / Complete:** Bouncing celebratory animation, sparkle stars, cheering expression.

### 2.3 Visual Progress & Display
- Circular SVG progress ring tracking elapsed time versus total phase duration.
- Large numerical display (`MM:SS`) with high-contrast font.
- Dynamic tab title: `(MM:SS) 🍅 Mode · Tools Hub` updating every second during countdown.
- Visual pulse glow animation upon timer reaching 00:00.

### 2.4 Controls & Quick Adjustments
- **Start / Pause:** Toggle running state.
- **Reset:** Restore current phase duration.
- **Skip:** Immediately jump to the next phase in the Pomodoro cycle.
- **Micro-adjustments:** `+1m` and `-1m` buttons to tweak active or paused session time on the fly.
- **Auto-start Next Phase:** Toggle to automatically begin the next interval (default: manual).

### 2.5 Audio & Persistence
- **Web Audio API Chimes:** Dual-tone synthesized chime on timer expiration (zero external audio files).
- **Mute Toggle:** Prominent sound toggle button with visual state indicator.
- **Local Storage:** Durations, sound preference, auto-start setting, and completed tally stored under `tools_hub_pomo_prefs` with `try/catch` guard.

### 2.6 Navigation & Design
- "Back to Hub" button calling `onBack()`.
- Responsive layout supporting 320px mobile to desktop.
- High-contrast dark theme matching Tools Hub standards.
