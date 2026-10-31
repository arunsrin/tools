import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import ThemeToggle from '../../components/ThemeToggle';
import type {
  TimezoneItem,
  TimezonePreferences,
} from './types';
import {
  DEFAULT_TIMEZONES,
  searchTimezones,
  getZonedParts,
  getTimestampForZone,
  getThreeDayTimelineHours,
  calculateZoneTime,
  formatTimelineTile,
  formatMeetingSummary,
} from './timezones';
import './TimezoneConverter.css';

interface TimezoneConverterProps {
  onBack: () => void;
}

const STORAGE_KEY = 'tools_hub_timezone_prefs';

const loadPreferences = (): TimezonePreferences => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.timezones) && parsed.timezones.length > 0) {
        return {
          timezones: parsed.timezones,
          timeFormat: parsed.timeFormat === '24h' ? '24h' : '12h',
          referenceId: parsed.referenceId || parsed.timezones[0].id,
        };
      }
    }
  } catch {
    // Gracefully handle storage errors
  }
  return {
    timezones: DEFAULT_TIMEZONES,
    timeFormat: '12h',
    referenceId: DEFAULT_TIMEZONES[0].id,
  };
};

const savePreferences = (prefs: TimezonePreferences): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Gracefully handle quota / storage exceptions
  }
};

