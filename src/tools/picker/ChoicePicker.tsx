import { useState, useEffect, useRef, useId, useCallback } from 'react';
import ToolHeader from '../../shared/components/ToolHeader';
import SegmentedControl from '../../shared/components/SegmentedControl';
import { usePersistedState } from '../../shared/hooks/usePersistedState';
import { useTimeoutRegistry } from '../../shared/hooks/useTimeoutRegistry';
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

interface ChoicePoolState {
  active: string[];
  eliminated: string[];
}

const PRESETS: Record<string, string[]> = {
  'Yes / No / Maybe': ['Yes', 'No', 'Maybe'],
  'What to Eat': ['Pizza', 'North Indian', 'South Indian', 'Sandwiches', 'Chaat', 'Chinese'],
  'Who Goes First': ['Asha', 'Siddharth', 'Amma', 'Appa'],
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

const EMPTY_COIN_STATS: CoinStats = {
  heads: 0,
  tails: 0,
  total: 0,
  streak: { side: null, count: 0 },
};

const DEFAULT_CHOICES_TEXT = PRESETS['What to Eat'].join('\n');

function isNonNegativeInt(val: unknown): val is number {
  return typeof val === 'number' && Number.isInteger(val) && val >= 0;
}

function validateCoinStats(raw: unknown): CoinStats {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return EMPTY_COIN_STATS;
  }
  const obj = raw as Record<string, unknown>;
  if (
    !isNonNegativeInt(obj.heads) ||
    !isNonNegativeInt(obj.tails) ||
    !isNonNegativeInt(obj.total)
  ) {
    return EMPTY_COIN_STATS;
  }
  const streakRaw = obj.streak;
  if (!streakRaw || typeof streakRaw !== 'object' || Array.isArray(streakRaw)) {
    return EMPTY_COIN_STATS;
  }
  const streakObj = streakRaw as Record<string, unknown>;
  const side = streakObj.side;
  if (side !== null && side !== 'heads' && side !== 'tails') {
    return EMPTY_COIN_STATS;
  }
  if (!isNonNegativeInt(streakObj.count)) {
    return EMPTY_COIN_STATS;
  }
  return {
    heads: obj.heads,
    tails: obj.tails,
    total: obj.total,
    streak: { side, count: streakObj.count },
  };
}

function validateDiceHistory(raw: unknown): RollRecord[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const valid: RollRecord[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const rec = item as Record<string, unknown>;
    if (
      typeof rec.id === 'string' &&
      typeof rec.time === 'string' &&
      typeof rec.sum === 'number' &&
      Number.isFinite(rec.sum) &&
      Array.isArray(rec.dice) &&
      rec.dice.length > 0 &&
      rec.dice.every((d) => typeof d === 'number' && Number.isInteger(d) && d >= 1 && d <= 6)
    ) {
      valid.push({
        id: rec.id,
        dice: [...rec.dice],
        sum: rec.sum,
        time: rec.time,
      });
    }
    if (valid.length >= 15) break;
  }
  return valid;
}

function validateChoiceHistory(raw: unknown): PickRecord[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const valid: PickRecord[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.id === 'string' && typeof rec.item === 'string' && typeof rec.time === 'string') {
      valid.push({
        id: rec.id,
        item: rec.item,
        time: rec.time,
      });
    }
    if (valid.length >= 15) break;
  }
  return valid;
}

function validateCustomChoices(raw: unknown): string {
  return typeof raw === 'string' && raw.length > 0 ? raw : DEFAULT_CHOICES_TEXT;
}

