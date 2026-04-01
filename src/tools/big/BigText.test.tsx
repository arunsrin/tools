import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import BigText from './BigText';
import { findBestFontSize } from './constants';

describe('findBestFontSize', () => {
  it('finds the correct font size for a simple case', () => {
    // container is 100x100, text at 50px is 50x50, at 101px is 101x101
    const measureText = (size: number) => ({ width: size, height: size });
    const result = findBestFontSize(100, 100, measureText);
    expect(result).toBe(100);
  });

  it('respects width limits', () => {
    const measureText = (size: number) => ({ width: size * 2, height: size });
    // 50 * 2 = 100 width, 50 height. Should fit in 100x100
    const result = findBestFontSize(100, 100, measureText);
    expect(result).toBe(50);
  });

  it('respects height limits', () => {
    const measureText = (size: number) => ({ width: size, height: size * 2 });
    // 50 width, 50 * 2 = 100 height. Should fit in 100x100
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
    
    expect(result).toBe(60); // 100 - 40 = 60
  });
});

describe('BigText Tool', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders editing mode by default', () => {
    render(<BigText onBack={mockOnBack} />);
    expect(screen.getByPlaceholderText(/Type something.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Make it BIG/i })).toBeInTheDocument();
  });

  it('initializes with text from localStorage if available', () => {
    localStorage.setItem('bigText', 'TEST LOCAL STORAGE');
    render(<BigText onBack={mockOnBack} />);
    expect(screen.getByDisplayValue('TEST LOCAL STORAGE')).toBeInTheDocument();
  });

  it('updates input value correctly', () => {
    render(<BigText onBack={mockOnBack} />);
    const input = screen.getByPlaceholderText(/Type something.../i);
    fireEvent.change(input, { target: { value: 'NEW TEXT' } });
    expect(input).toHaveValue('NEW TEXT');
    expect(localStorage.getItem('bigText')).toBe('NEW TEXT');
  });

  it('switches to display mode when "Make it BIG" is clicked', () => {
    render(<BigText onBack={mockOnBack} />);
    const input = screen.getByPlaceholderText(/Type something.../i);
    fireEvent.change(input, { target: { value: 'DISPLAY ME' } });
    const button = screen.getByRole('button', { name: /Make it BIG/i });
    fireEvent.click(button);

    expect(screen.getByText('DISPLAY ME')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Type something.../i)).not.toBeInTheDocument();
  });

  it('switches back to editing mode when text is clicked in display mode', () => {
    render(<BigText onBack={mockOnBack} />);
    const button = screen.getByRole('button', { name: /Make it BIG/i });
    fireEvent.click(button);

    const displayContainer = screen.getByText('HELLO').parentElement;
    fireEvent.click(displayContainer!);

    expect(screen.getByPlaceholderText(/Type something.../i)).toBeInTheDocument();
  });

  it('calls onBack when back link is clicked', () => {
    render(<BigText onBack={mockOnBack} />);
    const backLink = screen.getByText(/Back to Tools Hub/i);
    fireEvent.click(backLink);
    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it('persists and loads theme from localStorage', () => {
    localStorage.setItem('bigTheme', 'theme-matrix');
    render(<BigText onBack={mockOnBack} />);
    
    const container = screen.getByPlaceholderText(/Type something.../i).closest('.app-container');
    expect(container).toHaveClass('theme-matrix');

    const lightThemeBtn = screen.getByLabelText(/Select Light theme/i);
    fireEvent.click(lightThemeBtn);
    expect(container).toHaveClass('theme-light');
    expect(localStorage.getItem('bigTheme')).toBe('theme-light');
  });
});
