import { useCallback, useEffect, useRef, useState } from 'react';
import InlineAlert from '../../shared/components/InlineAlert';
import SegmentedControl from '../../shared/components/SegmentedControl';
import ToolHeader from '../../shared/components/ToolHeader';
import { usePersistedState } from '../../shared/hooks/usePersistedState';
import { createAudioController, type AudioController } from '../../shared/utils/audio';
import { getCanvasPointerPos } from '../../shared/utils/canvas';
import {
  clampPalPosition,
  DEFAULT_PALS_PREFS,
  ENV_PLATFORMS,
  normalizeFrameDelta,
  PALS_STORAGE_KEY,
  playBounceSound,
  playPetSound,
  playWhistleSound,
  renderBall,
  renderEnvironmentBackground,
  renderPal,
  renderParticles,
  renderPlatforms,
  renderTreat,
  stepPalsPhysics,
  validatePalsPrefs,
  VIRTUAL_HEIGHT,
  VIRTUAL_WIDTH,
} from './palsEngine';
import type {
  Ball,
  EnvironmentType,
  PalEntity,
  PalMood,
  PalsPrefs,
  PalsProps,
  PalType,
  Particle,
  Treat,
} from './types';
import './Pals.css';

const PAL_OPTIONS: readonly { value: PalType; label: string }[] = [
  { value: 'pip', label: '🐧 Pip' },
  { value: 'barnaby', label: '🐶 Barnaby' },
  { value: 'sprout', label: '👾 Sprout' },
];

const ENV_OPTIONS: readonly { value: EnvironmentType; label: string }[] = [
  { value: 'city', label: '🏙️ City' },
  { value: 'forest', label: '🌲 Forest' },
  { value: 'playground', label: '🎪 Playground' },
];

