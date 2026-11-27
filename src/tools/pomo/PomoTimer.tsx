import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import ToolHeader from '../../shared/components/ToolHeader';
import SegmentedControl from '../../shared/components/SegmentedControl';
import Modal from '../../shared/components/Modal';
import InlineAlert from '../../shared/components/InlineAlert';
import { useDocumentTitle } from '../../shared/hooks/useDocumentTitle';
import { usePersistedState } from '../../shared/hooks/usePersistedState';
import { useTimeoutRegistry, type TimeoutId } from '../../shared/hooks/useTimeoutRegistry';
import PomoMascot from './PomoMascot';
import { closeChimeAudio, playChime } from './audio';
import type { PomoPhase, PomoPrefs, PomoTimerProps } from './types';
import './PomoTimer.css';

const STORAGE_KEY = 'tools_hub_pomo_prefs';

const DEFAULT_PREFS: PomoPrefs = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  autoStart: false,
  isMuted: false,
  totalCompleted: 0,
};

function isFiniteIntInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

function validatePomoPrefs(raw: unknown): PomoPrefs {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return DEFAULT_PREFS;
  }
  const obj = raw as Record<string, unknown>;
  return {
    focusDuration: isFiniteIntInRange(obj.focusDuration, 1, 90)
      ? obj.focusDuration
      : DEFAULT_PREFS.focusDuration,
    shortBreakDuration: isFiniteIntInRange(obj.shortBreakDuration, 1, 30)
      ? obj.shortBreakDuration
      : DEFAULT_PREFS.shortBreakDuration,
    longBreakDuration: isFiniteIntInRange(obj.longBreakDuration, 1, 60)
      ? obj.longBreakDuration
      : DEFAULT_PREFS.longBreakDuration,
    autoStart: typeof obj.autoStart === 'boolean' ? obj.autoStart : DEFAULT_PREFS.autoStart,
    isMuted: typeof obj.isMuted === 'boolean' ? obj.isMuted : DEFAULT_PREFS.isMuted,
    totalCompleted:
      typeof obj.totalCompleted === 'number' &&
      Number.isInteger(obj.totalCompleted) &&
      obj.totalCompleted >= 0
        ? obj.totalCompleted
        : DEFAULT_PREFS.totalCompleted,
  };
}

