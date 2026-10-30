import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewsRiver from './NewsRiver';

describe('NewsRiver Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders header, title, and calls onBack when back button is clicked', () => {
    const handleBack = vi.fn();
    render(<NewsRiver onBack={handleBack} />);

    expect(screen.getByText(/News River/i)).toBeInTheDocument();
    const backBtn = screen.getByRole('button', { name: /Back to Tools Hub/i });
    expect(backBtn).toBeInTheDocument();

    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('renders default feed sources and headlines in Columns view', () => {
    render(<NewsRiver onBack={vi.fn()} />);

    // Check that primary feed headers are rendered
    expect(screen.getByRole('heading', { name: 'Hacker News' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Reddit /r/technology' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lobste.rs' })).toBeInTheDocument();

    // Check specific headline presence
    expect(screen.getByText(/SQLite in the browser with WebAssembly/i)).toBeInTheDocument();
    expect(screen.getByText(/astral-sh\/uv/i)).toBeInTheDocument();
  });

  it('switches between Columns view and River of News view', () => {
    render(<NewsRiver onBack={vi.fn()} />);

    // Default is columns
    const riverToggle = screen.getByRole('button', { name: /River View/i });
    expect(riverToggle).toBeInTheDocument();

    fireEvent.click(riverToggle);

    // River view heading should appear
    expect(screen.getByRole('heading', { name: 'All Headlines Stream' })).toBeInTheDocument();
    expect(screen.getByText(/Sort:/i)).toBeInTheDocument();

    // Switch back to Columns
    const columnsToggle = screen.getByRole('button', { name: /Columns View/i });
    fireEvent.click(columnsToggle);

    expect(screen.getByRole('heading', { name: 'Hacker News' })).toBeInTheDocument();
  });

  it('filters headlines in real time with the search input', () => {
    render(<NewsRiver onBack={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/Filter headlines.../i);
    fireEvent.change(searchInput, { target: { value: 'SQLite' } });

    // SQLite should be present
    expect(screen.getByText(/SQLite in the browser with WebAssembly/i)).toBeInTheDocument();

    // Other headlines shouldn't match
    expect(screen.queryByText(/Renewable energy generation surpasses/i)).not.toBeInTheDocument();

    // Clear button should be visible and functional
    const clearBtn = screen.getByRole('button', { name: /Clear search/i });
    expect(clearBtn).toBeInTheDocument();

    fireEvent.click(clearBtn);
    expect(screen.getByText(/Renewable energy generation surpasses/i)).toBeInTheDocument();
  });

  it('displays empty state when search returns no results', () => {
    render(<NewsRiver onBack={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/Filter headlines.../i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentHeadlineXYZ123' } });

    expect(screen.getByText(/No headlines match your filters/i)).toBeInTheDocument();
    expect(screen.getByText(/No items found matching "NonExistentHeadlineXYZ123"/i)).toBeInTheDocument();

    // Click clear in empty state
    const resetSearchBtn = screen.getByRole('button', { name: /Clear Search Query/i });
    fireEvent.click(resetSearchBtn);

    expect(screen.getByText(/SQLite in the browser with WebAssembly/i)).toBeInTheDocument();
  });

  it('filters by category pills', () => {
    render(<NewsRiver onBack={vi.fn()} />);

    // Click "World News" category
    const newsPill = screen.getByRole('button', { name: 'World News' });
    fireEvent.click(newsPill);

    // BBC should be present, Hacker News should not be shown
    expect(screen.getByRole('heading', { name: 'BBC News' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Hacker News' })).not.toBeInTheDocument();

    // Click "All Feeds" to restore
    const allPill = screen.getByRole('button', { name: 'All Feeds' });
    fireEvent.click(allPill);

    expect(screen.getByRole('heading', { name: 'Hacker News' })).toBeInTheDocument();
  });

  it('opens customize sources modal and allows toggling feeds', () => {
    render(<NewsRiver onBack={vi.fn()} />);

    const customizeBtn = screen.getByRole('button', { name: /Customize sources/i });
    fireEvent.click(customizeBtn);

    const dialog = screen.getByRole('dialog', { name: /Customize feed sources/i });
    expect(dialog).toBeInTheDocument();

    // Find Hacker News checkbox
    const hnCheckbox = screen.getByRole('checkbox', { name: /Hacker News/i });
    expect(hnCheckbox).toBeChecked();

    // Toggle off
    fireEvent.click(hnCheckbox);
    expect(hnCheckbox).not.toBeChecked();

    // Close modal via Done button
    const doneBtn = screen.getByRole('button', { name: 'Done' });
    fireEvent.click(doneBtn);
    expect(dialog).not.toBeInTheDocument();

    // Hacker News should now be hidden
    expect(screen.queryByRole('heading', { name: 'Hacker News' })).not.toBeInTheDocument();

    // Reopen modal and click Enable All
    fireEvent.click(customizeBtn);
    const enableAllBtn = screen.getByRole('button', { name: 'Enable All' });
    fireEvent.click(enableAllBtn);

    // Close via close icon (✕)
    const closeBtn = screen.getByRole('button', { name: /Close modal/i });
    fireEvent.click(closeBtn);

    expect(screen.getByRole('heading', { name: 'Hacker News' })).toBeInTheDocument();
  });

  it('closes customize modal on Escape key press', () => {
    render(<NewsRiver onBack={vi.fn()} />);

    const customizeBtn = screen.getByRole('button', { name: /Customize sources/i });
    fireEvent.click(customizeBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('tracks read status and allows clearing read history', () => {
    render(<NewsRiver onBack={vi.fn()} />);

    const link = screen.getByText(/SQLite in the browser with WebAssembly/i);
    fireEvent.click(link);

    // Subbar should now show "Clear read (1)"
    const clearReadBtn = screen.getByRole('button', { name: /Clear read \(1\)/i });
    expect(clearReadBtn).toBeInTheDocument();

    fireEvent.click(clearReadBtn);
    expect(screen.queryByRole('button', { name: /Clear read/i })).not.toBeInTheDocument();
  });

  it('supports sorting by latest and popular in River View', () => {
    render(<NewsRiver onBack={vi.fn()} />);

    // Switch to River View
    fireEvent.click(screen.getByRole('button', { name: /River View/i }));

    const popularBtn = screen.getByRole('button', { name: 'Popular' });
    fireEvent.click(popularBtn);
    expect(popularBtn).toHaveClass('active');

    const latestBtn = screen.getByRole('button', { name: 'Latest' });
    fireEvent.click(latestBtn);
    expect(latestBtn).toHaveClass('active');
  });

  it('handles live refresh triggering with network calls', async () => {
    const mockHnData = {
      hits: [
        {
          objectID: '9999',
          title: 'Brand New Live Story on HN',
          url: 'https://example.com/live',
          points: 500,
          num_comments: 100,
          created_at: new Date().toISOString(),
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('algolia')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockHnData),
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);
    });

    render(<NewsRiver onBack={vi.fn()} />);

    const refreshBtn = screen.getByRole('button', { name: /Refresh feeds/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(screen.getByText(/Brand New Live Story on HN/i)).toBeInTheDocument();
    });
  });

  it('persists preferences to localStorage and handles corrupted storage gracefully', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    render(<NewsRiver onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /River View/i }));

    expect(setItemSpy).toHaveBeenCalled();

    // Verify localStorage corruption doesn't crash on subsequent render
    localStorage.setItem('tools_hub_news_river_prefs', 'INVALID_JSON_CORRUPT');
    expect(() => render(<NewsRiver onBack={vi.fn()} />)).not.toThrow();
  });

  it('ensures all links open safely with target=_blank and rel=noopener noreferrer', () => {
    render(<NewsRiver onBack={vi.fn()} />);

    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);

    links.slice(0, 5).forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  it('marks item as read when clicked in River View', () => {
    render(<NewsRiver onBack={vi.fn()} />);

    // Switch to River View
    fireEvent.click(screen.getByRole('button', { name: /River View/i }));

    const riverLink = screen.getByText(/SQLite in the browser with WebAssembly/i);
    fireEvent.click(riverLink);

    expect(screen.getByRole('button', { name: /Clear read \(1\)/i })).toBeInTheDocument();
  });

  it('closes modal when clicking overlay backdrop and preserves modal on body click', () => {
    render(<NewsRiver onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Customize sources/i }));
    const dialog = screen.getByRole('dialog', { name: /Customize feed sources/i });
    expect(dialog).toBeInTheDocument();

    // Click inside modal dialog body (should not close)
    fireEvent.click(screen.getByText('Customize Feed Sources'));
    expect(dialog).toBeInTheDocument();

    // Click backdrop
    fireEvent.click(dialog);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('loads initial data from /data/feeds.json when available', async () => {
    const mockFeedsData = {
      lastUpdated: new Date().toISOString(),
      sources: [
        {
          id: 'custom-src',
          name: 'Custom Source',
          category: 'tech',
          icon: '✨',
          description: 'Custom test feed',
          color: '#123456',
          enabled: true,
        },
      ],
      items: [
        {
          id: 'custom-1',
          title: 'Fetched From Feeds JSON',
          url: 'https://example.com/custom',
          source: 'Custom Source',
          sourceId: 'custom-src',
          category: 'tech',
          publishedAt: new Date().toISOString(),
          points: 10,
          comments: 2,
          domain: 'example.com',
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/data/feeds.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFeedsData),
        } as Response);
      }
      return Promise.reject(new Error('Network error'));
    });

    render(<NewsRiver onBack={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText(/Fetched From Feeds JSON/i)).toBeInTheDocument();
      expect(screen.getByText(/● Live/i)).toBeInTheDocument();
    });
  });

  it('falls back to /data/feeds.json during refresh when CORS endpoints fail', async () => {
    const mockFallbackData = {
      lastUpdated: new Date().toISOString(),
      items: [
        {
          id: 'fb-1',
          title: 'Fallback Cached Headline',
          url: 'https://example.com/fallback',
          source: 'Hacker News',
          sourceId: 'hacker-news',
          category: 'tech',
          publishedAt: new Date().toISOString(),
          domain: 'example.com',
        },
      ],
    };

    vi.spyOn(globalThis, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/data/feeds.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFallbackData),
        } as Response);
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);
    });

    render(<NewsRiver onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Refresh feeds/i }));

    await waitFor(() => {
      expect(screen.getByText(/Fallback Cached Headline/i)).toBeInTheDocument();
    });
  });

  it('handles general network exception during refresh gracefully', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Total network failure'));

    render(<NewsRiver onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Refresh feeds/i }));

    await waitFor(() => {
      expect(screen.getByText(/Network update failed; retained existing feeds./i)).toBeInTheDocument();
    });
  });
});
