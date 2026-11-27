import { playWithAudio, type AudioController } from '../../shared/utils/audio';
import type {
  Ball,
  EnvironmentType,
  PalEntity,
  PalMood,
  PalType,
  PalsPrefs,
  Particle,
  Platform,
  Treat,
} from './types';

export const PALS_STORAGE_KEY = 'tools_hub_desktop_pals';

export const VIRTUAL_WIDTH = 800;
export const VIRTUAL_HEIGHT = 450;
export const FLOOR_Y = 405;
export const GRAVITY = 0.42;
export const FRAME_BASELINE_MS = 1000 / 60;
export const MAX_FRAME_DELTA_MS = 50;

export const DEFAULT_PALS_PREFS: PalsPrefs = {
  pal: 'pip',
  env: 'city',
  soundEnabled: false,
  snacksCount: 0,
};

export const ENV_PLATFORMS: Record<EnvironmentType, Platform[]> = {
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

export function validatePalsPrefs(raw: unknown): PalsPrefs {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_PALS_PREFS;
  }
  const obj = raw as Record<string, unknown>;
  const pal: PalType =
    obj.pal === 'pip' || obj.pal === 'barnaby' || obj.pal === 'sprout'
      ? obj.pal
      : DEFAULT_PALS_PREFS.pal;
  const env: EnvironmentType =
    obj.env === 'city' || obj.env === 'forest' || obj.env === 'playground'
      ? obj.env
      : DEFAULT_PALS_PREFS.env;
  const soundEnabled = typeof obj.soundEnabled === 'boolean' ? obj.soundEnabled : false;
  const snacksCount =
    typeof obj.snacksCount === 'number' && Number.isFinite(obj.snacksCount) && obj.snacksCount >= 0
      ? Math.floor(obj.snacksCount)
      : 0;

  return { pal, env, soundEnabled, snacksCount };
}

export function clampPalPosition(pal: PalEntity): void {
  pal.x = Math.max(20 + pal.radius, Math.min(VIRTUAL_WIDTH - 20 - pal.radius, pal.x));
  pal.y = Math.max(pal.radius, Math.min(FLOOR_Y - pal.radius, pal.y));
}

export function normalizeFrameDelta(
  timestamp: number,
  lastTimestamp: number | null
): { dt: number; nextTimestamp: number } {
  if (lastTimestamp === null || !Number.isFinite(timestamp)) {
    return { dt: 1, nextTimestamp: Number.isFinite(timestamp) ? timestamp : 0 };
  }
  const elapsed = Math.max(0, Math.min(MAX_FRAME_DELTA_MS, timestamp - lastTimestamp));
  return {
    dt: elapsed / FRAME_BASELINE_MS,
    nextTimestamp: timestamp,
  };
}

export function playPetSound(controller: AudioController, enabled: boolean): void {
  if (!enabled) return;
  void playWithAudio(controller, (ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.15);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  });
}

export function playBounceSound(controller: AudioController, enabled: boolean, high = false): void {
  if (!enabled) return;
  void playWithAudio(controller, (ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    const startFreq = high ? 520 : 320;
    const endFreq = high ? 180 : 120;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.14);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  });
}

export function playEatSound(controller: AudioController, enabled: boolean): void {
  if (!enabled) return;
  void playWithAudio(controller, (ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now);
    osc.frequency.setValueAtTime(880, now + 0.08);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);
  });
}

export function playWhistleSound(controller: AudioController, enabled: boolean): void {
  if (!enabled) return;
  void playWithAudio(controller, (ctx) => {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.linearRampToValueAtTime(1320, now + 0.12);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.25);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  });
}

export interface PhysicsStepInput {
  pal: PalEntity;
  ball: Ball | null;
  treat: Treat | null;
  particles: Particle[];
  platforms: Platform[];
  selectedPal: PalType;
  dt: number;
  tickCount: number;
  soundEnabled: boolean;
  audioController: AudioController;
  onEatTreat: () => void;
  onSetMood: (mood: PalMood) => void;
  onBoostEnergy: (delta: number) => void;
}

