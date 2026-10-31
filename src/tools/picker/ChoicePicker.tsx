import { useState, useEffect, useRef, useId, useCallback } from 'react';
import './ChoicePicker.css';

interface ChoicePickerProps {
  onBack: () => void;
}

type Mode = 'coin' | 'dice' | 'choices';
type ChoiceView = 'wheel' | 'cards';

interface CoinStats {
  heads: number;
  tails: number;
  total: number;
  streak: {
    side: 'heads' | 'tails' | null;
    count: number;
  };
}

interface RollRecord {
  id: string;
  dice: number[];
  sum: number;
  time: string;
}

interface PickRecord {
  id: string;
  item: string;
  time: string;
}

const PRESETS: Record<string, string[]> = {
  'Yes / No / Maybe': ['Yes', 'No', 'Maybe'],
  'What to Eat': ['Pizza', 'Sushi', 'Tacos', 'Burgers', 'Pasta', 'Salad'],
  'Who Goes First': ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
  'Numbers 1–10': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
};

const SLICE_COLORS = [
  '#0284c7', // Sky
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#ea580c', // Orange
  '#eab308', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#d946ef', // Fuchsia
  '#14b8a6', // Teal
  '#3b82f6', // Blue
];

// Helper for crypto random int between min (inclusive) and max (inclusive)
function getRandomInt(min: number, max: number): number {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const range = max - min + 1;
    const array = new Uint32Array(1);
    window.crypto.getRandomValues(array);
    return min + (array[0] % range);
  }
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Particle effect for celebration
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  radius: number;
  alpha: number;
  rotation: number;
  vr: number;
}

