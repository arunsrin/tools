import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PomoTimer, { PomoMascot } from './PomoTimer';
import { playChime } from './audio';

describe('PomoTimer Component', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.title = 'Tools Hub';
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders default state: 25:00 focus session, mascot, cycle 1/4, and controls', () => {
    render(<PomoTimer onBack={mockOnBack} />);

    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByTestId('pomo-mascot')).toHaveAttribute('data-phase', 'focus');
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText(/focus session/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reset timer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /skip to next phase/i })).toBeInTheDocument();
    expect(screen.getByText(/cycle/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/4/)).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<PomoTimer onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('starts and pauses the countdown timer with fake timers', () => {
    vi.useFakeTimers();
    render(<PomoTimer onBack={mockOnBack} />);

    const startBtn = screen.getByRole('button', { name: /start timer/i });
    fireEvent.click(startBtn);

    // Button should now say Pause
    expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument();

    // Advance 3 seconds
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('24:57')).toBeInTheDocument();

    // Pause timer
    fireEvent.click(screen.getByRole('button', { name: /pause timer/i }));
    expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument();

    // Advance 5 seconds - time should remain paused
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('24:57')).toBeInTheDocument();
  });

  it('handles micro adjustments (+1m and -1m)', () => {
    render(<PomoTimer onBack={mockOnBack} />);

    const addBtn = screen.getByRole('button', { name: /add one minute/i });
    const subBtn = screen.getByRole('button', { name: /subtract one minute/i });

    // Initial 25:00 + 1m -> 26:00
    fireEvent.click(addBtn);
    expect(screen.getByText('26:00')).toBeInTheDocument();

    // 26:00 - 1m -> 25:00
    fireEvent.click(subBtn);
    expect(screen.getByText('25:00')).toBeInTheDocument();

    // Subtract 26 times to verify clamping at 00:00
    for (let i = 0; i < 26; i++) {
      fireEvent.click(subBtn);
    }
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });

  it('resets timer back to phase duration', () => {
    vi.useFakeTimers();
    render(<PomoTimer onBack={mockOnBack} />);

    fireEvent.click(screen.getByRole('button', { name: /start timer/i }));
    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByText('24:50')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reset timer/i }));
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument();
  });

  it('allows manual phase tab switching', () => {
    render(<PomoTimer onBack={mockOnBack} />);

    // Switch to Short Break
    fireEvent.click(screen.getByRole('button', { name: /^short break$/i }));
    expect(screen.getByText('05:00')).toBeInTheDocument();
    expect(screen.getByText(/short coffee break/i)).toBeInTheDocument();
    expect(screen.getByTestId('pomo-mascot')).toHaveAttribute('data-phase', 'shortBreak');

    // Switch to Long Break
    fireEvent.click(screen.getByRole('button', { name: /^long break$/i }));
    expect(screen.getByText('15:00')).toBeInTheDocument();
    expect(screen.getByText(/long rest & recharge/i)).toBeInTheDocument();
    expect(screen.getByTestId('pomo-mascot')).toHaveAttribute('data-phase', 'longBreak');

    // Switch back to Focus
    fireEvent.click(screen.getByRole('button', { name: /^focus$/i }));
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText(/focus session/i)).toBeInTheDocument();
  });

  it('progresses through a complete 4-pomodoro cycle via skip', () => {
    render(<PomoTimer onBack={mockOnBack} />);

    const skipBtn = screen.getByRole('button', { name: /skip to next phase/i });

    // Cycle 1: Focus -> Short Break
    expect(screen.getByText(/1\/4/)).toBeInTheDocument();
    fireEvent.click(skipBtn);
    expect(screen.getByText(/short coffee break/i)).toBeInTheDocument();

    // Short Break -> Focus (Cycle 2)
    fireEvent.click(skipBtn);
    expect(screen.getByText(/focus session/i)).toBeInTheDocument();
    expect(screen.getByText(/2\/4/)).toBeInTheDocument();

    // Cycle 2: Focus -> Short Break -> Focus (Cycle 3)
    fireEvent.click(skipBtn);
    fireEvent.click(skipBtn);
    expect(screen.getByText(/focus session/i)).toBeInTheDocument();
    expect(screen.getByText(/3\/4/)).toBeInTheDocument();

    // Cycle 3: Focus -> Short Break -> Focus (Cycle 4)
    fireEvent.click(skipBtn);
    fireEvent.click(skipBtn);
    expect(screen.getByText(/focus session/i)).toBeInTheDocument();
    expect(screen.getByText(/4\/4/)).toBeInTheDocument();

    // Cycle 4: Focus -> Long Break!
    fireEvent.click(skipBtn);
    expect(screen.getByText(/long rest & recharge/i)).toBeInTheDocument();

    // Long Break -> Resets to Focus (Cycle 1)
    fireEvent.click(skipBtn);
    expect(screen.getByText(/focus session/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/4/)).toBeInTheDocument();
  });

  it('natural completion advances phase and increments lifetime completed count', () => {
    vi.useFakeTimers();
    render(<PomoTimer onBack={mockOnBack} />);

    // Start Focus
    fireEvent.click(screen.getByRole('button', { name: /start timer/i }));

    // Run until 0 seconds left (25 min = 1500 seconds)
    act(() => {
      vi.advanceTimersByTime(1500 * 1000);
    });

    // Should complete Focus, increment completed count, and move to Short Break
    expect(screen.getByText(/short coffee break/i)).toBeInTheDocument();
    expect(screen.getByText('05:00')).toBeInTheDocument();
    expect(screen.getByText(/lifetime:/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('updates document title during countdown and resets on unmount', () => {
    vi.useFakeTimers();
    const { unmount } = render(<PomoTimer onBack={mockOnBack} />);

    expect(document.title).toContain('(25:00) 🍅 Focus · Tools Hub');

    fireEvent.click(screen.getByRole('button', { name: /start timer/i }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(document.title).toContain('(24:58) 🍅 Focus · Tools Hub');

    unmount();
    expect(document.title).toBe('Tools Hub');
  });

  it('opens settings modal, modifies custom durations and validates inputs', () => {
    render(<PomoTimer onBack={mockOnBack} />);

    fireEvent.click(screen.getByRole('button', { name: /timer settings/i }));
    expect(screen.getByRole('heading', { name: /timer settings/i })).toBeInTheDocument();

    const form = screen.getByTestId('pomo-settings-form');
    const focusInput = screen.getByLabelText(/focus duration/i);
    const shortBreakInput = screen.getByLabelText(/short break duration/i);
    const longBreakInput = screen.getByLabelText(/long break duration/i);

    // Test invalid value > 90 for focus
    fireEvent.change(focusInput, { target: { value: '120' } });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent(/between 1 and 90 minutes/i);

    // Test invalid value < 1
    fireEvent.change(focusInput, { target: { value: '0' } });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent(/between 1 and 90 minutes/i);

    // Test invalid short break
    fireEvent.change(focusInput, { target: { value: '30' } });
    fireEvent.change(shortBreakInput, { target: { value: '45' } });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent(/short break must be between 1 and 30 minutes/i);

    // Test invalid long break
    fireEvent.change(shortBreakInput, { target: { value: '5' } });
    fireEvent.change(longBreakInput, { target: { value: '99' } });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent(/long break must be between 1 and 60 minutes/i);

    // Valid save
    fireEvent.change(longBreakInput, { target: { value: '20' } });
    fireEvent.submit(form);

    // Modal should close and timer reflect 30:00
    expect(screen.queryByRole('heading', { name: /timer settings/i })).not.toBeInTheDocument();
    expect(screen.getByText('30:00')).toBeInTheDocument();
  });

  it('resets defaults and clears stats from settings modal', () => {
    render(<PomoTimer onBack={mockOnBack} />);

    fireEvent.click(screen.getByRole('button', { name: /timer settings/i }));

    // Reset Defaults
    fireEvent.click(screen.getByRole('button', { name: /reset defaults/i }));
    expect(screen.getByLabelText(/focus duration/i)).toHaveValue(25);

    // Clear stats
    fireEvent.click(screen.getByRole('button', { name: /clear stats/i }));
    expect(screen.getByText(/1\/4/)).toBeInTheDocument();

    // Close modal via close button
    fireEvent.click(screen.getByRole('button', { name: /close settings/i }));
    expect(screen.queryByRole('heading', { name: /timer settings/i })).not.toBeInTheDocument();
  });

  it('toggles mute preference and handles audio gracefully', () => {
    render(<PomoTimer onBack={mockOnBack} />);

    const muteBtn = screen.getByRole('button', { name: /mute alerts/i });
    expect(muteBtn).toHaveTextContent('🔔');

    fireEvent.click(muteBtn);
    expect(screen.getByRole('button', { name: /unmute alerts/i })).toHaveTextContent('🔇');

    // Calling playChime with muted should do nothing
    playChime(true);

    // Calling playChime when unmuted in environment without AudioContext
    playChime(false);
  });

  it('renders PomoMascot across all phases and animation states', () => {
    const { rerender } = render(
      <PomoMascot phase="focus" isRunning={true} isFinishedAlert={false} />
    );
    expect(screen.getByTestId('pomo-mascot')).toHaveClass('pomo-breathing');

    rerender(<PomoMascot phase="shortBreak" isRunning={true} isFinishedAlert={false} />);
    expect(screen.getByTestId('pomo-mascot')).toHaveClass('pomo-relaxing');

    rerender(<PomoMascot phase="longBreak" isRunning={false} isFinishedAlert={true} />);
    expect(screen.getByTestId('pomo-mascot')).toHaveClass('pomo-celebrating');
  });

  it('loads preferences from localStorage and gracefully handles malformed data', () => {
    localStorage.setItem(
      'tools_hub_pomo_prefs',
      JSON.stringify({
        focusDuration: 45,
        shortBreakDuration: 10,
        longBreakDuration: 25,
        autoStart: true,
        isMuted: true,
        totalCompleted: 7,
      })
    );

    render(<PomoTimer onBack={mockOnBack} />);
    expect(screen.getByText('45:00')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unmute alerts/i })).toBeInTheDocument();
  });

  it('tolerates localStorage getItem throwing an exception', () => {
    const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Access denied');
    });

    render(<PomoTimer onBack={mockOnBack} />);
    expect(screen.getByText('25:00')).toBeInTheDocument();

    getItemSpy.mockRestore();
  });
});
