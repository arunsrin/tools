# Timezone Converter / Visualizer - Modular Tool Specification

## 1. Overview
The Timezone Converter / Visualizer is a client-side utility inspired by World Time Buddy. It enables users to compare time across global cities, visualize overlapping working hours on an interactive 72-hour rolling timeline, project times synchronously, and copy meeting times in a single click.

## 2. Functional Requirements

### 2.1 Default Cities & Preferences
- Initial default list when no `localStorage` data exists:
  - Bangalore (`Asia/Kolkata`, India)
  - San Francisco (`America/Los_Angeles`, US)
  - Tokyo (`Asia/Tokyo`, Japan)
  - Colombia / Bogotá (`America/Bogota`, Colombia)
  - Edmonton (`America/Edmonton`, Canada)
  - UTC (`UTC`, Coordinated Universal Time)
- Persistent settings in `localStorage` under `tools_hub_timezone_prefs` via `usePersistedState` with `try/catch` safety and runtime `Intl.DateTimeFormat` validation of `tz.iana` identifiers.
- Ability to reset to default timezones.

### 2.2 Interactive 72-Hour (3-Day) Grid
- Horizontal rolling timeline representing 72 hours (Yesterday, Today, Tomorrow relative to reference date) stepped accurately across DST transitions without UTC millisecond drift.
- Clicking or scrubbing across any hour tile updates the active selected timestamp across all displayed timezone rows without forcibly re-snapping horizontal scroll on every click (auto-scroll only on initial mount or explicit `"Reset to Now"`).
- Synchronized vertical indicator marking the exact floored active hour slot (preventing off-by-one next-hour highlights when minutes >= 30).
- Live real-world time marker and a `"Now"` button to snap the cursor back to the present moment.
- Working hours (`09:00` to `18:00` local time) highlighted with distinct border and background for scheduling meetings.
- Night hours (`22:00` to `07:00`) displayed with darker contrast (`--bg-elevated` / `--text-muted` meeting WCAG AA contrast).
- Date boundary badges displayed at midnight (`00:00`) showing the local date/day name.

### 2.3 Search & Customization
- Fuzzy / substring search across city names, country names, IANA timezone identifiers, UTC offsets, and common timezone abbreviations/conventions (e.g. `PST`, `PDT`, `Pacific`, `EST`, `EDT`, `Eastern`, `CST`, `CDT`, `Central`, `MST`, `MDT`, `Mountain`, `IST`, `GMT`, `BST`, `CET`, `JST`, `AEST`).
- Accessible dropdown with keyboard `ArrowUp`/`ArrowDown`/`Enter`/`Escape` navigation and an explicit `"No matching cities"` empty state.
- Add new timezones from search results (ignoring duplicates), remove timezones (disabled if only one remains), reorder timezones (move up/down with boundary disabled states), and designate any timezone as the home/reference base.

### 2.4 Time Controls & Copy
- 12h / 24h format toggle.
- Direct date and time inputs for setting an exact instant in the reference timezone (gracefully handling invalid date/time input).
- One-click `"Copy Meeting Times"` via `useCopyFeedback` with visual `Toast` / `InlineAlert` confirmation on both success and clipboard/execCommand failure.

## 3. Acceptance Criteria
- **Hub Navigation & Direct Route**: Uses shared `ToolHeader` (`"← Back to Tools Hub"` calling `onBack()`) and registers `/timezone` in `src/routes.ts`, `src/App.tsx`, and `src/App.test.tsx`.
- **DST & Minute-Boundary Accuracy**: `getThreeDayTimelineHours` handles DST transitions accurately and hour-tile highlighting matches the floored active hour even when minutes >= 30.
- **Invalid IANA & Storage Resilience**: Invalid `tz.iana` strings in storage are filtered/sanitized before `Intl.DateTimeFormat` rendering; `localStorage` read/write errors (`QuotaExceededError`) do not crash the tool.
- **Lifecycle Cleanup**: Intervals and `useTimeoutRegistry` timers clean up on unmount.
- **WCAG AA Dark Theme & Mobile 320px**: Consumes `src/styles/tokens.css`, meets >= 4.5:1 contrast (including `.tz-ref-badge` `--accent-on` on `--accent` and `.tz-hour-tile.night-hours`), wraps `.tz-header-left`, and scales sticky row sidebars cleanly on `<= 480px` viewports.
- **Modular Isolation & Test Coverage**: `TimezoneConverter.tsx` exports only `default function TimezoneConverter` with `TimezoneConverter.test.tsx` restoring mocked globals in `afterEach` and exceeding 80% coverage.
