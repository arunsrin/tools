# News River Specification

## 1. Overview
**News River** is a fast, minimalist, and responsive multi-feed news aggregator inspired by popurls and skimfeed. It provides a real-time pulse of developer, tech, science, and world headlines from sources like Hacker News, Reddit (/r/technology, /r/programming), Lobste.rs, GitHub Trending, Ars Technica, BBC News, and Product Hunt.

## 2. Key Features
- **Dual View Modes:**
  - **Columns View:** Dense, responsive multi-column grid organizing headlines by source card.
  - **River View:** Single unified chronological stream sorted by latest or popular/score.
- **Search & Filtering:** Real-time keyword filter across headlines and domains with immediate clear control.
- **Category Switching:** Filter feeds by `All`, `Tech`, `Programming`, `World News`, and `Design`.
- **Source Customization:** Modal drawer to toggle specific sources on/off with "Enable All" restore.
- **Read/Visited Tracking:** Clicking opens links securely in a new tab (`target="_blank"`, `rel="noopener noreferrer"`) and visually marks them as read. Includes a "Clear read" button.
- **Hybrid Jamstack Data Strategy:**
  - Bundled static fallback dataset for 0ms initial render and offline capability.
  - Scheduled GitHub Action (`update-feeds.yml`) + scraper (`fetch_feeds.py`) outputting to `/data/feeds.json`.
  - In-browser live refresh querying CORS-supported endpoints (Hacker News Algolia, Lobste.rs).
- **Zero Bloat & High Contrast:** Pure React 19, TypeScript, and CSS with WCAG AA compliance.

## 3. Navigation
Includes an accessible, high-contrast "Back to Hub" button calling `onBack()`.
