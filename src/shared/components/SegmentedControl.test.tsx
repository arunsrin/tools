import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SegmentedControl from './SegmentedControl';

describe('SegmentedControl', () => {
  const options = [
    { value: 'a', label: 'Alpha' },
    { value: 'b', label: 'Beta', disabled: true },
    { value: 'c', label: 'Gamma' },
  ] as const;

  it('supports group mode with aria-pressed and click selection', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        options={options}
        value="a"
        onChange={onChange}
        ariaLabel="Mode switcher"
      />
    );

    expect(screen.getByRole('group', { name: 'Mode switcher' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Beta' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Gamma' })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'Gamma' }));
    expect(onChange).toHaveBeenCalledWith('c');
  });

  it('supports tablist mode with aria-selected and arrow/Home/End keyboard navigation', () => {
    const onChange = vi.fn();
    render(
      <SegmentedControl
        options={options}
        value="a"
        onChange={onChange}
        ariaLabel="View tabs"
        mode="tablist"
      />
    );

    expect(screen.getByRole('tablist', { name: 'View tabs' })).toBeInTheDocument();
    const alphaTab = screen.getByRole('tab', { name: 'Alpha' });
    const gammaTab = screen.getByRole('tab', { name: 'Gamma' });
    expect(alphaTab).toHaveAttribute('aria-selected', 'true');
    expect(gammaTab).toHaveAttribute('aria-selected', 'false');

    // ArrowRight skips disabled 'b' and selects 'c'
    fireEvent.keyDown(alphaTab, { key: 'ArrowRight' });
    expect(onChange).toHaveBeenLastCalledWith('c');

    fireEvent.keyDown(gammaTab, { key: 'ArrowLeft' });
    expect(onChange).toHaveBeenLastCalledWith('a');

    fireEvent.keyDown(alphaTab, { key: 'End' });
    expect(onChange).toHaveBeenLastCalledWith('c');

    fireEvent.keyDown(gammaTab, { key: 'Home' });
    expect(onChange).toHaveBeenLastCalledWith('a');
  });
});
