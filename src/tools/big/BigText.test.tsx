import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import BigText from './BigText';
import { findBestFontSize, calculateResponsivePadding, MIN_FONT_SIZE } from './constants';

describe('calculateResponsivePadding', () => {
  it('calculates responsive padding for a narrow mobile screen', () => {
    const result = calculateResponsivePadding(360, 780);
    expect(result.paddingX).toBe(32);
    expect(result.availableWidth).toBe(328);
    expect(result.paddingY).toBe(62);
    expect(result.availableHeight).toBe(718);
  });

  it('calculates clamped padding for large desktop screens', () => {
    const result = calculateResponsivePadding(1920, 1080);
    expect(result.paddingX).toBe(64);
    expect(result.availableWidth).toBe(1856);
    expect(result.paddingY).toBe(64);
    expect(result.availableHeight).toBe(1016);
  });
});

describe('findBestFontSize', () => {
  it('finds the correct font size for a simple case', () => {
    const measureText = (size: number) => ({ width: size, height: size });
    const result = findBestFontSize(100, 100, measureText);
    expect(result).toBe(100);
  });

  it('respects width limits and scales down wide words', () => {
    const measureText = (size: number) => ({ width: size * 5, height: size });
    const result = findBestFontSize(300, 500, measureText);
    expect(result).toBe(60);
  });

  it('respects height limits', () => {
    const measureText = (size: number) => ({ width: size, height: size * 2 });
    const result = findBestFontSize(100, 100, measureText);
    expect(result).toBe(50);
  });

  it('correctly calculates font size with padding', () => {
    const padding = 40;
    const containerWidth = 100;
    const containerHeight = 100;
    const measureText = (size: number) => ({ width: size, height: size });

    const result = findBestFontSize(
      containerWidth - padding,
      containerHeight - padding,
      measureText
    );

    expect(result).toBe(60);
  });

  it('falls back to minSize floor when text does not fit at minSize', () => {
    const measureText = (size: number) => ({ width: size * 100, height: size });
    const result = findBestFontSize(200, 200, measureText, MIN_FONT_SIZE);
    expect(result).toBe(MIN_FONT_SIZE);
  });
});

