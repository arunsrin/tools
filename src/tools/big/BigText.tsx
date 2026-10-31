import { useState, useEffect, useRef, useCallback } from 'react';
import ThemeToggle from '../../components/ThemeToggle';
import {
  findBestFontSize,
  calculateResponsivePadding,
  MIN_FONT_SIZE,
  PRESETS,
  THEMES
} from './constants';
import './BigText.css';

interface BigTextProps {
  onBack: () => void;
}

const getStoredValue = (key: string, defaultValue: string): string => {
  try {
    return localStorage.getItem(key) || defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStoredValue = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Gracefully ignore storage quota / restricted exceptions
  }
};

function BigText({ onBack }: BigTextProps) {
  const [text, setText] = useState(() => getStoredValue('bigText', 'HELLO'));
  const [currentTheme, setCurrentTheme] = useState(() => getStoredValue('bigTheme', 'theme-dark'));
  const [isEditing, setIsEditing] = useState(true);
  const [fontSize, setFontSize] = useState(100);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setStoredValue('bigText', text);
  }, [text]);

  useEffect(() => {
    setStoredValue('bigTheme', currentTheme);
  }, [currentTheme]);

  const handlePresetClick = (preset: string) => {
    setText(preset);
    setIsEditing(false);
  };

  const calculateFontSize = useCallback(() => {
    if (!textRef.current || !containerRef.current || isEditing) return;

    const container = containerRef.current;
    const textElement = textRef.current;
    
    const { availableWidth, availableHeight } = calculateResponsivePadding(
      container.clientWidth,
      container.clientHeight
    );

    textElement.classList.remove('force-break');

    const minSize = MIN_FONT_SIZE;
    const bestSize = findBestFontSize(
      availableWidth,
      availableHeight,
      (size) => {
        textElement.style.fontSize = `${size}px`;
        return {
          width: textElement.scrollWidth,
          height: textElement.scrollHeight,
        };
      },
      minSize
    );
    
    textElement.style.fontSize = `${bestSize}px`;

    // Fallback: If even at the minimum font size floor the unbroken text overflows horizontally,
    // apply force-break to avoid horizontal clipping or window scrollbars.
    if (bestSize <= minSize && textElement.scrollWidth > availableWidth) {
      textElement.classList.add('force-break');
    } else {
      textElement.classList.remove('force-break');
    }

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
          <div className="big-bottom-actions">
            <button className="back-link" onClick={onBack}>
              ← Back to Tools Hub
            </button>
            <ThemeToggle />
          </div>
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
