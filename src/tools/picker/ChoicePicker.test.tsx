import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ChoicePicker from './ChoicePicker';

describe('ChoicePicker Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders header, navigation tabs, and back button', () => {
    const handleBack = vi.fn();
    render(<ChoicePicker onBack={handleBack} />);

    expect(screen.getByRole('heading', { level: 1, name: /random picker & decision maker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /multiple choice/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /coin toss/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /dice roll/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  describe('Multiple Choice Mode', () => {
    it('switches between spinning wheel and card draw views', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      // Default is wheel view
      expect(screen.getByRole('button', { name: /spinning wheel/i })).toHaveClass('active');
      expect(screen.getByRole('img', { name: /spinning wheel/i })).toBeInTheDocument();

      // Switch to card draw
      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));
      expect(screen.getByRole('button', { name: /instant draw/i })).toHaveClass('active');
      expect(screen.getByText(/click pick to reveal/i)).toBeInTheDocument();
    });

    it('applies quick presets and updates the choices list', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      const yesNoBtn = screen.getByRole('button', { name: /yes \/ no \/ maybe/i });
      fireEvent.click(yesNoBtn);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Yes\nNo\nMaybe');
    });

    it('picks a winner in wheel view and announces it', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      // Preset with known options
      fireEvent.click(screen.getByRole('button', { name: /yes \/ no \/ maybe/i }));

      const pickBtn = screen.getByRole('button', { name: /pick a winner/i });
      fireEvent.click(pickBtn);

      expect(screen.getByText(/choosing.../i)).toBeInTheDocument();

      // Fast-forward wheel spin duration (3600ms)
      act(() => {
        vi.advanceTimersByTime(3600);
      });

      // Winner banner should appear
      const winnerBanner = screen.getByRole('status');
      expect(winnerBanner).toBeInTheDocument();
      expect(winnerBanner).toHaveTextContent(/winner/i);

      // Check history
      expect(screen.getByRole('heading', { level: 4, name: /recent picks/i })).toBeInTheDocument();
      expect(screen.queryByText(/no picks yet/i)).not.toBeInTheDocument();
    });

    it('picks a winner in card draw view', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));
      fireEvent.click(screen.getByRole('button', { name: /yes \/ no \/ maybe/i }));

      const pickBtn = screen.getByRole('button', { name: /pick a winner/i });
      fireEvent.click(pickBtn);

      // Fast-forward card shuffle duration (700ms)
      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('supports elimination mode (raffle) and pool reset', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      // Load 3 items
      fireEvent.click(screen.getByRole('button', { name: /yes \/ no \/ maybe/i }));

      // Enable elimination mode
      const elimCheckbox = screen.getByRole('checkbox', { name: /eliminate picked option/i });
      fireEvent.click(elimCheckbox);
      expect(elimCheckbox).toBeChecked();

      // Check initial pool count in elimination bar
      const elimBar = screen.getByText(/pool remaining:/i).closest('.elimination-bar');
      expect(elimBar).toHaveTextContent('Pool Remaining: 3');

      // Switch to card draw for faster test timer (700ms)
      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));

      // Pick winner
      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));
      act(() => {
        vi.advanceTimersByTime(700);
      });

      // Active pool should now have 2 remaining, 1 eliminated
      expect(elimBar).toHaveTextContent('Pool Remaining: 2');
      expect(elimBar).toHaveTextContent('Eliminated: 1');

      // Click "Reset Pool"
      const resetBtn = screen.getByRole('button', { name: /reset elimination pool/i });
      fireEvent.click(resetBtn);

      expect(elimBar).toHaveTextContent('Pool Remaining: 3');
      expect(screen.queryByRole('button', { name: /reset elimination pool/i })).not.toBeInTheDocument();
    });

    it('clears pick history when clear button is clicked', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));
      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));
      act(() => {
        vi.advanceTimersByTime(700);
      });

      const clearBtn = screen.getByRole('button', { name: /clear pick history/i });
      fireEvent.click(clearBtn);

      expect(screen.getByText(/no picks yet/i)).toBeInTheDocument();
    });

    it('handles empty choices gracefully', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   \n  \n' } });

      const pickBtn = screen.getByRole('button', { name: /pick a winner/i });
      expect(pickBtn).toBeDisabled();
      expect(screen.getByText(/no items in pool/i)).toBeInTheDocument();
    });

    it('parses comma-delimited custom choices', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Apple, Banana, Orange' } });

      const elimCheckbox = screen.getByRole('checkbox', { name: /eliminate picked option/i });
      fireEvent.click(elimCheckbox);

      const elimBar = screen.getByText(/pool remaining:/i).closest('.elimination-bar');
      expect(elimBar).toHaveTextContent('Pool Remaining: 3');
    });

    it('eliminates only a single ticket when duplicate items exist in pool', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Alice\nAlice\nBob' } });

      const elimCheckbox = screen.getByRole('checkbox', { name: /eliminate picked option/i });
      fireEvent.click(elimCheckbox);

      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));
      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));
      act(() => {
        vi.advanceTimersByTime(700);
      });

      const elimBar = screen.getByText(/pool remaining:/i).closest('.elimination-bar');
      expect(elimBar).toHaveTextContent('Pool Remaining: 2');
      expect(elimBar).toHaveTextContent('Eliminated: 1');
    });
  });

  describe('Coin Toss Mode', () => {
    it('switches to coin toss mode and renders initial statistics', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /coin toss/i }));

      expect(screen.getByRole('button', { name: /flip coin/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /flip statistics/i })).toBeInTheDocument();
      expect(screen.getByText(/total flips/i)).toBeInTheDocument();
    });

    it('flips coin and updates statistics and outcome banner', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /coin toss/i }));
      const flipBtn = screen.getByRole('button', { name: /flip coin/i });

      fireEvent.click(flipBtn);
      expect(screen.getByText(/flipping.../i)).toBeInTheDocument();

      // Fast-forward coin flip animation (1200ms)
      act(() => {
        vi.advanceTimersByTime(1200);
      });

      expect(screen.getByText(/outcome:/i)).toBeInTheDocument();
      expect(screen.getByText('Total Flips').closest('.stat-box')).toHaveTextContent('1');
    });

    it('resets coin statistics when reset button is clicked', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /coin toss/i }));

      // Flip once
      fireEvent.click(screen.getByRole('button', { name: /flip coin/i }));
      act(() => {
        vi.advanceTimersByTime(1200);
      });

      const resetBtn = screen.getByRole('button', { name: /reset coin statistics/i });
      fireEvent.click(resetBtn);

      expect(screen.getByText(/current streak/i)).toBeInTheDocument();
      expect(screen.getByText(/none/i)).toBeInTheDocument();
    });
  });

  describe('Dice Roll Mode', () => {
    it('switches to dice mode and changes number of dice', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /dice roll/i }));

      expect(screen.getByRole('button', { name: /roll dice/i })).toBeInTheDocument();
      expect(screen.getByText(/sum total:/i)).toBeInTheDocument();

      // Select 4 dice
      const fourBtn = screen.getByRole('button', { name: '4' });
      fireEvent.click(fourBtn);
      expect(fourBtn).toHaveClass('active');

      // 4 dice elements should be rendered
      const diceElements = screen.getAllByLabelText(/die showing/i);
      expect(diceElements).toHaveLength(4);
    });

    it('rolls dice, calculates total sum, and updates roll history', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /dice roll/i }));
      const rollBtn = screen.getByRole('button', { name: /roll dice/i });

      fireEvent.click(rollBtn);
      expect(screen.getByText(/rolling.../i)).toBeInTheDocument();

      // Fast-forward roll duration (650ms)
      act(() => {
        vi.advanceTimersByTime(650);
      });

      expect(screen.queryByText(/no rolls recorded yet/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear dice history/i })).toBeInTheDocument();

      // Clear history
      fireEvent.click(screen.getByRole('button', { name: /clear dice history/i }));
      expect(screen.getByText(/no rolls recorded yet/i)).toBeInTheDocument();
    });
  });

  describe('Storage Resilience', () => {
    it('gracefully handles localStorage throwing errors', () => {
      const mockSetItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      render(<ChoicePicker onBack={vi.fn()} />);

      // Switch to instant draw and pick
      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));
      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));

      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
      mockSetItem.mockRestore();
    });
  });

  describe('Unmount & Cleanup Discipline', () => {
    it('cancels pending animation timeouts cleanly when unmounted early', () => {
      const { unmount } = render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /coin toss/i }));
      fireEvent.click(screen.getByRole('button', { name: /flip coin/i }));

      // Unmount while flip is in flight
      unmount();

      act(() => {
        vi.advanceTimersByTime(2000);
      });
      // Should cleanly finish without throwing or warnings
    });
  });
});
