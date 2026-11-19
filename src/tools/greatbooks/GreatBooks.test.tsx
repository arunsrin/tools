import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import GreatBooks from './GreatBooks';
import { LOCAL_STORAGE_KEY } from './greatBooksHelpers';

describe('GreatBooks Component', { timeout: 35000 }, () => {
  const onBackMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders the header, corpus metadata, and reading journey card', () => {
    render(<GreatBooks onBack={onBackMock} />);

    expect(screen.getByRole('heading', { level: 1, name: /great books/i })).toBeInTheDocument();
    expect(screen.getByText(/137 Foundational Authors/i)).toBeInTheDocument();
    expect(screen.getByText(/263 Curated Works/i)).toBeInTheDocument();
    expect(screen.getByText(/Verified Legal Public Domain Ebooks/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /your reading journey/i })).toBeInTheDocument();
  });

  it('triggers onBack when "Back to Tools Hub" button is clicked', () => {
    render(<GreatBooks onBack={onBackMock} />);

    const backBtn = screen.getByRole('button', { name: /return to tools hub/i });
    fireEvent.click(backBtn);
    expect(onBackMock).toHaveBeenCalledTimes(1);
  });

  it('renders authors in timeline view by default with era section headers', () => {
    render(<GreatBooks onBack={onBackMock} />);

    expect(screen.getByRole('heading', { level: 2, name: /ancient greece & rome/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /19th century/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /20th century/i })).toBeInTheDocument();

    // Homer, Plato, Shakespeare, Melville, Tolstoy exist
    expect(screen.getByRole('heading', { level: 3, name: /^homer$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /^plato$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /^william shakespeare$/i })).toBeInTheDocument();
  });

  it('switches between Timeline View and By Genre View', () => {
    render(<GreatBooks onBack={onBackMock} />);

    const genreViewBtn = screen.getByRole('button', { name: /by genre view/i });
    fireEvent.click(genreViewBtn);

    // Should now display genre section headings
    expect(screen.getByRole('heading', { level: 2, name: /philosophy & ethics/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /epic & poetry/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /drama & theater/i })).toBeInTheDocument();

    // Switch back to timeline
    const timelineBtn = screen.getByRole('button', { name: /timeline view/i });
    fireEvent.click(timelineBtn);
    expect(screen.getByRole('heading', { level: 2, name: /ancient greece & rome/i })).toBeInTheDocument();
  });

  it('filters authors in real time by search query', () => {
    render(<GreatBooks onBack={onBackMock} />);

    const searchInput = screen.getByRole('searchbox', { name: /search authors and books/i });

    // Search for Plato
    fireEvent.change(searchInput, { target: { value: 'Plato' } });
    expect(screen.getByRole('heading', { level: 3, name: /^plato$/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: /^homer$/i })).not.toBeInTheDocument();

    // Clear search using clear button
    const clearBtn = screen.getByRole('button', { name: /clear search text/i });
    fireEvent.click(clearBtn);
    expect(screen.getByRole('heading', { level: 3, name: /^homer$/i })).toBeInTheDocument();
  });

  it('filters by work title (e.g. "Moby Dick")', () => {
    render(<GreatBooks onBack={onBackMock} />);

    const searchInput = screen.getByRole('searchbox', { name: /search authors and books/i });
    fireEvent.change(searchInput, { target: { value: 'Moby Dick' } });

    expect(screen.getByRole('heading', { level: 3, name: /^herman melville$/i })).toBeInTheDocument();
    expect(screen.getByText('Moby Dick')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: /^plato$/i })).not.toBeInTheDocument();
  });

  it('filters using quick filter chips (e.g. Free Ebooks Only, Gateway **, In Copyright)', () => {
    render(<GreatBooks onBack={onBackMock} />);

    // In Copyright filter
    const copyrightChip = screen.getByRole('button', { name: /in copyright/i });
    fireEvent.click(copyrightChip);

    // Solzhenitsyn and Sartre should be shown
    expect(screen.getByRole('heading', { level: 3, name: /jean paul sartre/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /aleksandr i\. solzhenitsyn/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: /^homer$/i })).not.toBeInTheDocument();

    // Gateway (**) filter
    const gatewayChip = screen.getByRole('button', { name: /gateway \(ggb \*\*\)/i });
    fireEvent.click(gatewayChip);

    // Epicurus, Cicero, Plutarch are Gateway authors
    expect(screen.getByRole('heading', { level: 3, name: /^epicurus$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /^cicero$/i })).toBeInTheDocument();
  });

  it('filters by Era dropdown selector', () => {
    render(<GreatBooks onBack={onBackMock} />);

    const eraSelect = screen.getByLabelText(/era:/i);
    fireEvent.change(eraSelect, { target: { value: 'Renaissance & Reformation' } });

    // Shakespeare, Machiavelli should appear
    expect(screen.getByRole('heading', { level: 3, name: /^william shakespeare$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: /^niccolò machiavelli$/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: /^homer$/i })).not.toBeInTheDocument();
  });

  it('filters by Genre dropdown selector', () => {
    render(<GreatBooks onBack={onBackMock} />);

    const genreSelect = screen.getByLabelText(/genre:/i);
    fireEvent.change(genreSelect, { target: { value: 'Drama & Theater' } });

    expect(screen.getByRole('heading', { level: 3, name: /^william shakespeare$/i })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 3, name: /^plato$/i })).not.toBeInTheDocument();
  });

  it('updates reading tracker and persists to localStorage', () => {
    render(<GreatBooks onBack={onBackMock} />);

    // Select status for Homer (#1)
    const homerStatusSelect = screen.getByLabelText(/reading status for homer/i);
    expect(homerStatusSelect).toHaveValue('none');

    fireEvent.change(homerStatusSelect, { target: { value: 'completed' } });
    expect(homerStatusSelect).toHaveValue('completed');

    // Progress percentage should update in dashboard
    expect(screen.getByText(/of 137 authors read/i)).toBeInTheDocument();

    // Verify localStorage
    const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    expect(stored['1']).toBe('completed');
  });

  it('shows verified ManyBooks download links with formats for public domain works', () => {
    render(<GreatBooks onBack={onBackMock} />);

    // Homer's Iliad link
    const iliadLink = screen.getByRole('link', { name: /download or read iliad/i });
    expect(iliadLink).toHaveAttribute('href', 'https://manybooks.net/titles/homer2238222382-8.html');
    expect(iliadLink).toHaveAttribute('target', '_blank');
    expect(iliadLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders "In Copyright · Reference Only" badge for 20th C. copyrighted books', () => {
    render(<GreatBooks onBack={onBackMock} />);

    const searchInput = screen.getByRole('searchbox', { name: /search authors and books/i });
    fireEvent.change(searchInput, { target: { value: 'Solzhenitsyn' } });

    const copyrightBadges = screen.getAllByText(/in copyright · reference only/i);
    expect(copyrightBadges.length).toBeGreaterThan(0);
  });

  it('renders empty state when search finds no results and clears with button', () => {
    render(<GreatBooks onBack={onBackMock} />);

    const searchInput = screen.getByRole('searchbox', { name: /search authors and books/i });
    fireEvent.change(searchInput, { target: { value: 'nonexistent-ancient-author-xyz' } });

    expect(screen.getByText(/no authors or works found/i)).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /clear all filters/i });
    fireEvent.click(resetBtn);

    expect(screen.getByRole('heading', { level: 3, name: /^homer$/i })).toBeInTheDocument();
  });
});
