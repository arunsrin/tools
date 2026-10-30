# Timezone Converter / Visualizer - Modular Specification

## 1. Overview
The Timezone Converter / Visualizer is a client-side utility inspired by World Time Buddy. It enables users to compare time across global cities, visualize overlapping working hours on an interactive 72-hour rolling timeline, project times synchronously, and copy meeting times in a single click.

## 2. Acceptance Criteria & Features

### 2.1 Default Cities & Preferences
- Initial default list when no localStorage data exists:
  - Bangalore (`Asia/Kolkata`, India)
  - San Francisco (`America/Los_Angeles`, US)
  - Tokyo (`Asia/Tokyo`, Japan)
  - Colombia / Bogotá (`America/Bogota`, Colombia)
  - Edmonton (`America/Edmonton`, Canada)
  - UTC (`UTC`, Coordinated Universal Time)
- Persistent settings in `localStorage` under `tools_hub_timezone_prefs` with `try/catch` safety.
- Ability to reset to default timezones.

### 2.2 Interactive 72-Hour (3-Day) Grid
- Horizontal rolling timeline representing 72 hours (Yesterday, Today, Tomorrow relative to reference date).
- Clicking or scrubbing across any hour tile updates the active selected timestamp across all displayed timezone rows.
- Synchronized vertical indicator marking the currently selected hour/minute.
- Live real-world time marker and a "Now" button to snap the cursor back to the present moment.
- Working hours (09:00 to 18:00 local time) highlighted with distinct border and background for scheduling meetings.
- Night hours (22:00 to 07:00) displayed with darker contrast.
- Date boundary badges displayed at midnight (00:00) showing the local date/day name.

### 2.3 Search & Customization
- Fuzzy / substring search across city names, country names, IANA timezone identifiers, UTC offsets, and common timezone abbreviations/conventions (e.g. `PST`, `PDT`, `Pacific`, `EST`, `EDT`, `Eastern`, `CST`, `CDT`, `Central`, `MST`, `MDT`, `Mountain`, `IST`, `GMT`, `BST`, `CET`, `JST`, `AEST`).
- Add new timezones from search results.
- Remove timezones (disabled if only one remains).
- Reorder timezones (move up / down) and designate any timezone as the home / reference base.

### 2.4 Time Controls & Copy
- 12h / 24h format toggle.
- Direct date and time inputs for setting an exact instant in the reference timezone.
- One-click "Copy Meeting Times" with clipboard export and visual confirmation.

### 2.5 Architecture & Accessibility
- Pure client-side with native `Date` and `Intl` APIs (zero external libraries).
- WCAG AA high-contrast styling.
- Responsive mobile & desktop layout.
- "Back to Hub" button calling `onBack()`.