function parseChoices(text: string): string[] {
  // If text contains newlines, delimit by line; otherwise allow comma separation
  const delimiter = text.includes('\n') ? '\n' : text.includes(',') ? ',' : '\n';
  return text
    .split(delimiter)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

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

const MODE_OPTIONS = [
  { value: 'choices', label: '🎡 Multiple Choice' },
  { value: 'coin', label: '🪙 Coin Toss' },
  { value: 'dice', label: '🎲 Dice Roll' },
] as const;

export default function ChoicePicker({ onBack }: ChoicePickerProps) {
  const [mode, setMode] = useState<Mode>('choices');
  const textareaId = useId();

  // --- Confetti Canvas & Timer Registry ---
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiAnimRef = useRef<number | null>(null);
  const historyIdCounterRef = useRef(0);
  const timeouts = useTimeoutRegistry();

  const nextHistoryId = () => {
    historyIdCounterRef.current += 1;
    return `${Date.now()}-${historyIdCounterRef.current}`;
  };

  useEffect(() => {
    return () => {
      if (confettiAnimRef.current !== null) {
        cancelAnimationFrame(confettiAnimRef.current);
        confettiAnimRef.current = null;
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

    if (confettiAnimRef.current !== null) {
      cancelAnimationFrame(confettiAnimRef.current);
      confettiAnimRef.current = null;
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
        confettiAnimRef.current = null;
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
  const [coinStats, setCoinStats] = usePersistedState<CoinStats>(
    'picker_coin_stats',
    EMPTY_COIN_STATS,
    { validate: validateCoinStats }
  );

  const flipCoin = () => {
    if (isFlippingCoin) return;
    setIsFlippingCoin(true);

    const isHeads = getRandomInt(0, 1) === 0;
    const outcome = isHeads ? 'heads' : 'tails';

    const targetAngle = isHeads ? 0 : 180;
    const currentAngle = coinRotation % 360;
    const delta = (targetAngle - currentAngle + 360) % 360;
    const extraTurns = getRandomInt(5, 7) * 360;
    setCoinRotation((prev) => prev + extraTurns + delta);

    timeouts.schedule(() => {
      setCoinSide(outcome);
      setIsFlippingCoin(false);
      triggerConfetti();

      setCoinStats((prev) => {
        const newHeads = outcome === 'heads' ? prev.heads + 1 : prev.heads;
        const newTails = outcome === 'tails' ? prev.tails + 1 : prev.tails;
        const newTotal = prev.total + 1;
        const streakCount = prev.streak.side === outcome ? prev.streak.count + 1 : 1;
        return {
          heads: newHeads,
          tails: newTails,
          total: newTotal,
          streak: { side: outcome, count: streakCount },
        };
      });
    }, 1200);
  };

  const resetCoinStats = () => {
    setCoinStats(EMPTY_COIN_STATS);
  };

  // ==========================================
  // MODE 2: DICE ROLL STATE & ACTIONS
  // ==========================================
  const [diceCount, setDiceCount] = useState<number>(2);
  const [diceValues, setDiceValues] = useState<number[]>([3, 4]);
  const [isRollingDice, setIsRollingDice] = useState(false);
  const [rollHistory, setRollHistory] = usePersistedState<RollRecord[]>(
    'picker_dice_history',
    [],
    { validate: validateDiceHistory }
  );

  const rollDice = () => {
    if (isRollingDice) return;
    setIsRollingDice(true);

    const newDice: number[] = [];
    for (let i = 0; i < diceCount; i++) {
      newDice.push(getRandomInt(1, 6));
    }

    timeouts.schedule(() => {
      setDiceValues(newDice);
      setIsRollingDice(false);
      triggerConfetti();

      const sum = newDice.reduce((acc, val) => acc + val, 0);
      const record: RollRecord = {
        id: nextHistoryId(),
        dice: newDice,
        sum,
        time: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      };

      setRollHistory((prev) => [record, ...prev].slice(0, 15));
    }, 650);
  };

  const clearDiceHistory = () => {
    setRollHistory([]);
  };

  // ==========================================
  // MODE 3: MULTIPLE CHOICE STATE & ACTIONS
  // ==========================================
  const [choiceView, setChoiceView] = useState<ChoiceView>('wheel');
  const [rawInput, setRawInput] = usePersistedState<string>(
    'picker_custom_choices',
    DEFAULT_CHOICES_TEXT,
    {
      serialize: (val) => val,
      deserialize: (raw) => raw,
      validate: validateCustomChoices,
    }
  );

  const [pool, setPool] = useState<ChoicePoolState>(() => ({
    active: parseChoices(rawInput),
    eliminated: [],
  }));
  const activePool = pool.active;
  const eliminatedItems = pool.eliminated;
  const [eliminateMode, setEliminateMode] = useState<boolean>(false);
  const [selectedWinner, setSelectedWinner] = useState<string | null>(null);
  const [isChoosing, setIsChoosing] = useState(false);
  const [wheelRotation, setWheelRotation] = useState<number>(0);
  const [pickHistory, setPickHistory] = usePersistedState<PickRecord[]>(
    'picker_choice_history',
    [],
    { validate: validateChoiceHistory }
  );

  const handleInputChange = (val: string) => {
    if (isChoosing) return;
    setRawInput(val);
    setPool({ active: parseChoices(val), eliminated: [] });
    setSelectedWinner(null);
  };

  const applyPreset = (presetName: string) => {
    if (isChoosing) return;
    const list = PRESETS[presetName] || [];
    const text = list.join('\n');
    handleInputChange(text);
  };

  const resetPool = () => {
    if (isChoosing) return;
    setPool({ active: parseChoices(rawInput), eliminated: [] });
    setSelectedWinner(null);
  };

  const finalizePick = (winner: string, shouldEliminate: boolean) => {
    setSelectedWinner(winner);
    setIsChoosing(false);
    triggerConfetti();

    const record: PickRecord = {
      id: nextHistoryId(),
      item: winner,
      time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    };
    setPickHistory((prev) => [record, ...prev].slice(0, 15));

    if (shouldEliminate) {
      setPool((prev) => {
        const idx = prev.active.indexOf(winner);
        if (idx === -1) return prev;
        return {
          active: [...prev.active.slice(0, idx), ...prev.active.slice(idx + 1)],
          eliminated: [...prev.eliminated, winner],
        };
      });
    }
  };

  const pickWinner = () => {
    if (isChoosing || activePool.length === 0) return;
    setIsChoosing(true);
    setSelectedWinner(null);

    const winnerIndex = getRandomInt(0, activePool.length - 1);
    const winner = activePool[winnerIndex];
    const eliminateSnapshot = eliminateMode;

    if (choiceView === 'wheel') {
      const numSlices = activePool.length;
      const sliceAngle = 360 / numSlices;
      const sliceCenter = (winnerIndex + 0.5) * sliceAngle;
      const targetDeg = (270 - sliceCenter + 360) % 360;

      const extraSpins = getRandomInt(6, 9) * 360;
      const currentMod = wheelRotation % 360;
      const delta = (targetDeg - currentMod + 360) % 360;
      const finalRotation = wheelRotation + extraSpins + delta;

      setWheelRotation(finalRotation);

      timeouts.schedule(() => {
        finalizePick(winner, eliminateSnapshot);
      }, 3600);
    } else {
      timeouts.schedule(() => {
        finalizePick(winner, eliminateSnapshot);
      }, 700);
    }
  };

  const clearPickHistory = () => {
    setPickHistory([]);
  };

  // SVG Wheel Path generator
  const renderWheelSvg = () => {
    const size = 320;
    const center = size / 2;
    const radius = center - 8;
    const count = activePool.length;

    if (count === 0) {
      return (
        <svg viewBox={`0 0 ${size} ${size}`} className="picker-wheel-svg" role="img" aria-label="Empty Wheel">
          <circle cx={center} cy={center} r={radius} fill="#1e293b" stroke="#334155" strokeWidth="4" />
          <text x={center} y={center} textAnchor="middle" fill="#94a3b8" dominantBaseline="middle" fontSize="14">
            No items in pool
          </text>
        </svg>
      );
    }

    if (count === 1) {
      return (
        <svg viewBox={`0 0 ${size} ${size}`} className="picker-wheel-svg" role="img" aria-label="Single Option Wheel">
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
        className="picker-wheel-svg"
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
                className="picker-slice-text"
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
      <div className="picker-dice-pip-grid" aria-label={`Die showing ${value}`}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((pos) => (
          <span
            key={pos}
            className={`picker-pip-cell ${activePips.includes(pos) ? 'has-pip' : ''}`.trim()}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="picker-container">
      {/* Confetti Overlay */}
      <canvas ref={confettiCanvasRef} className="picker-confetti-canvas" aria-hidden="true" />

      <ToolHeader
        onBack={onBack}
        title="Random Picker & Decision Maker"
        subtitle="Instant, unbiased, and playful decisions with zero ads or tracking."
        className="picker-header"
      />

      <SegmentedControl<Mode>
        mode="tablist"
        ariaLabel="Decision Modes"
        value={mode}
        onChange={setMode}
        className="picker-mode-tabs"
        options={MODE_OPTIONS}
      />

      {/* ============================================================== */}
      {/* VIEW: MULTIPLE CHOICE PICKER                                   */}
      {/* ============================================================== */}
      {mode === 'choices' && (
        <section className="picker-mode-content" aria-label="Multiple Choice Picker">
          <div className="picker-choices-grid">
            {/* Interactive Picker Column */}
            <div className="picker-display-card">
              <SegmentedControl<ChoiceView>
                mode="group"
                ariaLabel="Picker Display Style"
                value={choiceView}
                onChange={setChoiceView}
                className="picker-sub-view-switch"
                options={[
                  { value: 'wheel', label: '🎡 Spinning Wheel', disabled: isChoosing },
                  { value: 'cards', label: '🃏 Instant Draw', disabled: isChoosing },
                ]}
              />

              {/* Visual Display */}
              <div className="picker-visual-stage">
                {choiceView === 'wheel' ? (
                  <div className="picker-wheel-wrapper">
                    <div className="picker-wheel-pointer" aria-hidden="true" />
                    {renderWheelSvg()}
                  </div>
                ) : (
                  <div className="picker-cards-wrapper">
                    <div
                      className={`picker-draw-card ${isChoosing ? 'shuffling' : ''} ${selectedWinner ? 'revealed' : ''}`.trim()}
                    >
                      <div className="picker-card-face picker-card-back">
                        <span className="picker-mystery-mark">?</span>
                        <span className="picker-mystery-hint">Click Pick to Reveal</span>
                      </div>
                      <div className="picker-card-face picker-card-front">
                        <span className="picker-winner-label">Selected:</span>
                        <strong className="picker-winner-title">{selectedWinner || '—'}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="picker-action-row">
                <button
                  type="button"
                  className="picker-primary-action-btn"
                  onClick={pickWinner}
                  disabled={isChoosing || activePool.length === 0}
                  aria-label={isChoosing ? 'Choosing winner' : 'Pick a Winner'}
                >
                  {isChoosing ? 'Choosing...' : '🎯 Pick a Winner!'}
                </button>
              </div>

              {/* Winner Announcement Banner */}
              {selectedWinner && (
                <div className="picker-winner-banner" role="status" aria-live="polite">
                  <span className="picker-winner-star">🎉</span>
                  <div className="picker-winner-text">
                    <span className="picker-winner-caption">Winner</span>
                    <strong className="picker-winner-value">{selectedWinner}</strong>
                  </div>
                </div>
              )}

              {/* Elimination status & reset button */}
              {eliminateMode && (
                <div className="picker-elimination-bar">
                  <span>
                    Pool Remaining: <strong>{activePool.length}</strong> · Eliminated:{' '}
                    <strong>{eliminatedItems.length}</strong>
                  </span>
                  {eliminatedItems.length > 0 && (
                    <button
                      type="button"
                      className="picker-text-btn"
                      onClick={resetPool}
                      disabled={isChoosing}
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
              <div className="picker-preset-group" aria-label="Presets">
                <span className="picker-preset-label">Quick Presets:</span>
                <div className="picker-preset-chips">
                  {Object.keys(PRESETS).map((p) => (
                    <button
                      key={p}
                      type="button"
                      className="picker-preset-chip"
                      onClick={() => applyPreset(p)}
                      disabled={isChoosing}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Area */}
              <div className="picker-input-group">
                <label htmlFor={textareaId}>
                  Enter Choices <span className="picker-label-sub">(one per line)</span>:
                </label>
                <textarea
                  id={textareaId}
                  className="picker-choice-textarea"
                  rows={6}
                  value={rawInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Pizza&#10;North Indian&#10;South Indian&#10;Chaat"
                  disabled={isChoosing}
                />
              </div>

              {/* Elimination Toggle */}
              <div className="picker-toggle-group">
                <label className="picker-checkbox-label">
                  <input
                    type="checkbox"
                    checked={eliminateMode}
                    onChange={(e) => setEliminateMode(e.target.checked)}
                    disabled={isChoosing}
                  />
                  <span>Eliminate picked option (Raffle / No repeats)</span>
                </label>
              </div>

              {/* Pick History */}
              <div className="picker-history-group">
                <div className="picker-history-header">
                  <h4>Recent Picks</h4>
                  {pickHistory.length > 0 && (
                    <button
                      type="button"
                      className="picker-clear-btn"
                      onClick={clearPickHistory}
                      aria-label="Clear Pick History"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {pickHistory.length === 0 ? (
                  <p className="picker-empty-history">No picks yet.</p>
                ) : (
                  <ul className="picker-history-list">
                    {pickHistory.map((rec) => (
                      <li key={rec.id} className="picker-history-item">
                        <span className="picker-history-name">{rec.item}</span>
                        <time className="picker-history-time">{rec.time}</time>
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
        <section className="picker-mode-content" aria-label="Coin Toss">
          <div className="picker-coin-layout">
            <div className="picker-coin-display-card">
              <div className="picker-coin-stage">
                <div
                  className={`picker-coin ${isFlippingCoin ? 'flipping' : ''}`.trim()}
                  style={{
                    transform: `rotateY(${coinRotation}deg)`,
                    transition: isFlippingCoin ? 'transform 1.2s cubic-bezier(0.2, 0.9, 0.3, 1)' : 'none',
                  }}
                  aria-label={`Coin showing ${coinSide || 'heads'}`}
                >
                  <div className="picker-coin-side picker-coin-heads">
                    <span className="picker-coin-glyph">👑</span>
                    <span className="picker-coin-text">HEADS</span>
                  </div>
                  <div className="picker-coin-side picker-coin-tails">
                    <span className="picker-coin-glyph">⚡</span>
                    <span className="picker-coin-text">TAILS</span>
                  </div>
                </div>
              </div>

              <div className="picker-coin-action-row">
                <button
                  type="button"
                  className="picker-primary-action-btn"
                  onClick={flipCoin}
                  disabled={isFlippingCoin}
                  aria-label="Flip Coin"
                >
                  {isFlippingCoin ? 'Flipping...' : '🪙 Flip Coin'}
                </button>
              </div>

              {coinSide && !isFlippingCoin && (
                <div className="picker-coin-outcome-banner" role="status" aria-live="polite">
                  <span>Outcome: </span>
                  <strong>{coinSide.toUpperCase()}</strong>
                </div>
              )}
            </div>

            {/* Coin Stats Card */}
            <div className="picker-coin-stats-card">
              <div className="picker-stats-header">
                <h3>Flip Statistics</h3>
                <button
                  type="button"
                  className="picker-clear-btn"
                  onClick={resetCoinStats}
                  aria-label="Reset Coin Statistics"
                >
                  Reset Stats
                </button>
              </div>

              <div className="picker-stats-metric-grid">
                <div className="picker-stat-box">
                  <span className="picker-stat-label">Total Flips</span>
                  <span className="picker-stat-value">{coinStats.total}</span>
                </div>
                <div className="picker-stat-box">
                  <span className="picker-stat-label">Heads</span>
                  <span className="picker-stat-value">
                    {coinStats.heads}{' '}
                    <small className="picker-stat-pct">
                      ({coinStats.total > 0 ? Math.round((coinStats.heads / coinStats.total) * 100) : 0}%)
                    </small>
                  </span>
                </div>
                <div className="picker-stat-box">
                  <span className="picker-stat-label">Tails</span>
                  <span className="picker-stat-value">
                    {coinStats.tails}{' '}
                    <small className="picker-stat-pct">
                      ({coinStats.total > 0 ? Math.round((coinStats.tails / coinStats.total) * 100) : 0}%)
                    </small>
                  </span>
                </div>
                <div className="picker-stat-box">
                  <span className="picker-stat-label">Current Streak</span>
                  <span className="picker-stat-value">
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
        <section className="picker-mode-content" aria-label="Dice Roll">
          <div className="picker-dice-layout">
            <div className="picker-dice-display-card">
              {/* Dice Quantity Selector */}
              <div className="picker-dice-count-selector" role="group" aria-label="Number of Dice">
                <span className="picker-selector-label">Number of Dice:</span>
                <div className="picker-dice-count-buttons">
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <button
                      key={num}
                      type="button"
                      className={`picker-dice-count-btn ${diceCount === num ? 'active' : ''}`.trim()}
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
              <div className="picker-dice-stage">
                <div className={`picker-dice-collection ${isRollingDice ? 'tumbling' : ''}`.trim()}>
                  {diceValues.map((val, idx) => (
                    <div key={`${idx}-${val}`} className="picker-die-item">
                      {renderDicePips(val)}
                    </div>
                  ))}
                </div>
              </div>

              {/* Total & Action */}
              <div className="picker-dice-total-banner" role="status" aria-live="polite">
                <span className="picker-dice-total-label">Sum Total:</span>
                <span className="picker-dice-total-sum">
                  {diceValues.reduce((acc, curr) => acc + curr, 0)}
                </span>
                <span className="picker-dice-breakdown">({diceValues.join(' + ')})</span>
              </div>

              <div className="picker-dice-action-row">
                <button
                  type="button"
                  className="picker-primary-action-btn"
                  onClick={rollDice}
                  disabled={isRollingDice}
                  aria-label="Roll Dice"
                >
                  {isRollingDice ? 'Rolling...' : '🎲 Roll Dice'}
                </button>
              </div>
            </div>

            {/* Roll History Card */}
            <div className="picker-dice-history-card">
              <div className="picker-history-header">
                <h3>Roll History</h3>
                {rollHistory.length > 0 && (
                  <button
                    type="button"
                    className="picker-clear-btn"
                    onClick={clearDiceHistory}
                    aria-label="Clear Dice History"
                  >
                    Clear
                  </button>
                )}
              </div>

              {rollHistory.length === 0 ? (
                <p className="picker-empty-history">No rolls recorded yet.</p>
              ) : (
                <ul className="picker-history-list">
                  {rollHistory.map((rec) => (
                    <li key={rec.id} className="picker-history-item">
                      <div className="picker-dice-hist-left">
                        <strong className="picker-dice-hist-sum">Total {rec.sum}</strong>
                        <span className="picker-dice-hist-dice">[{rec.dice.join(', ')}]</span>
                      </div>
                      <time className="picker-history-time">{rec.time}</time>
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
