# Timezone Converter / Visualizer Specification

## 1. Overview & User Story
As a user working across distributed global teams, I want a visual world clock and timezone converter inspired by World Time Buddy so that I can easily compare times across multiple cities, spot overlapping working hours across a rolling 3-day window, and share meeting times effortlessly.

## 2. Acceptance Criteria

### 2.1 Timezone Management & Defaults
- **AC-1 (Default Timezones):** When loaded for the first time without stored preferences, the tool initializes with the following default zones:
  - Bangalore (`Asia/Kolkata`)
  - San Francisco (`America/Los_Angeles`)
  - Tokyo (`Asia/Tokyo`)
  - Colombia / Bogotá (`America/Bogota`)
  - Edmonton (`America/Edmonton`)
  - UTC (`UTC`)
- **AC-2 (Search & Add Timezones):** An accessible search input allows users to search timezones by city name, country, region, or UTC offset with fuzzy/substring matching. Selecting an item adds it to the active list.
- **AC-3 (Remove & Set Reference):** Each timezone row has controls to remove the timezone (unless only one remains) and designate a timezone as the primary reference / home base (pinned to top or flagged).
- **AC-4 (Local Storage Persistence):** Active timezones and user preferences (format toggle) persist in `localStorage` under a dedicated key (`tools_hub_timezone_prefs`). Failures or private browsing restrictions are safely caught.

### 2.2 Visual Rolling 3-Day Slider & Grid
- **AC-5 (Rolling 3-Day Window):** The interactive timeline displays 72 continuous hourly blocks covering Yesterday, Today, and Tomorrow based on the selected base date.
- **AC-6 (Synchronized Scrubber):** Clicking or hovering/dragging across any hour block in any timezone row positions a shared time cursor that synchronizes across all displayed timezone rows, displaying the exact local date, hour, and minute for each zone.
- **AC-7 (Working Hours Highlighting):** Hour tiles falling within standard business hours (09:00 to 18:00 local time) are visually highlighted with a distinct background/border to clearly spot overlapping working hours across multiple locations.
- **AC-8 (Day/Night & Date Transitions):** Night hours (e.g., 22:00 to 07:00) and daylight hours have distinct contrast. Day transitions (midnight crossing) clearly show the day-of-week and date header badge so users immediately know when a zone has moved into yesterday or tomorrow.
- **AC-9 (Current Time Marker):** A distinct live indicator marks the current real-world time across the grid. A "Now" button snaps the scrubber back to the current time.

### 2.3 Time Formats & Manual Input
- **AC-10 (12h / 24h Toggle):** A toggle button switches all displayed times and timeline block labels between 12-hour (AM/PM) and 24-hour formats. Preference is preserved in `localStorage`.
- **AC-11 (Direct Date & Time Input):** Users can manually pick an exact date and type or adjust a specific time (hours/minutes) for the active reference zone, projecting across all rows immediately.

### 2.4 Meeting Time Copy & Export
- **AC-12 (Copy Overlapping Time):** A "Copy Meeting Times" button formats the currently selected timestamp across all visible timezones into a clean, readable text/markdown snippet and copies it to the clipboard, with visual feedback ("Copied!").

### 2.5 Hub Integration & Core Principles
- **AC-13 (Navigation):** An accessible "Back to Hub" button returns to the main hub.
- **AC-14 (Zero Dependency Bloat):** Time calculations and formatting use native JavaScript `Date` and `Intl.DateTimeFormat` APIs with zero external date libraries.
- **AC-15 (Accessibility & High Contrast):** High contrast UI adhering to WCAG AA, full keyboard accessibility, and responsive layout across mobile and desktop.
- **AC-16 (Automated Test Coverage):** Comprehensive companion unit and component tests verifying defaults, search, hour scrubbing, 12h/24h toggle, copy, and error resiliency with >80% coverage.
