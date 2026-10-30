import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App (Tools Hub Dashboard)', () => {
  it('renders the hub header and featured tools', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
    expect(screen.getByText(/simple, self-contained utilities/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /big text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /timezone converter/i })).toBeInTheDocument();
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('navigates to Timezone Converter tool and back to hub', () => {
    render(<App />);
    const tzCard = screen.getByRole('button', { name: /timezone converter/i });
    fireEvent.click(tzCard);

    // In TimezoneConverter tool
    expect(screen.getByRole('heading', { level: 1, name: /world time & timezone converter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();

    // Navigate back to hub
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('navigates to Big Text tool when its card is clicked', () => {
    render(<App />);
    const bigTextCard = screen.getByRole('button', { name: /big text/i });
    fireEvent.click(bigTextCard);

    // In BigText tool
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type something/i)).toBeInTheDocument();
  });

  it('navigates back to the hub dashboard when Back to Tools Hub is clicked', () => {
    render(<App />);
    // Navigate to tool
    fireEvent.click(screen.getByRole('button', { name: /big text/i }));
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();

    // Navigate back
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });
});
