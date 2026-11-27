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

    expect(
      screen.getByRole('heading', { level: 1, name: /random picker & decision maker/i })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();

    expect(screen.getByRole('tab', { name: /multiple choice/i })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('tab', { name: /coin toss/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /dice roll/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  describe('Multiple Choice Mode', () => {
    it('switches between spinning wheel and card draw views', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      const wheelBtn = screen.getByRole('button', { name: /spinning wheel/i });
      expect(wheelBtn).toHaveClass('is-selected');
      expect(wheelBtn).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('img', { name: /spinning wheel/i })).toBeInTheDocument();

      const drawBtn = screen.getByRole('button', { name: /instant draw/i });
      fireEvent.click(drawBtn);
      expect(drawBtn).toHaveClass('is-selected');
      expect(drawBtn).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText(/click pick to reveal/i)).toBeInTheDocument();
    });

    it('applies quick presets and updates the choices list', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Pizza\nNorth Indian\nSouth Indian\nSandwiches\nChaat\nChinese');

      fireEvent.click(screen.getByRole('button', { name: /yes \/ no \/ maybe/i }));
      expect(textarea.value).toBe('Yes\nNo\nMaybe');

      fireEvent.click(screen.getByRole('button', { name: /who goes first/i }));
      expect(textarea.value).toBe('Asha\nSiddharth\nAmma\nAppa');
    });

    it('picks a winner in wheel view and announces it', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /yes \/ no \/ maybe/i }));
      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));

      expect(screen.getByText(/choosing.../i)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(3600);
      });

      const winnerBanner = screen.getByRole('status');
      expect(winnerBanner).toBeInTheDocument();
      expect(winnerBanner).toHaveTextContent(/winner/i);

      expect(screen.getByRole('heading', { level: 4, name: /recent picks/i })).toBeInTheDocument();
      expect(screen.queryByText(/no picks yet/i)).not.toBeInTheDocument();
    });

    it('renders and picks cleanly with a single-slice wheel', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'OnlyOneOption' } });

      expect(screen.getByRole('img', { name: /single option wheel/i })).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));

      act(() => {
        vi.advanceTimersByTime(3600);
      });

      expect(screen.getByRole('status')).toHaveTextContent('OnlyOneOption');
    });

    it('picks a winner in card draw view', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));
      fireEvent.click(screen.getByRole('button', { name: /yes \/ no \/ maybe/i }));

      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));

      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('supports elimination mode (raffle), full pool exhaustion, and pool reset', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /yes \/ no \/ maybe/i }));

      const elimCheckbox = screen.getByRole('checkbox', { name: /eliminate picked option/i });
      fireEvent.click(elimCheckbox);
      expect(elimCheckbox).toBeChecked();

      const elimBar = screen.getByText(/pool remaining:/i).closest('.picker-elimination-bar');
      expect(elimBar).toHaveTextContent('Pool Remaining: 3');

      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));

      // Pick all 3 items until pool is exhausted
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));
        act(() => {
          vi.advanceTimersByTime(700);
        });
      }

      expect(elimBar).toHaveTextContent('Pool Remaining: 0');
      expect(elimBar).toHaveTextContent('Eliminated: 3');
      expect(screen.getByRole('button', { name: /pick a winner/i })).toBeDisabled();

      // Switch back to wheel to verify empty wheel state
      fireEvent.click(screen.getByRole('button', { name: /spinning wheel/i }));
      expect(screen.getByText(/no items in pool/i)).toBeInTheDocument();

      // Reset Pool restores all 3
      const resetBtn = screen.getByRole('button', { name: /reset elimination pool/i });
      fireEvent.click(resetBtn);

      expect(elimBar).toHaveTextContent('Pool Remaining: 3');
      expect(screen.queryByRole('button', { name: /reset elimination pool/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /pick a winner/i })).not.toBeDisabled();
    });

    it('disables Reset Pool, eliminateMode toggle, presets, and view switch mid-spin', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /yes \/ no \/ maybe/i }));
      const elimCheckbox = screen.getByRole('checkbox', { name: /eliminate picked option/i });
      fireEvent.click(elimCheckbox);

      // Eliminate 1 item so Reset Pool appears
      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));
      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));
      act(() => {
        vi.advanceTimersByTime(700);
      });

      // Start second spin and verify mid-spin guards
      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));
      expect(elimCheckbox).toBeDisabled();
      expect(screen.getByRole('button', { name: /reset elimination pool/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /what to eat/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /spinning wheel/i })).toBeDisabled();
      expect(screen.getByRole('textbox')).toBeDisabled();

      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(elimCheckbox).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /reset elimination pool/i })).not.toBeDisabled();
    });

    it('clears pick history when clear button is clicked', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));
      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));
      act(() => {
        vi.advanceTimersByTime(700);
      });

      fireEvent.click(screen.getByRole('button', { name: /clear pick history/i }));
      expect(screen.getByText(/no picks yet/i)).toBeInTheDocument();
    });

    it('handles empty choices gracefully', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: '   \n  \n' } });

      expect(screen.getByRole('button', { name: /pick a winner/i })).toBeDisabled();
      expect(screen.getByText(/no items in pool/i)).toBeInTheDocument();
    });

    it('parses comma-delimited custom choices', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      const textarea = screen.getByRole('textbox');
      fireEvent.change(textarea, { target: { value: 'Apple, Banana, Orange' } });

      const elimCheckbox = screen.getByRole('checkbox', { name: /eliminate picked option/i });
      fireEvent.click(elimCheckbox);

      const elimBar = screen.getByText(/pool remaining:/i).closest('.picker-elimination-bar');
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

      const elimBar = screen.getByText(/pool remaining:/i).closest('.picker-elimination-bar');
      expect(elimBar).toHaveTextContent('Pool Remaining: 2');
      expect(elimBar).toHaveTextContent('Eliminated: 1');
    });
  });

  describe('Coin Toss Mode', () => {
    it('switches to coin toss mode and renders initial statistics', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('tab', { name: /coin toss/i }));

      expect(screen.getByRole('button', { name: /flip coin/i })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3, name: /flip statistics/i })).toBeInTheDocument();
      expect(screen.getByText(/total flips/i)).toBeInTheDocument();
    });

    it('flips coin and updates statistics and outcome banner', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('tab', { name: /coin toss/i }));
      fireEvent.click(screen.getByRole('button', { name: /flip coin/i }));
      expect(screen.getByText(/flipping.../i)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1200);
      });

      expect(screen.getByText(/outcome:/i)).toBeInTheDocument();
      expect(screen.getByText('Total Flips').closest('.picker-stat-box')).toHaveTextContent('1');
    });

    it('resets coin statistics when reset button is clicked', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('tab', { name: /coin toss/i }));
      fireEvent.click(screen.getByRole('button', { name: /flip coin/i }));
      act(() => {
        vi.advanceTimersByTime(1200);
      });

      fireEvent.click(screen.getByRole('button', { name: /reset coin statistics/i }));
      expect(screen.getByText(/current streak/i)).toBeInTheDocument();
      expect(screen.getByText(/none/i)).toBeInTheDocument();
    });
  });

  describe('Dice Roll Mode', () => {
    it('switches to dice mode and changes number of dice', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('tab', { name: /dice roll/i }));

      expect(screen.getByRole('button', { name: /roll dice/i })).toBeInTheDocument();
      expect(screen.getByText(/sum total:/i)).toBeInTheDocument();

      const fourBtn = screen.getByRole('button', { name: '4' });
      fireEvent.click(fourBtn);
      expect(fourBtn).toHaveClass('active');

      expect(screen.getAllByLabelText(/die showing/i)).toHaveLength(4);
    });

    it('rolls dice, calculates total sum, and updates roll history', () => {
      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('tab', { name: /dice roll/i }));
      fireEvent.click(screen.getByRole('button', { name: /roll dice/i }));
      expect(screen.getByText(/rolling.../i)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(650);
      });

      expect(screen.queryByText(/no rolls recorded yet/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear dice history/i })).toBeInTheDocument();

      fireEvent.click(screen.getByRole('button', { name: /clear dice history/i }));
      expect(screen.getByText(/no rolls recorded yet/i)).toBeInTheDocument();
    });
  });

  describe('Storage Resilience & Shape Validation', () => {
    it('gracefully handles localStorage throwing errors', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      render(<ChoicePicker onBack={vi.fn()} />);

      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));
      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));

      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('ignores corrupt JSON and malformed shapes across all persisted keys', () => {
      localStorage.setItem('picker_coin_stats', '{bad-json');
      localStorage.setItem('picker_dice_history', JSON.stringify([{ bad: true }, 123, null]));
      localStorage.setItem('picker_choice_history', JSON.stringify([{ id: 1, item: null }]));

      const { unmount } = render(<ChoicePicker onBack={vi.fn()} />);
      expect(screen.getByText(/no picks yet/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole('tab', { name: /coin toss/i }));
      expect(screen.getByText('Total Flips').closest('.picker-stat-box')).toHaveTextContent('0');

      fireEvent.click(screen.getByRole('tab', { name: /dice roll/i }));
      expect(screen.getByText(/no rolls recorded yet/i)).toBeInTheDocument();
      unmount();

      // Partial coin stats object with invalid streak/counts should fall back cleanly
      localStorage.setItem(
        'picker_coin_stats',
        JSON.stringify({ heads: 'oops', tails: -1, total: 5, streak: { side: 'edge', count: 2 } })
      );
      localStorage.setItem('picker_dice_history', JSON.stringify('not-an-array'));
      localStorage.setItem('picker_choice_history', JSON.stringify('not-an-array'));

      render(<ChoicePicker onBack={vi.fn()} />);
      fireEvent.click(screen.getByRole('tab', { name: /coin toss/i }));
      expect(screen.getByText('Total Flips').closest('.picker-stat-box')).toHaveTextContent('0');
    });
  });

  describe('Confetti Canvas & Unmount Cleanup Discipline', () => {
    it('handles null canvas 2d context safely when picking a winner', () => {
      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

      render(<ChoicePicker onBack={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));
      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));

      act(() => {
        vi.advanceTimersByTime(700);
      });

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('renders confetti frames and stops cleanly once particles fade', () => {
      const mockCtx = {
        clearRect: vi.fn(),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        fillRect: vi.fn(),
        globalAlpha: 1,
        fillStyle: '',
      } as unknown as CanvasRenderingContext2D;

      vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(mockCtx);

      render(<ChoicePicker onBack={vi.fn()} />);
      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));
      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));

      act(() => {
        vi.advanceTimersByTime(700);
      });

      // Advance long enough for 67+ animation frames (~1200ms+) so particles fade out
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.clearRect).toHaveBeenCalled();
    });

    it('cancels pending timers and animation frames cleanly when unmounted early', () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
      const { unmount } = render(<ChoicePicker onBack={vi.fn()} />);

      // Trigger first timeout and let it complete, then trigger another to verify non-stale registry cleanup
      fireEvent.click(screen.getByRole('button', { name: /instant draw/i }));
      fireEvent.click(screen.getByRole('button', { name: /pick a winner/i }));
      act(() => {
        vi.advanceTimersByTime(700);
      });

      fireEvent.click(screen.getByRole('tab', { name: /coin toss/i }));
      fireEvent.click(screen.getByRole('button', { name: /flip coin/i }));

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      act(() => {
        vi.advanceTimersByTime(2000);
      });
    });
  });
});
