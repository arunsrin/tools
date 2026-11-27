import { useState, useEffect, useCallback, type MouseEvent } from 'react';
import './styles/tokens.css';
import './styles/primitives.css';
import './index.css';
import BigText from './tools/big/BigText';
import TimezoneConverter from './tools/timezone/TimezoneConverter';
import ChoicePicker from './tools/picker/ChoicePicker';
import PomoTimer from './tools/pomo/PomoTimer';
import Pals from './tools/pals/Pals';
import FractalExplorer from './tools/fractal/FractalExplorer';
import Biomorphs from './tools/biomorphs/Biomorphs';
import ChessWatermark from './components/ChessWatermark';
import ToolErrorBoundary from './shared/components/ToolErrorBoundary';
import {
  parseRoute,
  getPathForView,
  buildNormalizedUrl,
  TOOL_ROUTES,
  TOOL_BY_KEY,
  type ToolKey,
  type View,
} from './routes';

export default function App() {
  const [view, setView] = useState<View>(() =>
    parseRoute(window.location.pathname, window.location.hash)
  );

  // Sync state on browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setView(parseRoute(window.location.pathname, window.location.hash));
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Normalize URL bar if an invalid route redirected to hub or if hash fallback was used,
  // preserving query params and non-route hashes.
  useEffect(() => {
    const targetPath = getPathForView(view);
    const currentUrl =
      window.location.pathname + window.location.search + window.location.hash;
    const normalizedUrl = buildNormalizedUrl(
      targetPath,
      window.location.search,
      window.location.hash
    );

    if (currentUrl !== normalizedUrl) {
      window.history.replaceState({}, '', normalizedUrl);
    }
  }, [view]);

  const navigate = useCallback((nextView: View) => {
    const nextPath = getPathForView(nextView);
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
    setView(nextView);
  }, []);

  const handleBackToHub = useCallback(() => {
    navigate('hub');
  }, [navigate]);

  const handleCardClick =
    (targetView: ToolKey) => (e: MouseEvent<HTMLAnchorElement>) => {
      // Retain default browser behavior for modifier clicks or middle clicks (open in new tab)
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.shiftKey
      ) {
        return;
      }
      e.preventDefault();
      navigate(targetView);
    };

  if (view !== 'hub') {
    const toolTitle = TOOL_BY_KEY[view].title;
    let activeTool = null;

    if (view === 'big') {
      activeTool = <BigText onBack={handleBackToHub} />;
    } else if (view === 'timezone') {
      activeTool = <TimezoneConverter onBack={handleBackToHub} />;
    } else if (view === 'picker') {
      activeTool = <ChoicePicker onBack={handleBackToHub} />;
    } else if (view === 'pomo') {
      activeTool = <PomoTimer onBack={handleBackToHub} />;
    } else if (view === 'pals') {
      activeTool = <Pals onBack={handleBackToHub} />;
    } else if (view === 'fractal') {
      activeTool = <FractalExplorer onBack={handleBackToHub} />;
    } else if (view === 'biomorphs') {
      activeTool = <Biomorphs onBack={handleBackToHub} />;
    }

    return (
      <ToolErrorBoundary
        onBack={handleBackToHub}
        toolName={toolTitle}
        resetKey={view}
      >
        {activeTool}
      </ToolErrorBoundary>
    );
  }

  return (
    <div className="app-wrapper">
      <ChessWatermark />

      <div className="hub-container">
        <header className="hub-header">
          <span className="hub-badge">Utility Toolkit</span>
          <h1>Tools Hub</h1>
          <p>Simple, self-contained utilities crafted with zero bloat.</p>
        </header>

        <main className="tools-grid">
          <a
            href={TOOL_ROUTES.big}
            className="tool-card"
            onClick={handleCardClick('big')}
          >
            <div className="tool-icon">🔠</div>
            <h2>Big Text</h2>
            <p>Display large text to fill your entire screen. Perfect for noisy places.</p>
          </a>

          <a
            href={TOOL_ROUTES.biomorphs}
            className="tool-card featured"
            onClick={handleCardClick('biomorphs')}
          >
            <span className="tool-badge-featured">Featured</span>
            <div className="tool-icon">🧬</div>
            <h2>Biomorphs</h2>
            <p>Evolutionary Watchmaker: guide alien organism morphology through comparative duels.</p>
          </a>

          <a
            href={TOOL_ROUTES.pomo}
            className="tool-card"
            onClick={handleCardClick('pomo')}
          >
            <div className="tool-icon">🍅</div>
            <h2>Cute Pomo</h2>
            <p>Playful Pomodoro timer with Sprouting Tomato Buddy, chimes & cycle tracking.</p>
          </a>

          <a
            href={TOOL_ROUTES.pals}
            className="tool-card"
            onClick={handleCardClick('pals')}
          >
            <div className="tool-icon">🐾</div>
            <h2>Desktop Pals</h2>
            <p>Playful browser companions, physics playground, obstacles, toys & treats.</p>
          </a>

          <a
            href={TOOL_ROUTES.fractal}
            className="tool-card"
            onClick={handleCardClick('fractal')}
          >
            <div className="tool-icon">🌀</div>
            <h2>Fractal Explorer</h2>
            <p>Deep zoom Mandelbrot, Julia & Burning Ship sets with 4K wallpaper studio.</p>
          </a>

          <a
            href={TOOL_ROUTES.picker}
            className="tool-card"
            onClick={handleCardClick('picker')}
          >
            <div className="tool-icon">🎯</div>
            <h2>Random Picker</h2>
            <p>Playful coin flips, multi-dice rolls, and customizable spinning wheel picker.</p>
          </a>

          <a
            href={TOOL_ROUTES.timezone}
            className="tool-card"
            onClick={handleCardClick('timezone')}
          >
            <div className="tool-icon">🌐</div>
            <h2>Timezone Converter</h2>
            <p>Visual 3-day world clock, overlapping working hours & meeting planner.</p>
          </a>

          {/* Placeholder for future tools */}
          <div className="tool-card coming-soon" aria-disabled="true">
            <div className="tool-icon">✨</div>
            <h2>More Tools</h2>
            <p>Coming soon...</p>
          </div>
        </main>

        <footer className="hub-footer">
          <p className="attribution">
            Authored by{' '}
            <a href="https://www.arunsr.in/" target="_blank" rel="noopener noreferrer">
              Arun
            </a>{' '}
            · Co-authored by LLM
            <span className="dot-separator">•</span>
            <a
              href="https://github.com/arunsrin/tools"
              target="_blank"
              rel="noopener noreferrer"
              className="github-footer-link"
              aria-label="GitHub Repository"
              title="GitHub Repository"
            >
              <svg className="github-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
