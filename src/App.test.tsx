import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import {
  parseRoute,
  parseToolRoute,
  getPathForView,
  buildNormalizedUrl,
  TOOL_ROUTES,
  TOOL_REGISTRY,
} from './routes';

let shouldCrashBigText = false;

vi.mock('./tools/big/BigText', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./tools/big/BigText')>();
  return {
    default: function MockableBigText(props: { onBack: () => void }) {
      if (shouldCrashBigText) {
        throw new Error('Simulated BigText failure');
      }
      return <actual.default {...props} />;
    },
  };
});

import App from './App';

describe('App (Tools Hub Dashboard & URL Routing)', () => {
  beforeEach(() => {
    shouldCrashBigText = false;
    window.history.replaceState({}, '', '/');
  });

  afterEach(() => {
    shouldCrashBigText = false;
    vi.restoreAllMocks();
  });

  it('renders the hub header, badge, ChessWatermark, and featured tools as accessible links', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
    expect(screen.getByText(/simple, self-contained utilities/i)).toBeInTheDocument();
    expect(screen.getByText(/utility toolkit/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /click the chess knight/i })).toBeInTheDocument();

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

  it('renders active tool cards in strictly alphabetical order matching TOOL_REGISTRY', () => {
    const { container } = render(<App />);
    const cardHeadings = Array.from(
      container.querySelectorAll('.tools-grid .tool-card:not(.coming-soon) h2')
    ).map((el) => el.textContent?.trim() || '');

    expect(cardHeadings).toEqual([
      'Big Text',
      'Biomorphs',
      'Cute Pomo',
      'Desktop Pals',
      'Fractal Explorer',
      'Random Picker',
      'Timezone Converter',
    ]);
    expect(cardHeadings).toEqual(TOOL_REGISTRY.map((entry) => entry.title));

    const sortedHeadings = [...cardHeadings].sort((a, b) => a.localeCompare(b));
    expect(cardHeadings).toEqual(sortedHeadings);
  });

  it('marks the Coming soon card as aria-disabled="true" and keeps user on hub when clicked', () => {
    render(<App />);
    const comingSoonHeading = screen.getByRole('heading', { level: 2, name: /more tools/i });
    const comingSoonCard = comingSoonHeading.closest('.tool-card');
    expect(comingSoonCard).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(comingSoonCard!);
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('renders a Featured badge on the Biomorphs card', () => {
    render(<App />);
    const biomorphsCard = screen.getByRole('link', { name: /biomorphs/i });
    expect(biomorphsCard).toHaveClass('featured');
    expect(biomorphsCard).toHaveTextContent(/featured/i);
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

    expect(window.location.pathname).toBe('/timezone');
    expect(screen.getByRole('heading', { level: 1, name: /world time & timezone converter/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('navigates to Big Text tool when its card is clicked, unmounts ChessWatermark, and returns to hub', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /click the chess knight/i })).toBeInTheDocument();

    const bigTextCard = screen.getByRole('link', { name: /big text/i });
    fireEvent.click(bigTextCard);

    expect(window.location.pathname).toBe('/big');
    expect(screen.queryByRole('button', { name: /click the chess knight/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/type something/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /click the chess knight/i })).toBeInTheDocument();
  });

  it('navigates to Random Picker tool when its card is clicked and back to hub', () => {
    render(<App />);
    const pickerCard = screen.getByRole('link', { name: /random picker/i });
    fireEvent.click(pickerCard);

    expect(window.location.pathname).toBe('/picker');
    expect(screen.getByRole('heading', { level: 1, name: /random picker & decision maker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('navigates to Cute Pomo tool and back to hub', () => {
    render(<App />);
    const pomoCard = screen.getByRole('link', { name: /cute pomo/i });
    fireEvent.click(pomoCard);

    expect(window.location.pathname).toBe('/pomo');
    expect(screen.getByTestId('pomo-mascot')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByText(/focus session/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('navigates to Desktop Pals tool and back to hub', () => {
    render(<App />);
    const palsCard = screen.getByRole('link', { name: /desktop pals/i });
    fireEvent.click(palsCard);

    expect(window.location.pathname).toBe('/pals');
    expect(screen.getByRole('heading', { level: 1, name: /desktop pals/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByTestId('pals-canvas')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('navigates to Fractal Explorer tool and back to hub', () => {
    render(<App />);
    const fractalCard = screen.getByRole('link', { name: /fractal explorer/i });
    fireEvent.click(fractalCard);

    expect(window.location.pathname).toBe('/fractal');
    expect(screen.getByRole('heading', { level: 1, name: /fractal explorer/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();
    expect(screen.getByTestId('fractal-canvas')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('navigates to Biomorphs tool when its card is clicked and back to hub', () => {
    render(<App />);
    const biomorphsCard = screen.getByRole('link', { name: /biomorphs/i });
    fireEvent.click(biomorphsCard);

    expect(window.location.pathname).toBe('/biomorphs');
    expect(screen.getByRole('heading', { level: 1, name: /biomorphs: the evolutionary watchmaker/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to tools hub/i })).toBeInTheDocument();

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

  it('handles hash fallback routes cleanly (e.g. #/timezone) and normalizes URL while preserving query params', () => {
    window.history.replaceState({}, '', '/#/timezone?tz=UTC');
    render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /world time & timezone converter/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/timezone');
    expect(window.location.search).toBe('?tz=UTC');
    expect(window.location.hash).toBe('');
  });

  it('preserves query parameters and non-route hashes on direct tool URL sync', () => {
    window.history.replaceState({}, '', '/big?text=hello#section');
    render(<App />);

    expect(screen.getByPlaceholderText(/type something/i)).toBeInTheDocument();
    expect(window.location.pathname).toBe('/big');
    expect(window.location.search).toBe('?text=hello');
    expect(window.location.hash).toBe('#section');
  });

  it('falls back gracefully to hub view on unrecognized or nested paths (e.g. /unknown-tool, /big/extra)', () => {
    window.history.replaceState({}, '', '/unknown-tool');
    const { unmount } = render(<App />);

    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
    unmount();

    window.history.replaceState({}, '', '/big/extra');
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('responds to browser back, forward, and invalid nested popstate events', () => {
    render(<App />);
    const bigCard = screen.getByRole('link', { name: /big text/i });
    fireEvent.click(bigCard);
    expect(screen.getByPlaceholderText(/type something/i)).toBeInTheDocument();
    expect(window.location.pathname).toBe('/big');

    window.history.replaceState({}, '', '/');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();

    window.history.replaceState({}, '', '/big');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByPlaceholderText(/type something/i)).toBeInTheDocument();

    window.history.replaceState({}, '', '/big/extra');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/');
  });

  it('allows modifier clicks (Ctrl, Meta, Shift, Alt, middle-click) without preventDefault', () => {
    render(<App />);
    const pomoCard = screen.getByRole('link', { name: /cute pomo/i });

    fireEvent.click(pomoCard, { ctrlKey: true });
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();

    fireEvent.click(pomoCard, { metaKey: true });
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();

    fireEvent.click(pomoCard, { shiftKey: true });
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();

    fireEvent.click(pomoCard, { altKey: true });
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();

    fireEvent.click(pomoCard, { button: 1 });
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  it('catches active tool rendering errors in ToolErrorBoundary and recovers back to hub', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    shouldCrashBigText = true;

    render(<App />);
    fireEvent.click(screen.getByRole('link', { name: /big text/i }));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: /big text encountered an error/i })).toBeInTheDocument();
    expect(screen.getByText(/simulated bigtext failure/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back to tools hub/i }));
    expect(window.location.pathname).toBe('/');
    expect(screen.getByRole('heading', { level: 1, name: /tools hub/i })).toBeInTheDocument();
  });

  describe('Route helper functions (parseToolRoute, parseRoute, getPathForView, buildNormalizedUrl)', () => {
    it('parses valid single-segment paths case-insensitively', () => {
      expect(parseRoute('/big')).toBe('big');
      expect(parseRoute('/BIG')).toBe('big');
      expect(parseRoute('/timezone')).toBe('timezone');
      expect(parseRoute('/picker/')).toBe('picker');
      expect(parseRoute('/pomo')).toBe('pomo');
      expect(parseRoute('/pals')).toBe('pals');
      expect(parseRoute('/fractal')).toBe('fractal');
      expect(parseRoute('/biomorphs')).toBe('biomorphs');
    });

    it('rejects trailing segments in parseToolRoute and falls back to hub in parseRoute', () => {
      expect(parseToolRoute('/big/extra')).toBeNull();
      expect(parseRoute('/big/extra')).toBe('hub');
      expect(parseToolRoute('/', '#/big/extra')).toBeNull();
      expect(parseRoute('/', '#/big/extra')).toBe('hub');
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

    it('preserves query params and non-route hashes in buildNormalizedUrl', () => {
      expect(buildNormalizedUrl('/timezone', '?tz=UTC', '#/timezone')).toBe('/timezone?tz=UTC');
      expect(buildNormalizedUrl('/timezone', '', '#/timezone?tz=UTC')).toBe('/timezone?tz=UTC');
      expect(buildNormalizedUrl('/big', '?mode=dark', '#preview')).toBe('/big?mode=dark#preview');
      expect(buildNormalizedUrl('/', '', '')).toBe('/');
    });
  });
});
