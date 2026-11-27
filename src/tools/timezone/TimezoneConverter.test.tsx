import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
import TimezoneConverter from './TimezoneConverter';
import {
  DEFAULT_TIMEZONES,
  searchTimezones,
  getZonedParts,
  getTimestampForZone,
  formatTimelineTile,
  formatMeetingSummary,
  getThreeDayTimelineHours,
  isValidIanaTimeZone,
  sanitizeTimezonePreferences,
} from './timezones';

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
const originalExecCommandDescriptor = Object.getOwnPropertyDescriptor(document, 'execCommand');
const originalScrollToDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'scrollTo');

function restorePatchedGlobals() {
  if (originalClipboardDescriptor) {
    Object.defineProperty(navigator, 'clipboard', originalClipboardDescriptor);
  } else {
    delete (navigator as { clipboard?: unknown }).clipboard;
  }

  if (originalExecCommandDescriptor) {
    Object.defineProperty(document, 'execCommand', originalExecCommandDescriptor);
  } else {
    delete (document as { execCommand?: unknown }).execCommand;
  }

  if (originalScrollToDescriptor) {
    Object.defineProperty(Element.prototype, 'scrollTo', originalScrollToDescriptor);
  } else {
    delete (Element.prototype as { scrollTo?: unknown }).scrollTo;
  }
}

