# News River (Popurls / Skimfeed Clone) Specification

## 1. Overview & User Story
As a technologist, developer, or curious reader, I want a lightning-fast, minimalist, and responsive multi-feed news aggregator inspired by popurls and skimfeed, so that I can quickly survey top headlines across popular tech, programming, news, and design sources from a single unified dashboard without algorithms, paywalls, bloat, or tracking.

## 2. Architecture & Data Strategy (Hybrid Jamstack)
- **Instant Zero-Latency Boot:** The application ships with a bundled static JSON snapshot (`public/data/feeds.json` with embedded fallback data) so the initial render is instantaneous (0ms network delay), fully functional offline, and requires zero external servers.
- **Automated CI Aggregator:** A Python script (`scripts/fetch_feeds.py`) and companion GitHub Actions workflow (`.github/workflows/update-feeds.yml`) run on an automated schedule (e.g. hourly) to fetch, parse, sanitize, and publish fresh headlines into `public/data/feeds.json`.
- **Client-Side Live Refresh (CORS-friendly):** A "Refresh" button enables clients to fetch real-time updates directly from open CORS APIs (e.g. Hacker News Algolia/Firebase, Reddit JSON `/r/technology/top.json` & `/r/programming/top.json`, and Lobste.rs JSON) without server proxies.
- **Client Resilience:** If network requests fail or rate limits are reached, the application gracefully retains existing cached items and displays a subtle timestamp/status badge ("Updated X min ago").

## 3. Acceptance Criteria

### 3.1 Feed Sources & Categories
- **AC-1 (Curated Feed Catalog from Author Subscriptions):** The tool ships with a rich, curated catalog of feeds derived from the author's personal subscriptions (`subscriptions-2026-10-30.csv`), organized across 5 distinct channels:
  - **Tech & Dev:** Hacker News, Ars Technica, ByteByteGo, Real Python, Platformer, Bits about Money, SRE Weekly, Reddit Tech & Programming.
  - **AI & Research:** Latent Space, Ahead of AI (Sebastian Raschka), Ben's Bites, One Useful Thing (Ethan Mollick), aifeed.dev.
  - **Ideas & Essays:** Quanta Magazine, Arts & Letters Daily, 3 Quarks Daily, Aeon, Astral Codex Ten, After Babel (Jon Haidt), The Long Read (The Guardian), JSTOR Daily.
  - **Art & Visual Culture:** Colossal, The Public Domain Review, DailyArt Magazine, Muddy Colors, Lines and Colors.
  - **Gaming & Chess:** Eurogamer, Game Developer, Chess.com, Lichess Blog, SMBC Comics.
- **AC-2 (Category Filtering):** Users can filter displayed feeds by category:
  - `All`
  - `Tech & Dev`
  - `AI & Research`
  - `Ideas & Essays`
  - `Art & Visual`
  - `Gaming & Chess`

### 3.2 Dual View Modes (Columns & River)
- **AC-3 (Multi-Column Grid View):** Classic popurls / skimfeed dense multi-column card layout:
  - Responsive multi-column layout (1 col on mobile, 2 on tablet, 3-4 on desktop/ultrawide).
  - Each feed card contains the feed icon, source name, category tag, and top 5-10 headlines.
  - Each headline shows rank/bullet, title, external domain badge, relative time, and score/comments count when available.
- **AC-4 (River of News View):** A single unified, chronological stream combining headlines across all enabled feeds:
  - Displays source badge with unique color coding per source.
  - Sortable by latest time or popularity/score.
  - Clean infinite-scroll or paginated/scrollable stream.
- **AC-5 (View Switcher):** An accessible toggle switch in the toolbar allows seamless switching between "Columns" (Grid) and "River" (Chronological Stream). Active view preference persists in `localStorage`.

### 3.3 Search & Real-Time Filtering
- **AC-6 (Instant Keyword Search):** An accessible search input filters headlines across all feeds in real time by title, description, or domain. Shows matched count or "No headlines matching '<query>'".
- **AC-7 (Clear & Shortcut):** An accessible "Clear search" button resets the filter instantly.

### 3.4 Customization & Source Toggling
- **AC-8 (Source Toggling):** Users can customize which feeds appear on their dashboard via a "Customize Sources" drawer or dropdown toggle list.
- **AC-9 (Preference Persistence):** Custom source selections, active view mode, and category filters are persisted in `localStorage` under `tools_hub_news_river_prefs`. All `localStorage` calls are wrapped in `try/catch` for quota and private browsing safety.

### 3.5 Read/Unread Tracking & Interaction
- **AC-10 (Read / Visited State):** Clicking any headline marks it as read (persisted in `localStorage` for up to 30 days or 500 items). Read headlines display with subtle muted typography.
- **AC-11 (External Link Safety):** All headline links open securely in a new tab with `target="_blank"` and `rel="noopener noreferrer"`.
- **AC-12 (Clear Read History):** A control allows resetting or clearing read history.

### 3.6 Hub Integration & Quality Guardrails
- **AC-13 (Back to Hub):** An accessible, high-contrast "Back to Hub" button calls `onBack()`.
- **AC-14 (Zero Dependency Bloat):** Built with pure React 19, TypeScript, native `fetch`, native `Intl.RelativeTimeFormat`, and pure CSS. Zero bloated UI libraries.
- **AC-15 (Accessibility & High Contrast):** Meets WCAG AA contrast standards (minimum 4.5:1), responsive from 320px to 4K displays, with full keyboard navigation.
- **AC-16 (Automated Regression Tests):** Companion unit and component tests in `src/tools/news-river/NewsRiver.test.tsx` verifying:
  - Initial render with default feeds
  - View switcher (Columns vs River)
  - Keyword search filtering
  - Category filtering
  - Source toggle controls
  - Read tracking and local storage persistence
  - Graceful fallback on network failure or invalid feed data
  - >80% test coverage across statements, branches, and functions.
