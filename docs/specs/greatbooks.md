# Feature Specification: Great Books (Mortimer Adler's Reading List)

**Living Specification Custodian:** Gandalf (Strategist / Living Spec Custodian)  
**Status:** Approved by Human Author · In Development  
**Target Route:** `/greatbooks`  
**Module Directory:** `src/tools/greatbooks/`

---

## 1. Overview & Vision
The **Great Books** tool catalogues, structures, and enriches Mortimer J. Adler & Charles Van Doren's canonical reading list from Appendix A of *How to Read a Book* (1972). It provides a clean, fast, high-contrast digital catalogue allowing readers to explore the foundational works of Western thought, filter by historical era and genre, and easily access verified legal public domain ebook downloads exclusively via **Project Gutenberg** (`https://www.gutenberg.org/ebooks/<id>`), accompanied by a tribute and donation banner supporting Gutenberg's non-profit mission.

---

## 2. Source Material & Scope
- **Source:** Appendix A ("A Recommended Reading List") of *How to Read a Book* (Mortimer J. Adler & Charles Van Doren, 1972).
- **Scope:** All **137 author entries** (from #1 Homer, 9th Century B.C., to #137 Aleksandr Solzhenitsyn, 1918–), comprising ~250 specific works.
- **Editorial Markers:**
  - Single Asterisk (`*`): Included in *Great Books of the Western World* (GBWW).
  - Double Asterisk (`**`): Represented in *Gateway to the Great Books* (GGB).
  - Adler's key highlights (e.g. `(esp. ...)` dialogue/treatise recommendations).
- **Public Domain Compliance:**
  - Ancient, Medieval, Renaissance, Enlightenment, and 19th-century works are universally in the public domain and link to free ebook editions.
  - Mid-to-late 20th-century works under active copyright are clearly flagged as **"In Copyright / Reference Only"** with no unauthorized download link.

---

## 3. Categorization Schema

### 3.1 Historical Eras (6 Epochs)
1. **Ancient Greece & Rome** (9th C. B.C. – 2nd C. A.D.): Homer, Aeschylus, Plato, Aristotle, Cicero, Virgil, Marcus Aurelius...
2. **Early Christian & Middle Ages** (3rd C. – 14th C.): Plotinus, Augustine, Aquinas, Dante, Chaucer, Song of Roland...
3. **Renaissance & Reformation** (15th – 16th C.): Da Vinci, Machiavelli, Erasmus, More, Luther, Shakespeare, Cervantes...
4. **Enlightenment & Scientific Revolution** (17th – 18th C.): Bacon, Galileo, Descartes, Hobbes, Milton, Locke, Newton, Hume, Rousseau, Kant, Federalist Papers...
5. **19th Century** (1800 – 1899): Goethe, Austen, Hegel, Darwin, Melville, Dostoevsky, Tolstoy, Marx, Nietzsche, Twain...
6. **20th Century** (1900 – Present): Poincaré, Freud, Shaw, Planck, Russell, Joyce, Kafka, Sartre, Solzhenitsyn...

### 3.2 Disciplines & Genres (8 Categories)
1. **Philosophy & Ethics** (Plato, Aristotle, Spinoza, Kant, Nietzsche...)
2. **Epic, Poetry & Drama** (Homer, Sophocles, Dante, Shakespeare, Goethe...)
3. **Fiction & Literature** (Cervantes, Fielding, Austen, Melville, Tolstoy...)
4. **History, Politics & Social Thought** (Herodotus, Thucydides, Machiavelli, Locke, Federalist Papers, Marx...)
5. **Science, Mathematics & Medicine** (Hippocrates, Euclid, Archimedes, Copernicus, Galileo, Newton, Darwin, Einstein...)
6. **Theology & Sacred Texts** (Old Testament, New Testament, Augustine, Aquinas, Calvin...)
7. **Essays, Letters & Biography** (Montaigne, Bacon, Boswell, Emerson, Thoreau...)
8. **Psychology & Mind** (William James, Sigmund Freud...)

---

## 4. UI/UX Requirements & Features

### 4.1 Header & Navigation
- Prominent Title: **Great Books** with subtitle *"Mortimer Adler's Reading List from 'How to Read a Book' (1972)"*.
- High-contrast, accessible **"Back to Tools Hub"** button calling `onBack()`.
- Metadata counters displaying 137 Foundational Authors, 263 Curated Works, and Verified Legal Public Domain Ebooks badge.

### 4.2 Interactive View Switcher
- **Chronological Timeline View:** Sequential order (1 to 137) matching Adler's original text, grouped into sticky/collapsible Era sections.
- **By Genre View:** Categorized card stacks grouped into the 8 discipline genres.

### 4.3 Search & Filtering Bar
- **Instant Search:** Full-text instant search across author names, book titles, genres, and notes.
- **Filter Chips:**
  - "All"
  - "Free Ebook Available" (public domain with download link)
  - "GBWW (*)" (Great Books of the Western World)
  - "Gateway (**)" (Gateway to the Great Books)
  - "In Copyright" (20th C. reference titles)
- **Era Dropdown / Selector:** Filter to a specific historical epoch.
- **Genre Dropdown / Selector:** Filter to a specific discipline.
- **Active Filter Counter & Reset:** Clear all filters with one click.

### 4.4 Book Card Component
- Author Name & Lifespan / Date (e.g. `Plato (c. 427–347 B.C.)`).
- Adler Index Badge (e.g. `#10`).
- Collection Badges (`GBWW`, `Gateway`).
- Recommended Works list with Adler's specific dialogue/work recommendations highlighted.
- Ebook Availability & Download Button:
  - **Public Domain:** Prominent download button linking directly to verified Project Gutenberg eBook page with format indicators (`ePub`, `Kindle`, `Read Online`, `Plain Text`).
  - **In Copyright:** Subtle badge stating *"In Copyright · Reference Only"*.
- Zero Distraction: Clean, fast exploration focused strictly on Adler's curated corpus, works, and verified legal download destinations.

### 4.5 Performance & Accessibility
- Dark theme standard matching `#0f172a`, card surfaces `#1e293b`, borders `#334155`, text `#f1f5f9` / `#94a3b8`, accents `#38bdf8`.
- WCAG AA contrast compliance (minimum 4.5:1).
- 100% responsive: Fluid layout down to 320px viewport without horizontal scroll.
- Zero server calls at runtime; bundled static dataset.

---

## 5. Technical Constraints & Data Architecture
- **Self-Contained Static Dataset:** All 137 authors and download metadata bundled in `src/tools/greatbooks/adlerBooksData.ts`.
- **Zero Third-Party UI Bloat:** Native CSS and React 19 hooks only.
- **LocalStorage Safety:** Wrapped in `try/catch` to tolerate restricted environments.
- **Direct SPA History Routing:** Registered in `src/routes.ts` (`ToolKey = 'greatbooks'`, `/greatbooks`).

---

## 6. Acceptance Criteria
1. [x] All 137 authors from Adler's Appendix A catalogued with correct dates and works.
2. [ ] Accurate assignment of 6 historical eras and 8 discipline genres across all entries.
3. [ ] Canonical Project Gutenberg public domain download links for all non-copyrighted books.
4. [ ] Clear "In Copyright / Reference Only" designation for modern copyrighted titles.
5. [ ] Working view switcher between Chronological Timeline and By Genre.
6. [ ] Real-time search across author names, titles, and genres.
7. [ ] Working filters for Free Ebook, GBWW, Gateway, Era, and Genre.
8. [ ] Interactive reading progress tracker with `localStorage` persistence.
9. [ ] Seamless navigation back to hub with URL synchronization.
10. [ ] Automated test suite with >80% code coverage.
11. [ ] Clean build (`npm run build`), zero ESLint errors (`npm run lint`), passing local tests (`./scripts/test.ps1`).