function parseStrictPositiveInt(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

const PHASE_OPTIONS = [
  { value: 'focus', label: 'Focus' },
  { value: 'shortBreak', label: 'Short Break' },
  { value: 'longBreak', label: 'Long Break' },
] as const;

export default function PomoTimer({ onBack }: PomoTimerProps) {
  const [prefs, setPrefs] = usePersistedState<PomoPrefs>(STORAGE_KEY, DEFAULT_PREFS, {
    validate: validatePomoPrefs,
  });
  const [phase, setPhase] = useState<PomoPhase>('focus');
  const [cycleStep, setCycleStep] = useState<number>(1);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isFinishedAlert, setIsFinishedAlert] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);

  const timeouts = useTimeoutRegistry();
  const alertTimerRef = useRef<TimeoutId | null>(null);
  const targetEndTimeRef = useRef<number | null>(null);

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

  const [customFocus, setCustomFocus] = useState<string>(String(prefs.focusDuration));
  const [customShortBreak, setCustomShortBreak] = useState<string>(String(prefs.shortBreakDuration));
  const [customLongBreak, setCustomLongBreak] = useState<string>(String(prefs.longBreakDuration));
  const [settingsError, setSettingsError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      void closeChimeAudio();
    };
  }, []);

  const minutesDisplay = Math.floor(timeLeft / 60);
  const secondsDisplay = timeLeft % 60;
  const timeFormatted = `${String(minutesDisplay).padStart(2, '0')}:${String(secondsDisplay).padStart(2, '0')}`;
  const phaseLabel =
    phase === 'focus' ? 'Focus' : phase === 'shortBreak' ? 'Short Break' : 'Long Break';

  useDocumentTitle(`(${timeFormatted}) 🍅 ${phaseLabel} · Tools Hub`);

  const advanceToNextPhase = useCallback(() => {
    void playChime(prefs.isMuted);
    timeouts.clear(alertTimerRef.current);
    setIsFinishedAlert(true);
    alertTimerRef.current = timeouts.schedule(() => {
      setIsFinishedAlert(false);
      alertTimerRef.current = null;
    }, 2500);

    let nextTime = prefs.focusDuration * 60;
    if (phase === 'focus') {
      setPrefs((prev) => ({
        ...prev,
        totalCompleted: prev.totalCompleted + 1,
      }));

      if (cycleStep < 4) {
        nextTime = prefs.shortBreakDuration * 60;
        setPhase('shortBreak');
      } else {
        nextTime = prefs.longBreakDuration * 60;
        setPhase('longBreak');
      }
    } else if (phase === 'shortBreak') {
      nextTime = prefs.focusDuration * 60;
      setPhase('focus');
      setCycleStep((prev) => prev + 1);
    } else {
      nextTime = prefs.focusDuration * 60;
      setPhase('focus');
      setCycleStep(1);
    }

    timeLeftRef.current = nextTime;
    setTimeLeft(nextTime);

    if (prefs.autoStart) {
      targetEndTimeRef.current = Date.now() + nextTime * 1000;
    } else {
      targetEndTimeRef.current = null;
      setIsRunning(false);
    }
  }, [
    phase,
    cycleStep,
    prefs.isMuted,
    prefs.autoStart,
    prefs.focusDuration,
    prefs.shortBreakDuration,
    prefs.longBreakDuration,
    setPrefs,
    timeouts,
  ]);

  const advanceRef = useRef(advanceToNextPhase);
  useEffect(() => {
    advanceRef.current = advanceToNextPhase;
  }, [advanceToNextPhase]);

  useEffect(() => {
    if (!isRunning) {
      targetEndTimeRef.current = null;
      return;
    }

    if (targetEndTimeRef.current === null) {
      targetEndTimeRef.current = Date.now() + timeLeftRef.current * 1000;
    }

    const syncFromWallClock = () => {
      if (targetEndTimeRef.current === null) return;
      const remainingMs = targetEndTimeRef.current - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      if (remainingSec <= 0) {
        timeLeftRef.current = 0;
        setTimeLeft(0);
        advanceRef.current();
      } else if (remainingSec !== timeLeftRef.current) {
        timeLeftRef.current = remainingSec;
        setTimeLeft(remainingSec);
      }
    };

    const interval = setInterval(syncFromWallClock, 250);
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncFromWallClock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isRunning]);

  const handleTogglePlay = () => {
    setIsRunning((prev) => {
      const nextRunning = !prev;
      targetEndTimeRef.current = nextRunning ? Date.now() + timeLeftRef.current * 1000 : null;
      return nextRunning;
    });
  };

  const handleReset = () => {
    targetEndTimeRef.current = null;
    setIsRunning(false);
    const d = getPhaseDuration(phase) * 60;
    timeLeftRef.current = d;
    setTimeLeft(d);
  };

  const handleSkip = () => {
    targetEndTimeRef.current = null;
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
    if (targetEndTimeRef.current !== null) {
      targetEndTimeRef.current += 60 * 1000;
    }
    setTimeLeft(timeLeftRef.current);
  };

  const handleSubtractMinute = () => {
    const next = Math.max(0, timeLeftRef.current - 60);
    timeLeftRef.current = next;
    if (targetEndTimeRef.current !== null) {
      targetEndTimeRef.current = Date.now() + next * 1000;
    }
    setTimeLeft(next);
  };

  const handleSelectPhase = (targetPhase: PomoPhase) => {
    if (targetPhase === phase) return;
    targetEndTimeRef.current = null;
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

  const handleSaveSettings = (e: FormEvent) => {
    e.preventDefault();
    const f = parseStrictPositiveInt(customFocus);
    const sb = parseStrictPositiveInt(customShortBreak);
    const lb = parseStrictPositiveInt(customLongBreak);

    if (f === null || f < 1 || f > 90) {
      setSettingsError('Focus duration must be a whole number between 1 and 90 minutes.');
      return;
    }
    if (sb === null || sb < 1 || sb > 30) {
      setSettingsError('Short break must be a whole number between 1 and 30 minutes.');
      return;
    }
    if (lb === null || lb < 1 || lb > 60) {
      setSettingsError('Long break must be a whole number between 1 and 60 minutes.');
      return;
    }

    setSettingsError(null);
    setPrefs((prev) => ({
      ...prev,
      focusDuration: f,
      shortBreakDuration: sb,
      longBreakDuration: lb,
    }));

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

  const totalPhaseSeconds = getPhaseDuration(phase) * 60;
  const progressRatio = totalPhaseSeconds > 0 ? Math.max(0, Math.min(1, timeLeft / totalPhaseSeconds)) : 0;
  const circleRadius = 135;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="pomo-app-wrapper">
      <ToolHeader
        onBack={onBack}
        title="Cute Pomo"
        subtitle="Focus timer with Pomo the Sprouting Tomato Buddy."
        className="pomo-tool-header"
        actions={
          <div className="pomo-header-actions">
            <button
              className={`pomo-icon-btn ${prefs.isMuted ? 'pomo-muted' : ''}`.trim()}
              onClick={handleToggleMute}
              type="button"
              title={prefs.isMuted ? 'Unmute alerts' : 'Mute alerts'}
              aria-label={prefs.isMuted ? 'Unmute alerts' : 'Mute alerts'}
              aria-pressed={prefs.isMuted}
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
        }
      />

      <main className="pomo-container">
        <SegmentedControl<PomoPhase>
          mode="tablist"
          ariaLabel="Pomodoro Phase Modes"
          value={phase}
          onChange={handleSelectPhase}
          className="pomo-tabs"
          options={PHASE_OPTIONS}
        />

        <div
          className={`pomo-timer-card ${isFinishedAlert ? 'pomo-alert-pulse' : ''}`.trim()}
          data-phase={phase}
        >
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
              className={`pomo-btn pomo-btn-primary ${isRunning ? 'pomo-running' : ''}`.trim()}
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

          <div className="pomo-cycle-tracker">
            <div className="pomo-cycle-dots" aria-label={`Cycle progress: step ${cycleStep} of 4`}>
              {[1, 2, 3, 4].map((step) => {
                const isCompleted = step < cycleStep;
                const isCurrent = step === cycleStep;
                return (
                  <span
                    key={step}
                    className={`pomo-cycle-dot ${isCompleted ? 'pomo-completed' : ''} ${isCurrent ? 'pomo-current' : ''}`.trim()}
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

      <Modal
        isOpen={isSettingsOpen}
        onClose={handleCloseSettings}
        title="Timer Settings"
        closeLabel="Close settings"
        maxWidth="420px"
      >
        <form
          onSubmit={handleSaveSettings}
          className="pomo-settings-form"
          data-testid="pomo-settings-form"
          noValidate
        >
          {settingsError && (
            <InlineAlert
              message={settingsError}
              variant="error"
              onDismiss={() => setSettingsError(null)}
            />
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
      </Modal>
    </div>
  );
}
