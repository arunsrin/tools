# Great Books - Tool Specification

A curated, interactive digital catalogue of Mortimer J. Adler's reading recommendations from *How to Read a Book* (1972), categorized by era and genre with verified public domain ebook download links and reading progress tracking.

## 1. Functional Requirements
- **Complete Adler Corpus:** Covers all 137 authors from Appendix A of Mortimer J. Adler & Charles Van Doren's *How to Read a Book* (1972).
- **Dual View Modes:**
  - *Chronological Timeline:* Sequential 1–137 order grouped into 6 Historical Eras.
  - *By Genre:* Grouped by 8 Discipline Categories.
- **Search & Multi-Filter:**
  - Real-time search by author, book title, or genre.
  - Fast filter pills: All, Free Ebook Available, Great Books of the Western World (`*`), Gateway to the Great Books (`**`), In Copyright.
  - Dropdowns for Era and Genre filtering with instant active count and reset.
- **Verified Public Domain Ebook Downloads:**
  - Direct links to verified ManyBooks.net title pages (or canonical Project Gutenberg / Standard Ebooks fallback).
  - Format badges: ePub, MOBI, PDF, Read Online.
  - Modern titles under active copyright marked as "In Copyright · Reference Only".
- **Zero Distraction / High Readability:** Clean, fast exploration focused strictly on Adler's curated corpus, works, and verified download destinations.
- **Hub Navigation:** Clear "Back to Tools Hub" button with URL synchronization to `/`.

## 2. Technical Requirements
- **Framework:** React 19 + TypeScript.
- **Styles:** Scoped CSS (`GreatBooks.css`) adhering to Tools Hub dark theme standards (`#0f172a`, `#1e293b`, `#38bdf8`).
- **Data Bundle:** Self-contained static TypeScript data (`adlerBooksData.ts`), zero runtime backend or third-party fetching.
- **Testing:** Comprehensive companion unit tests (`GreatBooks.test.tsx`) asserting views, search, filters, links, and tracker persistence.
