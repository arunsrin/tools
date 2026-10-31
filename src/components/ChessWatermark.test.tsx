import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChessWatermark from './ChessWatermark';
import { CHESS_QUOTES } from './chessQuotes';

describe('ChessWatermark Component & Easter Egg', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the SVG chessboard watermark and knight trigger', () => {
    render(<ChessWatermark />);
    const knightBtn = screen.getByRole('button', { name: /click the chess knight/i });
    expect(knightBtn).toBeInTheDocument();
    expect(knightBtn).toHaveTextContent('♞');
  });

  it('clicking the knight opens a chess quote toast with an authentic quote and author', () => {
    render(<ChessWatermark />);
    const knightBtn = screen.getByRole('button', { name: /click the chess knight/i });

    fireEvent.click(knightBtn);

    const quoteStatus = screen.getByRole('status');
    expect(quoteStatus).toBeInTheDocument();

    // Check that one of the famous authors from CHESS_QUOTES is displayed
    const authors = CHESS_QUOTES.map((q) => q.author);
    const hasAuthor = authors.some((author) => screen.queryByText(new RegExp(author, 'i')));
    expect(hasAuthor).toBe(true);
  });

  it('cycles quotes on subsequent clicks', () => {
    render(<ChessWatermark />);
    const knightBtn = screen.getByRole('button', { name: /click the chess knight/i });

    // First click
    fireEvent.click(knightBtn);
    const firstQuote = screen.getByRole('status').textContent;

    // Second click
    fireEvent.click(knightBtn);
    const secondQuote = screen.getByRole('status').textContent;

    expect(secondQuote).toBeDefined();
    expect(firstQuote).toBeDefined();
  });

  it('allows manually closing the quote popover', () => {
    render(<ChessWatermark />);
    const knightBtn = screen.getByRole('button', { name: /click the chess knight/i });

    fireEvent.click(knightBtn);
    expect(screen.getByRole('status')).toBeInTheDocument();

    const closeBtn = screen.getByRole('button', { name: /close chess quote/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('auto-dismisses the quote popover after timeout', () => {
    render(<ChessWatermark />);
    const knightBtn = screen.getByRole('button', { name: /click the chess knight/i });

    fireEvent.click(knightBtn);
    expect(screen.getByRole('status')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(7500);
    });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