describe('TimezoneConverter Helper Functions', () => {
  it('searchTimezones filters by city and country', () => {
    const londonResults = searchTimezones('London');
    expect(londonResults.length).toBeGreaterThan(0);
    expect(londonResults[0].city).toBe('London');

    const countryResults = searchTimezones('Japan');
    expect(countryResults.some((r) => r.city === 'Tokyo')).toBe(true);

    const emptyResults = searchTimezones('');
    expect(emptyResults).toEqual([]);

    const noMatch = searchTimezones('NonExistentCityXYZ123');
    expect(noMatch).toEqual([]);
  });

  it('searchTimezones filters by abbreviation and convention aliases (PST, Pacific, EST, IST)', () => {
    const pstResults = searchTimezones('PST');
    expect(pstResults.length).toBeGreaterThan(0);
    expect(pstResults[0].aliases).toContain('PST');

    const pacificResults = searchTimezones('Pacific');
    expect(pacificResults.length).toBeGreaterThan(0);
    expect(pacificResults.some((r) => r.city.includes('Pacific') || r.city === 'San Francisco')).toBe(true);

    const estResults = searchTimezones('EST');
    expect(estResults.length).toBeGreaterThan(0);
    expect(estResults.some((r) => r.aliases?.includes('EST'))).toBe(true);

    const istResults = searchTimezones('IST');
    expect(istResults.length).toBeGreaterThan(0);
    expect(istResults.some((r) => r.aliases?.includes('IST'))).toBe(true);
  });

  it('calculates accurate zoned parts and handles offsets', () => {
    const date = new Date('2026-10-30T12:00:00Z');
    const kolkataParts = getZonedParts(date, 'Asia/Kolkata');
    // UTC 12:00 -> Kolkata 17:30
    expect(kolkataParts.hour).toBe(17);
    expect(kolkataParts.minute).toBe(30);

    const tokyoParts = getZonedParts(date, 'Asia/Tokyo');
    // UTC 12:00 -> Tokyo 21:00
    expect(tokyoParts.hour).toBe(21);
    expect(tokyoParts.minute).toBe(0);
  });

  it('converts local date/time to UTC timestamp accurately', () => {
    // 2026-10-30 09:00 in America/Los_Angeles (PDT = UTC-7) -> 16:00 UTC
    const ts = getTimestampForZone(2026, 10, 30, 9, 0, 'America/Los_Angeles');
    const iso = new Date(ts).toISOString();
    expect(iso).toContain('16:00:00');
  });

  it('generates 72 timeline hours for 3-day rolling window in UTC', () => {
    const hours = getThreeDayTimelineHours(Date.now(), 'UTC');
    expect(hours).toHaveLength(72);
    // Difference between consecutive blocks should be exactly 1 hour (3600000 ms)
    expect(hours[1] - hours[0]).toBe(3600000);
    expect(hours[71] - hours[0]).toBe(71 * 3600000);
  });

  it('handles DST Spring Forward and Fall Back without 1-hour drift in getThreeDayTimelineHours', () => {
    // Spring Forward in America/Los_Angeles: 2026-03-08 (23-hour day -> 71 hours total for Mar 7, 8, 9)
    const springRef = new Date('2026-03-08T19:00:00Z').getTime(); // Mar 8 12:00 PDT
    const springHours = getThreeDayTimelineHours(springRef, 'America/Los_Angeles');
    expect(springHours).toHaveLength(71);
    for (let i = 1; i < springHours.length; i++) {
      expect(springHours[i] - springHours[i - 1]).toBe(3600000);
    }
    const springStart = getZonedParts(new Date(springHours[0]), 'America/Los_Angeles');
    const springEnd = getZonedParts(new Date(springHours[springHours.length - 1]), 'America/Los_Angeles');
    expect(springStart).toMatchObject({ year: 2026, month: 3, day: 7, hour: 0 });
    expect(springEnd).toMatchObject({ year: 2026, month: 3, day: 9, hour: 23 });

    // Fall Back in America/Los_Angeles: 2026-11-01 (25-hour day -> 73 hours total for Oct 31, Nov 1, Nov 2)
    const fallRef = new Date('2026-11-01T19:00:00Z').getTime(); // Nov 1 11:00 PST
    const fallHours = getThreeDayTimelineHours(fallRef, 'America/Los_Angeles');
    expect(fallHours).toHaveLength(73);
    for (let i = 1; i < fallHours.length; i++) {
      expect(fallHours[i] - fallHours[i - 1]).toBe(3600000);
    }
    const fallStart = getZonedParts(new Date(fallHours[0]), 'America/Los_Angeles');
    const fallEnd = getZonedParts(new Date(fallHours[fallHours.length - 1]), 'America/Los_Angeles');
    expect(fallStart).toMatchObject({ year: 2026, month: 10, day: 31, hour: 0 });
    expect(fallEnd).toMatchObject({ year: 2026, month: 11, day: 2, hour: 23 });
  });

  it('validates IANA timezones and sanitizes persisted preferences', () => {
    expect(isValidIanaTimeZone('America/New_York')).toBe(true);
    expect(isValidIanaTimeZone('UTC')).toBe(true);
    expect(isValidIanaTimeZone('Invalid/Zone')).toBe(false);
    expect(isValidIanaTimeZone('')).toBe(false);

    const sanitized = sanitizeTimezonePreferences({
      timezones: [
        { id: 'bad', city: 'Bad', country: 'X', iana: 'Mars/Olympus' },
        { id: 'etc-utc', city: 'UTC', country: 'Universal', iana: 'UTC' },
      ],
      timeFormat: '24h',
      referenceId: 'bad',
    });
    expect(sanitized.timezones).toHaveLength(1);
    expect(sanitized.timezones[0].id).toBe('etc-utc');
    expect(sanitized.referenceId).toBe('etc-utc');
    expect(sanitized.timeFormat).toBe('24h');

    const fallback = sanitizeTimezonePreferences({
      timezones: [{ id: 'bad', city: 'Bad', country: 'X', iana: 'Invalid/Zone' }],
    });
    expect(fallback.timezones).toEqual(DEFAULT_TIMEZONES);
    expect(fallback.timeFormat).toBe('12h');
  });

  it('formats timeline tiles correctly in 12h and 24h formats', () => {
    const ts = new Date('2026-10-30T09:00:00Z').getTime();
    const tile12 = formatTimelineTile(ts, 'UTC', '12h');
    expect(tile12.hourText).toBe('9a');
    expect(tile12.isWorkHours).toBe(true);
    expect(tile12.isNight).toBe(false);

    const tile24 = formatTimelineTile(ts, 'UTC', '24h');
    expect(tile24.hourText).toBe('09:00');

    // Midnight tile
    const midnightTs = new Date('2026-10-30T00:00:00Z').getTime();
    const midnightTile = formatTimelineTile(midnightTs, 'UTC', '12h');
    expect(midnightTile.isMidnight).toBe(true);
    expect(midnightTile.dayBadge).toBeDefined();
  });

  it('formats meeting summary text for clipboard copy', () => {
    const ts = new Date('2026-10-30T14:00:00Z').getTime();
    const summary = formatMeetingSummary(ts, DEFAULT_TIMEZONES.slice(0, 2), '12h');
    expect(summary).toContain('📅 Meeting Times:');
    expect(summary).toContain('Bangalore (India)');
    expect(summary).toContain('San Francisco (United States)');
  });
});

