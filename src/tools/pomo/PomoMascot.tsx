import type { PomoPhase } from './types';

interface MascotProps {
  phase: PomoPhase;
  isRunning: boolean;
  isFinishedAlert: boolean;
}

export default function PomoMascot({ phase, isRunning, isFinishedAlert }: MascotProps) {
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
          <path
            d="M 80 42 Q 78 22 72 14 Q 82 22 84 42 Z"
            fill="#15803d"
            stroke="#14532d"
            strokeWidth="1.5"
          />
          <path
            d="M 80 44 Q 58 32 46 38 Q 62 48 80 44"
            fill="url(#sproutGrad)"
            stroke="#15803d"
            strokeWidth="1.5"
          />
          <path
            d="M 80 44 Q 102 32 114 38 Q 98 48 80 44"
            fill="url(#sproutGrad)"
            stroke="#15803d"
            strokeWidth="1.5"
          />
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
            <line x1="52" y1="80" x2="68" y2="84" stroke="#881337" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="108" y1="80" x2="92" y2="84" stroke="#881337" strokeWidth="2.5" strokeLinecap="round" />

            <circle cx="60" cy="94" r="7.5" fill="#0f172a" />
            <circle cx="58" cy="91.5" r="2.8" fill="#ffffff" />
            <circle cx="100" cy="94" r="7.5" fill="#0f172a" />
            <circle cx="98" cy="91.5" r="2.8" fill="#ffffff" />

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

            <path
              d="M 74 105 Q 80 113 86 105"
              fill="none"
              stroke="#881337"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            <g className="pomo-cup" transform="translate(118, 106) scale(0.75)">
              <rect x="0" y="4" width="18" height="18" rx="3" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
              <path d="M 18 8 Q 25 12 18 17" fill="none" stroke="#38bdf8" strokeWidth="2.2" strokeLinecap="round" />
              <path className="pomo-steam-line pomo-steam-1" d="M 5 0 Q 3 -6 6 -11" fill="none" stroke="#bae6fd" strokeWidth="1.5" strokeLinecap="round" />
              <path className="pomo-steam-line pomo-steam-2" d="M 12 0 Q 14 -6 11 -11" fill="none" stroke="#bae6fd" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          </g>
        )}

        {phase === 'longBreak' && (
          <g className="pomo-face-long-break">
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

            <path
              d="M 72 102 Q 80 118 88 102 Z"
              fill="#881337"
            />
            <ellipse cx="80" cy="111" rx="4.5" ry="3.2" fill="#fda4af" />

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
