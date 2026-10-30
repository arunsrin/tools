import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Category, FeedItem, FeedSource, NewsRiverPreferences, SortMode, ViewMode } from './types';
import { DEFAULT_ITEMS, DEFAULT_SOURCES } from './defaultFeeds';
import './NewsRiver.css';

interface NewsRiverProps {
  onBack: () => void;
}

const STORAGE_KEY = 'tools_hub_news_river_prefs';

function formatRelativeTime(dateString: string): string {
  try {
    const timestamp = new Date(dateString).getTime();
    if (isNaN(timestamp)) return '';
    const diffSeconds = Math.round((Date.now() - timestamp) / 1000);

    if (diffSeconds < 60) return 'just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return '';
  }
}

function extractDomain(url: string, fallback: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return fallback;
  }
}

const NewsRiver: React.FC<NewsRiverProps> = ({ onBack }) => {
  const [sources, setSources] = useState<FeedSource[]>(DEFAULT_SOURCES);
  const [items, setItems] = useState<FeedItem[]>(DEFAULT_ITEMS);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());
  const [isLive, setIsLive] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronously hydrate stored preferences on component initialization (zero layout flash)
  const [initialPrefs] = useState<Partial<NewsRiverPreferences>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.warn('Failed to load NewsRiver preferences from localStorage:', e);
      return {};
    }
  });

  const [viewMode, setViewMode] = useState<ViewMode>(() => initialPrefs.viewMode || 'columns');
  const [sortMode, setSortMode] = useState<SortMode>(() => initialPrefs.sortMode || 'latest');
  const [selectedCategory, setSelectedCategory] = useState<Category>(() => initialPrefs.selectedCategory || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [enabledSources, setEnabledSources] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    DEFAULT_SOURCES.forEach((s) => {
      map[s.id] = initialPrefs.enabledSourceIds ? initialPrefs.enabledSourceIds.includes(s.id) : true;
    });
    return map;
  });
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set(initialPrefs.readItemIds || []));
  const [isCustomizing, setIsCustomizing] = useState<boolean>(false);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
    };
  }, []);

  // Persist preferences
  useEffect(() => {
    try {
      const activeIds = Object.entries(enabledSources)
        .filter(([, enabled]) => enabled)
        .map(([id]) => id);

      const prefs: NewsRiverPreferences = {
        viewMode,
        sortMode,
        selectedCategory,
        enabledSourceIds: activeIds,
        readItemIds: Array.from(readIds).slice(-300), // Retain latest 300
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) {
      console.warn('Failed to save NewsRiver preferences to localStorage:', e);
    }
  }, [viewMode, sortMode, selectedCategory, enabledSources, readIds]);

  // Initial fetch of static feeds.json
  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialData() {
      try {
        const res = await fetch('/data/feeds.json', { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items) && data.items.length > 0) {
            setItems(data.items);
            if (data.lastUpdated) {
              setLastUpdated(new Date(data.lastUpdated));
            }
            if (Array.isArray(data.sources) && data.sources.length > 0) {
              setSources(data.sources);
            }
            setIsLive(true);
          }
        }
      } catch {
        // Quiet fallback to bundled default snapshot
      }
    }

    loadInitialData();
    return () => controller.abort();
  }, []);

  // Close modal on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCustomizing) {
        setIsCustomizing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCustomizing]);

  // Live Refresh Handler
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setStatusMessage('Fetching live updates...');

    const freshItems: FeedItem[] = [];

    try {
      // 1. Fetch Hacker News frontpage via public Algolia search API
      try {
        const hnRes = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page');
        if (hnRes.ok) {
          const data = await hnRes.json();
          const hits = (data.hits || []).slice(0, 10);
          hits.forEach((hit: { objectID: string; title: string; url?: string; points?: number; num_comments?: number; created_at: string }) => {
            const itemUrl = hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`;
            freshItems.push({
              id: `hn-${hit.objectID}`,
              title: hit.title,
              url: itemUrl,
              source: 'Hacker News',
              sourceId: 'hacker-news',
              category: 'tech',
              publishedAt: hit.created_at,
              points: hit.points || 0,
              comments: hit.num_comments || 0,
              commentsUrl: `https://news.ycombinator.com/item?id=${hit.objectID}`,
              domain: extractDomain(itemUrl, 'ycombinator.com'),
            });
          });
        }
      } catch (err) {
        console.warn('Live HN fetch skipped:', err);
      }

      // 2. Fetch Lobste.rs hottest JSON
      try {
        const lobRes = await fetch('https://lobste.rs/hottest.json');
        if (lobRes.ok) {
          const data = await lobRes.json();
          (data || []).slice(0, 8).forEach((item: { short_id: string; title: string; url: string; score: number; comment_count: number; created_at: string }) => {
            freshItems.push({
              id: `lob-${item.short_id}`,
              title: item.title,
              url: item.url,
              source: 'Lobste.rs',
              sourceId: 'lobsters',
              category: 'tech',
              publishedAt: item.created_at,
              points: item.score || 0,
              comments: item.comment_count || 0,
              commentsUrl: item.url.includes('lobste.rs/s/') ? item.url : `https://lobste.rs/s/${item.short_id}`,
              domain: extractDomain(item.url, 'lobste.rs'),
            });
          });
        }
      } catch (err) {
        console.warn('Live Lobsters fetch skipped:', err);
      }

      // 3. Fallback/supplement from /data/feeds.json
      if (freshItems.length === 0) {
        const res = await fetch('/data/feeds.json');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.items)) {
            setItems(data.items);
            setLastUpdated(new Date());
            setIsLive(true);
            setStatusMessage('Refreshed from static feed cache.');
            setIsRefreshing(false);
            return;
          }
        }
      }

      if (freshItems.length > 0) {
        // Merge fresh items over existing ones by id or replace sources
        const freshSourceIds = new Set(freshItems.map((i) => i.sourceId));
        setItems((prev) => {
          const remaining = prev.filter((i) => !freshSourceIds.has(i.sourceId));
          return [...freshItems, ...remaining];
        });
        setLastUpdated(new Date());
        setIsLive(true);
        setStatusMessage(`Updated ${freshItems.length} fresh headlines live!`);
      } else {
        setStatusMessage('Using current feed snapshot (live fetch unavailable).');
      }
    } catch {
      setStatusMessage('Network update failed; retained existing feeds.');
    } finally {
      setIsRefreshing(false);
      if (statusTimerRef.current) {
        clearTimeout(statusTimerRef.current);
      }
      statusTimerRef.current = setTimeout(() => {
        setStatusMessage(null);
      }, 4000);
    }
  }, []);

  const handleItemClick = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleClearRead = () => {
    setReadIds(new Set());
  };

  const toggleSource = (sourceId: string) => {
    setEnabledSources((prev) => ({
      ...prev,
      [sourceId]: !prev[sourceId],
    }));
  };

  const enableAllSources = () => {
    const map: Record<string, boolean> = {};
    sources.forEach((s) => {
      map[s.id] = true;
    });
    setEnabledSources(map);
  };

  // Filtered Items Calculation
  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      // Source enabled check
      if (enabledSources[item.sourceId] === false) return false;

      // Category check
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Keyword search check
      if (query) {
        const titleMatch = item.title.toLowerCase().includes(query);
        const domainMatch = item.domain.toLowerCase().includes(query);
        const sourceMatch = item.source.toLowerCase().includes(query);
        return titleMatch || domainMatch || sourceMatch;
      }

      return true;
    });
  }, [items, enabledSources, selectedCategory, searchQuery]);

  // River View Items Sorting
  const sortedRiverItems = useMemo(() => {
    const list = [...filteredItems];
    if (sortMode === 'popular') {
      list.sort((a, b) => (b.points || 0) - (a.points || 0));
    } else {
      list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
    return list;
  }, [filteredItems, sortMode]);

  // Group items by source for Columns View
  const itemsBySource = useMemo(() => {
    const groups = new Map<string, FeedItem[]>();
    sources.forEach((s) => {
      groups.set(s.id, []);
    });

    filteredItems.forEach((item) => {
      const arr = groups.get(item.sourceId);
      if (arr) {
        arr.push(item);
      }
    });

    return groups;
  }, [sources, filteredItems]);

  const activeSourcesForColumns = useMemo(() => {
    return sources.filter((s) => {
      if (enabledSources[s.id] === false) return false;
      if (selectedCategory !== 'all' && s.category !== selectedCategory) return false;
      const count = (itemsBySource.get(s.id) || []).length;
      return searchQuery ? count > 0 : true;
    });
  }, [sources, enabledSources, selectedCategory, itemsBySource, searchQuery]);

  const categories: { id: Category; label: string }[] = [
    { id: 'all', label: 'All Feeds' },
    { id: 'tech', label: 'Tech' },
    { id: 'ideas', label: 'Ideas & Science' },
    { id: 'gaming', label: 'Gaming' },
    { id: 'chess', label: 'Chess' },
    { id: 'comics', label: 'Comics' },
  ];

  return (
    <div className="news-river-container">
      {/* Top Header */}
      <header className="news-river-header">
        <div className="news-river-header-left">
          <button
            className="news-river-back-btn"
            onClick={onBack}
            aria-label="Back to Tools Hub"
          >
            ← Back to Hub
          </button>
          <div className="news-river-title-group">
            <h1 className="news-river-title">🌊 News River</h1>
            <span
              className={`news-river-badge ${isLive ? '' : 'fallback'}`}
              title={isLive ? 'Live feeds connected' : 'Using bundled static feed cache'}
            >
              {isLive ? '● Live' : '● Snapshot'}
            </span>
          </div>
        </div>

        <div className="news-river-header-controls">
          {/* Search Box */}
          <div className="news-river-search-box">
            <input
              type="text"
              className="news-river-search-input"
              placeholder="Filter headlines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Filter headlines"
            />
            {searchQuery && (
              <button
                className="news-river-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="news-river-view-toggle" role="group" aria-label="View Mode">
            <button
              className={`news-river-toggle-btn ${viewMode === 'columns' ? 'active' : ''}`}
              onClick={() => setViewMode('columns')}
              aria-label="Columns View"
            >
              <span>📊 Columns</span>
            </button>
            <button
              className={`news-river-toggle-btn ${viewMode === 'river' ? 'active' : ''}`}
              onClick={() => setViewMode('river')}
              aria-label="River View"
            >
              <span>🌊 River</span>
            </button>
          </div>

          {/* Actions: Customize Sources & Refresh */}
          <button
            className="news-river-action-btn"
            onClick={() => setIsCustomizing(true)}
            aria-label="Customize sources"
          >
            ⚙️ Sources
          </button>

          <button
            className="news-river-action-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
            aria-label="Refresh feeds"
          >
            <span className={isRefreshing ? 'news-river-spinner' : ''}>🔄</span>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Sub-toolbar with Categories and Status */}
      <nav className="news-river-subbar" aria-label="Categories and Controls">
        <div className="news-river-categories">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className={`news-river-category-pill ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="news-river-status-info">
          {statusMessage ? (
            <span>{statusMessage}</span>
          ) : (
            <span>
              Updated {lastUpdated ? formatRelativeTime(lastUpdated.toISOString()) : 'recently'} • {filteredItems.length} items
            </span>
          )}
          {readIds.size > 0 && (
            <button className="news-river-link-btn" onClick={handleClearRead}>
              Clear read ({readIds.size})
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="news-river-main">
        {filteredItems.length === 0 ? (
          <div className="news-river-empty-state">
            <div className="news-river-empty-icon">🔍</div>
            <h3>No headlines match your filters</h3>
            <p>
              {searchQuery
                ? `No items found matching "${searchQuery}".`
                : 'All feeds in this category are disabled or empty.'}
            </p>
            {searchQuery && (
              <button
                className="news-river-action-btn"
                onClick={() => setSearchQuery('')}
              >
                Clear Search Query
              </button>
            )}
          </div>
        ) : viewMode === 'columns' ? (
          /* Columns View */
          <div className="news-river-columns-grid">
            {activeSourcesForColumns.map((source) => {
              const sourceItems = itemsBySource.get(source.id) || [];
              if (sourceItems.length === 0 && searchQuery) return null;

              return (
                <article key={source.id} className="news-river-feed-card">
                  <header className="news-river-card-header">
                    <div className="news-river-card-title-group">
                      <span className="news-river-card-icon" aria-hidden="true">
                        {source.icon}
                      </span>
                      <h2 className="news-river-card-name">{source.name}</h2>
                    </div>
                    <div className="news-river-card-meta">
                      <span className="news-river-card-cat-badge">{source.category}</span>
                      <span className="news-river-card-count">{sourceItems.length}</span>
                    </div>
                  </header>

                  <ul className="news-river-items-list">
                    {sourceItems.length === 0 ? (
                      <li className="news-river-item-row" style={{ color: '#8b949e', fontSize: '0.85rem' }}>
                        No items currently available.
                      </li>
                    ) : (
                      sourceItems.map((item, idx) => {
                        const isRead = readIds.has(item.id);
                        return (
                          <li
                            key={item.id}
                            className={`news-river-item-row ${isRead ? 'read' : ''}`}
                          >
                            <span className="news-river-item-index">{idx + 1}.</span>
                            <div className="news-river-item-content">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="news-river-item-link"
                                onClick={() => handleItemClick(item.id)}
                              >
                                {item.title}
                              </a>
                              <div className="news-river-item-sub">
                                <span className="news-river-item-domain">{item.domain}</span>
                                {item.points !== undefined && item.points > 0 && (
                                  <span className="news-river-item-metric">▲ {item.points}</span>
                                )}
                                {item.comments !== undefined && (
                                  item.commentsUrl ? (
                                    <a
                                      href={item.commentsUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="news-river-item-metric news-river-comment-link"
                                      title="Open discussion comments"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      💬 {item.comments}
                                    </a>
                                  ) : (
                                    <span className="news-river-item-metric">💬 {item.comments}</span>
                                  )
                                )}
                                <span className="news-river-item-time">
                                  {formatRelativeTime(item.publishedAt)}
                                </span>
                              </div>
                            </div>
                          </li>
                        );
                      })
                    )}
                  </ul>
                </article>
              );
            })}
          </div>
        ) : (
          /* River of News View */
          <div className="news-river-stream-container">
            <header className="news-river-stream-header">
              <h2 className="news-river-stream-title">All Headlines Stream</h2>
              <div className="news-river-sort-controls">
                <span>Sort:</span>
                <button
                  className={`news-river-sort-btn ${sortMode === 'latest' ? 'active' : ''}`}
                  onClick={() => setSortMode('latest')}
                >
                  Latest
                </button>
                <button
                  className={`news-river-sort-btn ${sortMode === 'popular' ? 'active' : ''}`}
                  onClick={() => setSortMode('popular')}
                >
                  Popular
                </button>
              </div>
            </header>

            <ul className="news-river-stream-list">
              {sortedRiverItems.map((item) => {
                const isRead = readIds.has(item.id);
                const sourceObj = sources.find((s) => s.id === item.sourceId);
                const badgeColor = sourceObj?.color || '#30363d';

                return (
                  <li
                    key={item.id}
                    className={`news-river-stream-item ${isRead ? 'read' : ''}`}
                  >
                    <span
                      className="news-river-source-badge"
                      style={{
                        backgroundColor: `${badgeColor}25`,
                        color: badgeColor,
                        border: `1px solid ${badgeColor}50`,
                      }}
                    >
                      {item.source}
                    </span>

                    <div className="news-river-item-content">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="news-river-item-link"
                        onClick={() => handleItemClick(item.id)}
                      >
                        {item.title}
                      </a>
                      <div className="news-river-item-sub">
                        <span className="news-river-item-domain">{item.domain}</span>
                        {item.points !== undefined && item.points > 0 && (
                          <span className="news-river-item-metric">▲ {item.points}</span>
                        )}
                        {item.comments !== undefined && (
                          item.commentsUrl ? (
                            <a
                              href={item.commentsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="news-river-item-metric news-river-comment-link"
                              title="Open discussion comments"
                              onClick={(e) => e.stopPropagation()}
                            >
                              💬 {item.comments}
                            </a>
                          ) : (
                            <span className="news-river-item-metric">💬 {item.comments}</span>
                          )
                        )}
                        <span className="news-river-item-time">
                          {formatRelativeTime(item.publishedAt)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>

      {/* Customize Sources Modal */}
      {isCustomizing && (
        <div
          className="news-river-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Customize feed sources"
          onClick={() => setIsCustomizing(false)}
        >
          <div
            className="news-river-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="news-river-modal-header">
              <h3>Customize Feed Sources</h3>
              <button
                className="news-river-modal-close"
                onClick={() => setIsCustomizing(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="news-river-modal-body">
              {sources.map((source) => {
                const isEnabled = enabledSources[source.id] !== false;
                return (
                  <div key={source.id} className="news-river-source-row">
                    <label className="news-river-source-label">
                      <input
                        type="checkbox"
                        checked={isEnabled}
                        onChange={() => toggleSource(source.id)}
                      />
                      <div className="news-river-source-info">
                        <span className="news-river-source-title">
                          {source.icon} {source.name}
                        </span>
                        <span className="news-river-source-desc">{source.description}</span>
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>

            <div className="news-river-modal-footer">
              <button
                className="news-river-action-btn"
                onClick={enableAllSources}
              >
                Enable All
              </button>
              <button
                className="news-river-action-btn"
                style={{ backgroundColor: '#238636' }}
                onClick={() => setIsCustomizing(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsRiver;