export default function ChoicePicker({ onBack }: ChoicePickerProps) {
  const [mode, setMode] = useState<Mode>('choices');
  const textareaId = useId();

  // --- Confetti Canvas Ref ---
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiAnimRef = useRef<number | null>(null);
  const activeTimersRef = useRef<number[]>([]);

  const registerTimeout = useCallback((fn: () => void, delayMs: number) => {
    const id = window.setTimeout(() => {
      activeTimersRef.current = activeTimersRef.current.filter((t) => t !== id);
      fn();
    }, delayMs);
    activeTimersRef.current.push(id);
    return id;
  }, []);

  useEffect(() => {
    const activeTimers = activeTimersRef.current;
    return () => {
      for (const t of activeTimers) {
        window.clearTimeout(t);
      }
      if (confettiAnimRef.current) {
        cancelAnimationFrame(confettiAnimRef.current);
      }
    };
  }, []);

  const triggerConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const particles: Particle[] = [];
    const colors = ['#38bdf8', '#818cf8', '#f472b6', '#34d399', '#facc15', '#fb923c'];

    for (let i = 0; i < 65; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.7) * 12,
        color: colors[Math.floor(Math.random() * colors.length)],
        radius: Math.random() * 4 + 2,
        alpha: 1,
        rotation: Math.random() * 360,
        vr: (Math.random() - 0.5) * 10,
      });
    }

    if (confettiAnimRef.current) {
      cancelAnimationFrame(confettiAnimRef.current);
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let activeCount = 0;

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.alpha -= 0.015;
        p.rotation += p.vr;

        if (p.alpha > 0) {
          activeCount++;
          ctx.save();
          ctx.globalAlpha = Math.max(0, p.alpha);
          ctx.fillStyle = p.color;
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
          ctx.restore();
        }
      }

      if (activeCount > 0) {
        confettiAnimRef.current = requestAnimationFrame(render);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    confettiAnimRef.current = requestAnimationFrame(render);
  }, []);


  // ==========================================
  // MODE 1: COIN TOSS STATE & ACTIONS
  // ==========================================
  const [coinSide, setCoinSide] = useState<'heads' | 'tails' | null>('heads');
  const [isFlippingCoin, setIsFlippingCoin] = useState(false);
  const [coinRotation, setCoinRotation] = useState(0);
  const [coinStats, setCoinStats] = useState<CoinStats>(() => {
    try {
      const saved = localStorage.getItem('picker_coin_stats');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore localStorage errors
    }
    return {
      heads: 0,
      tails: 0,
      total: 0,
      streak: { side: null, count: 0 },
    };
  });

  const flipCoin = () => {
    if (isFlippingCoin) return;
    setIsFlippingCoin(true);

    const isHeads = getRandomInt(0, 1) === 0;
    const outcome = isHeads ? 'heads' : 'tails';

    // Calculate rotation so the visual orientation strictly aligns with heads (0 deg mod 360) or tails (180 deg mod 360)
    const targetAngle = isHeads ? 0 : 180;
    const currentAngle = coinRotation % 360;
    const delta = (targetAngle - currentAngle + 360) % 360;
    const extraTurns = getRandomInt(5, 7) * 360;
    setCoinRotation((prev) => prev + extraTurns + delta);

    registerTimeout(() => {
      setCoinSide(outcome);
      setIsFlippingCoin(false);
      triggerConfetti();

      setCoinStats((prev) => {
        const newHeads = outcome === 'heads' ? prev.heads + 1 : prev.heads;
        const newTails = outcome === 'tails' ? prev.tails + 1 : prev.tails;
        const newTotal = prev.total + 1;
        const streakCount = prev.streak.side === outcome ? prev.streak.count + 1 : 1;
        const updated: CoinStats = {
          heads: newHeads,
          tails: newTails,
          total: newTotal,
          streak: { side: outcome, count: streakCount },
        };
        try {
          localStorage.setItem('picker_coin_stats', JSON.stringify(updated));
        } catch {
          // Ignore storage quota
        }
        return updated;
      });
    }, 1200);
  };

  const resetCoinStats = () => {
    const empty: CoinStats = { heads: 0, tails: 0, total: 0, streak: { side: null, count: 0 } };
    setCoinStats(empty);
    try {
      localStorage.removeItem('picker_coin_stats');
    } catch {
      // Ignore
    }
  };

  // ==========================================
  // MODE 2: DICE ROLL STATE & ACTIONS
  // ==========================================
  const [diceCount, setDiceCount] = useState<number>(2);
  const [diceValues, setDiceValues] = useState<number[]>([3, 4]);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [rollHistory, setRollHistory] = useState<RollRecord[]>(() => {
    try {
      const saved = localStorage.getItem('picker_dice_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  const rollDice = () => {
    if (isRollingDice) return;
    setIsRollingDice(true);

    const newDice: number[] = [];
    for (let i = 0; i < diceCount; i++) {
      newDice.push(getRandomInt(1, 6));
    }

    registerTimeout(() => {
      setDiceValues(newDice);
      setIsRollingDice(false);
      triggerConfetti();

      const sum = newDice.reduce((acc, val) => acc + val, 0);
      const record: RollRecord = {
        id: Date.now().toString(),
        dice: newDice,
        sum,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };

      setRollHistory((prev) => {
        const updated = [record, ...prev].slice(0, 15);
        try {
          localStorage.setItem('picker_dice_history', JSON.stringify(updated));
        } catch {
          // Ignore
        }
        return updated;
      });
    }, 650);
  };

  const clearDiceHistory = () => {
    setRollHistory([]);
    try {
      localStorage.removeItem('picker_dice_history');
    } catch {
      // Ignore
    }
  };

  // ==========================================
  // MODE 3: MULTIPLE CHOICE STATE & ACTIONS
  // ==========================================
  const [choiceView, setChoiceView] = useState<ChoiceView>('wheel');
  const [rawInput, setRawInput] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('picker_custom_choices');
      if (saved) return saved;
    } catch {
      // Ignore
    }
    return PRESETS['What to Eat'].join('\n');
  });

  const parseChoices = (text: string): string[] => {
    // If text contains newlines, delimit by line; otherwise allow comma separation
    const delimiter = text.includes('\n') ? '\n' : (text.includes(',') ? ',' : '\n');
    return text
      .split(delimiter)
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  };

  const [activePool, setActivePool] = useState<string[]>(() => parseChoices(rawInput));
  const [eliminatedItems, setEliminatedItems] = useState<string[]>([]);
  const [eliminateMode, setEliminateMode] = useState<boolean>(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [isChoosing, setIsChoosing] = useState(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [pickHistory, setPickHistory] = useState<PickRecord[]>(() => {
    try {
      const saved = localStorage.getItem('picker_choice_history');
      if (saved) return JSON.parse(saved);
    } catch {
      // Ignore
    }
    return [];
  });

  // Keep active pool in sync if input changes and user hasn't eliminated yet
  const handleInputChange = (val: string) => {
    setRawInput(val);
    try {
      localStorage.setItem('picker_custom_choices', val);
    } catch {
      // Ignore
    }
    const parsed = parseChoices(val);
    setActivePool(parsed);
    setEliminatedItems([]);
    setSelectedWinner(null);
  };

  const applyPreset = (presetName: string) => {
    const list = PRESETS[presetName] || [];
    const text = list.join('\n');
    handleInputChange(text);
  };

  const resetPool = () => {
    const parsed = parseChoices(rawInput);
    setActivePool(parsed);
    setEliminatedItems([]);
    setSelectedWinner(null);
  };

  const pickWinner = () => {
    if (isChoosing || activePool.length === 0) return;
    setIsChoosing(true);
    setSelectedWinner(null);

    const winnerIndex = getRandomInt(0, activePool.length - 1);
    const winner = activePool[winnerIndex];

    if (choiceView === 'wheel') {
      const numSlices = activePool.length;
      const sliceAngle = 360 / numSlices;
      // Slice winnerIndex center angle is: (winnerIndex + 0.5) * sliceAngle
      // In our SVG layout, 0 deg is right (3 o'clock). Top pointer is at 270 deg (12 o'clock).
      // We want slice winnerIndex center to land at 270 deg after rotation R:
      // (R + sliceCenter) % 360 = 270  ==>  R % 360 = (270 - sliceCenter + 360) % 360
      const sliceCenter = (winnerIndex + 0.5) * sliceAngle;
      const targetDeg = (270 - sliceCenter + 360) % 360;

      // Add 6 to 9 full spins
      const extraSpins = getRandomInt(6, 9) * 360;
      const currentMod = wheelRotation % 360;
      const delta = (targetDeg - currentMod + 360) % 360;
      const finalRotation = wheelRotation + extraSpins + delta;

      setWheelRotation(finalRotation);

      registerTimeout(() => {
        finalizePick(winner);
      }, 3600);
    } else {
      // Cards / Instant Draw mode
      registerTimeout(() => {
        finalizePick(winner);
      }, 700);
    }
  };

  const finalizePick = (winner: string) => {
    setSelectedWinner(winner);
    setIsChoosing(false);
    triggerConfetti();

    // Log history
    const record: PickRecord = {
      id: Date.now().toString(),
      item: winner,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
    setPickHistory((prev) => {
      const updated = [record, ...prev].slice(0, 15);
      try {
        localStorage.setItem('picker_choice_history', JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return updated;
    });

    // Handle elimination mode (single-ticket removal to support weighted/duplicate choices)
    if (eliminateMode) {
      setActivePool((prev) => {
        const idx = prev.indexOf(winner);
        if (idx === -1) return prev;
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)];
      });
      setEliminatedItems((prev) => [...prev, winner]);
    }
  };

  const clearPickHistory = () => {
    setPickHistory([]);
    try {
      localStorage.removeItem('picker_choice_history');
    } catch {
      // Ignore
    }
  };

  // SVG Wheel Path generator
  const renderWheelSvg = () => {
    const size = 320;
    const center = size / 2;
    const radius = center - 8;
    const count = activePool.length;

    if (count === 0) {
      return (
        <svg viewBox={`0 0 ${size} ${size}`} className="wheel-svg" role="img" aria-label="Empty Wheel">
          <circle cx={center} cy={center} r={radius} fill="#1e293b" stroke="#334155" strokeWidth="4" />
          <text x={center} y={center} textAnchor="middle" fill="#94a3b8" dominantBaseline="middle" fontSize="14">
            No items in pool
          </text>
        </svg>
      );
    }

    if (count === 1) {
      return (
        <svg viewBox={`0 0 ${size} ${size}`} className="wheel-svg" role="img" aria-label="Single Option Wheel">
          <circle cx={center} cy={center} r={radius} fill={SLICE_COLORS[0]} stroke="#0f172a" strokeWidth="3" />
          <text
            x={center}
            y={center}
            textAnchor="middle"
            fill="#ffffff"
            dominantBaseline="middle"
            fontWeight="bold"
            fontSize="16"
          >
            {activePool[0].length > 18 ? `${activePool[0].slice(0, 16)}...` : activePool[0]}
          </text>
        </svg>
      );
    }

    const anglePerSlice = 360 / count;

    return (
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="wheel-svg"
        style={{
          transform: `rotate(${wheelRotation}deg)`,
          transition: isChoosing ? 'transform 3.5s cubic-bezier(0.12, 0.8, 0.2, 1)' : 'none',
        }}
        role="img"
        aria-label="Spinning Wheel"
      >
        {activePool.map((item, idx) => {
          const startAngle = (idx * anglePerSlice * Math.PI) / 180;
          const endAngle = (((idx + 1) * anglePerSlice) * Math.PI) / 180;
          const midAngle = (((idx + 0.5) * anglePerSlice) * Math.PI) / 180;

          const x1 = center + radius * Math.cos(startAngle);
          const y1 = center + radius * Math.sin(startAngle);
          const x2 = center + radius * Math.cos(endAngle);
          const y2 = center + radius * Math.sin(endAngle);

          const largeArcFlag = anglePerSlice > 180 ? 1 : 0;
          const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          const textRadius = radius * 0.65;
          const tx = center + textRadius * Math.cos(midAngle);
          const ty = center + textRadius * Math.sin(midAngle);
          const textRot = (idx + 0.5) * anglePerSlice;

          const label = item.length > 14 ? `${item.slice(0, 12)}…` : item;

          return (
            <g key={`${item}-${idx}`}>
              <path
                d={pathData}
                fill={SLICE_COLORS[idx % SLICE_COLORS.length]}
                stroke="#0f172a"
                strokeWidth="2.5"
              />
              <text
                x={tx}
                y={ty}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={count > 8 ? '10' : '12'}
                fontWeight="700"
                transform={`rotate(${textRot}, ${tx}, ${ty})`}
                className="slice-text"
              >
                {label}
              </text>
            </g>
          );
        })}
        {/* Center hub peg */}
        <circle cx={center} cy={center} r="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
        <circle cx={center} cy={center} r="8" fill="#38bdf8" />
      </svg>
    );
  };

  // Helper for rendering dice pip dots
  const renderDicePips = (value: number) => {
    // 3x3 grid dot positions: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    // 1: tl, 2: tc, 3: tr, 4: ml, 5: mc, 6: mr, 7: bl, 8: bc, 9: br
    const pipMap: Record<number, number[]> = {
      1: [5],
      2: [1, 9],
      3: [1, 5, 9],
      4: [1, 3, 7, 9],
      5: [1, 3, 5, 7, 9],
      6: [1, 3, 4, 6, 7, 9],
    };
    const activePips = pipMap[value] || [5];

    return (
      <div className="dice-pip-grid" aria-label={`Die showing ${value}`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((pos) => (
          <span
            key={pos}
            className={`pip-cell ${activePips.includes(pos) ? 'has-pip' : ''}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="picker-container">
      {/* Invisible Confetti Overlay */}
      <canvas ref={confettiCanvasRef} className="confetti-canvas" aria-hidden="true" />

      {/* Header with Back button */}
      <header className="picker-header">
        <button
          type="button"
          onClick={onBack}
          className="back-btn"
          aria-label="Back to Tools Hub"
        >
          <span className="back-arrow" aria-hidden="true">←</span>
          <span>Back to Tools Hub</span>
        </button>
        <div className="header-titles">
          <h1>Random Picker & Decision Maker</h1>
          <p>Instant, unbiased, and playful decisions with zero ads or tracking.</p>
        </div>
      </header>

      {/* Mode Navigation Tabs */}
      <nav className="mode-tabs" aria-label="Decision Modes">
        <button
          type="button"
          className={`mode-tab ${mode === 'choices' ? 'active' : ''}`}
          onClick={() => setMode('choices')}
          aria-pressed={mode === 'choices'}
        >
          <span className="mode-icon">🎡</span>
          <span>Multiple Choice</span>
        </button>
        <button
          type="button"
          className={`mode-tab ${mode === 'coin' ? 'active' : ''}`}
          onClick={() => setMode('coin')}
          aria-pressed={mode === 'coin'}
        >
          <span className="mode-icon">🪙</span>
          <span>Coin Toss</span>
        </button>
        <button
          type="button"
          className={`mode-tab ${mode === 'dice' ? 'active' : ''}`}
          onClick={() => setMode('dice')}
          aria-pressed={mode === 'dice'}
        >
          <span className="mode-icon">🎲</span>
          <span>Dice Roll</span>
        </button>
      </nav>

      {/* ============================================================== */}
      {/* VIEW: MULTIPLE CHOICE PICKER                                   */}
      {/* ============================================================== */}
      {mode === 'choices' && (
        <section className="mode-content choices-section" aria-label="Multiple Choice Picker">
          <div className="choices-grid">
            {/* Interactive Picker Column */}
            <div className="picker-display-card">
              {/* Choice View Switcher */}
              <div className="sub-view-switch" role="group" aria-label="Picker Display Style">
                <button
                  type="button"
                  className={`sub-btn ${choiceView === 'wheel' ? 'active' : ''}`}
                  onClick={() => setChoiceView('wheel')}
                  aria-pressed={choiceView === 'wheel'}
                >
                  🎡 Spinning Wheel
                </button>
                <button
                  type="button"
                  className={`sub-btn ${choiceView === 'cards' ? 'active' : ''}`}
                  onClick={() => setChoiceView('cards')}
                  aria-pressed={choiceView === 'cards'}
                >
                  🃏 Instant Draw
                </button>
              </div>

              {/* Visual Display */}
              <div className="visual-stage">
                {choiceView === 'wheel' ? (
                  <div className="wheel-wrapper">
                    <div className="wheel-pointer" aria-hidden="true" />
                    {renderWheelSvg()}
                  </div>
                ) : (
                  <div className="cards-wrapper">
                    <div className={`draw-card ${isChoosing ? 'shuffling' : ''} ${selectedWinner ? 'revealed' : ''}`}>
                      <div className="card-face card-back">
                        <span className="mystery-mark">?</span>
                        <span className="mystery-hint">Click Pick to Reveal</span>
                      </div>
                      <div className="card-face card-front">
                        <span className="winner-label">Selected:</span>
                        <strong className="winner-title">{selectedWinner || '—'}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="action-row">
                <button
                  type="button"
                  className="primary-action-btn"
                  onClick={pickWinner}
                  disabled={isChoosing || activePool.length === 0}
                  aria-label={isChoosing ? 'Choosing winner' : 'Pick a Winner'}
                >
                  {isChoosing ? 'Choosing...' : '🎯 Pick a Winner!'}
                </button>
              </div>

              {/* Winner Announcement Banner */}
              {selectedWinner && (
                <div className="winner-banner" role="status" aria-live="polite">
                  <span className="winner-star">🎉</span>
                  <div className="winner-text">
                    <span className="winner-caption">Winner</span>
                    <strong className="winner-value">{selectedWinner}</strong>
                  </div>
                </div>
              )}

              {/* Elimination status & reset button */}
              {eliminateMode && (
                <div className="elimination-bar">
                  <span>
                    Pool Remaining: <strong>{activePool.length}</strong> · Eliminated:{' '}
                    <strong>{eliminatedItems.length}</strong>
                  </span>
                  {eliminatedItems.length > 0 && (
                    <button
                      type="button"
                      className="text-btn"
                      onClick={resetPool}
                      aria-label="Reset Elimination Pool"
                    >
                      Reset Pool
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Configuration & Options Column */}
            <div className="picker-config-card">
              <h3>Custom Choices</h3>

              {/* Preset Buttons */}
              <div className="preset-group" aria-label="Presets">
                <span className="preset-label">Quick Presets:</span>
                <div className="preset-chips">
                  {Object.keys(PRESETS).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="preset-chip"
                      onClick={() => applyPreset(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="input-group">
                <label htmlFor={textareaId}>
                  Enter Choices <span className="label-sub">(one per line)</span>:
                </label>
                <textarea
                  id={textareaId}
                  className="choice-textarea"
                  rows={6}
                  value={rawInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Pizza&#10;Sushi&#10;Tacos&#10;Burgers"
                  disabled={isChoosing}
                />
              </div>

              {/* Elimination Toggle */}
              <div className="toggle-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={eliminateMode}
                    onChange={(e) => setEliminateMode(e.target.checked)}
                  />
                  <span>Eliminate picked option (Raffle / No repeats)</span>
                </label>
              </div>

              {/* Pick History */}
              <div className="history-group">
                <div className="history-header">
                  <h4>Recent Picks</h4>
                  {pickHistory.length > 0 && (
                    <button
                      type="button"
                      className="clear-btn"
                      onClick={clearPickHistory}
                      aria-label="Clear Pick History"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {pickHistory.length === 0 ? (
                  <p className="empty-history">No picks yet.</p>
                ) : (
                  <ul className="history-list">
                    {pickHistory.map((rec) => (
                      <li key={rec.id} className="history-item">
                        <span className="history-name">{rec.item}</span>
                        <time className="history-time">{rec.time}</time>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* VIEW: COIN TOSS                                                */}
      {/* ============================================================== */}
      {mode === 'coin' && (
        <section className="mode-content coin-section" aria-label="Coin Toss">
          <div className="coin-layout">
            <div className="coin-display-card">
              <div className="coin-stage">
                <div
                  className={`coin ${isFlippingCoin ? 'flipping' : ''}`}
                  style={{
                    transform: `rotateY(${coinRotation}deg)`,
                    transition: isFlippingCoin ? 'transform 1.2s cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                  }}
                  aria-label={`Coin showing ${coinSide || 'heads'}`}
                >
                  <div className="coin-side coin-heads">
                    <span className="coin-glyph">👑</span>
                    <span className="coin-text">HEADS</span>
                  </div>
                  <div className="coin-side coin-tails">
                    <span className="coin-glyph">⚡</span>
                    <span className="coin-text">TAILS</span>
                  </div>
                </div>
              </div>

              <div className="coin-action-row">
                <button
                  type="button"
                  className="primary-action-btn"
                  onClick={flipCoin}
                  disabled={isFlippingCoin}
                  aria-label="Flip Coin"
                >
                  {isFlippingCoin ? 'Flipping...' : '🪙 Flip Coin'}
                </button>
              </div>

              {coinSide && !isFlippingCoin && (
                <div className="coin-outcome-banner" role="status" aria-live="polite">
                  <span>Outcome: </span>
                  <strong>{coinSide.toUpperCase()}</strong>
                </div>
              )}
            </div>

            {/* Coin Stats Card */}
            <div className="coin-stats-card">
              <div className="stats-header">
                <h3>Flip Statistics</h3>
                <button
                  type="button"
                  className="clear-btn"
                  onClick={resetCoinStats}
                  aria-label="Reset Coin Statistics"
                >
                  Reset Stats
                </button>
              </div>

              <div className="stats-metric-grid">
                <div className="stat-box">
                  <span className="stat-label">Total Flips</span>
                  <span className="stat-value">{coinStats.total}</span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Heads</span>
                  <span className="stat-value">
                    {coinStats.heads}{' '}
                    <small className="stat-pct">
                      ({coinStats.total > 0 ? Math.round((coinStats.heads / coinStats.total) * 100) : 0}%)
                    </small>
                  </span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Tails</span>
                  <span className="stat-value">
                    {coinStats.tails}{' '}
                    <small className="stat-pct">
                      ({coinStats.total > 0 ? Math.round((coinStats.tails / coinStats.total) * 100) : 0}%)
                    </small>
                  </span>
                </div>
                <div className="stat-box">
                  <span className="stat-label">Current Streak</span>
                  <span className="stat-value">
                    {coinStats.streak.side
                      ? `${coinStats.streak.count} ${coinStats.streak.side.toUpperCase()}`
                      : 'None'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ============================================================== */}
      {/* VIEW: DICE ROLL                                                */}
      {/* ============================================================== */}
      {mode === 'dice' && (
        <section className="mode-content dice-section" aria-label="Dice Roll">
          <div className="dice-layout">
            <div className="dice-display-card">
              {/* Dice Quantity Selector */}
              <div className="dice-count-selector" role="group" aria-label="Number of Dice">
                <span className="selector-label">Number of Dice:</span>
                <div className="dice-count-buttons">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`dice-count-btn ${diceCount === num ? 'active' : ''}`}
                      onClick={() => {
                        setDiceCount(num);
                        const arr: number[] = [];
                        for (let i = 0; i < num; i++) arr.push(getRandomInt(1, 6));
                        setDiceValues(arr);
                      }}
                      disabled={isRollingDice}
                      aria-pressed={diceCount === num}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dice Stage */}
              <div className="dice-stage">
                <div className={`dice-collection ${isRollingDice ? 'tumbling' : ''}`}>
                  {diceValues.map((val, idx) => (
                    <div key={`${idx}-${val}`} className="die-item">
                      {renderDicePips(val)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Action */}
              <div className="dice-total-banner" role="status" aria-live="polite">
                <span className="dice-total-label">Sum Total:</span>
                <span className="dice-total-sum">
                  {diceValues.reduce((acc, curr) => acc + curr, 0)}
                </span>
                <span className="dice-breakdown">
                  ({diceValues.join(' + ')})
                </span>
              </div>

              <div className="dice-action-row">
                <button
                  type="button"
                  className="primary-action-btn"
                  onClick={rollDice}
                  disabled={isRollingDice}
                  aria-label="Roll Dice"
                >
                  {isRollingDice ? 'Rolling...' : '🎲 Roll Dice'}
                </button>
              </div>
            </div>

            {/* Roll History Card */}
            <div className="dice-history-card">
              <div className="history-header">
                <h3>Roll History</h3>
                {rollHistory.length > 0 && (
                  <button
                    type="button"
                    className="clear-btn"
                    onClick={clearDiceHistory}
                    aria-label="Clear Dice History"
                  >
                    Clear
                  </button>
                )}
              </div>

              {rollHistory.length === 0 ? (
                <p className="empty-history">No rolls recorded yet.</p>
              ) : (
                <ul className="history-list">
                  {rollHistory.map((rec) => (
                    <li key={rec.id} className="history-item">
                      <div className="dice-hist-left">
                        <strong className="dice-hist-sum">Total {rec.sum}</strong>
                        <span className="dice-hist-dice">[{rec.dice.join(', ')}]</span>
                      </div>
                      <time className="history-time">{rec.time}</time>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
