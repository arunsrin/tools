import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToolErrorBoundary from './ToolErrorBoundary';

function ExplodingChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Synthetic tool crash');
  }
  return <div>Tool rendered safely</div>;
}

describe('ToolErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders fallback UI when a child throws, allows Try Again recovery, and supports Back to Hub', () => {
    const onBack = vi.fn();
    let shouldThrow = true;

    const { rerender } = render(
      <ToolErrorBoundary onBack={onBack} toolName="Fractal Explorer" resetKey="fractal">
        <ExplodingChild shouldThrow={shouldThrow} />
      </ToolErrorBoundary>
    );

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /fractal explorer encountered an error/i })).toBeInTheDocument();
    expect(screen.getByText('Synthetic tool crash')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(onBack).toHaveBeenCalledTimes(1);

    shouldThrow = false;
    rerender(
      <ToolErrorBoundary onBack={onBack} toolName="Fractal Explorer" resetKey="fractal">
        <ExplodingChild shouldThrow={shouldThrow} />
      </ToolErrorBoundary>
    );
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('Tool rendered safely')).toBeInTheDocument();
  });

  it('resets automatically when resetKey changes', () => {
    const { rerender } = render(
      <ToolErrorBoundary onBack={vi.fn()} resetKey="broken">
        <ExplodingChild shouldThrow={true} />
      </ToolErrorBoundary>
    );
    expect(screen.getByRole('heading', { level: 1, name: /something went wrong/i })).toBeInTheDocument();

    rerender(
      <ToolErrorBoundary onBack={vi.fn()} resetKey="next-tool">
        <ExplodingChild shouldThrow={false} />
      </ToolErrorBoundary>
    );
    expect(screen.getByText('Tool rendered safely')).toBeInTheDocument();
  });
});
