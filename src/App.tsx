import { useState } from 'react';
import BigText from './tools/big/BigText';
import './index.css';

type View = 'hub' | 'big';

function App() {
  const [view, setView] = useState<View>('hub');

  if (view === 'big') {
    return <BigText onBack={() => setView('hub')} />;
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
