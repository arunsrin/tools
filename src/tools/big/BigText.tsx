import { useState, useEffect, useRef, useCallback, type KeyboardEvent } from 'react';
import ToolHeader from '../../shared/components/ToolHeader';
import InlineAlert from '../../shared/components/InlineAlert';
import { usePersistedState } from '../../shared/hooks/usePersistedState';
import { useTimeoutRegistry } from '../../shared/hooks/useTimeoutRegistry';
import {
  findBestFontSize,
  calculateResponsivePadding,
  MIN_FONT_SIZE,
  PRESETS,
  THEMES,
} from './constants';
import './BigText.css';

interface BigTextProps {
  onBack: () => void;
}

const VALID_THEME_IDS = new Set(THEMES.map((theme) => theme.id));

function validateStoredText(raw: unknown): string {
  return typeof raw === 'string' && raw.length > 0 ? raw : 'HELLO';
}

function validateStoredTheme(raw: unknown): string {
  return typeof raw === 'string' && VALID_THEME_IDS.has(raw) ? raw : 'theme-dark';
}

function BigText({ onBack }: BigTextProps) {
  const [text, setText] = usePersistedState<string>('bigText', 'HELLO', {
    serialize: (value) => value,
    deserialize: (raw) => raw,
    validate: validateStoredText,
  });
  const [currentTheme, setCurrentTheme] = usePersistedState<string>('bigTheme', 'theme-dark', {
    serialize: (value) => value,
    deserialize: (raw) => raw,
    validate: validateStoredTheme,
  });
  const [isEditing, setIsEditing] = useState(true);
  const [fontSize, setFontSize] = useState(100);
  const [validationError, setValidationError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const timeouts = useTimeoutRegistry();

  const handlePresetClick = (preset: string) => {
    setValidationError(null);
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
      const timerId = timeouts.schedule(calculateFontSize, 50);
      const handleKeyDown = (event: globalThis.KeyboardEvent) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          setIsEditing(true);
        }
      };
      window.addEventListener('resize', calculateFontSize);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('resize', calculateFontSize);
        document.removeEventListener('keydown', handleKeyDown);
        timeouts.clear(timerId);
      };
    }
  }, [isEditing, calculateFontSize, timeouts]);

  const handleDisplay = () => {
    if (!text.trim()) {
      setValidationError('Please enter some text before displaying.');
      return;
    }
    setValidationError(null);
    setIsEditing(false);
  };

  const handleExitDisplay = () => {
    setIsEditing(true);
  };

  const handleDisplayKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Escape') {
      event.preventDefault();
      handleExitDisplay();
    }
  };

  return (
    <div
      className={`bigtext-root ${currentTheme} ${isEditing ? '' : 'is-displaying'}`.trim()}
      ref={containerRef}
    >
      {isEditing ? (
        <div className="bigtext-editor-shell">
          <ToolHeader
            onBack={onBack}
            title="Big Text"
            subtitle="Display giant, high-contrast text across your screen."
          />

          <div className="bigtext-edit-mode">
            {validationError && (
              <InlineAlert
                message={validationError}
                variant="error"
                onDismiss={() => setValidationError(null)}
              />
            )}

            <input
              type="text"
              className="bigtext-input-field"
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (validationError && e.target.value.trim()) {
                  setValidationError(null);
                }
              }}
              placeholder="Type something..."
              aria-label="Text to display"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleDisplay();
                }
              }}
            />

            <button
              type="button"
              className="bigtext-display-button"
              onClick={handleDisplay}
            >
              Make it BIG
            </button>

            <div className="bigtext-presets-container">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  className="bigtext-preset-button"
                  onClick={() => handlePresetClick(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>

            <div className="bigtext-themes-container">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  className={`bigtext-theme-button ${theme.className} ${currentTheme === theme.id ? 'active' : ''}`}
                  onClick={() => setCurrentTheme(theme.id)}
                  title={theme.label}
                  aria-label={`Select ${theme.label} theme`}
                  aria-pressed={currentTheme === theme.id}
                />
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <div
            className="bigtext-display-mode display-mode"
            role="button"
            tabIndex={0}
            aria-label="Tap or press Escape to exit display mode"
            onClick={handleExitDisplay}
            onKeyDown={handleDisplayKeyDown}
          >
            <div
              ref={textRef}
              className="big-text"
              style={{ fontSize: `${fontSize}px` }}
            >
              {text}
            </div>
            <div className="back-hint">Tap or press Esc to edit</div>
          </div>
          <button
            type="button"
            className="bigtext-display-hub-btn"
            onClick={onBack}
          >
            ← Back to Tools Hub
          </button>
        </>
      )}
    </div>
  );
}

export default BigText;
