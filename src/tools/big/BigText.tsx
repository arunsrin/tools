import { useState, useEffect, useRef, useCallback } from 'react';
import { findBestFontSize, PRESETS, THEMES } from './constants';
import './BigText.css';
interface BigTextProps {
  onBack: () => void;
}

function BigText({ onBack }: BigTextProps) {
  const [text, setText] = useState(localStorage.getItem('bigText') || 'HELLO');
  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('bigTheme') || 'theme-dark');
  const [isEditing, setIsEditing] = useState(true);
  const [fontSize, setFontSize] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const presets = PRESETS;

  const themes = THEMES;

  useEffect(() => {
    localStorage.setItem('bigText', text);
  }, [text]);

  useEffect(() => {
    localStorage.setItem('bigTheme', currentTheme);
  }, [currentTheme]);

  const handlePresetClick = (preset: string) => {
    setText(preset);
    setIsEditing(false);
  };

  const calculateFontSize = useCallback(() => {
    if (!textRef.current || !containerRef.current || isEditing) return;

    const container = containerRef.current;
    const textElement = textRef.current;
    
    // Add 40px padding total (20px per side) to ensure text doesn't touch edges
    const padding = 40;
    const availableWidth = Math.max(0, container.clientWidth - padding);
    const availableHeight = Math.max(0, container.clientHeight - padding);

    const bestSize = findBestFontSize(
      availableWidth,
      availableHeight,
      (size) => {
        textElement.style.fontSize = `${size}px`;
        return {
          width: textElement.scrollWidth,
          height: textElement.scrollHeight
        };
      }
    );
    
    setFontSize(bestSize);
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      // Small delay to ensure container is rendered and has dimensions
      const timer = setTimeout(calculateFontSize, 50);
      window.addEventListener('resize', calculateFontSize);
      return () => {
        window.removeEventListener('resize', calculateFontSize);
        clearTimeout(timer);
      };
    }
  }, [isEditing, calculateFontSize]);

  const handleDisplay = () => {
    if (text.trim()) {
      setIsEditing(false);
    }
  };

  const handleBack = () => {
    setIsEditing(true);
  };

  return (
    <div className={`app-container ${currentTheme}`} ref={containerRef}>
      {isEditing ? (
        <div className="edit-mode">
          <input
            type="text"
            className="input-field"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type something..."
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && handleDisplay()}
          />
          <button className="display-button" onClick={handleDisplay}>
            Make it BIG
          </button>
          <div className="presets-container">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                className="preset-button"
                onClick={() => handlePresetClick(preset)}
              >
                {preset}
              </button>
            ))}
          </div>
          <div className="themes-container">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                className={`theme-button ${theme.className} ${currentTheme === theme.id ? 'active' : ''}`}
                onClick={() => setCurrentTheme(theme.id)}
                title={theme.label}
                aria-label={`Select ${theme.label} theme`}
              />
            ))}
          </div>
          <button className="back-link" onClick={onBack}>
            ← Back to Tools Hub
          </button>
        </div>
      ) : (
        <div className="display-mode" onClick={handleBack}>
          <div 
            ref={textRef} 
            className="big-text" 
            style={{ fontSize: `${fontSize}px` }}
          >
            {text}
          </div>
          <div className="back-hint">Tap to edit</div>
        </div>
      )}
    </div>
  );
}

export default BigText;
