import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import App from './App';
import { findBestFontSize } from './constants';

describe('findBestFontSize', () => {
  it('finds the correct font size for a simple case', () => {
    // container is 100x100, text at 50px is 50x50, at 101px is 101x101
    const measureText = (size: number) => ({ width: size, height: size });
    const result = findBestFontSize('HELLO', 100, 100, measureText);
    expect(result).toBe(100);
  });

  it('respects width limits', () => {
    const measureText = (size: number) => ({ width: size * 2, height: size });
    // 50 * 2 = 100 width, 50 height. Should fit in 100x100
    const result = findBestFontSize('HELLO', 100, 100, measureText);
    expect(result).toBe(50);
  });

  it('respects height limits', () => {
    const measureText = (size: number) => ({ width: size, height: size * 2 });
    // 50 width, 50 * 2 = 100 height. Should fit in 100x100
    const result = findBestFontSize('HELLO', 100, 100, measureText);
    expect(result).toBe(50);
  });

  it('correctly calculates font size with padding', () => {
    // This is more of an integration test for the logic inside calculateFontSize
    // We expect the result to be based on (containerSize - padding)
    const padding = 40;
    const containerWidth = 100;
    const containerHeight = 100;
    const measureText = (size: number) => ({ width: size, height: size });
    
    const result = findBestFontSize(
      'TEST', 
      containerWidth - padding, 
      containerHeight - padding, 
      measureText
    );
    
    expect(result).toBe(60); // 100 - 40 = 60
  });
});

describe('Big Text App', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('renders editing mode by default', () => {
    render(<App />);
    expect(screen.getByPlaceholderText(/Type something.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Make it BIG/i })).toBeInTheDocument();
  });

  it('initializes with text from localStorage if available', () => {
    localStorage.setItem('bigText', 'TEST LOCAL STORAGE');
    render(<App />);
    expect(screen.getByDisplayValue('TEST LOCAL STORAGE')).toBeInTheDocument();
  });

  it('updates input value correctly', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Type something.../i);
    fireEvent.change(input, { target: { value: 'NEW TEXT' } });
    expect(input).toHaveValue('NEW TEXT');
    expect(localStorage.getItem('bigText')).toBe('NEW TEXT');
  });

  it('switches to display mode when "Make it BIG" is clicked', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Type something.../i);
    fireEvent.change(input, { target: { value: 'DISPLAY ME' } });
    const button = screen.getByRole('button', { name: /Make it BIG/i });
    fireEvent.click(button);

    expect(screen.getByText('DISPLAY ME')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Type something.../i)).not.toBeInTheDocument();
  });

  it('switches back to editing mode when text is clicked in display mode', () => {
    render(<App />);
    const button = screen.getByRole('button', { name: /Make it BIG/i });
    fireEvent.click(button);

    const displayContainer = screen.getByText('HELLO').parentElement;
    fireEvent.click(displayContainer!);

    expect(screen.getByPlaceholderText(/Type something.../i)).toBeInTheDocument();
  });

  it('switches to display mode on Enter key press', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Type something.../i);
    fireEvent.change(input, { target: { value: 'ENTER PRESSED' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('ENTER PRESSED')).toBeInTheDocument();
  });

  it('does not switch to display mode if text is empty', () => {
    render(<App />);
    const input = screen.getByPlaceholderText(/Type something.../i);
    fireEvent.change(input, { target: { value: '  ' } });
    fireEvent.click(screen.getByRole('button', { name: /Make it BIG/i }));

    expect(screen.getByPlaceholderText(/Type something.../i)).toBeInTheDocument();
  });

  it('persists and loads theme from localStorage', () => {
    localStorage.setItem('bigTheme', 'theme-matrix');
    render(<App />);
    
    // Check if the container has the matrix theme class
    const container = screen.getByPlaceholderText(/Type something.../i).closest('.app-container');
    expect(container).toHaveClass('theme-matrix');

    // Change theme
    const lightThemeBtn = screen.getByLabelText(/Select Light theme/i);
    fireEvent.click(lightThemeBtn);
    expect(container).toHaveClass('theme-light');
    expect(localStorage.getItem('bigTheme')).toBe('theme-light');
  });
});
