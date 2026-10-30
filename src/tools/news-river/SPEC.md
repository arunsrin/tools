# News River Specification

## 1. Overview
**News River** is a fast, minimalist, and responsive multi-feed news aggregator inspired by popurls and skimfeed. It provides a real-time pulse of developer, tech, ideas, gaming, chess, and comics headlines from sources in the user's subscription catalog plus Hacker News and Lobste.rs.

## 2. Key Features
- **Dual View Modes:**
  - **Columns View:** Dense, responsive 3-column grid organizing headlines by source card with natural document-level vertical scrolling across as many rows as needed.
  - **River View:** Single unified chronological stream sorted by latest or popular/score.
- **Search & Filtering:** Real-time keyword filter across headlines and domains with immediate clear control.
- **Category Switching:** Filter feeds by `All Feeds`, `Tech & Dev`, `Ideas & Science`, `Gaming`, `Chess`, and `Comics`.
- **Clickable Comment Threads:** Direct discussion links (💬 count) for Hacker News and Lobste.rs opening the thread in a new tab.
- **Source Customization:** Modal drawer to toggle specific sources on/off with "Enable All" restore.
- **Read/Visited Tracking:** Clicking opens links securely in a new tab (`target="_blank"`, `rel="noopener noreferrer"`) and visually marks them as read. Includes a "Clear read" button.
- **Hybrid Jamstack Data Strategy:**
  - Bundled static fallback dataset for 0ms initial render and offline capability.
  - Scheduled GitHub Action (`update-feeds.yml`) + scraper (`fetch_feeds.py`) outputting to `/data/feeds.json`.
  - In-browser live refresh querying CORS-supported endpoints (Hacker News Algolia, Lobste.rs).
- **Zero Bloat & High Contrast:** Pure React 19, TypeScript, and CSS with WCAG AA compliance.

## 3. Navigation
Includes an accessible, high-contrast "Back to Hub" button calling `onBack()`.
