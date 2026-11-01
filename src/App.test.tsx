import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from './App';
import { parseRoute, getPathForView, TOOL_ROUTES } from './routes';

describe('App (Tools Hub Dashboard & URL Routing)', () => {
  beforeEach(() => {
    // Reset path to root before each test
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the hub header, badge, and featured tools as accessible links', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
    expect(screen.getByText(/simple, self-contained utilities/i)).toBeInTheDocument();
    expect(screen.getByText(/utility toolkit/i)).toBeInTheDocument();

    const bigLink = screen.getByRole('link', { name: /big text/i });
    expect(bigLink).toHaveAttribute('href', TOOL_ROUTES.big);

    const tzLink = screen.getByRole('link', { name: /timezone converter/i });
    expect(tzLink).toHaveAttribute('href', TOOL_ROUTES.timezone);

    const pickerLink = screen.getByRole('link', { name: /random picker/i });
    expect(pickerLink).toHaveAttribute('href', TOOL_ROUTES.picker);

    const pomoLink = screen.getByRole('link', { name: /cute pomo/i });
    expect(pomoLink).toHaveAttribute('href', TOOL_ROUTES.pomo);

    const palsLink = screen.getByRole('link', { name: /desktop pals/i });
    expect(palsLink).toHaveAttribute('href', TOOL_ROUTES.pals);

    const fractalLink = screen.getByRole('link', { name: /fractal explorer/i });
    expect(fractalLink).toHaveAttribute('href', TOOL_ROUTES.fractal);

    const biomorphsLink = screen.getByRole('link', { name: /biomorphs/i });
    expect(biomorphsLink).toHaveAttribute('href', TOOL_ROUTES.biomorphs);

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

  it('navigates to Timezone Converter tool on click and updates URL, then returns to hub', () => {
    render(<App />);
    const tzCard = screen.getByRole('link', { name: /timezone converter/i });
    fireEvent.click(tzCard);

    // In TimezoneConverter tool & URL updated
    expect(window.location.pathname).toBe('/timezone');
    expect(screen.getByRole('heading', { level: 1, name: /world time & timezone converter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();

    // Navigate back to hub
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('navigates to Big Text tool when its card is clicked and back to hub', () => {
    render(<App />);
    const bigTextCard = screen.getByRole('link', { name: /big text/i });
    fireEvent.click(bigTextCard);

    // In BigText tool & URL updated
    expect(window.location.pathname).toBe('/big');
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type something/i)).toBeInTheDocument();

    // Navigate back
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('navigates to Random Picker tool when its card is clicked and back to hub', () => {
    render(<App />);
    const pickerCard = screen.getByRole('link', { name: /random picker/i });
    fireEvent.click(pickerCard);

    // In ChoicePicker tool & URL updated
    expect(window.location.pathname).toBe('/picker');
    expect(screen.getByRole('heading', { level: 1, name: /random picker & decision maker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();

    // Navigate back
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('navigates to Cute Pomo tool and back to hub', () => {
    render(<App />);
    const pomoCard = screen.getByRole('link', { name: /cute pomo/i });
    fireEvent.click(pomoCard);

    // In PomoTimer tool & URL updated
    expect(window.location.pathname).toBe('/pomo');
    expect(screen.getByTestId('pomo-mascot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByText(/focus session/i)).toBeInTheDocument();

    // Navigate back to hub
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('navigates to Desktop Pals tool and back to hub', () => {
    render(<App />);
    const palsCard = screen.getByRole('link', { name: /desktop pals/i });
    fireEvent.click(palsCard);

    // In Desktop Pals tool & URL updated
    expect(window.location.pathname).toBe('/pals');
    expect(screen.getByRole('heading', { level: 1, name: /desktop pals/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByTestId('pals-canvas')).toBeInTheDocument();

    // Navigate back to hub
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('navigates to Fractal Explorer tool and back to hub', () => {
    render(<App />);
    const fractalCard = screen.getByRole('link', { name: /fractal explorer/i });
    fireEvent.click(fractalCard);

    // In Fractal Explorer tool & URL updated
    expect(window.location.pathname).toBe('/fractal');
    expect(screen.getByRole('heading', { level: 1, name: /fractal explorer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByTestId('fractal-canvas')).toBeInTheDocument();

    // Navigate back to hub
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('navigates to Biomorphs tool when its card is clicked and back to hub', () => {
    render(<App />);
    const biomorphsCard = screen.getByRole('link', { name: /biomorphs/i });
    fireEvent.click(biomorphsCard);

    // In Biomorphs tool & URL updated
    expect(window.location.pathname).toBe('/biomorphs');
    expect(screen.getByRole('heading', { level: 1, name: /biomorphs: the evolutionary watchmaker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();

    // Navigate back to hub
    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('mounts directly to Timezone Converter when loading /timezone path', () => {
    window.history.replaceState({}, '', '/timezone');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /world time & timezone converter/i })).toBeInTheDocument();
  });

  it('mounts directly to Big Text when loading /big path', () => {
    window.history.replaceState({}, '', '/big');
    render(<App />);

    expect(screen.getByPlaceholderText(/type something/i)).toBeInTheDocument();
  });

  it('mounts directly to Random Picker when loading /picker path', () => {
    window.history.replaceState({}, '', '/picker');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /random picker & decision maker/i })).toBeInTheDocument();
  });

  it('mounts directly to Cute Pomo when loading /pomo path', () => {
    window.history.replaceState({}, '', '/pomo');
    render(<App />);

    expect(screen.getByTestId('pomo-mascot')).toBeInTheDocument();
  });

  it('mounts directly to Desktop Pals when loading /pals path', () => {
    window.history.replaceState({}, '', '/pals');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /desktop pals/i })).toBeInTheDocument();
    expect(screen.getByTestId('pals-canvas')).toBeInTheDocument();
  });

  it('mounts directly to Fractal Explorer when loading /fractal path', () => {
    window.history.replaceState({}, '', '/fractal');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /fractal explorer/i })).toBeInTheDocument();
    expect(screen.getByTestId('fractal-canvas')).toBeInTheDocument();
  });

  it('mounts directly to Biomorphs when loading /biomorphs path', () => {
    window.history.replaceState({}, '', '/biomorphs');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /biomorphs: the evolutionary watchmaker/i })).toBeInTheDocument();
  });

  it('handles hash fallback routes cleanly (e.g. #/timezone) and normalizes URL to /timezone', () => {
    window.history.replaceState({}, '', '/#/timezone');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /world time & timezone converter/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/timezone');
    expect(window.location.hash).toBe('');
  });

  it('falls back gracefully to hub view on unrecognized path (e.g. /unknown-tool)', () => {
    window.history.replaceState({}, '', '/unknown-tool');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('responds to browser back and forward popstate events', () => {
    render(<App />);
    const bigCard = screen.getByRole('link', { name: /big text/i });
    fireEvent.click(bigCard);
    expect(screen.getByPlaceholderText(/type something/i)).toBeInTheDocument();
    expect(window.location.pathname).toBe('/big');

    // Simulate browser Back button: URL goes to /
    window.history.replaceState({}, '', '/');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();

    // Simulate browser Forward button: URL goes to /big
    window.history.replaceState({}, '', '/big');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByPlaceholderText(/type something/i)).toBeInTheDocument();
  });

  it('allows modifier clicks (Ctrl, Cmd, Shift, middle-click) without preventDefault', () => {
    render(<App />);
    const pomoCard = screen.getByRole('link', { name: /cute pomo/i });

    // Ctrl+click should not navigate via SPA (lets browser handle new tab)
    fireEvent.click(pomoCard, { ctrlKey: true });
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();

    // Middle click (button 1) should not navigate via SPA
    fireEvent.click(pomoCard, { button: 1 });
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  describe('Route helper functions (parseRoute and getPathForView)', () => {
    it('parses valid paths correctly', () => {
      expect(parseRoute('/big')).toBe('big');
      expect(parseRoute('/timezone')).toBe('timezone');
      expect(parseRoute('/picker/')).toBe('picker');
      expect(parseRoute('/pomo')).toBe('pomo');
      expect(parseRoute('/pals')).toBe('pals');
      expect(parseRoute('/fractal')).toBe('fractal');
      expect(parseRoute('/biomorphs')).toBe('biomorphs');
    });

    it('parses hash fallback correctly', () => {
      expect(parseRoute('/', '#/big')).toBe('big');
      expect(parseRoute('/', '#timezone')).toBe('timezone');
      expect(parseRoute('/', '#picker')).toBe('picker');
      expect(parseRoute('/', '#/pomo')).toBe('pomo');
      expect(parseRoute('/', '#/pals')).toBe('pals');
      expect(parseRoute('/', '#/fractal')).toBe('fractal');
      expect(parseRoute('/', '#/biomorphs')).toBe('biomorphs');
    });

    it('falls back to hub for unknown or empty paths', () => {
      expect(parseRoute('/')).toBe('hub');
      expect(parseRoute('', '')).toBe('hub');
      expect(parseRoute('/nonexistent-tool')).toBe('hub');
      expect(parseRoute('/', '#unknown')).toBe('hub');
    });

    it('returns proper paths for views', () => {
      expect(getPathForView('hub')).toBe('/');
      expect(getPathForView('big')).toBe('/big');
      expect(getPathForView('timezone')).toBe('/timezone');
      expect(getPathForView('picker')).toBe('/picker');
      expect(getPathForView('pomo')).toBe('/pomo');
      expect(getPathForView('pals')).toBe('/pals');
      expect(getPathForView('fractal')).toBe('/fractal');
      expect(getPathForView('biomorphs')).toBe('/biomorphs');
    });
  });
});
