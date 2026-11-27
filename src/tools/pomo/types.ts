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