export default function TimezoneConverter({ onBack }: TimezoneConverterProps) {
  const [preferences, setPreferences] = useState<TimezonePreferences>(loadPreferences);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number>(() => Date.now());
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [realTimeNow, setRealTimeNow] = useState<number>(() => Date.now());

  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { timezones, timeFormat, referenceId } = preferences;

  // Active reference timezone
  const referenceTimezone = useMemo(() => {
    return timezones.find((tz) => tz.id === referenceId) || timezones[0] || DEFAULT_TIMEZONES[0];
  }, [timezones, referenceId]);

  // Persist preferences
  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  // Live real-time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setRealTimeNow(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearching(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 72-hour window timestamps based on selected time and reference zone
  const timelineHours = useMemo(() => {
    return getThreeDayTimelineHours(selectedTimestamp, referenceTimezone.iana);
  }, [selectedTimestamp, referenceTimezone.iana]);

  // Auto-scroll timeline to selected hour on mount
  const scrollToActiveHour = useCallback((smooth = true) => {
    if (!timelineScrollRef.current) return;
    const container = timelineScrollRef.current;
    // Find closest hour index
    const hourWidth = 52; // Width of hour tile in px
    let closestIndex = 0;
    let minDiff = Infinity;
    timelineHours.forEach((ts, idx) => {
      const diff = Math.abs(ts - selectedTimestamp);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = idx;
      }
    });

    const targetScroll = Math.max(0, closestIndex * hourWidth - container.clientWidth / 2 + hourWidth / 2);
    if (typeof container.scrollTo === 'function') {
      container.scrollTo({
        left: targetScroll,
        behavior: smooth ? 'smooth' : 'auto',
      });
    } else {
      container.scrollLeft = targetScroll;
    }
  }, [timelineHours, selectedTimestamp]);

  useEffect(() => {
    // Initial centering after render
    const timer = setTimeout(() => {
      scrollToActiveHour(false);
    }, 100);
    return () => clearTimeout(timer);
  }, [scrollToActiveHour]);

  // Reference zone local date & time parts for manual input controls
  const referenceZonedParts = useMemo(() => {
    return getZonedParts(new Date(selectedTimestamp), referenceTimezone.iana);
  }, [selectedTimestamp, referenceTimezone.iana]);

  const dateInputValue = useMemo(() => {
    const y = referenceZonedParts.year.toString().padStart(4, '0');
    const m = referenceZonedParts.month.toString().padStart(2, '0');
    const d = referenceZonedParts.day.toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [referenceZonedParts]);

  const timeInputValue = useMemo(() => {
    const h = referenceZonedParts.hour.toString().padStart(2, '0');
    const m = referenceZonedParts.minute.toString().padStart(2, '0');
    return `${h}:${m}`;
  }, [referenceZonedParts]);

  // Handlers
  const handleDateChange = (newDateStr: string) => {
    if (!newDateStr) return;
    const [y, m, d] = newDateStr.split('-').map(Number);
    if (!y || !m || !d) return;
    const newTs = getTimestampForZone(
      y,
      m,
      d,
      referenceZonedParts.hour,
      referenceZonedParts.minute,
      referenceTimezone.iana
    );
    setSelectedTimestamp(newTs);
  };

  const handleTimeChange = (newTimeStr: string) => {
    if (!newTimeStr) return;
    const [h, m] = newTimeStr.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) return;
    const newTs = getTimestampForZone(
      referenceZonedParts.year,
      referenceZonedParts.month,
      referenceZonedParts.day,
      h,
      m,
      referenceTimezone.iana
    );
    setSelectedTimestamp(newTs);
  };

  const handleHourTileClick = (hourTimestamp: number) => {
    // Preserve minutes from current selection
    const currentMinutes = referenceZonedParts.minute;
    setSelectedTimestamp(hourTimestamp + currentMinutes * 60000);
  };

  const handleSnapToNow = () => {
    const now = Date.now();
    setSelectedTimestamp(now);
    setRealTimeNow(now);
    setTimeout(() => scrollToActiveHour(true), 50);
  };

  const handleToggleFormat = () => {
    setPreferences((prev) => ({
      ...prev,
      timeFormat: prev.timeFormat === '12h' ? '24h' : '12h',
    }));
  };

  const handleResetDefaults = () => {
    setPreferences({
      timezones: DEFAULT_TIMEZONES,
      timeFormat: '12h',
      referenceId: DEFAULT_TIMEZONES[0].id,
    });
    setSelectedTimestamp(Date.now());
  };

  const handleSetReference = (id: string) => {
    setPreferences((prev) => ({
      ...prev,
      referenceId: id,
    }));
  };

  const handleRemoveTimezone = (id: string) => {
    if (timezones.length <= 1) return;
    setPreferences((prev) => {
      const remaining = prev.timezones.filter((tz) => tz.id !== id);
      const newRefId = prev.referenceId === id ? remaining[0].id : prev.referenceId;
      return {
        ...prev,
        timezones: remaining,
        referenceId: newRefId,
      };
    });
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= timezones.length) return;
    setPreferences((prev) => {
      const nextList = [...prev.timezones];
      const temp = nextList[index];
      nextList[index] = nextList[targetIndex];
      nextList[targetIndex] = temp;
      return { ...prev, timezones: nextList };
    });
  };

  const handleAddTimezone = (tz: TimezoneItem) => {
    if (timezones.some((t) => t.id === tz.id || (t.iana === tz.iana && t.city === tz.city))) {
      setIsSearching(false);
      setSearchQuery('');
      return;
    }
    setPreferences((prev) => ({
      ...prev,
      timezones: [...prev.timezones, tz],
    }));
    setSearchQuery('');
    setIsSearching(false);
  };

  const handleCopyMeetingTimes = async () => {
    const summary = formatMeetingSummary(selectedTimestamp, timezones, timeFormat);
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(summary);
      } else {
        // Fallback for older browsers or restricted permissions
        const textarea = document.createElement('textarea');
        textarea.value = summary;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 2500);
    } catch {
      // Gracefully handle clipboard write restrictions
    }
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchTimezones(searchQuery);
  }, [searchQuery]);

  return (
    <div className="tz-container" data-testid="timezone-converter">
      {/* Top Hub Navigation & Controls Bar */}
      <header className="tz-header">
        <div className="tz-header-left">
          <button
            type="button"
            className="tz-back-btn"
            onClick={onBack}
            aria-label="Back to Tools Hub"
          >
            ← Back to Hub
          </button>
          <div className="tz-title-area">
            <h1>World Time & Timezone Converter</h1>
            <p className="tz-subtitle">3-Day Visual Timeline & Meeting Planner</p>
          </div>
        </div>

        <div className="tz-header-actions">
          <button
            type="button"
            className="tz-action-btn tz-now-btn"
            onClick={handleSnapToNow}
            title="Snap time cursor to current real-world time"
          >
            ⏱️ Snap to Now
          </button>

          <button
            type="button"
            className="tz-action-btn tz-format-btn"
            onClick={handleToggleFormat}
            aria-label={`Toggle time format, currently ${timeFormat}`}
          >
            {timeFormat === '12h' ? 'Format: 12h' : 'Format: 24h'}
          </button>

          <button
            type="button"
            className={`tz-action-btn tz-copy-btn ${copiedNotification ? 'copied' : ''}`}
            onClick={handleCopyMeetingTimes}
            aria-label="Copy meeting times to clipboard"
          >
            {copiedNotification ? '✓ Copied!' : '📋 Copy Meeting Times'}
          </button>

          <button
            type="button"
            className="tz-action-btn tz-reset-btn"
            onClick={handleResetDefaults}
            title="Reset to default cities"
          >
            ↺ Reset
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* Reference Time & Search Bar */}
      <section className="tz-controls-bar">
        {/* City Search Bar */}
        <div className="tz-search-wrapper" ref={searchContainerRef}>
          <div className="tz-search-input-box">
            <span className="tz-search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              className="tz-search-input"
              placeholder="Add city or timezone (e.g., London, PST, Pacific, EST)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
              }}
              onFocus={() => setIsSearching(true)}
              aria-label="Search city or timezone to add"
            />
            {searchQuery && (
              <button
                type="button"
                className="tz-search-clear"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {isSearching && searchResults.length > 0 && (
            <ul className="tz-search-dropdown" role="listbox">
              {searchResults.map((item) => (
                <li key={item.id} role="option" aria-selected={false}>
                  <button
                    type="button"
                    className="tz-search-result-btn"
                    onClick={() => handleAddTimezone(item)}
                  >
                    <span className="tz-search-city">{item.city}</span>
                    <span className="tz-search-details">
                      {item.country} • {item.iana}
                      {item.aliases && item.aliases.length > 0 ? ` • ${item.aliases.slice(0, 4).join(', ')}` : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Reference Date/Time Picker */}
        <div className="tz-reference-controls">
          <span className="tz-reference-label">
            Reference ({referenceTimezone.city}):
          </span>
          <input
            type="date"
            className="tz-date-input"
            value={dateInputValue}
            onChange={(e) => handleDateChange(e.target.value)}
            aria-label={`Select date for ${referenceTimezone.city}`}
          />
          <input
            type="time"
            className="tz-time-input"
            value={timeInputValue}
            onChange={(e) => handleTimeChange(e.target.value)}
            aria-label={`Select time for ${referenceTimezone.city}`}
          />
        </div>
      </section>

      {/* Legend & Instructions */}
      <div className="tz-legend-bar">
        <div className="tz-legend-item">
          <span className="tz-legend-color work-legend"></span>
          <span>Working Hours (09:00 - 18:00)</span>
        </div>
        <div className="tz-legend-item">
          <span className="tz-legend-color night-legend"></span>
          <span>Night / Off-Hours</span>
        </div>
        <div className="tz-legend-item">
          <span className="tz-legend-color selected-legend"></span>
          <span>Selected Time Column</span>
        </div>
        <div className="tz-legend-tip">
          💡 Click any hour block across the 72-hour timeline to project that instant across all cities.
        </div>
      </div>

      {/* Main 72-Hour Timeline Matrix */}
      <main className="tz-timeline-matrix">
        <div className="tz-scroll-container" ref={timelineScrollRef}>
          {/* Timeline Grid Header (Day Markers) */}
          <div className="tz-matrix-header-row">
            <div className="tz-row-sidebar-header">
              <span>Cities & Timezones</span>
              <span className="tz-cities-count">({timezones.length})</span>
            </div>
            <div className="tz-hours-header-track">
              {timelineHours.map((ts) => {
                const tile = formatTimelineTile(ts, referenceTimezone.iana, timeFormat);
                const isSelected = Math.abs(ts - selectedTimestamp) < 1800000;
                return (
                  <div
                    key={`header-${ts}`}
                    className={`tz-hour-header-cell ${tile.isMidnight ? 'midnight-header' : ''} ${
                      isSelected ? 'selected-column-header' : ''
                    }`}
                  >
                    {tile.dayBadge ? (
                      <span className="tz-header-day-badge">{tile.dayBadge}</span>
                    ) : (
                      <span className="tz-header-hour-text">{tile.hourText}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timezone Rows */}
          {timezones.map((tz, index) => {
            const isRef = tz.id === referenceId;
            const currentCalc = calculateZoneTime(selectedTimestamp, tz.iana, timeFormat);

            return (
              <div
                key={tz.id}
                className={`tz-zone-row ${isRef ? 'reference-row' : ''}`}
                data-testid={`timezone-row-${tz.id}`}
              >
                {/* Fixed / Sticky Left Sidebar with Details & Actions */}
                <div className="tz-row-sidebar">
                  <div className="tz-row-top">
                    <div className="tz-city-info">
                      <div className="tz-city-name-wrap">
                        <strong className="tz-city-name">{tz.city}</strong>
                        {isRef && <span className="tz-ref-badge" title="Primary Reference Zone">★ Home</span>}
                      </div>
                      <span className="tz-country-name">
                        {tz.country} • {currentCalc.offsetStr}
                      </span>
                    </div>

                    <div className="tz-row-actions">
                      {!isRef && (
                        <button
                          type="button"
                          className="tz-icon-btn tz-star-btn"
                          onClick={() => handleSetReference(tz.id)}
                          title="Set as reference timezone"
                          aria-label={`Set ${tz.city} as reference timezone`}
                        >
                          ☆
                        </button>
                      )}
                      <button
                        type="button"
                        className="tz-icon-btn"
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        title="Move up"
                        aria-label={`Move ${tz.city} up`}
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        className="tz-icon-btn"
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === timezones.length - 1}
                        title="Move down"
                        aria-label={`Move ${tz.city} down`}
                      >
                        ▼
                      </button>
                      {timezones.length > 1 && (
                        <button
                          type="button"
                          className="tz-icon-btn tz-remove-btn"
                          onClick={() => handleRemoveTimezone(tz.id)}
                          title="Remove timezone"
                          aria-label={`Remove ${tz.city}`}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="tz-row-bottom">
                    <div className="tz-current-time-display">
                      <span className="tz-time-big">{currentCalc.timeStr}</span>
                      <span className="tz-date-small">
                        {currentCalc.dayStr}, {currentCalc.dateStr}
                      </span>
                    </div>
                    <span
                      className={`tz-status-pill ${
                        currentCalc.isWorkHours
                          ? 'status-work'
                          : currentCalc.isNight
                          ? 'status-night'
                          : 'status-off'
                      }`}
                    >
                      {currentCalc.isWorkHours ? 'Work Hours' : currentCalc.isNight ? 'Night' : 'Off-Hours'}
                    </span>
                  </div>
                </div>

                {/* 72-Hour Grid Track */}
                <div className="tz-hours-track">
                  {timelineHours.map((ts) => {
                    const tile = formatTimelineTile(ts, tz.iana, timeFormat);
                    const isSelected = Math.abs(ts - selectedTimestamp) < 1800000;
                    const isNow = Math.abs(ts - realTimeNow) < 1800000;

                    let tileClass = 'tz-hour-tile';
                    if (tile.isWorkHours) tileClass += ' work-hours';
                    else if (tile.isNight) tileClass += ' night-hours';
                    if (tile.isMidnight) tileClass += ' midnight-boundary';
                    if (isSelected) tileClass += ' selected-tile';
                    if (isNow) tileClass += ' real-now-tile';

                    return (
                      <button
                        key={`${tz.id}-${ts}`}
                        type="button"
                        className={tileClass}
                        onClick={() => handleHourTileClick(ts)}
                        title={`${tz.city}: ${tile.hourText} (${tile.isWorkHours ? 'Working Hours' : 'Off-hours'})`}
                        aria-label={`${tz.city} at ${tile.hourText}`}
                      >
                        {tile.dayBadge ? (
                          <div className="tz-tile-midnight-inner">
                            <span className="tz-badge-text">{tile.dayBadge}</span>
                            <span className="tz-tile-hour-sub">{tile.hourText}</span>
                          </div>
                        ) : (
                          <span className="tz-tile-hour">{tile.hourText}</span>
                        )}
                        {isNow && <span className="tz-now-dot" title="Current time"></span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
