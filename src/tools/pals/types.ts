export type PalType = 'pip' | 'barnaby' | 'sprout';
export type EnvironmentType = 'city' | 'forest' | 'playground';
export type PalMood = 'Joyful' | 'Playful' | 'Curious' | 'Munching' | 'Sleepy';

export interface PalsProps {
  onBack: () => void;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'solid' | 'bouncy' | 'mushroom' | 'brick';
  label?: string;
}

export interface Particle {
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

export interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface Treat {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: 'fish' | 'bone' | 'berry';
}

export type PalBehaviorState =
  | 'idle'
  | 'walking'
  | 'jumping'
  | 'sliding'
  | 'chasing'
  | 'eating'
  | 'sleeping'
  | 'dragged';

export interface PalEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  facing: 'left' | 'right';
  state: PalBehaviorState;
  stateTimer: number;
  animTime: number;
  squash: number;
  stretch: number;
  isGrounded: boolean;
}

export interface PalsPrefs {
  pal: PalType;
  env: EnvironmentType;
  soundEnabled: boolean;
  snacksCount: number;
}
