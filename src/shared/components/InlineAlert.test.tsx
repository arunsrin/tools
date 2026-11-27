import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InlineAlert from './InlineAlert';

describe('InlineAlert', () => {
  it('renders role="alert" for error and warning variants with optional dismiss', () => {
    const onDismiss = vi.fn();
    render(<InlineAlert message="Invalid payload" variant="error" onDismiss={onDismiss} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Invalid payload');
    expect(alert).toHaveClass('shared-inline-alert--error');

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss alert' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders role="status" for info and success variants without dismiss button when omitted', () => {
    render(<InlineAlert message="Saved cleanly" variant="success" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('Saved cleanly');
    expect(status).toHaveClass('shared-inline-alert--success');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