describe('BigText Tool', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders editing mode by default with ToolHeader and typed buttons', () => {
    render(<BigText onBack={mockOnBack} />);
    expect(screen.getByRole('heading', { level: 1, name: /big text/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type something.../i)).toBeInTheDocument();
    const displayBtn = screen.getByRole('button', { name: /Make it BIG/i });
    expect(displayBtn).toHaveAttribute('type', 'button');
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toHaveAttribute('type', 'button');
  });

  it('initializes with text from localStorage if available', () => {
    localStorage.setItem('bigText', 'TEST LOCAL STORAGE');
    render(<BigText onBack={mockOnBack} />);
    expect(screen.getByDisplayValue('TEST LOCAL STORAGE')).toBeInTheDocument();
  });

  it('updates input value and persists raw string to localStorage', () => {
    render(<BigText onBack={mockOnBack} />);
    const input = screen.getByPlaceholderText(/Type something.../i);
    fireEvent.change(input, { target: { value: 'NEW TEXT' } });
    expect(input).toHaveValue('NEW TEXT');
    expect(localStorage.getItem('bigText')).toBe('NEW TEXT');
  });

  it('shows an InlineAlert on empty/whitespace submit and clears it when typing or dismissed', () => {
    render(<BigText onBack={mockOnBack} />);
    const input = screen.getByPlaceholderText(/Type something.../i);
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /Make it BIG/i }));

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent(/please enter some text/i);
    expect(screen.getByPlaceholderText(/Type something.../i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /dismiss alert/i }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    // Trigger again via Enter key
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Typing non-empty text clears alert
    fireEvent.change(input, { target: { value: 'VALID' } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('switches to display mode when "Make it BIG" is clicked or Enter is pressed', () => {
    render(<BigText onBack={mockOnBack} />);
    const input = screen.getByPlaceholderText(/Type something.../i);
    fireEvent.change(input, { target: { value: 'DISPLAY ME' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(screen.getByText('DISPLAY ME')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Type something.../i)).not.toBeInTheDocument();
  });

  it('exits display mode via click, Escape, Enter, and Space, and exposes Back to Tools Hub button', () => {
    render(<BigText onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Make it BIG/i }));

    const displayContainer = screen.getByText('HELLO').parentElement!;
    expect(displayContainer).toHaveAttribute('role', 'button');
    expect(displayContainer).toHaveAttribute('tabindex', '0');

    // Click returns to editor
    fireEvent.click(displayContainer);
    expect(screen.getByPlaceholderText(/Type something.../i)).toBeInTheDocument();

    // Enter on display container returns to editor
    fireEvent.click(screen.getByRole('button', { name: /Make it BIG/i }));
    fireEvent.keyDown(screen.getByText('HELLO').parentElement!, { key: 'Enter' });
    expect(screen.getByPlaceholderText(/Type something.../i)).toBeInTheDocument();

    // Space on display container returns to editor
    fireEvent.click(screen.getByRole('button', { name: /Make it BIG/i }));
    fireEvent.keyDown(screen.getByText('HELLO').parentElement!, { key: ' ' });
    expect(screen.getByPlaceholderText(/Type something.../i)).toBeInTheDocument();

    // Global Escape exits display mode
    fireEvent.click(screen.getByRole('button', { name: /Make it BIG/i }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByPlaceholderText(/Type something.../i)).toBeInTheDocument();

    // Back to Tools Hub button inside display mode calls onBack
    fireEvent.click(screen.getByRole('button', { name: /Make it BIG/i }));
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('calls onBack when back button in editor ToolHeader is clicked', () => {
    render(<BigText onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Back to Tools Hub/i }));
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('persists and loads theme from localStorage and rejects unknown theme ids', () => {
    localStorage.setItem('bigTheme', 'theme-matrix');
    const { unmount } = render(<BigText onBack={mockOnBack} />);

    const container = screen.getByPlaceholderText(/Type something.../i).closest('.bigtext-root');
    expect(container).toHaveClass('theme-matrix');

    const lightThemeBtn = screen.getByLabelText(/Select Light theme/i);
    fireEvent.click(lightThemeBtn);
    expect(container).toHaveClass('theme-light');
    expect(localStorage.getItem('bigTheme')).toBe('theme-light');
    unmount();

    // Invalid stored theme falls back to theme-dark
    localStorage.setItem('bigTheme', 'theme-invalid');
    render(<BigText onBack={mockOnBack} />);
    expect(
      screen.getByPlaceholderText(/Type something.../i).closest('.bigtext-root')
    ).toHaveClass('theme-dark');
  });

  it('handles localStorage getItem and setItem exceptions gracefully without crashing', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Access denied');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    render(<BigText onBack={mockOnBack} />);
    const input = screen.getByPlaceholderText(/Type something.../i);
    expect(input).toHaveValue('HELLO');

    expect(() => {
      fireEvent.change(input, { target: { value: 'SAFE TEXT' } });
    }).not.toThrow();
    expect(input).toHaveValue('SAFE TEXT');
  });

  it('switches to preset text when preset button is clicked', () => {
    render(<BigText onBack={mockOnBack} />);
    const presetBtn = screen.getByRole('button', { name: '🍺 1 more please' });
    fireEvent.click(presetBtn);

    expect(screen.getByText('🍺 1 more please')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Type something.../i)).not.toBeInTheDocument();
  });

  it('applies force-break at MIN_FONT_SIZE when text overflows and recalculates on resize', () => {
    vi.useFakeTimers();
    render(<BigText onBack={mockOnBack} />);

    const input = screen.getByPlaceholderText(/Type something.../i);
    fireEvent.change(input, { target: { value: 'SUPERLONGUNBROKENSTRING' } });
    fireEvent.click(screen.getByRole('button', { name: /Make it BIG/i }));

    const textEl = screen.getByText('SUPERLONGUNBROKENSTRING');
    const rootEl = textEl.closest('.bigtext-root')!;

    Object.defineProperty(rootEl, 'clientWidth', { configurable: true, value: 300 });
    Object.defineProperty(rootEl, 'clientHeight', { configurable: true, value: 200 });

    // Simulate scrollWidth exceeding availableWidth even at MIN_FONT_SIZE
    let forceOverflow = true;
    Object.defineProperty(textEl, 'scrollWidth', {
      configurable: true,
      get: () => (forceOverflow ? 999 : 50),
    });
    Object.defineProperty(textEl, 'scrollHeight', {
      configurable: true,
      get: () => 20,
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(textEl).toHaveClass('force-break');
    expect(textEl.style.fontSize).toBe(`${MIN_FONT_SIZE}px`);

    // Resize when text fits removes force-break
    forceOverflow = false;
    act(() => {
      fireEvent(window, new Event('resize'));
    });

    expect(textEl).not.toHaveClass('force-break');
    expect(parseInt(textEl.style.fontSize, 10)).toBeGreaterThan(MIN_FONT_SIZE);
  });

  it('cancels pending resize/measurement timeout and listeners cleanly on unmount', () => {
    vi.useFakeTimers();
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const removeWindowSpy = vi.spyOn(window, 'removeEventListener');
    const removeDocSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(<BigText onBack={mockOnBack} />);
    fireEvent.click(screen.getByRole('button', { name: /Make it BIG/i }));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    expect(removeWindowSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeDocSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
  });
});
