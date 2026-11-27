import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Toast from './Toast';

describe('Toast', () => {
  it('renders nothing when visible is false', () => {
    const { container } = render(<Toast message="Hidden" visible={false} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders status toast by default and alert toast on error variant', () => {
    const onDismiss = vi.fn();
    const { rerender } = render(<Toast message="Copied!" variant="success" onDismiss={onDismiss} />);

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Copied!');
    expect(status).toHaveClass('shared-toast--success');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);

    rerender(<Toast message="Export failed" variant="error" />);
    expect(screen.getByRole('alert')).toHaveTextContent('Export failed');
  });
});
