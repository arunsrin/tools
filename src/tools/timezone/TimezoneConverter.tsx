import { useState, useEffect, useRef, useMemo, useCallback, type KeyboardEvent } from 'react';
import ToolHeader from '../../shared/components/ToolHeader';
import Toast from '../../shared/components/Toast';
import InlineAlert from '../../shared/components/InlineAlert';
import { usePersistedState } from '../../shared/hooks/usePersistedState';
import { useTimeoutRegistry } from '../../shared/hooks/useTimeoutRegistry';
import { useCopyFeedback } from '../../shared/hooks/useCopyFeedback';
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
  sanitizeTimezonePreferences,
} from './timezones';
import './TimezoneConverter.css';

interface TimezoneConverterProps {
  onBack: () => void;
}

const STORAGE_KEY = 'tools_hub_timezone_prefs';

const DEFAULT_PREFERENCES: TimezonePreferences = {
  timezones: DEFAULT_TIMEZONES,
  timeFormat: '12h',
  referenceId: DEFAULT_TIMEZONES[0].id,
};

function isTimestampInHourSlot(
  slotStartMs: number,
  nextSlotStartMs: number,
  targetMs: number
): boolean {
  return targetMs >= slotStartMs && targetMs < nextSlotStartMs;
}

export default function TimezoneConverter({ onBack }: TimezoneConverterProps) {
  const [preferences, setPreferences] = usePersistedState<TimezonePreferences>(
    STORAGE_KEY,
    DEFAULT_PREFERENCES,
    { validate: sanitizeTimezonePreferences }
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number>(() => Date.now());
  const [realTimeNow, setRealTimeNow] = useState<number>(() => Date.now());
  const [scrollRequest, setScrollRequest] = useState<{ id: number; smooth: boolean }>({
    id: 1,
    smooth: false,
  });

  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const { schedule, clear } = useTimeoutRegistry();
  const { status: copyStatus, copy: copyMeetingSummary, reset: resetCopyStatus } = useCopyFeedback(2500);

  const { timezones, timeFormat, referenceId } = preferences;

  // Active reference timezone
  const referenceTimezone = useMemo(() => {
    return timezones.find((tz) => tz.id === referenceId) || timezones[0] || DEFAULT_TIMEZONES[0];
  }, [timezones, referenceId]);

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
        setActiveSearchIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 3-day rolling timeline timestamps based on selected time and reference zone
  const timelineHours = useMemo(() => {
    return getThreeDayTimelineHours(selectedTimestamp, referenceTimezone.iana);
  }, [selectedTimestamp, referenceTimezone.iana]);

  // Center timeline on the active hour slot (triggered only on mount or explicit Snap/Reset to Now)
  const scrollToActiveHour = useCallback(
    (smooth = true) => {
      const container = timelineScrollRef.current;
      if (!container || timelineHours.length === 0) return;

      const firstCell = container.querySelector('.tz-hour-header-cell') as HTMLElement | null;
      const hourWidth = firstCell?.offsetWidth || 52;

      let targetIndex = timelineHours.findIndex((ts, idx) => {
        const nextTs = timelineHours[idx + 1] ?? ts + 3600000;
        return isTimestampInHourSlot(ts, nextTs, selectedTimestamp);
      });

      if (targetIndex === -1) {
        let minDiff = Infinity;
        timelineHours.forEach((ts, idx) => {
          const diff = Math.abs(ts - selectedTimestamp);
          if (diff < minDiff) {
            minDiff = diff;
            targetIndex = idx;
          }
        });
      }

      const targetScroll = Math.max(
        0,
        targetIndex * hourWidth - container.clientWidth / 2 + hourWidth / 2
      );
      if (typeof container.scrollTo === 'function') {
        container.scrollTo({
          left: targetScroll,
          behavior: smooth ? 'smooth' : 'auto',
        });
      } else {
        container.scrollLeft = targetScroll;
      }
    },
    [timelineHours, selectedTimestamp]
  );

  const scrollToActiveHourRef = useRef(scrollToActiveHour);
  useEffect(() => {
    scrollToActiveHourRef.current = scrollToActiveHour;
  }, [scrollToActiveHour]);

  useEffect(() => {
    const timerId = schedule(() => {
      scrollToActiveHourRef.current(scrollRequest.smooth);
    }, 100);
    return () => clear(timerId);
  }, [scrollRequest, schedule, clear]);

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
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(newDateStr);
    if (!match) return;
    const y = Number(match[1]);
    const m = Number(match[2]);
    const d = Number(match[3]);
    if (m < 1 || m > 12 || d < 1 || d > 31) return;
    const probe = new Date(Date.UTC(y, m - 1, d));
    if (
      probe.getUTCFullYear() !== y ||
      probe.getUTCMonth() !== m - 1 ||
      probe.getUTCDate() !== d
    ) {
      return;
    }

    const newTs = getTimestampForZone(
      y,
      m,
      d,
      referenceZonedParts.hour,
      referenceZonedParts.minute,
      referenceTimezone.iana
    );
    if (Number.isFinite(newTs)) {
      setSelectedTimestamp(newTs);
    }
  };

  const handleTimeChange = (newTimeStr: string) => {
    const match = /^(\d{1,2}):(\d{2})$/.exec(newTimeStr);
    if (!match) return;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h < 0 || h > 23 || m < 0 || m > 59) return;

    const newTs = getTimestampForZone(
      referenceZonedParts.year,
      referenceZonedParts.month,
      referenceZonedParts.day,
      h,
      m,
      referenceTimezone.iana
    );
    if (Number.isFinite(newTs)) {
      setSelectedTimestamp(newTs);
    }
  };

  const handleHourTileClick = (hourTimestamp: number) => {
    // Preserve minutes from current selection without snapping scroll
    const currentMinutes = referenceZonedParts.minute;
    setSelectedTimestamp(hourTimestamp + currentMinutes * 60000);
  };

  const handleSnapToNow = () => {
    const now = Date.now();
    setSelectedTimestamp(now);
    setRealTimeNow(now);
    setScrollRequest((prev) => ({ id: prev.id + 1, smooth: true }));
  };

  const handleToggleFormat = () => {
    setPreferences((prev) => ({
      ...prev,
      timeFormat: prev.timeFormat === '12h' ? '24h' : '12h',
    }));
  };

  const handleResetDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES);
    const now = Date.now();
    setSelectedTimestamp(now);
    setRealTimeNow(now);
    setScrollRequest((prev) => ({ id: prev.id + 1, smooth: true }));
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
      if (prev.timezones.length <= 1) return prev;
      const remaining = prev.timezones.filter((tz) => tz.id !== id);
      if (remaining.length === 0) return prev;
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
      if (targetIndex < 0 || targetIndex >= prev.timezones.length) return prev;
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
      setActiveSearchIndex(-1);
      return;
    }
    setPreferences((prev) => ({
      ...prev,
      timezones: [...prev.timezones, tz],
    }));
    setSearchQuery('');
    setIsSearching(false);
    setActiveSearchIndex(-1);
  };

  const handleCopyMeetingTimes = async () => {
    const summary = formatMeetingSummary(selectedTimestamp, timezones, timeFormat);
    await copyMeetingSummary(summary);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchTimezones(searchQuery);
  }, [searchQuery]);

  const showSearchDropdown = isSearching && searchQuery.trim().length > 0;

  const handleSearchKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLDivElement>) => {
    if (e.key === 'Escape') {
      if (isSearching) {
        e.preventDefault();
        setIsSearching(false);
        setActiveSearchIndex(-1);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      if (searchQuery.trim()) {
        setIsSearching(true);
      }
      if (searchResults.length > 0) {
        e.preventDefault();
        setActiveSearchIndex((prev) => (prev + 1) % searchResults.length);
      }
      return;
    }

    if (e.key === 'ArrowUp') {
      if (isSearching && searchResults.length > 0) {
        e.preventDefault();
        setActiveSearchIndex((prev) => (prev <= 0 ? searchResults.length - 1 : prev - 1));
      }
      return;
    }

    if (e.key === 'Enter' && isSearching && activeSearchIndex >= 0 && activeSearchIndex < searchResults.length) {
      e.preventDefault();
      handleAddTimezone(searchResults[activeSearchIndex]);
    }
  };

  const headerActions = (
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
        className={`tz-action-btn tz-copy-btn ${copyStatus === 'copied' ? 'copied' : ''}`}
        onClick={handleCopyMeetingTimes}
        aria-label="Copy meeting times to clipboard"
      >
        {copyStatus === 'copied' ? '✓ Copied!' : '📋 Copy Meeting Times'}
      </button>

      <button
        type="button"
        className="tz-action-btn tz-reset-btn"
        onClick={handleResetDefaults}
        title="Reset to default cities"
      >
        ↺ Reset
      </button>
    </div>
  );

  return (
    <div className="tz-container" data-testid="timezone-converter">
      <ToolHeader
        onBack={onBack}
        title="World Time & Timezone Converter"
        badge="World Time"
        subtitle="3-Day Visual Timeline & Meeting Planner"
        actions={headerActions}
        className="tz-header"
      />

      {/* Reference Time & Search Bar */}
      <section className="tz-controls-bar">
        {/* City Search Bar */}
        <div
          className="tz-search-wrapper"
          ref={searchContainerRef}
          onKeyDown={handleSearchKeyDown}
        >
          <div className="tz-search-input-box">
            <span className="tz-search-icon" aria-hidden="true">🔍</span>
            <input
              type="text"
              role="combobox"
              className="tz-search-input"
              placeholder="Add city or timezone (e.g., London, PST, Pacific, EST)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(true);
                setActiveSearchIndex(-1);
              }}
              onFocus={() => setIsSearching(true)}
              aria-label="Search city or timezone to add"
              aria-expanded={showSearchDropdown}
              aria-controls={showSearchDropdown && searchResults.length > 0 ? 'tz-search-listbox' : undefined}
              aria-activedescendant={
                showSearchDropdown && activeSearchIndex >= 0 && activeSearchIndex < searchResults.length
                  ? `tz-search-option-${activeSearchIndex}`
                  : undefined
              }
              aria-autocomplete="list"
            />
            {searchQuery && (
              <button
                type="button"
                className="tz-search-clear"
                onClick={() => {
                  setSearchQuery('');
                  setActiveSearchIndex(-1);
                }}
                aria-label="Clear search query"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && (
            searchResults.length > 0 ? (
              <ul
                id="tz-search-listbox"
                className="tz-search-dropdown"
                role="listbox"
                aria-label="Matching cities and timezones"
              >
                {searchResults.map((item, idx) => {
                  const isActive = idx === activeSearchIndex;
                  return (
                    <li
                      key={item.id}
                      id={`tz-search-option-${idx}`}
                      role="option"
                      aria-selected={isActive}
                    >
                      <button
                        type="button"
                        className={`tz-search-result-btn ${isActive ? 'active' : ''}`}
                        onClick={() => handleAddTimezone(item)}
                      >
                        <span className="tz-search-city">{item.city}</span>
                        <span className="tz-search-details">
                          {item.country} • {item.iana}
                          {item.aliases && item.aliases.length > 0 ? ` • ${item.aliases.slice(0, 4).join(', ')}` : ''}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="tz-search-dropdown tz-search-empty" role="status">
                No matching cities
              </div>
            )
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

      {copyStatus === 'error' && (
        <div className="tz-alert-wrap">
          <InlineAlert
            variant="error"
            message="Unable to copy meeting times to clipboard. Please copy manually or check browser permissions."
            onDismiss={resetCopyStatus}
          />
        </div>
      )}

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

      {/* Main 3-Day Timeline Matrix */}
      <main className="tz-timeline-matrix">
        <div className="tz-scroll-container" ref={timelineScrollRef}>
          {/* Timeline Grid Header (Day Markers) */}
          <div className="tz-matrix-header-row">
            <div className="tz-row-sidebar-header">
              <span>Cities & Timezones</span>
              <span className="tz-cities-count">({timezones.length})</span>
            </div>
            <div className="tz-hours-header-track">
              {timelineHours.map((ts, idx) => {
                const nextTs = timelineHours[idx + 1] ?? ts + 3600000;
                const tile = formatTimelineTile(ts, referenceTimezone.iana, timeFormat);
                const isSelected = isTimestampInHourSlot(ts, nextTs, selectedTimestamp);
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

                {/* 3-Day Grid Track */}
                <div className="tz-hours-track">
                  {timelineHours.map((ts, idx) => {
                    const nextTs = timelineHours[idx + 1] ?? ts + 3600000;
                    const tile = formatTimelineTile(ts, tz.iana, timeFormat);
                    const isSelected = isTimestampInHourSlot(ts, nextTs, selectedTimestamp);
                    const isNow = isTimestampInHourSlot(ts, nextTs, realTimeNow);

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

      <Toast
        visible={copyStatus === 'copied'}
        variant="success"
        message="Meeting times copied to clipboard."
        onDismiss={resetCopyStatus}
      />
    </div>
  );
}