export function stepPalsPhysics({
  pal,
  ball,
  treat,
  particles,
  platforms,
  selectedPal,
  dt,
  tickCount,
  soundEnabled,
  audioController,
  onEatTreat,
  onSetMood,
  onBoostEnergy,
}: PhysicsStepInput): { consumedTreat: boolean } {
  let consumedTreat = false;

  if (dt > 0) {
    if (pal.state !== 'dragged') {
      pal.vy += GRAVITY * dt;
      pal.x += pal.vx * dt;
      pal.y += pal.vy * dt;

      pal.vx *= Math.pow(0.94, dt);

      let grounded = false;
      for (const plat of platforms) {
        const prevY = pal.y - pal.vy * dt;
        const isAbove = prevY <= plat.y;
        const withinX =
          pal.x + pal.radius * 0.7 >= plat.x && pal.x - pal.radius * 0.7 <= plat.x + plat.width;
        if (isAbove && pal.y + pal.radius >= plat.y && withinX && pal.vy >= 0) {
          pal.y = plat.y - pal.radius;
          grounded = true;

          if (plat.type === 'bouncy') {
            pal.vy = -14.5;
            playBounceSound(audioController, soundEnabled, true);
            pal.stretch = 1.4;
            pal.squash = 0.7;
            particles.push({
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
              playBounceSound(audioController, soundEnabled, false);
              pal.squash = 1.25;
              pal.stretch = 0.8;
            }
            pal.vy = 0;
          }
          break;
        }
      }

      // Hard floor safety clamp so dragging or fast deltas can never tunnel below FLOOR_Y
      if (pal.y + pal.radius >= FLOOR_Y) {
        pal.y = FLOOR_Y - pal.radius;
        if (pal.vy > 0) {
          pal.vy = 0;
        }
        grounded = true;
      }

      pal.isGrounded = grounded;

      if (pal.x - pal.radius < 20) {
        pal.x = 20 + pal.radius;
        pal.vx = Math.abs(pal.vx) * 0.7;
        pal.facing = 'right';
      } else if (pal.x + pal.radius > VIRTUAL_WIDTH - 20) {
        pal.x = VIRTUAL_WIDTH - 20 - pal.radius;
        pal.vx = -Math.abs(pal.vx) * 0.7;
        pal.facing = 'left';
      }

      pal.stateTimer -= dt;
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
          } else if (pal.isGrounded) {
            pal.vy = -9 - Math.random() * 3;
            pal.vx = (pal.facing === 'right' ? 3 : -3) * (0.8 + Math.random() * 0.5);
            pal.state = 'jumping';
            pal.stateTimer = 60;
          }
        }
      }

      if (pal.state === 'walking') {
        const speed = selectedPal === 'pip' ? 1.6 : selectedPal === 'barnaby' ? 2.4 : 1.8;
        pal.vx = pal.facing === 'right' ? speed : -speed;
      } else if (pal.state === 'sliding') {
        const speed = 4.0;
        pal.vx = pal.facing === 'right' ? speed : -speed;
        if (pal.isGrounded && Math.floor(tickCount) % 4 === 0) {
          particles.push({
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

        if (treat && Math.hypot(pal.x - treat.x, pal.y - treat.y) < 35) {
          consumedTreat = true;
          playEatSound(audioController, soundEnabled);
          onEatTreat();
          onSetMood('Joyful');
          onBoostEnergy(15);
          pal.state = 'eating';
          pal.stateTimer = 50;

          for (let i = 0; i < 6; i++) {
            particles.push({
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

        if (ball && Math.hypot(pal.x - ball.x, pal.y - ball.y) < pal.radius + ball.radius + 6) {
          ball.vx = (pal.facing === 'right' ? 1 : -1) * (5 + Math.random() * 4);
          ball.vy = -6 - Math.random() * 3;
          playBounceSound(audioController, soundEnabled);
          pal.vy = -4;
        }
      }
    }

    const restoreBlend = Math.min(1, 0.12 * dt);
    pal.squash += (1 - pal.squash) * restoreBlend;
    pal.stretch += (1 - pal.stretch) * restoreBlend;
    pal.animTime += 0.08 * dt;

    if (ball) {
      ball.vy += GRAVITY * dt;
      ball.x += ball.vx * dt;
      ball.y += ball.vy * dt;
      ball.vx *= Math.pow(0.98, dt);

      for (const plat of platforms) {
        const isAbove = ball.y - ball.vy * dt <= plat.y;
        const withinX =
          ball.x + ball.radius >= plat.x && ball.x - ball.radius <= plat.x + plat.width;
        if (isAbove && ball.y + ball.radius >= plat.y && withinX && ball.vy >= 0) {
          ball.y = plat.y - ball.radius;
          if (plat.type === 'bouncy') {
            ball.vy = -13;
            playBounceSound(audioController, soundEnabled, true);
          } else {
            ball.vy = -ball.vy * 0.75;
          }
          if (Math.abs(ball.vy) < 1) ball.vy = 0;
          break;
        }
      }

      if (ball.y + ball.radius > FLOOR_Y) {
        ball.y = FLOOR_Y - ball.radius;
        ball.vy = Math.abs(ball.vy) > 1 ? -Math.abs(ball.vy) * 0.75 : 0;
      }

      if (ball.x - ball.radius < 10) {
        ball.x = 10 + ball.radius;
        ball.vx = -ball.vx * 0.8;
      } else if (ball.x + ball.radius > VIRTUAL_WIDTH - 10) {
        ball.x = VIRTUAL_WIDTH - 10 - ball.radius;
        ball.vx = -ball.vx * 0.8;
      }
    }

    if (treat && !consumedTreat) {
      treat.vy += GRAVITY * 0.8 * dt;
      treat.x += treat.vx * dt;
      treat.y += treat.vy * dt;
      treat.vx *= Math.pow(0.95, dt);

      for (const plat of platforms) {
        if (
          treat.y + 12 >= plat.y &&
          treat.x >= plat.x &&
          treat.x <= plat.x + plat.width &&
          treat.vy >= 0
        ) {
          treat.y = plat.y - 12;
          treat.vy = 0;
          treat.vx = 0;
          break;
        }
      }

      if (treat.y + 12 > FLOOR_Y) {
        treat.y = FLOOR_Y - 12;
        treat.vy = 0;
        treat.vx = 0;
      }
    }
  }

  return { consumedTreat };
}

export function renderEnvironmentBackground(
  ctx: CanvasRenderingContext2D,
  env: EnvironmentType,
  tick: number
): void {
  if (env === 'city') {
    const sky = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    sky.addColorStop(0, '#090d16');
    sky.addColorStop(1, '#17223b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 73 + 12) % VIRTUAL_WIDTH;
      const sy = (i * 37 + 5) % 240;
      const rad = (i % 3 === 0 ? 1.5 : 1) * (0.8 + 0.2 * Math.sin(tick * 0.05 + i));
      ctx.beginPath();
      ctx.arc(sx, sy, rad, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(40, 160, 90, 250);
    ctx.fillRect(150, 110, 110, 300);
    ctx.fillRect(280, 140, 130, 270);
    ctx.fillRect(430, 90, 100, 320);
    ctx.fillRect(550, 130, 120, 280);
    ctx.fillRect(690, 150, 80, 260);

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
    const sky = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    sky.addColorStop(0, '#04130d');
    sky.addColorStop(1, '#0e2b1f');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(710, 80, 32, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#062016';
    ctx.beginPath();
    ctx.arc(60, 200, 120, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(740, 210, 130, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 15; i++) {
      const fx = (i * 97 + tick * 0.4 * (i % 2 === 0 ? 1 : -1)) % VIRTUAL_WIDTH;
      const fy = 100 + ((i * 43 + Math.sin(tick * 0.04 + i) * 30) % 270);
      const glow = Math.sin(tick * 0.08 + i) * 0.5 + 0.5;
      ctx.fillStyle = `rgba(163, 230, 53, ${0.4 + glow * 0.6})`;
      ctx.beginPath();
      ctx.arc((fx + VIRTUAL_WIDTH) % VIRTUAL_WIDTH, fy, 2 + glow * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    const sky = ctx.createLinearGradient(0, 0, 0, VIRTUAL_HEIGHT);
    sky.addColorStop(0, '#19112b');
    sky.addColorStop(1, '#2f1a4a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, VIRTUAL_WIDTH, VIRTUAL_HEIGHT);

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

export function renderPlatforms(
  ctx: CanvasRenderingContext2D,
  platforms: Platform[],
  env: EnvironmentType
): void {
  for (const plat of platforms) {
    if (plat.id === 'floor') {
      if (env === 'city') {
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(plat.x, plat.y, plat.width, 4);
      } else if (env === 'forest') {
        ctx.fillStyle = '#14532d';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(plat.x, plat.y, plat.width, 5);
      } else {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(plat.x, plat.y, plat.width, 5);
      }
      continue;
    }

    if (plat.type === 'bouncy') {
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(plat.x, plat.y, plat.width, 4);

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

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(plat.x + plat.width * 0.3, plat.y + 4, 5, 0, Math.PI * 2);
      ctx.arc(plat.x + plat.width * 0.7, plat.y + 6, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fef08a';
      ctx.fillRect(plat.x + plat.width * 0.4, plat.y + 10, plat.width * 0.2, 40);
    } else {
      const color = env === 'city' ? '#334155' : env === 'forest' ? '#713f12' : '#9a3412';
      ctx.fillStyle = color;
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

      ctx.fillStyle = env === 'city' ? '#64748b' : env === 'forest' ? '#15803d' : '#fb923c';
      ctx.fillRect(plat.x, plat.y, plat.width, 4);
    }
  }
}

export function renderPal(ctx: CanvasRenderingContext2D, pal: PalEntity, palType: PalType): void {
  ctx.save();
  ctx.translate(pal.x, pal.y);
  ctx.scale(pal.squash, pal.stretch);

  const flip = pal.facing === 'left' ? -1 : 1;
  ctx.scale(flip, 1);

  if (palType === 'pip') {
    if (pal.state === 'sliding') {
      ctx.rotate(0.2);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, pal.radius, pal.radius * 0.8, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(0, 0, pal.radius * 0.85, pal.radius, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(2, 4, pal.radius * 0.55, pal.radius * 0.7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(pal.radius * 0.5, -4);
    ctx.lineTo(pal.radius * 0.95, 0);
    ctx.lineTo(pal.radius * 0.5, 4);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.35, -7, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.4, -8, 1.2, 0, Math.PI * 2);
    ctx.fill();

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

    const footOffset = pal.state === 'walking' ? Math.sin(pal.animTime * 10) * 4 : 0;
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(-6, pal.radius - 2 + footOffset, 6, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(6, pal.radius - 2 - footOffset, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (palType === 'barnaby') {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, pal.radius, pal.radius * 0.9, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(0, 2, pal.radius * 0.9, pal.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.35, -8, pal.radius * 0.65, 0, Math.PI * 2);
    ctx.fill();

    const earBounce = Math.sin(pal.animTime * 12) * 0.15;
    ctx.save();
    ctx.translate(pal.radius * 0.1, -14);
    ctx.rotate(earBounce);
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.ellipse(0, 10, 7, 14, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(pal.radius * 0.65, -4, 9, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.85, -6, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.45, -11, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.5, -12, 1.2, 0, Math.PI * 2);
    ctx.fill();

    const tailWag = Math.sin(pal.animTime * 18) * 0.5;
    ctx.save();
    ctx.translate(-pal.radius * 0.7, 0);
    ctx.rotate(tailWag - 0.4);
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(-8, -4, 12, 4, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.ellipse(pal.radius * 0.75, 1, 3.5, 5, 0.3, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(0, pal.radius, pal.radius * 0.8, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    const jellyGrad = ctx.createRadialGradient(-5, -5, 4, 0, 0, pal.radius);
    jellyGrad.addColorStop(0, '#34d399');
    jellyGrad.addColorStop(1, '#059669');
    ctx.fillStyle = jellyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, pal.radius * 0.85, pal.radius * 0.8, 0, 0, Math.PI * 2);
    ctx.fill();

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

    ctx.fillStyle = '#064e3b';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.3, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.34, -5.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(251, 113, 133, 0.6)';
    ctx.beginPath();
    ctx.arc(pal.radius * 0.45, 3, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

export function renderBall(ctx: CanvasRenderingContext2D, ball: Ball): void {
  ctx.save();
  ctx.translate(ball.x, ball.y);

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e0f2fe';
  ctx.beginPath();
  ctx.arc(-3, -3, ball.radius * 0.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function renderTreat(ctx: CanvasRenderingContext2D, treat: Treat): void {
  ctx.save();
  ctx.translate(treat.x, treat.y);
  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const icon = treat.type === 'fish' ? '🐟' : treat.type === 'bone' ? '🦴' : '🫐';
  ctx.fillText(icon, 0, 0);
  ctx.restore();
}

export function renderParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  dt = 1
): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

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
