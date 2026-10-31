import React, { useState, useEffect, useRef } from 'react';
import { CHESS_QUOTES } from './chessQuotes';
import './ChessWatermark.css';

export const ChessWatermark: React.FC = () => {
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState<number | null>(null);
  const [isHopping, setIsHopping] = useState(false);
  const autoDismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerQuote = () => {
    setIsHopping(true);
    setTimeout(() => setIsHopping(false), 500);

    setCurrentQuoteIndex((prev) => {
      if (prev === null) {
        return Math.floor(Math.random() * CHESS_QUOTES.length);
      }
      return (prev + 1) % CHESS_QUOTES.length;
    });
  };

  useEffect(() => {
    if (currentQuoteIndex !== null) {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
      autoDismissTimerRef.current = setTimeout(() => {
        setCurrentQuoteIndex(null);
      }, 7000);
    }
    return () => {
      if (autoDismissTimerRef.current) {
        clearTimeout(autoDismissTimerRef.current);
      }
    };
  }, [currentQuoteIndex]);

  const activeQuote = currentQuoteIndex !== null ? CHESS_QUOTES[currentQuoteIndex] : null;

  return (
    <div className="chess-watermark-container">
      {/* Interactive Watermark SVG */}
      <div className="chess-watermark" aria-hidden="true">
        <svg viewBox="0 0 512 512" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="tools-chess-pattern" x="0" y="0" width="128" height="128" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="64" height="64" className="chess-sq-light" />
              <rect x="64" y="0" width="64" height="64" className="chess-sq-dark" />
              <rect x="0" y="64" width="64" height="64" className="chess-sq-dark" />
              <rect x="64" y="64" width="64" height="64" className="chess-sq-light" />
              <path d="M0,0 h128 M0,64 h128 M0,0 v128 M64,0 v128" className="chess-grid-line" />
            </pattern>
            <radialGradient id="tools-chess-radial-fade" cx="100%" cy="0%" r="115%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.75" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="75%" stopColor="#ffffff" stopOpacity="0.18" />
              <stop offset="92%" stopColor="#ffffff" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <mask id="tools-chess-fade-mask">
              <rect width="512" height="512" fill="url(#tools-chess-radial-fade)" />
            </mask>
          </defs>

          <g mask="url(#tools-chess-fade-mask)">
            <rect width="512" height="512" fill="url(#tools-chess-pattern)" />
            <rect width="512" height="512" fill="none" className="chess-board-frame" />
          </g>
        </svg>
      </div>

      {/* Interactive Knight Trigger Button */}
      <button
        type="button"
        className={`chess-knight-trigger ${isHopping ? 'hopping' : ''}`}
        onClick={triggerQuote}
        aria-label="Click the chess knight for a quote on chess, art, and strategy"
        title="Click for a chess quote"
      >
        <span className="chess-knight-piece">♞</span>
      </button>

      {/* Quote Toast / Popover */}
      {activeQuote && (
        <div className="chess-quote-popover" role="status" aria-live="polite">
          <button
            type="button"
            className="chess-quote-close"
            onClick={() => setCurrentQuoteIndex(null)}
            aria-label="Close chess quote"
          >
            ✕
          </button>
          <div className="chess-quote-content">
            <span className="chess-quote-icon">♟</span>
            <blockquote className="chess-quote-text">“{activeQuote.quote}”</blockquote>
            <cite className="chess-quote-author">— {activeQuote.author}</cite>
            {activeQuote.note && <span className="chess-quote-note">({activeQuote.note})</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChessWatermark;
