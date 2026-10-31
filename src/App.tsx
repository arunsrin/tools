import { useState } from 'react';
import BigText from './tools/big/BigText';
import TimezoneConverter from './tools/timezone/TimezoneConverter';
import ChoicePicker from './tools/picker/ChoicePicker';
import PomoTimer from './tools/pomo/PomoTimer';
import ChessWatermark from './components/ChessWatermark';
import './index.css';

type View = 'hub' | 'big' | 'timezone' | 'picker' | 'pomo';

export default function App() {
  const [view, setView] = useState<View>('hub');

  if (view === 'big') {
    return <BigText onBack={() => setView('hub')} />;
  }

  if (view === 'timezone') {
    return <TimezoneConverter onBack={() => setView('hub')} />;
  }

  if (view === 'picker') {
    return <ChoicePicker onBack={() => setView('hub')} />;
  }

  if (view === 'pomo') {
    return <PomoTimer onBack={() => setView('hub')} />;
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
          <button className="tool-card" onClick={() => setView('big')} type="button">
            <div className="tool-icon">🔠</div>
            <h2>Big Text</h2>
            <p>Display large text to fill your entire screen. Perfect for noisy places.</p>
          </button>

          <button className="tool-card" onClick={() => setView('timezone')} type="button">
            <div className="tool-icon">🌐</div>
            <h2>Timezone Converter</h2>
            <p>Visual 3-day world clock, overlapping working hours & meeting planner.</p>
          </button>

          <button className="tool-card" onClick={() => setView('picker')} type="button">
            <div className="tool-icon">🎯</div>
            <h2>Random Picker</h2>
            <p>Playful coin flips, multi-dice rolls, and customizable spinning wheel picker.</p>
          </button>

          <button className="tool-card" onClick={() => setView('pomo')} type="button">
            <div className="tool-icon">🍅</div>
            <h2>Cute Pomo</h2>
            <p>Playful Pomodoro timer with Sprouting Tomato Buddy, chimes & cycle tracking.</p>
          </button>

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
