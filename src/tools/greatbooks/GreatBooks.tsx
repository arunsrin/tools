import { useState, useMemo, useCallback, memo } from 'react';
import type {
  HistoricalEra,
  BookGenre,
  ViewMode,
  AdlerAuthor,
} from './greatBooksTypes';
import {
  HISTORICAL_ERAS,
  BOOK_GENRES,
  type QuickFilter,
  filterAuthors,
  calculateCorpusStats,
} from './greatBooksHelpers';
import { ADLER_GREAT_BOOKS } from './adlerBooksData';
import './GreatBooks.css';

interface GreatBooksProps {
  onBack: () => void;
}

export default function GreatBooks({ onBack }: GreatBooksProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('timeline');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEra, setSelectedEra] = useState<HistoricalEra | 'all'>('all');
  const [selectedGenre, setSelectedGenre] = useState<BookGenre | 'all'>('all');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');

  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedEra('all');
    setSelectedGenre('all');
    setQuickFilter('all');
  }, []);

  const isFilterActive =
    searchQuery.trim().length > 0 ||
    selectedEra !== 'all' ||
    selectedGenre !== 'all' ||
    quickFilter !== 'all';

  // Filtered authors
  const filteredAuthors = useMemo(() => {
    return filterAuthors(ADLER_GREAT_BOOKS, {
      searchQuery,
      era: selectedEra,
      genre: selectedGenre,
      quickFilter,
    });
  }, [searchQuery, selectedEra, selectedGenre, quickFilter]);

  // Corpus stats
  const corpusStats = useMemo(() => {
    return calculateCorpusStats(ADLER_GREAT_BOOKS);
  }, []);

  // Grouped by era for timeline view
  const authorsByEra = useMemo(() => {
    const map = new Map<HistoricalEra, AdlerAuthor[]>();
    for (const era of HISTORICAL_ERAS) {
      map.set(era, []);
    }
    for (const author of filteredAuthors) {
      const list = map.get(author.era);
      if (list) list.push(author);
    }
    return map;
  }, [filteredAuthors]);

  // Grouped by genre for genre view
  const authorsByGenre = useMemo(() => {
    const map = new Map<BookGenre, AdlerAuthor[]>();
    for (const genre of BOOK_GENRES) {
      map.set(genre, []);
    }
    for (const author of filteredAuthors) {
      const list = map.get(author.genre);
      if (list) list.push(author);
    }
    return map;
  }, [filteredAuthors]);

  return (
    <div className="great-books-container">
      {/* Top Header */}
      <header className="great-books-header">
        <button
          type="button"
          className="great-books-back-button"
          onClick={onBack}
          aria-label="Return to Tools Hub"
        >
          ← Back to Tools Hub
        </button>

        <div className="great-books-title-group">
          <h1 className="great-books-title">Great Books</h1>
          <p className="great-books-subtitle">
            Mortimer Adler’s Reading List from <em>How to Read a Book</em> (1972)
          </p>
          <div className="great-books-corpus-meta">
            <span className="corpus-badge">{corpusStats.totalAuthors} Foundational Authors</span>
            <span className="corpus-badge">{corpusStats.totalWorks} Curated Works</span>
            <span className="corpus-badge accent-badge">Verified Legal Public Domain Ebooks</span>
          </div>
        </div>
      </header>

      {/* Project Gutenberg Tribute & Donation Banner */}
      <aside className="gutenberg-donation-banner" aria-label="Support Project Gutenberg">
        <div className="donation-banner-content">
          <div className="donation-banner-text">
            <span className="donation-banner-icon" aria-hidden="true">📖</span>
            <div>
              <h2 className="donation-banner-title">
                Honoring Free Knowledge & Public Domain Preservation
              </h2>
              <p className="donation-banner-desc">
                All public domain editions in this catalog are digitized and preserved by the tireless volunteers at{' '}
                <strong>Project Gutenberg</strong> with zero paywalls, advertisements, or mandatory registration.
                This site is completely independent and not affiliated with Project Gutenberg—just a grateful user paying tribute.
                If you find this Great Books guide valuable, please consider supporting Project Gutenberg’s 501(c)(3) mission.
              </p>
            </div>
          </div>
          <a
            href="https://www.gutenberg.org/donate/"
            target="_blank"
            rel="noopener noreferrer"
            className="donation-cta-btn"
            aria-label="Donate to Project Gutenberg (opens in a new tab)"
          >
            <span className="heart-icon" aria-hidden="true">💖</span>
            <span>Support Project Gutenberg</span>
            <span className="ext-icon" aria-hidden="true">↗</span>
          </a>
        </div>
      </aside>

      {/* Control Bar: Search, View Mode & Filters */}
      <section className="great-books-controls" aria-label="Search and Filter Controls">
        <div className="controls-row-top">
          {/* Instant Search Input */}
          <div className="search-input-wrapper">
            <span className="search-icon" aria-hidden="true">🔍</span>
            <input
              type="search"
              className="great-books-search-input"
              placeholder="Search authors, book titles, genres, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search authors and books"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search text"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Switcher */}
          <div className="view-mode-toggle" role="group" aria-label="Layout view mode">
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'timeline' ? 'active' : ''}`}
              onClick={() => setViewMode('timeline')}
              aria-pressed={viewMode === 'timeline'}
            >
              📅 Timeline View
            </button>
            <button
              type="button"
              className={`view-mode-btn ${viewMode === 'genre' ? 'active' : ''}`}
              onClick={() => setViewMode('genre')}
              aria-pressed={viewMode === 'genre'}
            >
              🏷️ By Genre View
            </button>
          </div>
        </div>

        {/* Quick Filter Chips */}
        <div className="quick-filters-row" role="group" aria-label="Quick collection filters">
          <button
            type="button"
            className={`filter-chip ${quickFilter === 'all' ? 'active' : ''}`}
            onClick={() => setQuickFilter('all')}
          >
            All Works ({ADLER_GREAT_BOOKS.length})
          </button>
          <button
            type="button"
            className={`filter-chip ${quickFilter === 'free_only' ? 'active' : ''}`}
            onClick={() => setQuickFilter('free_only')}
          >
            🟢 Free Ebooks Only
          </button>
          <button
            type="button"
            className={`filter-chip ${quickFilter === 'gbww' ? 'active' : ''}`}
            onClick={() => setQuickFilter('gbww')}
          >
            ⭐ Great Books (GBWW *)
          </button>
          <button
            type="button"
            className={`filter-chip ${quickFilter === 'gateway' ? 'active' : ''}`}
            onClick={() => setQuickFilter('gateway')}
          >
            🏛️ Gateway (GGB **)
          </button>
          <button
            type="button"
            className={`filter-chip ${quickFilter === 'copyright' ? 'active' : ''}`}
            onClick={() => setQuickFilter('copyright')}
          >
            🔒 In Copyright
          </button>
        </div>

        {/* Dropdown Filters & Counter */}
        <div className="dropdowns-row">
          <div className="dropdown-group">
            <label htmlFor="era-select" className="dropdown-label">
              Era:
            </label>
            <select
              id="era-select"
              className="great-books-select"
              value={selectedEra}
              onChange={(e) => setSelectedEra(e.target.value as HistoricalEra | 'all')}
            >
              <option value="all">All Eras (Chronological)</option>
              {HISTORICAL_ERAS.map((era) => (
                <option key={era} value={era}>
                  {era}
                </option>
              ))}
            </select>
          </div>

          <div className="dropdown-group">
            <label htmlFor="genre-select" className="dropdown-label">
              Genre:
            </label>
            <select
              id="genre-select"
              className="great-books-select"
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value as BookGenre | 'all')}
            >
              <option value="all">All Genres</option>
              {BOOK_GENRES.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          <div className="results-count-group">
            <span className="results-count-text">
              Showing <strong>{filteredAuthors.length}</strong> of {ADLER_GREAT_BOOKS.length} authors
            </span>
            {isFilterActive && (
              <button
                type="button"
                className="reset-filters-btn"
                onClick={handleClearFilters}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Main Catalog Rendering */}
      <main className="great-books-catalog">
        {filteredAuthors.length === 0 ? (
          <div className="great-books-empty-state">
            <div className="empty-icon" aria-hidden="true">📖</div>
            <h3 className="empty-title">No authors or works found</h3>
            <p className="empty-text">
              Try adjusting your search keywords, era, or genre filters.
            </p>
            <button
              type="button"
              className="empty-reset-btn"
              onClick={handleClearFilters}
            >
              Clear All Filters
            </button>
          </div>
        ) : viewMode === 'timeline' ? (
          /* Timeline View Grouped by Historical Eras */
          HISTORICAL_ERAS.map((era) => {
            const authorsInEra = authorsByEra.get(era) || [];
            if (authorsInEra.length === 0) return null;

            return (
              <section key={era} className="era-section" aria-labelledby={`era-heading-${era}`}>
                <div className="era-section-header">
                  <h2 id={`era-heading-${era}`} className="era-section-title">
                    {era}
                  </h2>
                  <span className="era-section-count">
                    {authorsInEra.length} {authorsInEra.length === 1 ? 'author' : 'authors'}
                  </span>
                </div>

                <div className="authors-grid">
                  {authorsInEra.map((author) => (
                    <AuthorCard
                      key={author.id}
                      author={author}
                    />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          /* By Genre View Grouped by Discipline */
          BOOK_GENRES.map((genre) => {
            const authorsInGenre = authorsByGenre.get(genre) || [];
            if (authorsInGenre.length === 0) return null;

            return (
              <section key={genre} className="genre-section" aria-labelledby={`genre-heading-${genre}`}>
                <div className="genre-section-header">
                  <h2 id={`genre-heading-${genre}`} className="genre-section-title">
                    {genre}
                  </h2>
                  <span className="genre-section-count">
                    {authorsInGenre.length} {authorsInGenre.length === 1 ? 'author' : 'authors'}
                  </span>
                </div>

                <div className="authors-grid">
                  {authorsInGenre.map((author) => (
                    <AuthorCard
                      key={author.id}
                      author={author}
                    />
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>

      {/* Footer & Curation Attribution */}
      <footer className="great-books-footer">
        <p>
          Curated from Appendix A: <em>A Recommended Reading List</em> in Mortimer J. Adler & Charles Van Doren’s{' '}
          <em>How to Read a Book</em> (1972 edition).
        </p>
        <p className="footer-subtext">
          <span className="legend-item"><span className="legend-symbol">(*)</span> Great Books of the Western World</span> ·{' '}
          <span className="legend-item"><span className="legend-symbol">(**)</span> Gateway to the Great Books</span> ·{' '}
          <span>Only verified, legal public domain editions are linked (Project Gutenberg). Free, open, zero registration.</span>
        </p>
      </footer>
    </div>
  );
}

interface AuthorCardProps {
  author: AdlerAuthor;
}

const AuthorCard = memo(function AuthorCard({ author }: AuthorCardProps) {
  return (
    <article className="author-card">
      <div className="author-card-header">
        <div className="author-meta-left">
          <span className="adler-index-badge">#{author.id}</span>
          <div>
            <h3 className="author-name">{author.name}</h3>
            {author.dates && <span className="author-dates">{author.dates}</span>}
          </div>
        </div>
      </div>

      <div className="author-badges-row">
        <span className="author-genre-badge">{author.genre}</span>
        <span className="author-era-badge">{author.era}</span>
        {author.gatewayToGreatBooks && (
          <span className="author-collection-badge gateway-badge" title="Author represented in Gateway to the Great Books">
            Gateway (**)
          </span>
        )}
      </div>

      {/* Recommended Works List */}
      <div className="works-list">
        <h4 className="works-heading">Recommended Works:</h4>
        <ul className="works-items">
          {author.works.map((work) => (
            <li key={work.id} className="work-item">
              <div className="work-title-row">
                <span className="work-title">
                  {work.title}
                  {work.gbww && (
                    <span className="gbww-marker" title="Included in Great Books of the Western World">
                      {' '}*
                    </span>
                  )}
                </span>
              </div>

              {work.note && (
                <p className="work-note">
                  <em>{work.note}</em>
                </p>
              )}

              {/* Download / Ebook Link Action */}
              <div className="work-download-action">
                {work.inCopyright || !work.downloadUrl ? (
                  <span className="copyright-badge" title="Under active copyright protection. Available at public libraries or bookstores.">
                    🔒 In Copyright · Reference Only
                  </span>
                ) : (
                  <a
                    href={work.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-link-btn"
                    title={`Download or read ${work.title} on ${work.source}`}
                    aria-label={`Download or read ${work.title} on ${work.source}`}
                  >
                    <span className="dl-icon" aria-hidden="true">⬇</span>
                    <span>Free on {work.source}</span>
                    <span className="format-tags">
                      {work.formats.map((fmt) => (
                        <span key={fmt} className="format-pill">
                          {fmt}
                        </span>
                      ))}
                    </span>
                    <span className="ext-icon" aria-hidden="true">↗</span>
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
});