export default function Pals({ onBack }: PalsProps) {
  const [prefs, setPrefs] = usePersistedState<PalsPrefs>(PALS_STORAGE_KEY, DEFAULT_PALS_PREFS, {
    validate: validatePalsPrefs,
  });

  const selectedPal = prefs.pal;
  const selectedEnv = prefs.env;
  const soundEnabled = prefs.soundEnabled;
  const snacksCount = prefs.snacksCount;

  const [mood, setMood] = useState<PalMood>('Playful');
  const [energy, setEnergy] = useState<number>(90);
  const [canvasUnavailable] = useState<boolean>(() => {
    if (typeof document === 'undefined') return false;
    try {
      return document.createElement('canvas').getContext('2d') === null;
    } catch {
      return true;
    }
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioControllerRef = useRef<AudioController | null>(null);

  const selectedPalRef = useRef(selectedPal);
  const selectedEnvRef = useRef(selectedEnv);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    selectedPalRef.current = selectedPal;
  }, [selectedPal]);

  useEffect(() => {
    selectedEnvRef.current = selectedEnv;
  }, [selectedEnv]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    const controller = createAudioController();
    audioControllerRef.current = controller;
    return () => {
      audioControllerRef.current = null;
      void controller.close();
    };
  }, []);

  const palRef = useRef<PalEntity>({
    x: 400,
    y: 350,
    vx: 0,
    vy: 0,
    radius: 26,
    facing: 'right',
    state: 'idle',
    stateTimer: 0,
    animTime: 0,
    squash: 1,
    stretch: 1,
    isGrounded: false,
  });

  const ballRef = useRef<Ball | null>(null);
  const treatRef = useRef<Treat | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const lastPointerRef = useRef({ x: 0, y: 0, time: 0 });

  const handleEatTreat = useCallback(() => {
    setPrefs((prev) => ({ ...prev, snacksCount: prev.snacksCount + 1 }));
  }, [setPrefs]);

  const handleBoostEnergy = useCallback((delta: number) => {
    setEnergy((prev) => Math.min(100, prev + delta));
  }, []);

  const handlePet = useCallback(() => {
    const pal = palRef.current;
    const controller = audioControllerRef.current;
    if (controller) {
      playPetSound(controller, soundEnabledRef.current);
    }
    setMood('Joyful');
    setEnergy((prev) => Math.min(100, prev + 10));

    for (let i = 0; i < 5; i++) {
      particlesRef.current.push({
        x: pal.x + (Math.random() - 0.5) * 30,
        y: pal.y - 15 - Math.random() * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: -1.5 - Math.random() * 2,
        life: 0,
        maxLife: 45,
        text: '❤️',
        size: 16,
      });
    }

    pal.vy = -4;
    pal.squash = 1.25;
    pal.stretch = 0.8;
  }, []);

  const handleThrowBall = useCallback(() => {
    const pal = palRef.current;
    const spawnX = pal.x < 400 ? 550 : 250;
    ballRef.current = {
      x: spawnX,
      y: 120,
      vx: (Math.random() - 0.5) * 4,
      vy: 1,
      radius: 12,
    };
    const controller = audioControllerRef.current;
    if (controller) {
      playBounceSound(controller, soundEnabledRef.current);
    }
    setMood('Playful');
  }, []);

  const handleFeedTreat = useCallback(() => {
    const palType = selectedPalRef.current;
    const treatType: Treat['type'] =
      palType === 'pip' ? 'fish' : palType === 'barnaby' ? 'bone' : 'berry';
    treatRef.current = {
      x: 200 + Math.random() * 400,
      y: 90,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 2,
      type: treatType,
    };
    setMood('Curious');
  }, []);

  const handleWhistle = useCallback(() => {
    const controller = audioControllerRef.current;
    if (controller) {
      playWhistleSound(controller, soundEnabledRef.current);
    }
    const pal = palRef.current;
    pal.state = 'chasing';
    pal.stateTimer = 180;
    pal.vy = -6;
    setMood('Joyful');

    for (let i = 0; i < 3; i++) {
      particlesRef.current.push({
        x: 400 + (i - 1) * 30,
        y: 150,
        vx: (Math.random() - 0.5) * 1,
        vy: -1.2 - Math.random() * 1.5,
        life: 0,
        maxLife: 50,
        text: '🎵',
        size: 16,
      });
    }
  }, []);

  const handleReset = useCallback(() => {
    palRef.current.x = 400;
    palRef.current.y = 350;
    palRef.current.vx = 0;
    palRef.current.vy = 0;
    palRef.current.state = 'idle';
    ballRef.current = null;
    treatRef.current = null;
    particlesRef.current = [];
    setMood('Playful');
    setEnergy(90);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const coords = getCanvasPointerPos(e, canvas, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    const pal = palRef.current;
    const dist = Math.hypot(coords.x - pal.x, coords.y - pal.y);

    if (dist <= pal.radius * 1.6) {
      isDraggingRef.current = true;
      dragOffsetRef.current = { x: pal.x - coords.x, y: pal.y - coords.y };
      lastPointerRef.current = { x: coords.x, y: coords.y, time: performance.now() };
      pal.state = 'dragged';
      pal.vx = 0;
      pal.vy = 0;
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    } else {
      handlePet();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!isDraggingRef.current || !canvas) return;
    const coords = getCanvasPointerPos(e, canvas, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
    const pal = palRef.current;
    const now = performance.now();
    const dtMs = Math.max(1, now - lastPointerRef.current.time);

    pal.vx = ((coords.x - lastPointerRef.current.x) / dtMs) * 16;
    pal.vy = ((coords.y - lastPointerRef.current.y) / dtMs) * 16;

    pal.x = coords.x + dragOffsetRef.current.x;
    pal.y = coords.y + dragOffsetRef.current.y;
    clampPalPosition(pal);

    lastPointerRef.current = { x: coords.x, y: coords.y, time: now };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const pal = palRef.current;
    clampPalPosition(pal);
    pal.state = 'jumping';
    pal.vx = Math.max(-14, Math.min(14, pal.vx));
    pal.vy = Math.max(-14, Math.min(14, pal.vy));
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore environments without pointer capture support
    }
  };

  // Single continuous delta-time normalized RAF loop (sound/pal/env read from refs)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTimestamp: number | null = null;
    let tickAccumulator = 0;

    const renderFrame = (timestamp: number) => {
      const { dt, nextTimestamp } = normalizeFrameDelta(timestamp, lastTimestamp);
      lastTimestamp = nextTimestamp;
      tickAccumulator += dt;

      const env = selectedEnvRef.current;
      const palType = selectedPalRef.current;
      const platforms = ENV_PLATFORMS[env];
      const controller = audioControllerRef.current;

      if (controller) {
        const { consumedTreat } = stepPalsPhysics({
          pal: palRef.current,
          ball: ballRef.current,
          treat: treatRef.current,
          particles: particlesRef.current,
          platforms,
          selectedPal: palType,
          dt,
          tickCount: tickAccumulator,
          soundEnabled: soundEnabledRef.current,
          audioController: controller,
          onEatTreat: handleEatTreat,
          onSetMood: setMood,
          onBoostEnergy: handleBoostEnergy,
        });
        if (consumedTreat) {
          treatRef.current = null;
        }
      }

      ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);
      renderEnvironmentBackground(ctx, env, tickAccumulator);
      renderPlatforms(ctx, platforms, env);
      if (treatRef.current) {
        renderTreat(ctx, treatRef.current);
      }
      if (ballRef.current) {
        renderBall(ctx, ballRef.current);
      }
      renderPal(ctx, palRef.current, palType);
      renderParticles(ctx, particlesRef.current, dt);

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [handleBoostEnergy, handleEatTreat]);

  const treatInfo = {
    pip: { label: 'Feed Fish', icon: '🐟' },
    barnaby: { label: 'Feed Bone', icon: '🦴' },
    sprout: { label: 'Feed Berry', icon: '🫐' },
  }[selectedPal];

  return (
    <div className="pals-wrapper">
      <ToolHeader
        onBack={onBack}
        title="Desktop Pals"
        badge="Interactive Toy"
        subtitle="Playful browser companions, physics playground, toys & treats."
        className="pals-header"
      />

      <main className="pals-main">
        {/* Top Control Bar: Companions & Environments */}
        <div className="pals-controls-bar">
          <div className="pals-control-group">
            <span className="pals-control-label">Companion:</span>
            <SegmentedControl<PalType>
              ariaLabel="Select companion"
              value={selectedPal}
              onChange={(pal) => setPrefs((prev) => ({ ...prev, pal }))}
              options={PAL_OPTIONS}
              className="pals-segmented-group"
            />
          </div>

          <div className="pals-control-group">
            <span className="pals-control-label">Environment:</span>
            <SegmentedControl<EnvironmentType>
              ariaLabel="Select environment"
              value={selectedEnv}
              onChange={(env) => setPrefs((prev) => ({ ...prev, env }))}
              options={ENV_OPTIONS}
              className="pals-segmented-group"
            />
          </div>

          <div className="pals-control-group pals-sound-control">
            <button
              type="button"
              className={`pals-sound-btn ${soundEnabled ? 'sound-on' : 'sound-off'}`}
              onClick={() => setPrefs((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              aria-pressed={soundEnabled}
            >
              {soundEnabled ? '🔊 Sound On' : '🔇 Muted'}
            </button>
          </div>
        </div>

        {canvasUnavailable ? (
          <InlineAlert
            variant="warning"
            message="2D canvas rendering is unavailable in this browser environment."
          />
        ) : null}

        {/* The Interactive Canvas Arena */}
        <div className="pals-canvas-container">
          <canvas
            ref={canvasRef}
            width={VIRTUAL_WIDTH}
            height={VIRTUAL_HEIGHT}
            className="pals-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            data-testid="pals-canvas"
          />

          {/* Canvas Floating Overlay HUD */}
          <div className="pals-canvas-hud">
            <div className="pals-hud-badge">
              <span className="pals-hud-name">
                {selectedPal === 'pip'
                  ? 'Pip the Penguin'
                  : selectedPal === 'barnaby'
                    ? 'Barnaby the Pup'
                    : 'Sprout the Sprite'}
              </span>
              <span className="pals-hud-mood">Mood: {mood}</span>
            </div>

            <div className="pals-hud-stats">
              <span className="pals-hud-snack">Snacks: {snacksCount}</span>
              <div className="pals-energy-bar" title={`Energy: ${energy}%`}>
                <div className="pals-energy-fill" style={{ width: `${energy}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="pals-action-bar" role="toolbar" aria-label="Companion action controls">
          <button
            type="button"
            className="pals-action-btn pals-pet-btn"
            onClick={handlePet}
            title="Pet companion"
          >
            💖 Pet Pal
          </button>

          <button
            type="button"
            className="pals-action-btn pals-ball-btn"
            onClick={handleThrowBall}
            title="Throw a bouncy toy ball for fetch"
          >
            🎾 Throw Ball
          </button>

          <button
            type="button"
            className="pals-action-btn pals-treat-btn"
            onClick={handleFeedTreat}
            title={treatInfo.label}
          >
            {treatInfo.icon} {treatInfo.label}
          </button>

          <button
            type="button"
            className="pals-action-btn pals-whistle-btn"
            onClick={handleWhistle}
            title="Whistle to call companion"
          >
            🔔 Whistle
          </button>

          <button
            type="button"
            className="pals-action-btn pals-reset-btn"
            onClick={handleReset}
            title="Reset companion position and arena"
          >
            🔄 Reset
          </button>
        </div>

        {/* Instructions / Tip Card */}
        <div className="pals-tip-card">
          <p>
            💡 <strong>Play Tip:</strong> Click and drag your pal to toss them with gravity! Watch
            them jump on platforms, slide on their belly, catch balls, and gobble treats.
          </p>
        </div>
      </main>
    </div>
  );
}
