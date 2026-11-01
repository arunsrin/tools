import { useState, useEffect, useRef, useCallback } from 'react';
import './Pals.css';

export type PalType = 'pip' | 'barnaby' | 'sprout';
export type EnvironmentType = 'city' | 'forest' | 'playground';
export type PalMood = 'Joyful' | 'Playful' | 'Curious' | 'Munching' | 'Sleepy';

interface PalsProps {
  onBack: () => void;
}

interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'bouncy' | 'mushroom' | 'brick';
  label?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  text?: string;
  color?: string;
  size: number;
}

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Treat {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'fish' | 'bone' | 'berry';
}

const STORAGE_KEY = 'tools_hub_desktop_pals';

const VIRTUAL_WIDTH = 800;
const VIRTUAL_HEIGHT = 450;
const FLOOR_Y = 405;
const GRAVITY = 0.42;

// Platform setups per environment
const ENV_PLATFORMS: Record<EnvironmentType, Platform[]> = {
  city: [
    { id: 'floor', x: 0, y: FLOOR_Y, width: VIRTUAL_WIDTH, height: 45, type: 'brick' },
    { id: 'c1', x: 80, y: 310, width: 140, height: 18, type: 'brick', label: 'AC Unit' },
    { id: 'c2', x: 320, y: 220, width: 160, height: 18, type: 'solid', label: 'Water Tower' },
    { id: 'c3', x: 570, y: 290, width: 150, height: 18, type: 'brick', label: 'Fire Escape' },
  ],
  forest: [
    { id: 'floor', x: 0, y: FLOOR_Y, width: VIRTUAL_WIDTH, height: 45, type: 'solid' },
    { id: 'f1', x: 90, y: 295, width: 130, height: 22, type: 'mushroom', label: 'Big Shroom' },
    { id: 'f2', x: 310, y: 200, width: 180, height: 20, type: 'solid', label: 'Ancient Branch' },
    { id: 'f3', x: 580, y: 295, width: 130, height: 22, type: 'mushroom', label: 'Glow Cap' },
  ],
  playground: [
    { id: 'floor', x: 0, y: FLOOR_Y, width: VIRTUAL_WIDTH, height: 45, type: 'solid' },
    { id: 'p1', x: 90, y: 310, width: 130, height: 20, type: 'solid', label: 'Play Block' },
    { id: 'p2', x: 330, y: 325, width: 140, height: 18, type: 'bouncy', label: 'Bouncy Trampoline' },
    { id: 'p3', x: 560, y: 220, width: 150, height: 20, type: 'solid', label: 'High Fort' },
  ],
};

// Safe Web Audio Synthesizer
class SoundManager {
  private ctx: AudioContext | null = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch {
          // Audio Context unsupported or blocked
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playPet(enabled: boolean) {
    if (!enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // ignore
    }
  }

  playBounce(enabled: boolean, high = false) {
    if (!enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const startFreq = high ? 520 : 320;
      const endFreq = high ? 180 : 120;
      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.14);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // ignore
    }
  }

  playEat(enabled: boolean) {
    if (!enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now);
      osc.frequency.setValueAtTime(880, now + 0.08);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    } catch {
      // ignore
    }
  }

  playWhistle(enabled: boolean) {
    if (!enabled) return;
    this.initCtx();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.linearRampToValueAtTime(1320, now + 0.12);
      osc.frequency.linearRampToValueAtTime(1100, now + 0.25);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    } catch {
      // ignore
    }
  }
}

const sounds = new SoundManager();