describe('TimezoneConverter Component', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    restorePatchedGlobals();
    localStorage.clear();
  });

  it('renders default cities and initial layout with ToolHeader', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);

    expect(screen.getByRole('heading', { level: 1, name: /world time & timezone converter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();

    // Verify all 6 default cities are present
    expect(screen.getByText('Bangalore')).toBeInTheDocument();
    expect(screen.getByText('San Francisco')).toBeInTheDocument();
    expect(screen.getByText('Tokyo')).toBeInTheDocument();
    expect(screen.getByText('Colombia (Bogotá)')).toBeInTheDocument();
    expect(screen.getByText('Edmonton')).toBeInTheDocument();
    expect(screen.getByText('UTC')).toBeInTheDocument();

    // Home / reference badge
    expect(screen.getByTitle('Primary Reference Zone')).toBeInTheDocument();
  });

  it('calls onBack when Back to Tools Hub button is clicked', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('toggles time format between 12h and 24h', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const formatBtn = screen.getByRole('button', { name: /toggle time format/i });
    expect(formatBtn).toHaveTextContent(/format: 12h/i);

    fireEvent.click(formatBtn);
    expect(formatBtn).toHaveTextContent(/format: 24h/i);

    fireEvent.click(formatBtn);
    expect(formatBtn).toHaveTextContent(/format: 12h/i);
  });

  it('snaps to now when Snap to Now button is clicked', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const nowBtn = screen.getByRole('button', { name: /snap to now/i });
    fireEvent.click(nowBtn);
    expect(screen.getByTestId('timezone-converter')).toBeInTheDocument();
  });

  it('searches and adds a new timezone', async () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const searchInput = screen.getByPlaceholderText(/add city or timezone/i);

    fireEvent.change(searchInput, { target: { value: 'Berlin' } });
    fireEvent.focus(searchInput);

    const berlinOption = await screen.findByRole('button', { name: /^berlin/i });
    expect(berlinOption).toBeInTheDocument();

    fireEvent.click(berlinOption);
    expect(screen.getByText('Berlin')).toBeInTheDocument();
  });

  it('ignores adding a duplicate city', async () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const searchInput = screen.getByPlaceholderText(/add city or timezone/i);
    expect(screen.getAllByTestId(/^timezone-row-/)).toHaveLength(6);

    fireEvent.change(searchInput, { target: { value: 'Bangalore' } });
    fireEvent.focus(searchInput);

    const bangaloreOptionItem = await screen.findByRole('option');
    const bangaloreOption = within(bangaloreOptionItem).getByRole('button');
    fireEvent.click(bangaloreOption);

    expect(screen.getAllByTestId(/^timezone-row-/)).toHaveLength(6);
    expect(searchInput).toHaveValue('');
  });

  it('shows empty state and supports Escape and Arrow-key navigation in search dropdown', async () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const searchInput = screen.getByPlaceholderText(/add city or timezone/i);

    // Empty state
    fireEvent.change(searchInput, { target: { value: 'AtlantisXYZ999' } });
    fireEvent.focus(searchInput);
    expect(screen.getByText('No matching cities')).toBeInTheDocument();

    // Arrow navigation + Enter selection
    fireEvent.change(searchInput, { target: { value: 'Berlin' } });
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    const options = screen.getAllByRole('option');
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
    expect(options[options.length - 1]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    expect(options[0]).toHaveAttribute('aria-selected', 'true');

    fireEvent.keyDown(searchInput, { key: 'Enter' });
    expect(screen.getByText('Berlin')).toBeInTheDocument();

    // Escape closes dropdown
    fireEvent.change(searchInput, { target: { value: 'Sydney' } });
    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);
    fireEvent.keyDown(searchInput, { key: 'Escape' });
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('searches and adds by abbreviation convention (e.g. PST, Pacific)', async () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const searchInput = screen.getByPlaceholderText(/add city or timezone/i);

    fireEvent.change(searchInput, { target: { value: 'PST' } });
    fireEvent.focus(searchInput);

    const ptOption = await screen.findByRole('button', { name: /pacific time/i });
    expect(ptOption).toBeInTheDocument();

    fireEvent.click(ptOption);
    expect(screen.getByText('Pacific Time (PT)')).toBeInTheDocument();
  });

  it('clears search input when clear button is clicked', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const searchInput = screen.getByPlaceholderText(/add city or timezone/i);

    fireEvent.change(searchInput, { target: { value: 'Paris' } });
    expect(searchInput).toHaveValue('Paris');

    const clearBtn = screen.getByRole('button', { name: /clear search query/i });
    fireEvent.click(clearBtn);

    expect(searchInput).toHaveValue('');
  });

  it('changes reference timezone when star button is clicked', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const setRefBtn = screen.getByRole('button', { name: /set tokyo as reference timezone/i });
    fireEvent.click(setRefBtn);

    expect(screen.getByText(/reference \(tokyo\):/i)).toBeInTheDocument();
  });

  it('removes a timezone and enforces 1-timezone minimum removal guard', () => {
    localStorage.setItem(
      'tools_hub_timezone_prefs',
      JSON.stringify({
        timezones: [DEFAULT_TIMEZONES[0], DEFAULT_TIMEZONES[1]],
        timeFormat: '12h',
        referenceId: DEFAULT_TIMEZONES[0].id,
      })
    );

    render(<TimezoneConverter onBack={mockOnBack} />);
    expect(screen.getAllByTestId(/^timezone-row-/)).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: /remove san francisco/i }));
    expect(screen.getAllByTestId(/^timezone-row-/)).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();
  });

  it('reorders timezones and disables boundary move-up/down buttons', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);

    const firstUpBtn = screen.getByRole('button', { name: /move bangalore up/i });
    const firstDownBtn = screen.getByRole('button', { name: /move bangalore down/i });
    const lastUpBtn = screen.getByRole('button', { name: /move utc up/i });
    const lastDownBtn = screen.getByRole('button', { name: /move utc down/i });

    expect(firstUpBtn).toBeDisabled();
    expect(firstDownBtn).not.toBeDisabled();
    expect(lastUpBtn).not.toBeDisabled();
    expect(lastDownBtn).toBeDisabled();

    fireEvent.click(firstDownBtn);

    const rows = screen.getAllByTestId(/^timezone-row-/);
    expect(rows[1]).toHaveTextContent('Bangalore');
    expect(screen.getByRole('button', { name: /move san francisco up/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /move bangalore up/i })).not.toBeDisabled();
  });

  it('resets to default cities when Reset button is clicked', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /remove edmonton/i }));
    expect(screen.queryByText('Edmonton')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByText('Edmonton')).toBeInTheDocument();
  });

  it('highlights the floored hour slot when minutes >= 30 and across DST', () => {
    localStorage.setItem(
      'tools_hub_timezone_prefs',
      JSON.stringify({
        timezones: [DEFAULT_TIMEZONES[5], DEFAULT_TIMEZONES[1]], // UTC (ref) and San Francisco
        timeFormat: '24h',
        referenceId: DEFAULT_TIMEZONES[5].id,
      })
    );

    render(<TimezoneConverter onBack={mockOnBack} />);
    const dateInput = screen.getByLabelText(/select date for utc/i);
    const timeInput = screen.getByLabelText(/select time for utc/i);

    // 14:45 UTC: should highlight 14:00 slot, NOT 15:00
    fireEvent.change(dateInput, { target: { value: '2026-10-30' } });
    fireEvent.change(timeInput, { target: { value: '14:45' } });

    const utc14Tiles = screen.getAllByRole('button', { name: 'UTC at 14:00' });
    const utc15Tiles = screen.getAllByRole('button', { name: 'UTC at 15:00' });
    // Center day (Today) is the 2nd occurrence (index 1)
    expect(utc14Tiles[1]).toHaveClass('selected-tile');
    expect(utc15Tiles[1]).not.toHaveClass('selected-tile');

    // Also verify header column matches 14:00
    const selectedHeaders = document.querySelectorAll('.selected-column-header');
    expect(selectedHeaders).toHaveLength(1);
    expect(selectedHeaders[0]).toHaveTextContent('14:00');
  });

  it('does not snap horizontal scroll on hour tile click, only on mount and Snap to Now', () => {
    const scrollToMock = vi.fn();
    Object.defineProperty(Element.prototype, 'scrollTo', {
      value: scrollToMock,
      configurable: true,
      writable: true,
    });

    vi.useFakeTimers();
    render(<TimezoneConverter onBack={mockOnBack} />);

    // Initial mount scroll fires after 100ms
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(scrollToMock).toHaveBeenCalledTimes(1);
    expect(scrollToMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ behavior: 'auto' })
    );

    scrollToMock.mockClear();

    // Clicking an hour tile must NOT trigger horizontal scroll snap
    const hourTiles = screen.getAllByRole('button', { name: /bangalore at/i });
    fireEvent.click(hourTiles[10]);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(scrollToMock).not.toHaveBeenCalled();

    // Clicking Snap to Now MUST trigger smooth scroll snap
    fireEvent.click(screen.getByRole('button', { name: /snap to now/i }));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(scrollToMock).toHaveBeenCalledTimes(1);
    expect(scrollToMock).toHaveBeenLastCalledWith(
      expect.objectContaining({ behavior: 'smooth' })
    );
  });

  it('handles valid and invalid date and time manual input changes safely', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const dateInput = screen.getByLabelText(/select date for/i);
    const timeInput = screen.getByLabelText(/select time for/i);

    fireEvent.change(dateInput, { target: { value: '2026-11-15' } });
    fireEvent.change(timeInput, { target: { value: '14:30' } });

    expect(dateInput).toHaveValue('2026-11-15');
    expect(timeInput).toHaveValue('14:30');

    // Invalid inputs should be ignored without crashing or corrupting state
    fireEvent.change(dateInput, { target: { value: '' } });
    fireEvent.change(dateInput, { target: { value: '2026-02-30' } });
    fireEvent.change(dateInput, { target: { value: 'not-a-date' } });
    fireEvent.change(timeInput, { target: { value: '' } });
    fireEvent.change(timeInput, { target: { value: '25:99' } });
    fireEvent.change(timeInput, { target: { value: 'ab:cd' } });

    expect(dateInput).toHaveValue('2026-11-15');
    expect(timeInput).toHaveValue('14:30');
  });

  it('copies meeting times to clipboard with Toast visual confirmation', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    render(<TimezoneConverter onBack={mockOnBack} />);
    const copyBtn = screen.getByRole('button', { name: /copy meeting times to clipboard/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
      expect(screen.getByText(/✓ copied!/i)).toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent(/meeting times copied/i);
    });
  });

  it('falls back to execCommand when clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const execCommandMock = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      value: execCommandMock,
      configurable: true,
      writable: true,
    });

    render(<TimezoneConverter onBack={mockOnBack} />);
    const copyBtn = screen.getByRole('button', { name: /copy meeting times to clipboard/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith('copy');
      expect(screen.getByText(/✓ copied!/i)).toBeInTheDocument();
    });
  });

  it('shows InlineAlert when both clipboard API and execCommand fail', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
      configurable: true,
      writable: true,
    });
    Object.defineProperty(document, 'execCommand', {
      value: vi.fn().mockReturnValue(false),
      configurable: true,
      writable: true,
    });

    render(<TimezoneConverter onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /copy meeting times to clipboard/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/unable to copy meeting times/i);
    });
    expect(screen.queryByText(/✓ copied!/i)).not.toBeInTheDocument();
  });

  it('handles localStorage QuotaExceededError gracefully on updates', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });

    render(<TimezoneConverter onBack={mockOnBack} />);
    const formatBtn = screen.getByRole('button', { name: /toggle time format/i });
    fireEvent.click(formatBtn);
    expect(formatBtn).toHaveTextContent(/format: 24h/i);
  });

  it('loads preferences from localStorage and sanitizes invalid JSON and invalid IANA strings', () => {
    localStorage.setItem(
      'tools_hub_timezone_prefs',
      JSON.stringify({
        timezones: [DEFAULT_TIMEZONES[0]],
        timeFormat: '24h',
        referenceId: DEFAULT_TIMEZONES[0].id,
      })
    );

    const { unmount } = render(<TimezoneConverter onBack={mockOnBack} />);
    expect(screen.getByRole('button', { name: /toggle time format/i })).toHaveTextContent(/format: 24h/i);
    unmount();

    // Corrupted JSON
    localStorage.setItem('tools_hub_timezone_prefs', '{ invalid json [');
    const { unmount: unmount2 } = render(<TimezoneConverter onBack={mockOnBack} />);
    expect(screen.getByText('Bangalore')).toBeInTheDocument();
    unmount2();

    // Invalid IANA timezone string must not crash Intl.DateTimeFormat
    localStorage.setItem(
      'tools_hub_timezone_prefs',
      JSON.stringify({
        timezones: [{ id: 'bad', city: 'Broken', country: 'Nowhere', iana: 'Invalid/Timezone' }],
        timeFormat: '12h',
        referenceId: 'bad',
      })
    );
    render(<TimezoneConverter onBack={mockOnBack} />);
    expect(screen.getByText('Bangalore')).toBeInTheDocument();
  });

  it('handles clicking outside the search dropdown', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const searchInput = screen.getByPlaceholderText(/add city or timezone/i);
    fireEvent.change(searchInput, { target: { value: 'Sydney' } });

    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);

    fireEvent.mouseDown(document.body);
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('cleans up all active timers and intervals on unmount', async () => {
    vi.useFakeTimers();
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    });

    const { unmount } = render(<TimezoneConverter onBack={mockOnBack} />);

    // Schedule copy feedback timer while mount timer and ticker interval are active
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /copy meeting times to clipboard/i }));
      await Promise.resolve();
    });

    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
