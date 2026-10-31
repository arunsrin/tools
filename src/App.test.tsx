import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from './App';

describe('App (Tools Hub Dashboard)', () => {
  it('renders the hub header, badge, and featured tools', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
    expect(screen.getByText(/simple, self-contained utilities/i)).toBeInTheDocument();
    expect(screen.getByText(/utility toolkit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /big text/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /timezone converter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /random picker/i })).toBeInTheDocument();
    expect(screen.getByText(/more tools/i)).toBeInTheDocument();
  });

  it('renders footer attribution with author link, co-author note, and icon-only GitHub link', () => {
    render(<App />);
    expect(screen.getByText(/authored by/i)).toBeInTheDocument();
    const arunLink = screen.getByRole('link', { name: /^arun$/i });
    expect(arunLink).toHaveAttribute('href', 'https://www.arunsr.in/');
    expect(screen.getByText(/co-authored by llm/i)).toBeInTheDocument();

    const githubLink = screen.getByRole('link', { name: /gitHub repository/i });
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute('href', 'https://github.com/arunsrin/tools');
    expect(githubLink).toHaveAttribute('target', '_blank');
    expect(githubLink).toHaveAttribute('title', 'GitHub Repository');
    expect(githubLink).not.toHaveTextContent('GitHub');

    expect(screen.queryByText(/gplv3 licensed/i)).not.toBeInTheDocument();
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

  it('navigates to Random Picker tool when its card is clicked and back to hub', () => {
    render(<App />);
    const pickerCard = screen.getByRole('button', { name: /random picker/i });
    fireEvent.click(pickerCard);

    // In ChoicePicker tool
    expect(screen.getByRole('heading', { level: 1, name: /random picker & decision maker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();

    // Navigate back
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });
});