export default function Pals({ onBack }: PalsProps) {
  // Load preferences from localStorage
  const [selectedPal, setSelectedPal] = useState<PalType>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.pal === 'pip' || parsed.pal === 'barnaby' || parsed.pal === 'sprout') {
          return parsed.pal;
        }
      }
    } catch {
      // fallback
    }
    return 'pip';
  });

  const [selectedEnv, setSelectedEnv] = useState<EnvironmentType>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.env === 'city' || parsed.env === 'forest' || parsed.env === 'playground') {
          return parsed.env;
        }
      }
    } catch {
      // fallback
    }
    return 'city';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return Boolean(parsed.soundEnabled);
      }
    } catch {
      // fallback
    }
    return false;
  });

  const [snacksCount, setSnacksCount] = useState<number>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return typeof parsed.snacksCount === 'number' ? parsed.snacksCount : 0;
      }
    } catch {
      // fallback
    }
    return 0;
  });

  const [mood, setMood] = useState<PalMood>('Playful');
  const [energy, setEnergy] = useState<number>(90);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pal simulation state ref
  const palRef = useRef({
    x: 400,
    y: 350,
    vx: 0,
    vy: 0,
    radius: 26,
    facing: 'right' as 'left' | 'right',
    state: 'idle' as 'idle' | 'walking' | 'jumping' | 'sliding' | 'chasing' | 'eating' | 'sleeping' | 'dragged',
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

  // Persist state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          pal: selectedPal,
          env: selectedEnv,
          soundEnabled,
          snacksCount,
        })
      );
    } catch {
      // ignore
    }
  }, [selectedPal, selectedEnv, soundEnabled, snacksCount]);

  // Pet action
  const handlePet = useCallback(() => {
    const pal = palRef.current;
    sounds.playPet(soundEnabled);
    setMood('Joyful');
    setEnergy((prev) => Math.min(100, prev + 10));

    // Spawn heart particles
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
  }, [soundEnabled]);

  // Throw ball action
  const handleThrowBall = useCallback(() => {
    const pal = palRef.current;
    // Spawn ball on the opposite side or above
    const spawnX = pal.x < 400 ? 550 : 250;
    ballRef.current = {
      x: spawnX,
      y: 120,
      vx: (Math.random() - 0.5) * 4,
      vy: 1,
      radius: 12,
    };
    sounds.playBounce(soundEnabled);
    setMood('Playful');
  }, [soundEnabled]);

  // Feed treat action
  const handleFeedTreat = useCallback(() => {
    const treatType: Treat['type'] =
      selectedPal === 'pip' ? 'fish' : selectedPal === 'barnaby' ? 'bone' : 'berry';
    treatRef.current = {
      x: 200 + Math.random() * 400,
      y: 90,
      vx: (Math.random() - 0.5) * 1.5,
      vy: 2,
      type: treatType,
    };
    setMood('Curious');
  }, [selectedPal]);

  // Whistle / Call action
  const handleWhistle = useCallback(() => {
    sounds.playWhistle(soundEnabled);
    const pal = palRef.current;
    pal.state = 'chasing';
    pal.stateTimer = 180;
    pal.vy = -6;
    setMood('Joyful');

    // Spawn musical notes
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
  }, [soundEnabled]);

  // Reset arena
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

  // Pointer interactions on canvas (mouse & touch)
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = VIRTUAL_WIDTH / rect.width;
    const scaleY = VIRTUAL_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);
    const pal = palRef.current;
    const dist = Math.hypot(coords.x - pal.x, coords.y - pal.y);

    if (dist <= pal.radius * 1.6) {
      isDraggingRef.current = true;
      dragOffsetRef.current = { x: pal.x - coords.x, y: pal.y - coords.y };
      lastPointerRef.current = { x: coords.x, y: coords.y, time: performance.now() };
      pal.state = 'dragged';
      pal.vx = 0;
      pal.vy = 0;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
      // Clicking on empty arena spawns a cute heart or interacts
      handlePet();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const coords = getCanvasCoords(e);
    const pal = palRef.current;
    const now = performance.now();
    const dt = Math.max(1, now - lastPointerRef.current.time);

    pal.vx = ((coords.x - lastPointerRef.current.x) / dt) * 16;
    pal.vy = ((coords.y - lastPointerRef.current.y) / dt) * 16;

    pal.x = coords.x + dragOffsetRef.current.x;
    pal.y = coords.y + dragOffsetRef.current.y;

    lastPointerRef.current = { x: coords.x, y: coords.y, time: now };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    const pal = palRef.current;
    pal.state = 'jumping';
    // Clamp toss velocities
    pal.vx = Math.max(-14, Math.min(14, pal.vx));
    pal.vy = Math.max(-14, Math.min(14, pal.vy));
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Main 60fps simulation & render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let tickCount = 0;

    const platforms = ENV_PLATFORMS[selectedEnv];

    const renderFrame = () => {
      tickCount++;
      const pal = palRef.current;
      const ball = ballRef.current;
      const treat = treatRef.current;

      // --- 1. PAL PHYSICS & AUTONOMOUS AI ---
      if (pal.state !== 'dragged') {
        pal.vy += GRAVITY;
        pal.x += pal.vx;
        pal.y += pal.vy;

        // Friction
        pal.vx *= 0.94;

        // Platform collisions
        let grounded = false;
        for (const plat of platforms) {
          const isAbove = pal.y - pal.vy <= plat.y;
          const withinX = pal.x + pal.radius * 0.7 >= plat.x && pal.x - pal.radius * 0.7 <= plat.x + plat.width;
          if (isAbove && pal.y + pal.radius >= plat.y && withinX && pal.vy >= 0) {
            pal.y = plat.y - pal.radius;
            grounded = true;

            if (plat.type === 'bouncy') {
              // Trampoline bounce!
              pal.vy = -14.5;
              sounds.playBounce(soundEnabled, true);
              pal.stretch = 1.4;
              pal.squash = 0.7;
              // Add bounce spark particles
              particlesRef.current.push({
                x: pal.x,
                y: plat.y,
                vx: (Math.random() - 0.5) * 3,
                vy: -2,
                life: 0,
                maxLife: 30,
                text: '⭐',
                size: 14,
              });
            } else {
              if (pal.vy > 5) {
                sounds.playBounce(soundEnabled, false);
                pal.squash = 1.25;
                pal.stretch = 0.8;
              }
              pal.vy = 0;
            }
            break;
          }
        }
        pal.isGrounded = grounded;

        // Wall collisions
        if (pal.x - pal.radius < 20) {
          pal.x = 20 + pal.radius;
          pal.vx = Math.abs(pal.vx) * 0.7;
          pal.facing = 'right';
        } else if (pal.x + pal.radius > VIRTUAL_WIDTH - 20) {
          pal.x = VIRTUAL_WIDTH - 20 - pal.radius;
          pal.vx = -Math.abs(pal.vx) * 0.7;
          pal.facing = 'left';
        }

        // --- Autonomous AI State transitions ---
        pal.stateTimer--;
        if (pal.stateTimer <= 0) {
          if (treat) {
            pal.state = 'chasing';
            pal.stateTimer = 120;
          } else if (ball) {
            pal.state = 'chasing';
            pal.stateTimer = 140;
          } else {
            const rand = Math.random();
            if (rand < 0.4) {
              pal.state = 'walking';
              pal.facing = Math.random() > 0.5 ? 'right' : 'left';
              pal.stateTimer = 60 + Math.floor(Math.random() * 90);
            } else if (rand < 0.65 && selectedPal === 'pip') {
              pal.state = 'sliding';
              pal.facing = Math.random() > 0.5 ? 'right' : 'left';
              pal.stateTimer = 50 + Math.floor(Math.random() * 50);
            } else if (rand < 0.85) {
              pal.state = 'idle';
              pal.stateTimer = 60 + Math.floor(Math.random() * 90);
            } else {
              // Jump onto a platform
              if (pal.isGrounded) {
                pal.vy = -9 - Math.random() * 3;
                pal.vx = (pal.facing === 'right' ? 3 : -3) * (0.8 + Math.random() * 0.5);
                pal.state = 'jumping';
                pal.stateTimer = 60;
              }
            }
          }
        }

        // Behavior execution
        if (pal.state === 'walking') {
          const speed = selectedPal === 'pip' ? 1.6 : selectedPal === 'barnaby' ? 2.4 : 1.8;
          pal.vx = pal.facing === 'right' ? speed : -speed;
        } else if (pal.state === 'sliding') {
          const speed = 4.0;
          pal.vx = pal.facing === 'right' ? speed : -speed;
          if (pal.isGrounded && tickCount % 4 === 0) {
            particlesRef.current.push({
              x: pal.x - (pal.facing === 'right' ? 20 : -20),
              y: pal.y + 15,
              vx: (pal.facing === 'right' ? -1 : 1) * (1 + Math.random()),
              vy: -0.5,
              life: 0,
              maxLife: 20,
              color: 'rgba(255,255,255,0.4)',
              size: 4,
            });
          }
        } else if (pal.state === 'chasing') {
          const targetX = treat ? treat.x : ball ? ball.x : 400;
          const dx = targetX - pal.x;
          pal.facing = dx > 0 ? 'right' : 'left';
          const chaseSpeed = 3.2;
          pal.vx = dx > 10 ? chaseSpeed : dx < -10 ? -chaseSpeed : 0;

          // Check if reached treat
          if (treat && Math.hypot(pal.x - treat.x, pal.y - treat.y) < 35) {
            treatRef.current = null;
            sounds.playEat(soundEnabled);
            setSnacksCount((prev) => prev + 1);
            setMood('Joyful');
            setEnergy((prev) => Math.min(100, prev + 15));
            pal.state = 'eating';
            pal.stateTimer = 50;

            // Spawn eating crumb particles
            for (let i = 0; i < 6; i++) {
              particlesRef.current.push({
                x: pal.x + (Math.random() - 0.5) * 20,
                y: pal.y,
                vx: (Math.random() - 0.5) * 3,
                vy: -1 - Math.random() * 2,
                life: 0,
                maxLife: 35,
                text: '✨',
                size: 12,
              });
            }
          }

          // Check if reached ball
          if (ball && Math.hypot(pal.x - ball.x, pal.y - ball.y) < pal.radius + ball.radius + 6) {
            ball.vx = (pal.facing === 'right' ? 1 : -1) * (5 + Math.random() * 4);
            ball.vy = -6 - Math.random() * 3;
            sounds.playBounce(soundEnabled);
            pal.vy = -4;
          }
        }
      }

      // Restore squash / stretch gradually
      pal.squash += (1 - pal.squash) * 0.12;
      pal.stretch += (1 - pal.stretch) * 0.12;
      pal.animTime += 0.08;

      // --- 2. BALL SIMULATION ---
      if (ball) {
        ball.vy += GRAVITY;
        ball.x += ball.vx;
        ball.y += ball.vy;
        ball.vx *= 0.98;

        for (const plat of platforms) {
          const isAbove = ball.y - ball.vy <= plat.y;
          const withinX = ball.x + ball.radius >= plat.x && ball.x - ball.radius <= plat.x + plat.width;
          if (isAbove && ball.y + ball.radius >= plat.y && withinX && ball.vy >= 0) {
            ball.y = plat.y - ball.radius;
            if (plat.type === 'bouncy') {
              ball.vy = -13;
              sounds.playBounce(soundEnabled, true);
            } else {
              ball.vy = -ball.vy * 0.75;
            }
            if (Math.abs(ball.vy) < 1) ball.vy = 0;
            break;
          }
        }

        // Walls
        if (ball.x - ball.radius < 10) {
          ball.x = 10 + ball.radius;
          ball.vx = -ball.vx * 0.8;
        } else if (ball.x + ball.radius > VIRTUAL_WIDTH - 10) {
          ball.x = VIRTUAL_WIDTH - 10 - ball.radius;
          ball.vx = -ball.vx * 0.8;
        }
      }

      // --- 3. TREAT SIMULATION ---
      if (treat) {
        treat.vy += GRAVITY * 0.8;
        treat.x += treat.vx;
        treat.y += treat.vy;
        treat.vx *= 0.95;

        for (const plat of platforms) {
          if (treat.y + 12 >= plat.y && treat.x >= plat.x && treat.x <= plat.x + plat.width && treat.vy >= 0) {
            treat.y = plat.y - 12;
            treat.vy = 0;
            treat.vx = 0;
            break;
          }
        }
      }

      // --- 4. RENDER TO CANVAS ---
      ctx.clearRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

      // (A) Background
      renderEnvironmentBackground(ctx, selectedEnv, tickCount);

      // (B) Platforms
      renderPlatforms(ctx, platforms, selectedEnv);

      // (C) Treat
      if (treat) {
        renderTreat(ctx, treat);
      }

      // (D) Ball
      if (ball) {
        renderBall(ctx, ball);
      }

      // (E) Companion (Pal)
      renderPal(ctx, pal, selectedPal);

      // (F) Particles
      renderParticles(ctx, particlesRef.current);

      animId = requestAnimationFrame(renderFrame);
    };

    animId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [selectedEnv, selectedPal, soundEnabled]);

  // Pal treat details
  const treatInfo = {
    pip: { label: 'Feed Fish', icon: '🐟' },
    barnaby: { label: 'Feed Bone', icon: '🦴' },
    sprout: { label: 'Feed Berry', icon: '🫐' },
  }[selectedPal];

  return (
    <div className="pals-wrapper">
      <header className="pals-header">
        <button
          type="button"
          className="back-btn"
          onClick={onBack}
          aria-label="Back to Tools Hub"
        >
          ← Back to Tools Hub
        </button>

        <div className="pals-title-area">
          <div className="pals-badge">Interactive Toy</div>
          <h1 className="pals-title">Desktop Pals</h1>
          <p className="pals-subtitle">
            Playful browser companions, physics playground, toys & treats.
          </p>
        </div>
      </header>

      <main className="pals-main">
        {/* Top Control Bar: Companions & Environments */}
        <div className="pals-controls-bar">
          <div className="control-group">
            <span className="control-label">Companion:</span>
            <div className="btn-group" role="group" aria-label="Select companion">
              <button
                type="button"
                className={`pal-select-btn ${selectedPal === 'pip' ? 'active' : ''}`}
                onClick={() => setSelectedPal('pip')}
                aria-pressed={selectedPal === 'pip'}
              >
                🐧 Pip
              </button>
              <button
                type="button"
                className={`pal-select-btn ${selectedPal === 'barnaby' ? 'active' : ''}`}
                onClick={() => setSelectedPal('barnaby')}
                aria-pressed={selectedPal === 'barnaby'}
              >
                🐶 Barnaby
              </button>
              <button
                type="button"
                className={`pal-select-btn ${selectedPal === 'sprout' ? 'active' : ''}`}
                onClick={() => setSelectedPal('sprout')}
                aria-pressed={selectedPal === 'sprout'}
              >
                👾 Sprout
              </button>
            </div>
          </div>

          <div className="control-group">
            <span className="control-label">Environment:</span>
            <div className="btn-group" role="group" aria-label="Select environment">
              <button
                type="button"
                className={`env-select-btn ${selectedEnv === 'city' ? 'active' : ''}`}
                onClick={() => setSelectedEnv('city')}
                aria-pressed={selectedEnv === 'city'}
              >
                🏙️ City
              </button>
              <button
                type="button"
                className={`env-select-btn ${selectedEnv === 'forest' ? 'active' : ''}`}
                onClick={() => setSelectedEnv('forest')}
                aria-pressed={selectedEnv === 'forest'}
              >
                🌲 Forest
              </button>
              <button
                type="button"
                className={`env-select-btn ${selectedEnv === 'playground' ? 'active' : ''}`}
                onClick={() => setSelectedEnv('playground')}
                aria-pressed={selectedEnv === 'playground'}
              >
                🎪 Playground
              </button>
            </div>
          </div>

          <div className="control-group sound-control">
            <button
              type="button"
              className={`sound-btn ${soundEnabled ? 'sound-on' : 'sound-off'}`}
              onClick={() => setSoundEnabled((prev) => !prev)}
              aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
            >
              {soundEnabled ? '🔊 Sound On' : '🔇 Muted'}
            </button>
          </div>
        </div>

        {/* The Interactive Canvas Arena */}
        <div className="canvas-container">
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
          <div className="canvas-hud">
            <div className="hud-badge">
              <span className="hud-name">
                {selectedPal === 'pip'
                  ? 'Pip the Penguin'
                  : selectedPal === 'barnaby'
                  ? 'Barnaby the Pup'
                  : 'Sprout the Sprite'}
              </span>
              <span className="hud-mood">Mood: {mood}</span>
            </div>

            <div className="hud-stats">
              <span className="hud-snack">Snacks: {snacksCount}</span>
              <div className="energy-bar" title={`Energy: ${energy}%`}>
                <div className="energy-fill" style={{ width: `${energy}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="pals-action-bar" role="toolbar" aria-label="Companion action controls">
          <button
            type="button"
            className="action-btn pet-btn"
            onClick={handlePet}
            title="Pet companion"
          >
            💖 Pet Pal
          </button>

          <button
            type="button"
            className="action-btn ball-btn"
            onClick={handleThrowBall}
            title="Throw a bouncy toy ball for fetch"
          >
            🎾 Throw Ball
          </button>

          <button
            type="button"
            className="action-btn treat-btn"
            onClick={handleFeedTreat}
            title={treatInfo.label}
          >
            {treatInfo.icon} {treatInfo.label}
          </button>

          <button
            type="button"
            className="action-btn whistle-btn"
            onClick={handleWhistle}
            title="Whistle to call companion"
          >
            🔔 Whistle
          </button>

          <button
            type="button"
            className="action-btn reset-btn"
            onClick={handleReset}
            title="Reset companion position and arena"
          >
            🔄 Reset
          </button>
        </div>

        {/* Instructions / Tip Card */}
        <div className="pals-tip-card">
          <p>
            💡 <strong>Play Tip:</strong> Click and drag your pal to toss them with gravity! Watch them jump on platforms, slide on their belly, catch balls, and gobble treats.
          </p>
        </div>
      </main>
    </div>
  );
}

// ----------------------------------------------------
// CANVAS RENDERING HELPERS
// ----------------------------------------------------

function renderEnvironmentBackground(
  ctx: CanvasRenderingContext2D,
  env: EnvironmentType,
  tick: number
) {
  if (env === 'city') {
    // Midnight Sky
    const sky = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    sky.addColorStop(0, '#090d16');
    sky.addColorStop(1, '#17223b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 73 + 12) % VIRTUAL_WIDTH;
      const sy = (i * 37 + 5) % 240;
      const rad = (i % 3 === 0 ? 1.5 : 1) * (0.8 + 0.2 * Math.sin(tick * 0.05 + i));
      ctx.beginPath();
      ctx.arc(sx, sy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    // Skyline silhouettes
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 160, 90, 250);
    ctx.fillRect(150, 110, 110, 300);
    ctx.fillRect(280, 140, 130, 270);
    ctx.fillRect(430, 90, 100, 320);
    ctx.fillRect(550, 130, 120, 280);
    ctx.fillRect(690, 150, 80, 260);

    // Skyscraper windows
    ctx.fillStyle = '#38bdf8';
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 3; col++) {
        if ((row + col + Math.floor(tick * 0.02)) % 4 !== 0) {
          ctx.fillRect(165 + col * 28, 140 + row * 22, 12, 10);
          ctx.fillRect(450 + col * 26, 120 + row * 22, 10, 9);
        }
      }
    }
  } else if (env === 'forest') {
    // Mystic Emerald Night
    const sky = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    sky.addColorStop(0, '#04130d');
    sky.addColorStop(1, '#0e2b1f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Glowing Moon
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(710, 80, 32, 0, Math.PI * 2);
    ctx.fill();

    // Ancient tree trunks
    ctx.fillStyle = '#062016';
    ctx.beginPath();
    ctx.arc(60, 200, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(740, 210, 130, 0, Math.PI * 2);
    ctx.fill();

    // Floating fireflies
    for (let i = 0; i < 15; i++) {
      const fx = (i * 97 + tick * 0.4 * (i % 2 === 0 ? 1 : -1)) % VIRTUAL_WIDTH;
      const fy = 100 + (i * 43 + Math.sin(tick * 0.04 + i) * 30) % 270;
      const glow = Math.sin(tick * 0.08 + i) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(163, 230, 53, ${0.4 + glow * 0.6})`;
      ctx.beginPath();
      ctx.arc((fx + VIRTUAL_WIDTH) % VIRTUAL_WIDTH, fy, 2 + glow * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Playground Sandbox / Festive Twilight
    const sky = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    sky.addColorStop(0, '#19112b');
    sky.addColorStop(1, '#2f1a4a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    // Bunting Pennants across top
    const buntingColors = ['#f43f5e', '#38bdf8', '#fbbf24', '#34d399', '#a855f7'];
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, 40);
    ctx.quadraticCurveTo(400, 90, VIRTUAL_WIDTH, 40);
    ctx.stroke();

    for (let i = 0; i < 16; i++) {
      const t = i / 15;
      const bx = t * VIRTUAL_WIDTH;
      const by = (1 - t) * (1 - t) * 40 + 2 * (1 - t) * t * 90 + t * t * 40;
      ctx.fillStyle = buntingColors[i % buntingColors.length];
      ctx.beginPath();
      ctx.moveTo(bx - 10, by);
      ctx.lineTo(bx + 10, by);
      ctx.lineTo(bx, by + 18);
      ctx.closePath();
      ctx.fill();
    }
  }
}

function renderPlatforms(
  ctx: CanvasRenderingContext2D,
  platforms: Platform[],
  env: EnvironmentType
) {
  for (const plat of platforms) {
    if (plat.id === 'floor') {
      if (env === 'city') {
        // Dark brick roof
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(plat.x, plat.y, plat.width, 4);
      } else if (env === 'forest') {
        // Mossy grass floor
        ctx.fillStyle = '#14532d';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(plat.x, plat.y, plat.width, 5);
      } else {
        // Sand floor
        ctx.fillStyle = '#78350f';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(plat.x, plat.y, plat.width, 5);
      }
      continue;
    }

    if (plat.type === 'bouncy') {
      // Trampoline
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(plat.x, plat.y, plat.width, 4);

      // Springs underneath
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      for (let s = plat.x + 20; s < plat.x + plat.width - 15; s += 25) {
        ctx.beginPath();
        ctx.moveTo(s, plat.y + plat.height);
        ctx.lineTo(s + 6, plat.y + plat.height + 12);
        ctx.lineTo(s - 6, plat.y + plat.height + 24);
        ctx.stroke();
      }
    } else if (plat.type === 'mushroom') {
      // Giant Mushroom Cap
      ctx.fillStyle = '#e11d48';
      ctx.beginPath();
      ctx.ellipse(
        plat.x + plat.width / 2,
        plat.y + 10,
        plat.width / 2,
        plat.height,
        0,
        Math.PI,
        0,
        false
      );
      ctx.fill();

      // White polka dots
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(plat.x + plat.width * 0.3, plat.y + 4, 5, 0, Math.PI * 2);
      ctx.arc(plat.x + plat.width * 0.7, plat.y + 6, 6, 0, Math.PI * 2);
      ctx.fill();

      // Mushroom stem
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(plat.x + plat.width * 0.4, plat.y + 10, plat.width * 0.2, 40);
    } else {
      // Solid block platform
      const color = env === 'city' ? '#334155' : env === 'forest' ? '#713f12' : '#9a3412';
      ctx.fillStyle = color;
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

      ctx.fillStyle = env === 'city' ? '#64748b' : env === 'forest' ? '#15803d' : '#fb923c';
      ctx.fillRect(plat.x, plat.y, plat.width, 4);
    }
  }
}

function renderPal(
  ctx: CanvasRenderingContext2D,
  pal: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    facing: 'left' | 'right';
    state: string;
    animTime: number;
    squash: number;
    stretch: number;
  },
  palType: PalType
) {
  ctx.save();
  ctx.translate(pal.x, pal.y);
  ctx.scale(pal.squash, pal.stretch);

  const flip = pal.facing === 'left' ? -1 : 1;
  ctx.scale(flip, 1);

  if (palType === 'pip') {
    // --- PIP THE PENGUIN ---
    if (pal.state === 'sliding') {
      ctx.rotate(0.2);
    }

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, pal.radius, pal.radius * 0.8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (dark navy/charcoal)
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(0, 0, pal.radius * 0.85, pal.radius, 0, 0, Math.PI * 2);
    ctx.fill();

    // White belly
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(2, 4, pal.radius * 0.55, pal.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Orange Beak
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(pal.radius * 0.5, -4);
    ctx.lineTo(pal.radius * 0.95, 0);
    ctx.lineTo(pal.radius * 0.5, 4);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.35, -7, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.4, -8, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    const wingAngle =
      pal.state === 'jumping'
        ? Math.sin(pal.animTime * 14) * 0.6
        : pal.state === 'walking'
        ? Math.sin(pal.animTime * 8) * 0.3
        : 0;
    ctx.save();
    ctx.translate(-pal.radius * 0.4, 0);
    ctx.rotate(wingAngle);
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.ellipse(0, 4, 6, 14, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Feet
    const footOffset = pal.state === 'walking' ? Math.sin(pal.animTime * 10) * 4 : 0;
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(-6, pal.radius - 2 + footOffset, 6, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(6, pal.radius - 2 - footOffset, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (palType === 'barnaby') {
    // --- BARNABY THE PUP ---
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, pal.radius, pal.radius * 0.9, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (golden-brown)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 2, pal.radius * 0.9, pal.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.35, -8, pal.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    // Floppy Ear
    const earBounce = Math.sin(pal.animTime * 12) * 0.15;
    ctx.save();
    ctx.translate(pal.radius * 0.1, -14);
    ctx.rotate(earBounce);
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(0, 10, 7, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Snout
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(pal.radius * 0.65, -4, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.85, -6, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.45, -11, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.5, -12, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Wagging Tail
    const tailWag = Math.sin(pal.animTime * 18) * 0.5;
    ctx.save();
    ctx.translate(-pal.radius * 0.7, 0);
    ctx.rotate(tailWag - 0.4);
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(-8, -4, 12, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Tongue out when joyful
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.ellipse(pal.radius * 0.75, 1, 3.5, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // --- SPROUT THE FOREST SPRITE ---
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, pal.radius, pal.radius * 0.8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Translucent emerald jelly blob
    const jellyGrad = ctx.createRadialGradient(-5, -5, 4, 0, 0, pal.radius);
    jellyGrad.addColorStop(0, '#34d399');
    jellyGrad.addColorStop(1, '#059669');
    ctx.fillStyle = jellyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, pal.radius * 0.85, pal.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Swaying sprout leaf on head
    const leafSway = Math.sin(pal.animTime * 6) * 0.25;
    ctx.save();
    ctx.translate(0, -pal.radius * 0.75);
    ctx.rotate(leafSway);
    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(8, -12, 0, -20);
    ctx.quadraticCurveTo(-8, -12, 0, 0);
    ctx.fill();
    ctx.restore();

    // Kawaii Eyes
    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.3, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.34, -5.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Rosy blushing cheek
    ctx.fillStyle = 'rgba(251, 113, 133, 0.6)';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.45, 3, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function renderBall(ctx: CanvasRenderingContext2D, ball: Ball) {
  ctx.save();
  ctx.translate(ball.x, ball.y);

  // Ball body
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  // Glow / shine
  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.arc(-3, -3, ball.radius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderTreat(ctx: CanvasRenderingContext2D, treat: Treat) {
  ctx.save();
  ctx.translate(treat.x, treat.y);
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const icon = treat.type === 'fish' ? '🐟' : treat.type === 'bone' ? '🦴' : '🫐';
  ctx.fillText(icon, 0, 0);
  ctx.restore();
}

function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life++;
    p.x += p.vx;
    p.y += p.vy;

    const alpha = Math.max(0, 1 - p.life / p.maxLife);

    ctx.save();
    ctx.globalAlpha = alpha;
    if (p.text) {
      ctx.font = `${p.size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(p.text, p.x, p.y);
    } else if (p.color) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    if (p.life >= p.maxLife) {
      particles.splice(i, 1);
    }
  }
}
