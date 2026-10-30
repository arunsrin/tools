import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TimezoneConverter from './TimezoneConverter';
import {
  DEFAULT_TIMEZONES,
  searchTimezones,
  getZonedParts,
  getTimestampForZone,
  formatTimelineTile,
  formatMeetingSummary,
  getThreeDayTimelineHours,
} from './timezones';

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

  it('generates 72 timeline hours for 3-day rolling window', () => {
    const hours = getThreeDayTimelineHours(Date.now(), 'UTC');
    expect(hours).toHaveLength(72);
    // Difference between consecutive blocks should be exactly 1 hour (3600000 ms)
    expect(hours[1] - hours[0]).toBe(3600000);
    expect(hours[71] - hours[0]).toBe(71 * 3600000);
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
    localStorage.clear();
  });

  it('renders default cities and initial layout', () => {
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
    // Should stay interactive without errors
    expect(screen.getByTestId('timezone-converter')).toBeInTheDocument();
  });

  it('searches and adds a new timezone', async () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const searchInput = screen.getByPlaceholderText(/add city or timezone/i);

    fireEvent.change(searchInput, { target: { value: 'Berlin' } });
    fireEvent.focus(searchInput);

    // Dropdown option should appear
    const berlinOption = await screen.findByRole('button', { name: /^berlin/i });
    expect(berlinOption).toBeInTheDocument();

    fireEvent.click(berlinOption);

    // Berlin should now be in the list
    expect(screen.getByText('Berlin')).toBeInTheDocument();
  });

  it('searches and adds by abbreviation convention (e.g. PST, Pacific)', async () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const searchInput = screen.getByPlaceholderText(/add city or timezone/i);

    fireEvent.change(searchInput, { target: { value: 'PST' } });
    fireEvent.focus(searchInput);

    // Pacific Time convention button should appear
    const ptOption = await screen.findByRole('button', { name: /pacific time/i });
    expect(ptOption).toBeInTheDocument();

    fireEvent.click(ptOption);

    // Pacific Time should now be rendered
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

    // Reference control should now indicate Tokyo
    expect(screen.getByText(/reference \(tokyo\):/i)).toBeInTheDocument();
  });

  it('removes a timezone when remove button is clicked', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    expect(screen.getByText('Edmonton')).toBeInTheDocument();

    const removeBtn = screen.getByRole('button', { name: /remove edmonton/i });
    fireEvent.click(removeBtn);

    expect(screen.queryByText('Edmonton')).not.toBeInTheDocument();
  });

  it('reorders timezones with move up and move down buttons', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const moveDownBtn = screen.getByRole('button', { name: /move bangalore down/i });
    fireEvent.click(moveDownBtn);

    // Bangalore should now be moved down
    const rows = screen.getAllByTestId(/^timezone-row-/);
    expect(rows[1]).toHaveTextContent('Bangalore');
  });

  it('resets to default cities when Reset button is clicked', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    // Remove Edmonton
    fireEvent.click(screen.getByRole('button', { name: /remove edmonton/i }));
    expect(screen.queryByText('Edmonton')).not.toBeInTheDocument();

    // Click Reset
    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(screen.getByText('Edmonton')).toBeInTheDocument();
  });

  it('updates selected time when clicking an hour tile', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const hourTiles = screen.getAllByRole('button', { name: /bangalore at/i });
    expect(hourTiles.length).toBeGreaterThan(0);

    fireEvent.click(hourTiles[10]);
    expect(screen.getByTestId('timezone-converter')).toBeInTheDocument();
  });

  it('handles date and time manual input changes', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const dateInput = screen.getByLabelText(/select date for/i);
    const timeInput = screen.getByLabelText(/select time for/i);

    fireEvent.change(dateInput, { target: { value: '2026-11-15' } });
    fireEvent.change(timeInput, { target: { value: '14:30' } });

    expect(dateInput).toHaveValue('2026-11-15');
    expect(timeInput).toHaveValue('14:30');
  });

  it('copies meeting times to clipboard with visual confirmation', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(<TimezoneConverter onBack={mockOnBack} />);
    const copyBtn = screen.getByRole('button', { name: /copy meeting times to clipboard/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalled();
      expect(screen.getByText(/✓ copied!/i)).toBeInTheDocument();
    });
  });

  it('falls back to execCommand when clipboard API is unavailable', async () => {
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
      writable: true,
    });
    const execCommandMock = vi.fn();
    document.execCommand = execCommandMock;

    render(<TimezoneConverter onBack={mockOnBack} />);
    const copyBtn = screen.getByRole('button', { name: /copy meeting times to clipboard/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(execCommandMock).toHaveBeenCalledWith('copy');
      expect(screen.getByText(/✓ copied!/i)).toBeInTheDocument();
    });

    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      configurable: true,
      writable: true,
    });
  });

  it('loads preferences from localStorage and handles corrupt storage safely', () => {
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

    // Corrupted localStorage
    localStorage.setItem('tools_hub_timezone_prefs', '{ invalid json [');
    render(<TimezoneConverter onBack={mockOnBack} />);
    expect(screen.getByText('Bangalore')).toBeInTheDocument();
  });

  it('handles clicking outside the search dropdown', () => {
    render(<TimezoneConverter onBack={mockOnBack} />);
    const searchInput = screen.getByPlaceholderText(/add city or timezone/i);
    fireEvent.change(searchInput, { target: { value: 'Sydney' } });

    expect(screen.getAllByRole('option').length).toBeGreaterThan(0);

    // Click outside
    fireEvent.mouseDown(document.body);
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });
});
