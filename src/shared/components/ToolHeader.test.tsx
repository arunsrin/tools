import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToolHeader from './ToolHeader';

describe('ToolHeader', () => {
  it('renders standardized Back to Tools Hub button, title, optional badge, subtitle, and actions', () => {
    const onBack = vi.fn();
    render(
      <ToolHeader
        onBack={onBack}
        title="Sample Tool"
        badge="Utility"
        subtitle="Helpful description"
        actions={<button type="button">Settings</button>}
      />
    );

    const backBtn = screen.getByRole('button', { name: /← back to tools hub/i });
    expect(backBtn).toBeInTheDocument();
    fireEvent.click(backBtn);
    expect(onBack).toHaveBeenCalledTimes(1);

    expect(screen.getByRole('heading', { level: 1, name: 'Sample Tool' })).toBeInTheDocument();
    expect(screen.getByText('Utility')).toBeInTheDocument();
    expect(screen.getByText('Helpful description')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Settings' })).toBeInTheDocument();
  });

  it('omits optional badge, subtitle, and actions when not provided', () => {
    render(<ToolHeader onBack={vi.fn()} title="Minimal Tool" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Minimal Tool' })).toBeInTheDocument();
    expect(document.querySelector('.shared-tool-badge')).toBeNull();
    expect(document.querySelector('.shared-tool-subtitle')).toBeNull();
    expect(document.querySelector('.shared-tool-header-actions')).toBeNull();
  });
});
