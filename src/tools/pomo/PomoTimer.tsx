import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playChime } from './audio';
import './PomoTimer.css';

export interface PomoTimerProps {
  onBack: () => void;
}

export type PomoPhase = 'focus' | 'shortBreak' | 'longBreak';

export interface PomoPrefs {
  focusDuration: number;
  shortBreakDuration: number;
  longBreakDuration: number;
  autoStart: boolean;
  isMuted: boolean;
  totalCompleted: number;
}

const STORAGE_KEY = 'tools_hub_pomo_prefs';

const DEFAULT_PREFS: PomoPrefs = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStart: false,
  isMuted: false,
  totalCompleted: 0,
};

function loadStoredPrefs(): PomoPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    const parsed = JSON.parse(raw);
    return {
      focusDuration: Number(parsed.focusDuration) || DEFAULT_PREFS.focusDuration,
      shortBreakDuration: Number(parsed.shortBreakDuration) || DEFAULT_PREFS.shortBreakDuration,
      longBreakDuration: Number(parsed.longBreakDuration) || DEFAULT_PREFS.longBreakDuration,
      autoStart: Boolean(parsed.autoStart),
      isMuted: Boolean(parsed.isMuted),
      totalCompleted: Number(parsed.totalCompleted) || 0,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

function savePrefs(prefs: PomoPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage quota or permission errors
  }
}

interface MascotProps {
  phase: PomoPhase;
  isRunning: boolean;
  isFinishedAlert: boolean;
}

