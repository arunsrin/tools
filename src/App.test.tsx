import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App (Tools Hub Dashboard)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('renders the hub header, badge, and featured tools', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
    expect(screen.getByText(/simple, self-contained utilities/i)).toBeInTheDocument();
    expect(screen.getByText(/utility toolkit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /big text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /timezone converter/i })).toBeInTheDocument();
    expect(screen.getByText(/more tools/i)).toBeInTheDocument();
  });

  it('renders GitHub link in top chrome and links to repo', () => {
    render(<App />);
    const githubLink = screen.getByRole('link', { name: /gitHub repository/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/arunsrin/tools');
    expect(githubLink).toHaveAttribute('target', '_blank');
  });

  it('renders theme toggle and toggles between light and dark modes', () => {
    render(<App />);
    const themeBtn = screen.getByRole('button', { name: /switch to (light|dark) mode/i });
    expect(themeBtn).toBeInTheDocument();

    // Toggle theme
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    // Toggle back
    fireEvent.click(themeBtn);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('renders footer attribution and links', () => {
    render(<App />);
    expect(screen.getByText(/authored by/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^arun$/i })).toHaveAttribute('href', 'https://www.arunsr.in/');
    expect(screen.getByText(/co-authored by llm/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /digital garden/i })).toHaveAttribute('href', 'https://www.arunsr.in/');
    expect(screen.getByText(/gplv3 licensed/i)).toBeInTheDocument();
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

  it('navigates to Big Text tool when its card is clicked and back to hub', () => {
    render(<App />);
    const bigTextCard = screen.getByRole('button', { name: /big text/i });
    fireEvent.click(bigTextCard);

    // In BigText tool
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type something/i)).toBeInTheDocument();

    // Navigate back
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });
});
