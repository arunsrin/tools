import { useState, useMemo, useEffect, useCallback, memo } from 'react';
import type {
  HistoricalEra,
  BookGenre,
  ViewMode,
  ReadingStatus,
  ReadingTrackerState,
  AdlerAuthor,
} from './greatBooksTypes';
import {
  HISTORICAL_ERAS,
  BOOK_GENRES,
  type QuickFilter,
  filterAuthors,
  calculateStats,
  loadReadingTracker,
  saveReadingTracker,
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
  const [tracker, setTracker] = useState<ReadingTrackerState>(() => loadReadingTracker());

  // Save tracker state on change
  useEffect(() => {
    saveReadingTracker(tracker);
  }, [tracker]);

  const handleStatusChange = useCallback((authorId: number, status: ReadingStatus | 'none') => {
    setTracker((prev) => {
      const next = { ...prev };
      const key = String(authorId);
      if (status === 'none') {
        delete next[key];
      } else {
        next[key] = status;
      }
      return next;
    });
  }, []);

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

  // Overall stats
  const stats = useMemo(() => {
    return calculateStats(ADLER_GREAT_BOOKS, tracker);
  }, [tracker]);

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
            <span className="corpus-badge">137 Foundational Authors</span>
            <span className="corpus-badge">263 Curated Works</span>
            <span className="corpus-badge accent-badge">Verified Legal Public Domain Ebooks</span>
          </div>
        </div>

        {/* Reading Tracker Dashboard Card */}
        <section className="great-books-tracker-card" aria-label="Personal Reading Progress">
          <div className="tracker-header">
            <div className="tracker-headline">
              <span className="tracker-icon" aria-hidden="true">📚</span>
              <div>
                <h2 className="tracker-title">Your Reading Journey</h2>
                <p className="tracker-counts">
                  <strong>{stats.completedCount}</strong> of {stats.totalAuthors} authors read ({stats.percentCompleted}%) ·{' '}
                  <span className="reading-accent">{stats.readingCount} reading</span> ·{' '}
                  <span className="want-accent">{stats.wantToReadCount} want to read</span>
                </p>
              </div>
            </div>
            <div className="tracker-percentage" aria-hidden="true">
              {stats.percentCompleted}%
            </div>
          </div>

          <div
            className="tracker-progress-track"
            role="progressbar"
            aria-valuenow={stats.percentCompleted}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Overall Reading Progress"
          >
            <div
              className="tracker-progress-fill"
              style={{ width: `${stats.percentCompleted}%` }}
            />
          </div>
        </section>
      </header>

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
                      status={tracker[String(author.id)]}
                      onStatusChange={handleStatusChange}
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
                      status={tracker[String(author.id)]}
                      onStatusChange={handleStatusChange}
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
          <span>Only verified, legal public domain editions are linked (ManyBooks & Project Gutenberg).</span>
        </p>
      </footer>
    </div>
  );
}

interface AuthorCardProps {
  author: AdlerAuthor;
  status?: ReadingStatus;
  onStatusChange: (authorId: number, status: ReadingStatus | 'none') => void;
}

const AuthorCard = memo(function AuthorCard({ author, status, onStatusChange }: AuthorCardProps) {
  return (
    <article className={`author-card ${status ? `status-${status}` : ''}`}>
      <div className="author-card-header">
        <div className="author-meta-left">
          <span className="adler-index-badge">#{author.id}</span>
          <div>
            <h3 className="author-name">{author.name}</h3>
            {author.dates && <span className="author-dates">{author.dates}</span>}
          </div>
        </div>

        {/* Reading Status Selector */}
        <div className="reading-status-control">
          <label htmlFor={`status-${author.id}`} className="visually-hidden">
            Reading status for {author.name}
          </label>
          <select
            id={`status-${author.id}`}
            className={`status-select ${status || 'unmarked'}`}
            value={status || 'none'}
            onChange={(e) => onStatusChange(author.id, e.target.value as ReadingStatus | 'none')}
          >
            <option value="none">Mark Status</option>
            <option value="want_to_read">🔖 Want to Read</option>
            <option value="reading">📖 Currently Reading</option>
            <option value="completed">✓ Completed</option>
          </select>
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