export function PomoMascot({ phase, isRunning, isFinishedAlert }: MascotProps) {
  let mascotClass = 'pomo-mascot';
  if (isFinishedAlert) {
    mascotClass += ' pomo-celebrating';
  } else if (isRunning) {
    mascotClass += phase === 'focus' ? ' pomo-breathing' : ' pomo-relaxing';
  }

  return (
    <div className={mascotClass} data-testid="pomo-mascot" data-phase={phase}>
      <svg
        viewBox="0 0 160 160"
        className="pomo-mascot-svg"
        role="img"
        aria-label={`Sprouting Tomato Mascot in ${phase} mode`}
      >
        <defs>
          <radialGradient id="tomatoBodyGrad" cx="40%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="45%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </radialGradient>
          <radialGradient id="sproutGrad" cx="40%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#15803d" />
          </radialGradient>
        </defs>

        {/* Soft ground shadow */}
        <ellipse cx="80" cy="148" rx="42" ry="7" fill="rgba(0, 0, 0, 0.25)" />

        {/* Tomato Body */}
        <path
          d="M 80 44 C 114 42 136 66 136 96 C 136 126 112 144 80 144 C 48 144 24 126 24 96 C 24 66 46 42 80 44 Z"
          fill="url(#tomatoBodyGrad)"
          stroke="#9f1239"
          strokeWidth="2.5"
        />

        {/* Soft Blush Cheeks */}
        <ellipse cx="48" cy="106" rx="8" ry="4.5" fill="#fbcfe8" opacity="0.7" />
        <ellipse cx="112" cy="106" rx="8" ry="4.5" fill="#fbcfe8" opacity="0.7" />

        {/* Top Sprout / Leaves */}
        <g className="pomo-sprout">
          {/* Stem */}
          <path
            d="M 80 42 Q 78 22 72 14 Q 82 22 84 42 Z"
            fill="#15803d"
            stroke="#14532d"
            strokeWidth="1.5"
          />
          {/* Leaves resting on head */}
          {/* Left leaf */}
          <path
            d="M 80 44 Q 58 32 46 38 Q 62 48 80 44"
            fill="url(#sproutGrad)"
            stroke="#15803d"
            strokeWidth="1.5"
          />
          {/* Right leaf */}
          <path
            d="M 80 44 Q 102 32 114 38 Q 98 48 80 44"
            fill="url(#sproutGrad)"
            stroke="#15803d"
            strokeWidth="1.5"
          />
          {/* Center Leaf */}
          <path
            d="M 80 44 Q 78 24 81 22 Q 83 30 80 44"
            fill="url(#sproutGrad)"
            stroke="#15803d"
            strokeWidth="1.5"
          />
        </g>

        {/* Facial Expressions based on Phase */}
        {phase === 'focus' && (
          <g className="pomo-face-focus">
            {/* Focused Eyebrows */}
            <line x1="52" y1="80" x2="68" y2="84" stroke="#881337" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="108" y1="80" x2="92" y2="84" stroke="#881337" strokeWidth="2.5" strokeLinecap="round" />

            {/* Focused Pupils */}
            <circle cx="60" cy="94" r="7.5" fill="#0f172a" />
            <circle cx="58" cy="91.5" r="2.8" fill="#ffffff" />
            <circle cx="100" cy="94" r="7.5" fill="#0f172a" />
            <circle cx="98" cy="91.5" r="2.8" fill="#ffffff" />

            {/* Determined tiny smile */}
            <path
              d="M 75 106 Q 80 110 85 106"
              fill="none"
              stroke="#881337"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        )}

        {phase === 'shortBreak' && (
          <g className="pomo-face-short-break">
            {/* Peaceful closed curved smiling eyes */}
            <path
              d="M 52 94 Q 60 84 68 94"
              fill="none"
              stroke="#881337"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
            <path
              d="M 92 94 Q 100 84 108 94"
              fill="none"
              stroke="#881337"
              strokeWidth="3.2"
              strokeLinecap="round"
            />

            {/* Contented smile */}
            <path
              d="M 74 105 Q 80 113 86 105"
              fill="none"
              stroke="#881337"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            {/* Cute Steaming Mug */}
            <g className="pomo-cup" transform="translate(118, 106) scale(0.75)">
              <rect x="0" y="4" width="18" height="18" rx="3" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
              <path d="M 18 8 Q 25 12 18 17" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
              {/* Animated Steam */}
              <path className="steam-line steam-1" d="M 5 0 Q 3 -6 6 -11" fill="none" stroke="#bae6fd" strokeWidth="1.5" strokeLinecap="round" />
              <path className="steam-line steam-2" d="M 12 0 Q 14 -6 11 -11" fill="none" stroke="#bae6fd" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </g>
        )}

        {phase === 'longBreak' && (
          <g className="pomo-face-long-break">
            {/* Joyful Star / Cheerful Eyes */}
            <path
              d="M 52 92 Q 60 82 68 92"
              fill="none"
              stroke="#881337"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <path
              d="M 92 92 Q 100 82 108 92"
              fill="none"
              stroke="#881337"
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Big Open Happy Smile with Tongue */}
            <path
              d="M 72 102 Q 80 118 88 102 Z"
              fill="#881337"
            />
            <ellipse cx="80" cy="111" rx="4.5" ry="3.2" fill="#fda4af" />

            {/* Sparkles around Pomo */}
            <g className="pomo-sparkles">
              <path d="M 32 60 L 34 54 L 40 52 L 34 50 L 32 44 L 30 50 L 24 52 L 30 54 Z" fill="#fbbf24" />
              <path d="M 128 58 L 130 52 L 136 50 L 130 48 L 128 42 L 126 48 L 120 50 L 126 52 Z" fill="#fbbf24" />
              <circle cx="28" cy="74" r="2" fill="#38bdf8" />
              <circle cx="134" cy="72" r="2" fill="#38bdf8" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
}

export default function PomoTimer({ onBack }: PomoTimerProps) {
  const [prefs, setPrefs] = useState<PomoPrefs>(loadStoredPrefs);
  const [phase, setPhase] = useState<PomoPhase>('focus');
  const [cycleStep, setCycleStep] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinishedAlert, setIsFinishedAlert] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  // Duration in minutes for current phase
  const getPhaseDuration = useCallback(
    (p: PomoPhase): number => {
      switch (p) {
        case 'focus':
          return prefs.focusDuration;
        case 'shortBreak':
          return prefs.shortBreakDuration;
        case 'longBreak':
          return prefs.longBreakDuration;
      }
    },
    [prefs.focusDuration, prefs.shortBreakDuration, prefs.longBreakDuration]
  );

  const [timeLeft, setTimeLeft] = useState<number>(prefs.focusDuration * 60);
  const timeLeftRef = useRef<number>(prefs.focusDuration * 60);

  // Keep track of settings inputs
  const [customFocus, setCustomFocus] = useState<string>(String(prefs.focusDuration));
  const [customShortBreak, setCustomShortBreak] = useState<string>(String(prefs.shortBreakDuration));
  const [customLongBreak, setCustomLongBreak] = useState<string>(String(prefs.longBreakDuration));
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // Sync prefs changes to localStorage
  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  // Dynamic Browser Tab Title
  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    const phaseLabel =
      phase === 'focus' ? 'Focus' : phase === 'shortBreak' ? 'Short Break' : 'Long Break';

    document.title = `(${timeStr}) 🍅 ${phaseLabel} · Tools Hub`;
  }, [timeLeft, phase]);

  // Restore Tools Hub title on unmount
  useEffect(() => {
    return () => {
      document.title = 'Tools Hub';
    };
  }, []);

  // Timer Tick Engine
  const advanceToNextPhase = useCallback(() => {
    playChime(prefs.isMuted);
    setIsFinishedAlert(true);
    setTimeout(() => setIsFinishedAlert(false), 2500);

    if (phase === 'focus') {
      setPrefs((prev) => ({
        ...prev,
        totalCompleted: prev.totalCompleted + 1,
      }));

      if (cycleStep < 4) {
        const nextTime = prefs.shortBreakDuration * 60;
        timeLeftRef.current = nextTime;
        setPhase('shortBreak');
        setTimeLeft(nextTime);
      } else {
        const nextTime = prefs.longBreakDuration * 60;
        timeLeftRef.current = nextTime;
        setPhase('longBreak');
        setTimeLeft(nextTime);
      }
    } else if (phase === 'shortBreak') {
      const nextTime = prefs.focusDuration * 60;
      timeLeftRef.current = nextTime;
      setPhase('focus');
      setCycleStep((prev) => prev + 1);
      setTimeLeft(nextTime);
    } else {
      // Long Break ended, reset to cycle 1
      const nextTime = prefs.focusDuration * 60;
      timeLeftRef.current = nextTime;
      setPhase('focus');
      setCycleStep(1);
      setTimeLeft(nextTime);
    }

    if (!prefs.autoStart) {
      setIsRunning(false);
    }
  }, [phase, cycleStep, prefs.isMuted, prefs.autoStart, prefs.focusDuration, prefs.shortBreakDuration, prefs.longBreakDuration]);

  const advanceRef = useRef(advanceToNextPhase);
  useEffect(() => {
    advanceRef.current = advanceToNextPhase;
  }, [advanceToNextPhase]);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      if (timeLeftRef.current <= 1) {
        timeLeftRef.current = 0;
        setTimeLeft(0);
        advanceRef.current();
      } else {
        timeLeftRef.current -= 1;
        setTimeLeft(timeLeftRef.current);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Controls
  const handleTogglePlay = () => {
    setIsRunning((prev) => !prev);
  };

  const handleReset = () => {
    setIsRunning(false);
    const d = getPhaseDuration(phase) * 60;
    timeLeftRef.current = d;
    setTimeLeft(d);
  };

  const handleSkip = () => {
    setIsRunning(false);
    if (phase === 'focus') {
      if (cycleStep < 4) {
        const nextTime = prefs.shortBreakDuration * 60;
        timeLeftRef.current = nextTime;
        setPhase('shortBreak');
        setTimeLeft(nextTime);
      } else {
        const nextTime = prefs.longBreakDuration * 60;
        timeLeftRef.current = nextTime;
        setPhase('longBreak');
        setTimeLeft(nextTime);
      }
    } else if (phase === 'shortBreak') {
      const nextTime = prefs.focusDuration * 60;
      timeLeftRef.current = nextTime;
      setPhase('focus');
      setCycleStep((prev) => prev + 1);
      setTimeLeft(nextTime);
    } else {
      const nextTime = prefs.focusDuration * 60;
      timeLeftRef.current = nextTime;
      setPhase('focus');
      setCycleStep(1);
      setTimeLeft(nextTime);
    }
  };

  const handleAddMinute = () => {
    timeLeftRef.current += 60;
    setTimeLeft(timeLeftRef.current);
  };

  const handleSubtractMinute = () => {
    timeLeftRef.current = Math.max(0, timeLeftRef.current - 60);
    setTimeLeft(timeLeftRef.current);
  };

  const handleSelectPhase = (targetPhase: PomoPhase) => {
    if (targetPhase === phase) return;
    setIsRunning(false);
    const d = getPhaseDuration(targetPhase) * 60;
    timeLeftRef.current = d;
    setPhase(targetPhase);
    setTimeLeft(d);
  };

  const handleToggleMute = () => {
    setPrefs((prev) => ({
      ...prev,
      isMuted: !prev.isMuted,
    }));
  };

  const handleOpenSettings = () => {
    setCustomFocus(String(prefs.focusDuration));
    setCustomShortBreak(String(prefs.shortBreakDuration));
    setCustomLongBreak(String(prefs.longBreakDuration));
    setSettingsError(null);
    setIsSettingsOpen(true);
  };

  const handleCloseSettings = () => {
    setSettingsError(null);
    setIsSettingsOpen(false);
  };

  useEffect(() => {
    if (!isSettingsOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCloseSettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen]);

  // Settings Save & Validation
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const f = parseInt(customFocus, 10);
    const sb = parseInt(customShortBreak, 10);
    const lb = parseInt(customLongBreak, 10);

    if (isNaN(f) || f < 1 || f > 90) {
      setSettingsError('Focus duration must be between 1 and 90 minutes.');
      return;
    }
    if (isNaN(sb) || sb < 1 || sb > 30) {
      setSettingsError('Short break must be between 1 and 30 minutes.');
      return;
    }
    if (isNaN(lb) || lb < 1 || lb > 60) {
      setSettingsError('Long break must be between 1 and 60 minutes.');
      return;
    }

    setSettingsError(null);
    setPrefs((prev) => ({
      ...prev,
      focusDuration: f,
      shortBreakDuration: sb,
      longBreakDuration: lb,
    }));

    // If currently paused, update current time left
    if (!isRunning) {
      if (phase === 'focus') {
        timeLeftRef.current = f * 60;
        setTimeLeft(f * 60);
      }
      if (phase === 'shortBreak') {
        timeLeftRef.current = sb * 60;
        setTimeLeft(sb * 60);
      }
      if (phase === 'longBreak') {
        timeLeftRef.current = lb * 60;
        setTimeLeft(lb * 60);
      }
    }

    setIsSettingsOpen(false);
  };

  const handleResetDefaults = () => {
    setCustomFocus(String(DEFAULT_PREFS.focusDuration));
    setCustomShortBreak(String(DEFAULT_PREFS.shortBreakDuration));
    setCustomLongBreak(String(DEFAULT_PREFS.longBreakDuration));
    setPrefs((prev) => ({
      ...prev,
      focusDuration: DEFAULT_PREFS.focusDuration,
      shortBreakDuration: DEFAULT_PREFS.shortBreakDuration,
      longBreakDuration: DEFAULT_PREFS.longBreakDuration,
    }));
    if (!isRunning) {
      if (phase === 'focus') {
        const d = DEFAULT_PREFS.focusDuration * 60;
        timeLeftRef.current = d;
        setTimeLeft(d);
      }
      if (phase === 'shortBreak') {
        const d = DEFAULT_PREFS.shortBreakDuration * 60;
        timeLeftRef.current = d;
        setTimeLeft(d);
      }
      if (phase === 'longBreak') {
        const d = DEFAULT_PREFS.longBreakDuration * 60;
        timeLeftRef.current = d;
        setTimeLeft(d);
      }
    }
    setSettingsError(null);
  };

  const handleResetStats = () => {
    setPrefs((prev) => ({
      ...prev,
      totalCompleted: 0,
    }));
    setCycleStep(1);
  };

  // Calculations for UI
  const totalPhaseSeconds = getPhaseDuration(phase) * 60;
  const progressRatio = totalPhaseSeconds > 0 ? Math.max(0, Math.min(1, timeLeft / totalPhaseSeconds)) : 0;
  const circleRadius = 135;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const minutesDisplay = Math.floor(timeLeft / 60);
  const secondsDisplay = timeLeft % 60;
  const timeFormatted = `${String(minutesDisplay).padStart(2, '0')}:${String(secondsDisplay).padStart(2, '0')}`;

  return (
    <div className="pomo-app-wrapper">
      <header className="pomo-header">
        <button
          className="pomo-back-btn"
          onClick={onBack}
          type="button"
          aria-label="Back to Tools Hub"
        >
          ← Back to Hub
        </button>

        <div className="pomo-header-actions">
          <button
            className={`pomo-icon-btn ${prefs.isMuted ? 'muted' : ''}`}
            onClick={handleToggleMute}
            type="button"
            title={prefs.isMuted ? 'Unmute alerts' : 'Mute alerts'}
            aria-label={prefs.isMuted ? 'Unmute alerts' : 'Mute alerts'}
          >
            {prefs.isMuted ? '🔇' : '🔔'}
          </button>
          <button
            className="pomo-icon-btn"
            onClick={handleOpenSettings}
            type="button"
            title="Timer Settings"
            aria-label="Timer Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      <main className="pomo-container">
        {/* Phase Selector Tabs */}
        <nav className="pomo-tabs" aria-label="Pomodoro Phase Modes">
          <button
            className={`pomo-tab-btn ${phase === 'focus' ? 'active' : ''}`}
            onClick={() => handleSelectPhase('focus')}
            type="button"
          >
            Focus
          </button>
          <button
            className={`pomo-tab-btn ${phase === 'shortBreak' ? 'active' : ''}`}
            onClick={() => handleSelectPhase('shortBreak')}
            type="button"
          >
            Short Break
          </button>
          <button
            className={`pomo-tab-btn ${phase === 'longBreak' ? 'active' : ''}`}
            onClick={() => handleSelectPhase('longBreak')}
            type="button"
          >
            Long Break
          </button>
        </nav>

        {/* Circular Progress & Mascot Stage */}
        <div className={`pomo-timer-card ${isFinishedAlert ? 'alert-pulse' : ''}`} data-phase={phase}>
          <div className="pomo-dial-container">
            <svg
              className="pomo-progress-ring"
              viewBox="0 0 300 300"
              aria-hidden="true"
            >
              <circle
                className="pomo-ring-bg"
                cx="150"
                cy="150"
                r={circleRadius}
              />
              <circle
                className="pomo-ring-progress"
                cx="150"
                cy="150"
                r={circleRadius}
                style={{
                  strokeDasharray: circumference,
                  strokeDashoffset,
                }}
              />
            </svg>

            <div className="pomo-dial-content">
              <PomoMascot
                phase={phase}
                isRunning={isRunning}
                isFinishedAlert={isFinishedAlert}
              />
              <div className="pomo-time-display" aria-live="polite">
                {timeFormatted}
              </div>
              <div className="pomo-phase-badge">
                {phase === 'focus' && 'Focus Session'}
                {phase === 'shortBreak' && 'Short Coffee Break'}
                {phase === 'longBreak' && 'Long Rest & Recharge 🎉'}
              </div>
            </div>
          </div>

          {/* Quick Adjustment Buttons */}
          <div className="pomo-micro-adjustments">
            <button
              className="pomo-adjust-btn"
              onClick={handleSubtractMinute}
              type="button"
              aria-label="Subtract one minute"
              title="-1 Minute"
            >
              -1m
            </button>
            <button
              className="pomo-adjust-btn"
              onClick={handleAddMinute}
              type="button"
              aria-label="Add one minute"
              title="+1 Minute"
            >
              +1m
            </button>
          </div>

          {/* Primary Controls */}
          <div className="pomo-controls">
            <button
              className="pomo-btn pomo-btn-secondary"
              onClick={handleReset}
              type="button"
              aria-label="Reset timer"
            >
              Reset
            </button>

            <button
              className={`pomo-btn pomo-btn-primary ${isRunning ? 'running' : ''}`}
              onClick={handleTogglePlay}
              type="button"
              aria-label={isRunning ? 'Pause timer' : 'Start timer'}
            >
              {isRunning ? 'Pause' : 'Start'}
            </button>

            <button
              className="pomo-btn pomo-btn-secondary"
              onClick={handleSkip}
              type="button"
              aria-label="Skip to next phase"
            >
              Skip
            </button>
          </div>

          {/* 4-Session Cycle Indicator & Streak */}
          <div className="pomo-cycle-tracker">
            <div className="pomo-cycle-dots" aria-label={`Cycle progress: step ${cycleStep} of 4`}>
              {[1, 2, 3, 4].map((step) => {
                const isCompleted = step < cycleStep;
                const isCurrent = step === cycleStep;
                return (
                  <span
                    key={step}
                    className={`cycle-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    title={`Session ${step} of 4 ${isCompleted ? '(done)' : isCurrent ? '(active)' : ''}`}
                  >
                    {isCompleted ? '🍅' : isCurrent ? '🌱' : '⚪'}
                  </span>
                );
              })}
            </div>
            <div className="pomo-cycle-tally">
              Cycle <strong>{cycleStep}/4</strong> · Lifetime:{' '}
              <span className="pomo-tally-number">{prefs.totalCompleted}</span> 🍅
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal Drawer */}
      {isSettingsOpen && (
        <div
          className="pomo-modal-backdrop"
          onClick={handleCloseSettings}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pomo-settings-title"
        >
          <div
            className="pomo-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pomo-modal-header">
              <h2 id="pomo-settings-title">Timer Settings</h2>
              <button
                className="pomo-modal-close"
                onClick={handleCloseSettings}
                type="button"
                aria-label="Close settings"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleSaveSettings}
              className="pomo-settings-form"
              data-testid="pomo-settings-form"
            >
              {settingsError && (
                <div className="pomo-settings-error" role="alert">
                  {settingsError}
                </div>
              )}

              <div className="pomo-form-group">
                <label htmlFor="focus-duration-input">Focus Duration (minutes):</label>
                <input
                  id="focus-duration-input"
                  type="number"
                  min="1"
                  max="90"
                  value={customFocus}
                  onChange={(e) => setCustomFocus(e.target.value)}
                  required
                />
              </div>

              <div className="pomo-form-group">
                <label htmlFor="short-break-input">Short Break Duration (minutes):</label>
                <input
                  id="short-break-input"
                  type="number"
                  min="1"
                  max="30"
                  value={customShortBreak}
                  onChange={(e) => setCustomShortBreak(e.target.value)}
                  required
                />
              </div>

              <div className="pomo-form-group">
                <label htmlFor="long-break-input">Long Break Duration (minutes):</label>
                <input
                  id="long-break-input"
                  type="number"
                  min="1"
                  max="60"
                  value={customLongBreak}
                  onChange={(e) => setCustomLongBreak(e.target.value)}
                  required
                />
              </div>

              <div className="pomo-form-group-toggle">
                <label className="pomo-toggle-label">
                  <input
                    type="checkbox"
                    checked={prefs.autoStart}
                    onChange={(e) =>
                      setPrefs((prev) => ({ ...prev, autoStart: e.target.checked }))
                    }
                  />
                  <span>Auto-start next phase automatically</span>
                </label>
              </div>

              <div className="pomo-modal-actions">
                <button
                  type="button"
                  className="pomo-btn-text"
                  onClick={handleResetDefaults}
                >
                  Reset Defaults (25/5/15)
                </button>
                <button
                  type="button"
                  className="pomo-btn-text pomo-danger"
                  onClick={handleResetStats}
                >
                  Clear Stats
                </button>
                <button type="submit" className="pomo-btn pomo-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
