import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import PomoTimer from './PomoTimer';
import PomoMascot from './PomoMascot';
import { playChime, closeChimeAudio } from './audio';

describe('PomoTimer Component', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.title = 'Tools Hub - Simple, Self-Contained Utilities';
  });

  afterEach(async () => {
    await closeChimeAudio();
    vi.useRealTimers();
    vi.restoreAllMocks();
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
    expect(screen.getByText(/^cycle/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/4/)).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(<PomoTimer onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('starts and pauses the countdown timer and updates SVG progress ring', () => {
    vi.useFakeTimers();
    const { container } = render(<PomoTimer onBack={mockOnBack} />);

    const progressCircle = container.querySelector('.pomo-ring-progress') as SVGCircleElement;
    expect(progressCircle).toBeTruthy();
    const initialOffset = parseFloat(progressCircle.style.strokeDashoffset);
    expect(initialOffset).toBeCloseTo(0, 3);

    const startBtn = screen.getByRole('button', { name: /start timer/i });
    fireEvent.click(startBtn);
    expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.getByText('24:57')).toBeInTheDocument();
    const elapsedOffset = parseFloat(progressCircle.style.strokeDashoffset);
    expect(elapsedOffset).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /pause timer/i }));
    expect(screen.getByRole('button', { name: /start timer/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByText('24:57')).toBeInTheDocument();
  });

  it('stays accurate to wall-clock time across background-tab throttling', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));

    render(<PomoTimer onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /start timer/i }));

    // Simulate browser tab throttling where system clock jumps ahead 90 seconds without intermediate ticks
    vi.setSystemTime(new Date('2026-01-01T12:01:30Z'));
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(screen.getByText('23:30')).toBeInTheDocument();
  });

  it('handles micro adjustments (+1m and -1m) while paused and running', () => {
    vi.useFakeTimers();
    render(<PomoTimer onBack={mockOnBack} />);

    const addBtn = screen.getByRole('button', { name: /add one minute/i });
    const subBtn = screen.getByRole('button', { name: /subtract one minute/i });

    fireEvent.click(addBtn);
    expect(screen.getByText('26:00')).toBeInTheDocument();

    fireEvent.click(subBtn);
    expect(screen.getByText('25:00')).toBeInTheDocument();

    // Also adjust while running
    fireEvent.click(screen.getByRole('button', { name: /start timer/i }));
    fireEvent.click(addBtn);
    expect(screen.getByText('26:00')).toBeInTheDocument();
    fireEvent.click(subBtn);
    expect(screen.getByText('25:00')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /pause timer/i }));

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

  it('allows manual phase tab switching with ARIA tablist semantics', () => {
    render(<PomoTimer onBack={mockOnBack} />);

    const shortBreakTab = screen.getByRole('tab', { name: /^short break$/i });
    fireEvent.click(shortBreakTab);
    expect(shortBreakTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('05:00')).toBeInTheDocument();
    expect(screen.getByText(/short coffee break/i)).toBeInTheDocument();
    expect(screen.getByTestId('pomo-mascot')).toHaveAttribute('data-phase', 'shortBreak');

    const longBreakTab = screen.getByRole('tab', { name: /^long break$/i });
    fireEvent.click(longBreakTab);
    expect(longBreakTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('15:00')).toBeInTheDocument();
    expect(screen.getByText(/long rest & recharge/i)).toBeInTheDocument();
    expect(screen.getByTestId('pomo-mascot')).toHaveAttribute('data-phase', 'longBreak');

    const focusTab = screen.getByRole('tab', { name: /^focus$/i });
    fireEvent.click(focusTab);
    expect(focusTab).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText(/focus session/i)).toBeInTheDocument();
  });

  it('progresses through a complete 4-pomodoro cycle via skip', () => {
    render(<PomoTimer onBack={mockOnBack} />);

    const skipBtn = screen.getByRole('button', { name: /skip to next phase/i });

    expect(screen.getByText(/1\/4/)).toBeInTheDocument();
    fireEvent.click(skipBtn);
    expect(screen.getByText(/short coffee break/i)).toBeInTheDocument();

    fireEvent.click(skipBtn);
    expect(screen.getByText(/focus session/i)).toBeInTheDocument();
    expect(screen.getByText(/2\/4/)).toBeInTheDocument();

    fireEvent.click(skipBtn);
    fireEvent.click(skipBtn);
    expect(screen.getByText(/focus session/i)).toBeInTheDocument();
    expect(screen.getByText(/3\/4/)).toBeInTheDocument();

    fireEvent.click(skipBtn);
    fireEvent.click(skipBtn);
    expect(screen.getByText(/focus session/i)).toBeInTheDocument();
    expect(screen.getByText(/4\/4/)).toBeInTheDocument();

    fireEvent.click(skipBtn);
    expect(screen.getByText(/long rest & recharge/i)).toBeInTheDocument();

    fireEvent.click(skipBtn);
    expect(screen.getByText(/focus session/i)).toBeInTheDocument();
    expect(screen.getByText(/1\/4/)).toBeInTheDocument();
  });

  it('natural completion advances phase and increments lifetime completed count', () => {
    vi.useFakeTimers();
    render(<PomoTimer onBack={mockOnBack} />);

    fireEvent.click(screen.getByRole('button', { name: /start timer/i }));

    act(() => {
      vi.advanceTimersByTime(1500 * 1000);
    });

    expect(screen.getByText(/short coffee break/i)).toBeInTheDocument();
    expect(screen.getByText('05:00')).toBeInTheDocument();
    expect(screen.getByText(/lifetime:/i)).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('updates document title during countdown and restores previous title on unmount', () => {
    vi.useFakeTimers();
    document.title = 'Tools Hub - Simple, Self-Contained Utilities';
    const { unmount } = render(<PomoTimer onBack={mockOnBack} />);

    expect(document.title).toContain('(25:00) 🍅 Focus · Tools Hub');

    fireEvent.click(screen.getByRole('button', { name: /start timer/i }));
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(document.title).toContain('(24:58) 🍅 Focus · Tools Hub');

    unmount();
    expect(document.title).toBe('Tools Hub - Simple, Self-Contained Utilities');
  });

  it('opens settings modal, validates strict integer inputs (no parseInt truncation), and saves', () => {
    render(<PomoTimer onBack={mockOnBack} />);

    fireEvent.click(screen.getByRole('button', { name: /timer settings/i }));
    expect(screen.getByRole('heading', { name: /timer settings/i })).toBeInTheDocument();

    const form = screen.getByTestId('pomo-settings-form');
    const focusInput = screen.getByLabelText(/focus duration/i);
    const shortBreakInput = screen.getByLabelText(/short break duration/i);
    const longBreakInput = screen.getByLabelText(/long break duration/i);

    // Reject empty / NaN / decimal / trailing characters
    fireEvent.change(focusInput, { target: { value: '' } });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent(/whole number between 1 and 90/i);

    fireEvent.change(focusInput, { target: { value: '25.5' } });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent(/whole number between 1 and 90/i);

    fireEvent.change(focusInput, { target: { value: '25abc' } });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent(/whole number between 1 and 90/i);

    // Dismiss alert
    fireEvent.click(screen.getByRole('button', { name: /dismiss alert/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Out-of-range focus
    fireEvent.change(focusInput, { target: { value: '120' } });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent(/between 1 and 90 minutes/i);

    fireEvent.change(focusInput, { target: { value: '0' } });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent(/between 1 and 90 minutes/i);

    // Invalid short break
    fireEvent.change(focusInput, { target: { value: '30' } });
    fireEvent.change(shortBreakInput, { target: { value: '45' } });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent(/short break must be a whole number between 1 and 30/i);

    // Invalid long break
    fireEvent.change(shortBreakInput, { target: { value: '5' } });
    fireEvent.change(longBreakInput, { target: { value: '99' } });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toHaveTextContent(/long break must be a whole number between 1 and 60/i);

    // Valid save
    fireEvent.change(longBreakInput, { target: { value: '20' } });
    fireEvent.submit(form);

    expect(screen.queryByRole('heading', { name: /timer settings/i })).not.toBeInTheDocument();
    expect(screen.getByText('30:00')).toBeInTheDocument();
  });

  it('resets defaults and clears stats from settings modal', () => {
    render(<PomoTimer onBack={mockOnBack} />);

    fireEvent.click(screen.getByRole('button', { name: /timer settings/i }));

    fireEvent.click(screen.getByRole('button', { name: /reset defaults/i }));
    expect(screen.getByLabelText(/focus duration/i)).toHaveValue(25);

    fireEvent.click(screen.getByRole('button', { name: /clear stats/i }));
    expect(screen.getByText(/1\/4/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /close settings/i }));
    expect(screen.queryByRole('heading', { name: /timer settings/i })).not.toBeInTheDocument();
  });

  it('dismisses settings modal on Escape key, restores focus, and resets uncommitted errors on reopen', () => {
    render(<PomoTimer onBack={mockOnBack} />);

    const settingsBtn = screen.getByRole('button', { name: /timer settings/i });
    settingsBtn.focus();
    fireEvent.click(settingsBtn);
    expect(screen.getByRole('heading', { name: /timer settings/i })).toBeInTheDocument();

    const form = screen.getByTestId('pomo-settings-form');
    const focusInput = screen.getByLabelText(/focus duration/i);

    fireEvent.change(focusInput, { target: { value: '999' } });
    fireEvent.submit(form);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Dismiss with Escape key via Modal's document keydown listener
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('heading', { name: /timer settings/i })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(settingsBtn);

    // Reopen modal - input back to saved duration and error cleared
    fireEvent.click(settingsBtn);
    expect(screen.getByRole('heading', { name: /timer settings/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/focus duration/i)).toHaveValue(25);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Dismiss by clicking Modal backdrop
    const backdrop = screen.getByRole('dialog').parentElement!;
    fireEvent.click(backdrop);
    expect(screen.queryByRole('heading', { name: /timer settings/i })).not.toBeInTheDocument();
  });

  it('auto-starts next phase when autoStart is enabled', () => {
    vi.useFakeTimers();
    localStorage.setItem(
      'tools_hub_pomo_prefs',
      JSON.stringify({
        focusDuration: 1,
        shortBreakDuration: 1,
        longBreakDuration: 5,
        autoStart: true,
        isMuted: true,
        totalCompleted: 0,
      })
    );

    render(<PomoTimer onBack={mockOnBack} />);
    expect(screen.getByText('01:00')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /start timer/i }));
    expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });

    expect(screen.getByText(/short coffee break/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /pause timer/i })).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText('00:58')).toBeInTheDocument();
  });

  it('toggles mute preference and handles audio gracefully with context cleanup', async () => {
    const mockClose = vi.fn().mockResolvedValue(undefined);
    const mockResume = vi.fn().mockResolvedValue(undefined);
    let capturedOnEnded: (() => void) | undefined;

    class MockAudioContext {
      state = 'suspended';
      currentTime = 0;
      destination = {};
      resume = mockResume;
      close = mockClose;
      createOscillator() {
        return {
          type: 'sine',
          frequency: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
          set onended(fn: () => void) {
            capturedOnEnded = fn;
          },
        };
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
      }
    }

    const originalAudioContext = window.AudioContext;
    (window as unknown as { AudioContext: typeof MockAudioContext }).AudioContext = MockAudioContext;

    try {
      render(<PomoTimer onBack={mockOnBack} />);

      const muteBtn = screen.getByRole('button', { name: /mute alerts/i });
      expect(muteBtn).toHaveTextContent('🔔');

      fireEvent.click(muteBtn);
      expect(screen.getByRole('button', { name: /unmute alerts/i })).toHaveTextContent('🔇');

      expect(await playChime(true)).toBe(false);
      expect(mockResume).not.toHaveBeenCalled();

      fireEvent.click(screen.getByRole('button', { name: /unmute alerts/i }));

      expect(await playChime(false)).toBe(true);
      expect(mockResume).toHaveBeenCalled();
      expect(capturedOnEnded).toBeTypeOf('function');
      capturedOnEnded!();
      expect(mockClose).toHaveBeenCalled();
    } finally {
      (window as unknown as { AudioContext?: typeof originalAudioContext }).AudioContext =
        originalAudioContext;
    }
  });

  it('handles missing or throwing AudioContext safely without throwing', async () => {
    const originalAudioContext = window.AudioContext;
    const originalWebkit = (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext;

    try {
      // Missing AudioContext
      delete (window as unknown as { AudioContext?: unknown }).AudioContext;
      delete (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext;
      expect(await playChime(false)).toBe(false);

      // Throwing AudioContext constructor
      (window as unknown as { AudioContext: unknown }).AudioContext = function ThrowingAudio() {
        throw new Error('Audio blocked');
      };
      expect(await playChime(false)).toBe(false);
    } finally {
      (window as unknown as { AudioContext?: typeof originalAudioContext }).AudioContext =
        originalAudioContext;
      (window as unknown as { webkitAudioContext?: unknown }).webkitAudioContext = originalWebkit;
    }
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

  it('loads valid preferences and sanitizes corrupt JSON or out-of-range fields', () => {
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

    const { unmount } = render(<PomoTimer onBack={mockOnBack} />);
    expect(screen.getByText('45:00')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /unmute alerts/i })).toBeInTheDocument();
    unmount();

    // Actual corrupt JSON
    localStorage.setItem('tools_hub_pomo_prefs', '{corrupt-json');
    const { unmount: unmountCorrupt } = render(<PomoTimer onBack={mockOnBack} />);
    expect(screen.getByText('25:00')).toBeInTheDocument();
    unmountCorrupt();

    // Partial / out-of-range values
    localStorage.setItem(
      'tools_hub_pomo_prefs',
      JSON.stringify({
        focusDuration: 999,
        shortBreakDuration: -5,
        longBreakDuration: 'bad',
        autoStart: 'yes',
        totalCompleted: -3,
      })
    );
    render(<PomoTimer onBack={mockOnBack} />);
    expect(screen.getByText('25:00')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('tolerates localStorage getItem and setItem (QuotaExceededError) exceptions', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Access denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    render(<PomoTimer onBack={mockOnBack} />);
    expect(screen.getByText('25:00')).toBeInTheDocument();

    expect(() => {
      fireEvent.click(screen.getByRole('button', { name: /mute alerts/i }));
    }).not.toThrow();
    expect(screen.getByRole('button', { name: /unmute alerts/i })).toBeInTheDocument();
  });

  it('cleans up active countdown interval and alert timeout on unmount', () => {
    vi.useFakeTimers();
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval');
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');

    const { unmount } = render(<PomoTimer onBack={mockOnBack} />);

    fireEvent.click(screen.getByRole('button', { name: /start timer/i }));
    // Complete 25m focus to schedule the 2500ms alert timeout
    act(() => {
      vi.advanceTimersByTime(1500 * 1000);
    });

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
