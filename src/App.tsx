import { useState } from 'react';
import BigText from './tools/big/BigText';
import TimezoneConverter from './tools/timezone/TimezoneConverter';
import NewsRiver from './tools/news-river/NewsRiver';
import './index.css';

type View = 'hub' | 'big' | 'timezone' | 'news-river';

function App() {
  const [view, setView] = useState<View>('hub');

  if (view === 'big') {
    return <BigText onBack={() => setView('hub')} />;
  }

  if (view === 'timezone') {
    return <TimezoneConverter onBack={() => setView('hub')} />;
  }

  if (view === 'news-river') {
    return <NewsRiver onBack={() => setView('hub')} />;
  }

  return (
    <div className="hub-container">
      <header>
        <h1>Tools Hub</h1>
        <p>Simple, self-contained utilities.</p>
      </header>
      
      <main className="tools-grid">
        <button className="tool-card" onClick={() => setView('big')}>
          <div className="tool-icon">🔠</div>
          <h2>Big Text</h2>
          <p>Display large text to fill your entire screen. Perfect for noisy places.</p>
        </button>

        <button className="tool-card" onClick={() => setView('timezone')}>
          <div className="tool-icon">🌐</div>
          <h2>Timezone Converter</h2>
          <p>Visual 3-day world clock, overlapping working hours & meeting planner.</p>
        </button>

        <button className="tool-card" onClick={() => setView('news-river')}>
          <div className="tool-icon">🌊</div>
          <h2>News River</h2>
          <p>Multi-feed aggregator inspired by popurls and skimfeed with column & river views.</p>
        </button>
        
        {/* Placeholder for future tools */}
        <div className="tool-card coming-soon">
          <div className="tool-icon">✨</div>
          <h2>More Tools</h2>
          <p>Coming soon...</p>
        </div>
      </main>

      <footer>
        <p>&copy; 2024 Tools Hub. GPLv3 Licensed.</p>
      </footer>
    </div>
  );
}

export default App;
