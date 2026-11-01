import {
  type BiomorphGenome,
  type EcosystemConfig,
  type TerrainType,
  type ClimateType,
  type ThreatType,
  calculateFitness,
  createPrimordialGenome,
  mutateGenome,
  renderBiomorphBody,
} from './biomorphEngine';

export type AgentRole = 'player' | 'prey' | 'predator' | 'rival';

export interface BiosphereAgent {
  id: string;
  role: AgentRole;
  name: string;
  genome: BiomorphGenome;
  x: number;
  y: number;
  vx: number;
  vy: number;
  heading: number; // in radians
  speed: number;
  maxSpeed: number;
  size: number; // visual scale factor
  energy: number; // 0 to 100
  maxEnergy: number;
  fitness: number; // 0 to 100
  isAlive: boolean;
  invulnerableTimer: number; // seconds
  animationPhase: number;
  targetX: number;
  targetY: number;
  retargetTimer: number; // seconds until next direction pick
}

export interface AmbientParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
  phase: number;
}

export interface BiosphereState {
  agents: BiosphereAgent[];
  particles: AmbientParticle[];
  playerAgent: BiosphereAgent | null;
  ecosystem: EcosystemConfig;
  isPaused: boolean;
  simSpeed: number; // 1, 2, or 3
  elapsedSeconds: number;
  preyEaten: number;
  predatorsRepelled: number;
  apexDominanceAchieved: boolean;
  isExtinct: boolean;
  extinctionReason: string;
  actionLog: string[];
}

// -------------------------------------------------------------
// Procedural Population Generators
// -------------------------------------------------------------

function createPreyGenome(seedIndex: number): BiomorphGenome {
  const base = createPrimordialGenome();
  // Herbivore / Prey adaptations: bright, gentle colors, slender segments, light wings or bulbs
  base.name = `Critter-${seedIndex + 1}`;
  base.primaryHue = (110 + seedIndex * 35) % 360;
  base.secondaryHue = (base.primaryHue + 60) % 360;
  base.glowHue = (base.primaryHue + 180) % 360;
  base.segments = [
    { width: 20, height: 16, yOffset: -18 },
    { width: 26, height: 24, yOffset: 6 },
  ];
  base.limbPairs = [
    { length1: 18, length2: 16, angle1: -20, angle2: 30, thickness: 2.5, tipType: 'taper' },
    { length1: 22, length2: 18, angle1: 25, angle2: 20, thickness: 2.5, tipType: seedIndex % 2 === 0 ? 'wing' : 'taper' },
  ];
  base.antennaCount = 2;
  base.antennaLength = 28;
  base.antennaTip = 'bulb';
  base.eyeCount = 2;
  base.eyeSize = 4;
  base.headApparatus = 'none';
  return base;
}

function createPredatorGenome(threat: ThreatType, seedIndex: number): BiomorphGenome {
  const base = createPrimordialGenome();
  base.name = `Hunter-${seedIndex + 1}`;

  switch (threat) {
    case 'airborne':
      base.primaryHue = (180 + seedIndex * 40) % 360;
      base.secondaryHue = 45;
      base.glowHue = 30;
      base.limbPairs = [
        { length1: 35, length2: 45, angle1: -45, angle2: 50, thickness: 4, tipType: 'wing' },
        { length1: 30, length2: 35, angle1: 15, angle2: 30, thickness: 3.5, tipType: 'wing' },
        { length1: 25, length2: 25, angle1: 50, angle2: -20, thickness: 3, tipType: 'claw' },
      ];
      base.headApparatus = 'mandibles';
      break;

    case 'parasites':
      base.primaryHue = (290 + seedIndex * 50) % 360;
      base.secondaryHue = 330;
      base.glowHue = 310;
      base.limbPairs = [
        { length1: 22, length2: 22, angle1: -30, angle2: 40, thickness: 2.5, tipType: 'taper' },
        { length1: 26, length2: 24, angle1: 0, angle2: 35, thickness: 2.5, tipType: 'taper' },
        { length1: 24, length2: 26, angle1: 30, angle2: 25, thickness: 2.5, tipType: 'taper' },
        { length1: 20, length2: 22, angle1: 60, angle2: 20, thickness: 2, tipType: 'taper' },
      ];
      base.headApparatus = 'proboscis';
      break;

    default: // stalkers, gravity, scarcity
      base.primaryHue = (345 + seedIndex * 30) % 360; // Crimson / Obsidian
      base.secondaryHue = 15;
      base.glowHue = 0;
      base.limbPairs = [
        { length1: 40, length2: 35, angle1: -25, angle2: 55, thickness: 6, tipType: 'claw' },
        { length1: 45, length2: 40, angle1: 15, angle2: 40, thickness: 5.5, tipType: 'claw' },
        { length1: 38, length2: 42, angle1: 45, angle2: 25, thickness: 5, tipType: 'claw' },
      ];
      base.headApparatus = 'mandibles';
      base.eyeCount = 4;
      break;
  }
  return base;
}

function createRivalGenome(parent: BiomorphGenome, seedIndex: number): BiomorphGenome {
  const mutated = mutateGenome(parent, 'moderate').child;
  mutated.name = `Wild-${seedIndex + 1}`;
  return mutated;
}

// -------------------------------------------------------------
// Ambient Particle Factory
// -------------------------------------------------------------

function createAmbientParticles(
  terrain: TerrainType,
  climate: ClimateType,
  width: number,
  height: number,
  count = 45
): AmbientParticle[] {
  const particles: AmbientParticle[] = [];

  for (let i = 0; i < count; i++) {
    let color = 'rgba(148, 163, 184, 0.4)';
    let vx = (Math.random() - 0.5) * 0.4;
    let vy = (Math.random() - 0.5) * 0.4;
    let radius = 1 + Math.random() * 2.5;

    if (terrain === 'swamp') {
      color = `hsla(${120 + Math.random() * 40}, 70%, 45%, ${0.25 + Math.random() * 0.35})`;
      vy = -0.3 - Math.random() * 0.4; // Rising methane bubbles
      radius = 1.5 + Math.random() * 3;
    } else if (terrain === 'abyss') {
      color = `hsla(${190 + Math.random() * 70}, 85%, 60%, ${0.3 + Math.random() * 0.4})`;
      vy = -0.15 - Math.random() * 0.25;
      radius = 1.2 + Math.random() * 2;
    } else if (terrain === 'crags' || terrain === 'desert') {
      color = `hsla(${35 + Math.random() * 25}, 65%, 55%, ${0.2 + Math.random() * 0.3})`;
      vx = 0.5 + Math.random() * 0.8; // Sand draft
      radius = 1 + Math.random() * 2;
    } else if (terrain === 'canopy') {
      color = `hsla(${95 + Math.random() * 50}, 80%, 50%, ${0.25 + Math.random() * 0.35})`;
      vx = (Math.random() - 0.3) * 0.5;
      vy = 0.2 + Math.random() * 0.4; // Floating spores/leaves
    }

    if (climate === 'frost') {
      color = `hsla(205, 90%, 85%, ${0.35 + Math.random() * 0.45})`;
      vy = 0.6 + Math.random() * 0.9; // Blizzard flakes
      vx = 0.4 + Math.random() * 0.6;
    } else if (climate === 'geothermal') {
      color = `hsla(${15 + Math.random() * 30}, 95%, 60%, ${0.35 + Math.random() * 0.4})`;
      vy = -0.5 - Math.random() * 0.8; // Rising volcanic embers
    } else if (climate === 'acidic') {
      color = `hsla(80, 85%, 55%, ${0.3 + Math.random() * 0.35})`;
    }

    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx,
      vy,
      radius,
      alpha: 0.2 + Math.random() * 0.5,
      color,
      phase: Math.random() * Math.PI * 2,
    });
  }

  return particles;
}

// -------------------------------------------------------------
// Initial Biosphere State Creator
// -------------------------------------------------------------

export function createInitialBiosphere(
  playerGenome: BiomorphGenome,
  ecosystem: EcosystemConfig,
  width: number,
  height: number
): BiosphereState {
  const playerFitness = calculateFitness(playerGenome, ecosystem).score;
  const hasWings = playerGenome.limbPairs.some((l) => l.tipType === 'wing');
  const limbBonus = playerGenome.limbPairs.length * 0.08;
  const wingBonus = hasWings ? 0.35 : 0;
  const playerMaxSpeed = 1.3 + (playerFitness / 100) * 1.5 + limbBonus + wingBonus;

  const playerAgent: BiosphereAgent = {
    id: `player-${Date.now()}`,
    role: 'player',
    name: playerGenome.name,
    genome: playerGenome,
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    heading: -Math.PI / 2, // Facing upward
    speed: 0,
    maxSpeed: playerMaxSpeed,
    size: 0.42,
    energy: 100,
    maxEnergy: 100,
    fitness: playerFitness,
    isAlive: true,
    invulnerableTimer: 0,
    animationPhase: 0,
    targetX: width / 2,
    targetY: height / 2,
    retargetTimer: 2,
  };

  const agents: BiosphereAgent[] = [playerAgent];

  // Spawn 8 Prey Agents
  for (let i = 0; i < 8; i++) {
    const genome = createPreyGenome(i);
    const angle = (i / 8) * Math.PI * 2;
    const dist = 140 + Math.random() * 180;
    const px = Math.min(Math.max(40, width / 2 + Math.cos(angle) * dist), width - 40);
    const py = Math.min(Math.max(40, height / 2 + Math.sin(angle) * dist), height - 40);

    agents.push({
      id: `prey-${i}-${Date.now()}`,
      role: 'prey',
      name: genome.name,
      genome,
      x: px,
      y: py,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      heading: Math.random() * Math.PI * 2,
      speed: 0.8 + Math.random() * 0.5,
      maxSpeed: 1.8,
      size: 0.26,
      energy: 50,
      maxEnergy: 50,
      fitness: 45,
      isAlive: true,
      invulnerableTimer: 0,
      animationPhase: Math.random() * 10,
      targetX: Math.random() * width,
      targetY: Math.random() * height,
      retargetTimer: 2 + Math.random() * 3,
    });
  }

  // Spawn 2 Predators
  for (let i = 0; i < 2; i++) {
    const genome = createPredatorGenome(ecosystem.threat, i);
    const edgeX = i === 0 ? 60 : width - 60;
    const edgeY = i === 0 ? 60 : height - 60;

    agents.push({
      id: `predator-${i}-${Date.now()}`,
      role: 'predator',
      name: genome.name,
      genome,
      x: edgeX,
      y: edgeY,
      vx: 0,
      vy: 0,
      heading: Math.random() * Math.PI * 2,
      speed: 1.2,
      maxSpeed: ecosystem.threat === 'airborne' ? 2.4 : 2.0,
      size: 0.55,
      energy: 100,
      maxEnergy: 100,
      fitness: 80,
      isAlive: true,
      invulnerableTimer: 0,
      animationPhase: Math.random() * 10,
      targetX: width / 2,
      targetY: height / 2,
      retargetTimer: 1.5,
    });
  }

  // Spawn 3 Rival Biomorphs
  for (let i = 0; i < 3; i++) {
    const genome = createRivalGenome(playerGenome, i);
    const rx = 80 + Math.random() * (width - 160);
    const ry = 80 + Math.random() * (height - 160);
    const rivalFit = calculateFitness(genome, ecosystem).score;

    agents.push({
      id: `rival-${i}-${Date.now()}`,
      role: 'rival',
      name: genome.name,
      genome,
      x: rx,
      y: ry,
      vx: 0,
      vy: 0,
      heading: Math.random() * Math.PI * 2,
      speed: 0.9,
      maxSpeed: 1.5,
      size: 0.38,
      energy: 80,
      maxEnergy: 80,
      fitness: rivalFit,
      isAlive: true,
      invulnerableTimer: 0,
      animationPhase: Math.random() * 10,
      targetX: Math.random() * width,
      targetY: Math.random() * height,
      retargetTimer: 3,
    });
  }

  const particles = createAmbientParticles(ecosystem.terrain, ecosystem.climate, width, height);

  return {
    agents,
    particles,
    playerAgent,
    ecosystem,
    isPaused: false,
    simSpeed: 1,
    elapsedSeconds: 0,
    preyEaten: 0,
    predatorsRepelled: 0,
    apexDominanceAchieved: false,
    isExtinct: false,
    extinctionReason: '',
    actionLog: [
      `🚀 ${playerGenome.name} launched into ${ecosystem.terrain} (${playerFitness}% fitness).`,
      '🌿 Grazing on bio-spores sustains energy. Beware of native predators!',
    ],
  };
}

// -------------------------------------------------------------
// Physics, Steering & Interaction Step
// -------------------------------------------------------------

export function stepBiosphere(
  prevState: BiosphereState,
  dt: number,
  width: number,
  height: number
): BiosphereState {
  if (prevState.isPaused || prevState.isExtinct) {
    // Still animate ambient particles even if paused or post-mortem
    const updatedParticles = prevState.particles.map((p) => {
      let nx = p.x + p.vx * dt * 30;
      let ny = p.y + p.vy * dt * 30;
      if (nx < 0) nx += width;
      if (nx > width) nx -= width;
      if (ny < 0) ny += height;
      if (ny > height) ny -= height;
      return { ...p, x: nx, y: ny };
    });
    return { ...prevState, particles: updatedParticles };
  }

  const effectiveDt = dt * prevState.simSpeed;
  const newElapsed = prevState.elapsedSeconds + effectiveDt;
  const actionLog = [...prevState.actionLog];

  const logEvent = (msg: string) => {
    actionLog.unshift(msg);
    if (actionLog.length > 5) actionLog.pop();
  };

  const agents = prevState.agents.map((a) => ({ ...a }));
  const player = agents.find((a) => a.role === 'player') ?? null;

  let preyEatenDelta = 0;
  let repelledDelta = 0;
  let isExtinct: boolean = prevState.isExtinct;
  let extinctionReason = prevState.extinctionReason;
  let apexDominance = prevState.apexDominanceAchieved;

  // 1. Process Player Metabolism & Climate Drain
  if (player && player.isAlive) {
    let metabolicDrain = 1.2 * effectiveDt;

    // Climate Harshness drain
    if (prevState.ecosystem.climate === 'frost' || prevState.ecosystem.climate === 'acidic') {
      const mitigation = player.fitness >= 90 ? 0 : player.fitness >= 75 ? 0.3 : 0.9;
      metabolicDrain += mitigation * effectiveDt;
    } else if (prevState.ecosystem.climate === 'geothermal') {
      const mitigation = player.fitness >= 85 ? 0 : 0.6;
      metabolicDrain += mitigation * effectiveDt;
    }

    player.energy = Math.max(0, player.energy - metabolicDrain);
    if (player.invulnerableTimer > 0) {
      player.invulnerableTimer = Math.max(0, player.invulnerableTimer - effectiveDt);
    }

    // Check Extinction
    if (player.energy <= 0) {
      player.isAlive = false;
      player.energy = 0;
      isExtinct = true;
      extinctionReason = `Succumbed to energy depletion and hostile ${prevState.ecosystem.climate} climate.`;
      logEvent(`💀 ${player.name} perished from exhaustion in the biosphere.`);
    }
  }

  // 2. Behavioral Steering & Movement
  for (const agent of agents) {
    if (!agent.isAlive) continue;

    agent.retargetTimer -= effectiveDt;
    agent.animationPhase += effectiveDt * (agent.speed + 1) * 3;

    // Steering Force vectors
    let steerX = 0;
    let steerY = 0;

    if (agent.role === 'player') {
      // Natural gentle seeking toward nearest prey within 280px if not retargeted
      let nearestPrey: BiosphereAgent | null = null;
      let minDist = 280;

      for (const other of agents) {
        if (other.role === 'prey' && other.isAlive) {
          const d = Math.hypot(other.x - agent.x, other.y - agent.y);
          if (d < minDist) {
            minDist = d;
            nearestPrey = other;
          }
        }
      }

      if (nearestPrey) {
        steerX = (nearestPrey.x - agent.x) / minDist;
        steerY = (nearestPrey.y - agent.y) / minDist;
      } else {
        // Wander toward target
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        const d = Math.hypot(dx, dy);
        if (d > 10) {
          steerX = dx / d;
          steerY = dy / d;
        }
      }

      if (agent.retargetTimer <= 0) {
        agent.targetX = 60 + Math.random() * (width - 120);
        agent.targetY = 60 + Math.random() * (height - 120);
        agent.retargetTimer = 3 + Math.random() * 2;
      }
    } else if (agent.role === 'prey') {
      // Prey: Flee from player or predators within 120px
      let threatClose = false;
      for (const threat of agents) {
        if ((threat.role === 'predator' || threat.role === 'player') && threat.isAlive) {
          const d = Math.hypot(threat.x - agent.x, threat.y - agent.y);
          if (d < 120 && d > 1) {
            steerX -= ((threat.x - agent.x) / d) * 2;
            steerY -= ((threat.y - agent.y) / d) * 2;
            threatClose = true;
          }
        }
      }

      if (!threatClose) {
        // Wander
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        const d = Math.hypot(dx, dy);
        if (d > 15) {
          steerX = dx / d;
          steerY = dy / d;
        }
      }

      if (agent.retargetTimer <= 0) {
        agent.targetX = 40 + Math.random() * (width - 80);
        agent.targetY = 40 + Math.random() * (height - 80);
        agent.retargetTimer = 2.5 + Math.random() * 3;
      }
    } else if (agent.role === 'predator') {
      // Predator: Hunt nearest player or prey within 200px
      let huntTarget: BiosphereAgent | null = null;
      let minHuntDist = 220;

      for (const target of agents) {
        if ((target.role === 'player' || target.role === 'prey') && target.isAlive) {
          const d = Math.hypot(target.x - agent.x, target.y - agent.y);
          if (d < minHuntDist) {
            minHuntDist = d;
            huntTarget = target;
          }
        }
      }

      if (huntTarget) {
        steerX = (huntTarget.x - agent.x) / minHuntDist;
        steerY = (huntTarget.y - agent.y) / minHuntDist;
      } else {
        const dx = agent.targetX - agent.x;
        const dy = agent.targetY - agent.y;
        const d = Math.hypot(dx, dy);
        if (d > 20) {
          steerX = dx / d;
          steerY = dy / d;
        }
      }

      if (agent.retargetTimer <= 0) {
        agent.targetX = 60 + Math.random() * (width - 120);
        agent.targetY = 60 + Math.random() * (height - 120);
        agent.retargetTimer = 2;
      }
    } else {
      // Rival / Neutral Wander
      const dx = agent.targetX - agent.x;
      const dy = agent.targetY - agent.y;
      const d = Math.hypot(dx, dy);
      if (d > 20) {
        steerX = dx / d;
        steerY = dy / d;
      }
      if (agent.retargetTimer <= 0) {
        agent.targetX = 50 + Math.random() * (width - 100);
        agent.targetY = 50 + Math.random() * (height - 100);
        agent.retargetTimer = 3;
      }
    }

    // Soft Boundary Repulsion
    const margin = 40;
    if (agent.x < margin) steerX += (margin - agent.x) * 0.05;
    if (agent.x > width - margin) steerX -= (agent.x - (width - margin)) * 0.05;
    if (agent.y < margin) steerY += (margin - agent.y) * 0.05;
    if (agent.y > height - margin) steerY -= (agent.y - (height - margin)) * 0.05;

    // Apply acceleration and velocity dampening
    const steerMag = Math.hypot(steerX, steerY);
    if (steerMag > 0.01) {
      steerX /= steerMag;
      steerY /= steerMag;
    }

    agent.vx += steerX * effectiveDt * 2.5;
    agent.vy += steerY * effectiveDt * 2.5;

    // Clamp to maxSpeed
    const currentSpeed = Math.hypot(agent.vx, agent.vy);
    if (currentSpeed > agent.maxSpeed) {
      agent.vx = (agent.vx / currentSpeed) * agent.maxSpeed;
      agent.vy = (agent.vy / currentSpeed) * agent.maxSpeed;
    }

    agent.x += agent.vx * effectiveDt * 50;
    agent.y += agent.vy * effectiveDt * 50;
    agent.speed = Math.hypot(agent.vx, agent.vy);

    // Hard Boundary Clamp
    agent.x = Math.max(20, Math.min(width - 20, agent.x));
    agent.y = Math.max(20, Math.min(height - 20, agent.y));

    // Smooth heading rotation
    if (agent.speed > 0.1) {
      const targetHeading = Math.atan2(agent.vy, agent.vx);
      let angleDiff = targetHeading - agent.heading;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      agent.heading += angleDiff * Math.min(1, effectiveDt * 6);
    }
  }

  // 3. Collision Resolution & Combat Interactions
  if (player && player.isAlive) {
    for (const other of agents) {
      if (other.id === player.id || !other.isAlive) continue;

      const dist = Math.hypot(other.x - player.x, other.y - player.y);

      // Feeding: Player consumes Prey
      if (other.role === 'prey' && dist < 32) {
        other.isAlive = false;
        preyEatenDelta += 1;
        player.energy = Math.min(player.maxEnergy, player.energy + 18);
        logEvent(`🌱 Consumed bio-spore prey (+18 energy).`);

        // Check Apex Dominance Milestone
        if (
          player.fitness >= 90 &&
          (prevState.preyEaten + preyEatenDelta >= 5 || newElapsed >= 45) &&
          !apexDominance
        ) {
          apexDominance = true;
          logEvent(`🏆 APEX DOMINANCE! Master of the ${prevState.ecosystem.terrain} biosphere!`);
        }
      }

      // Combat: Predator attacks Player
      if (other.role === 'predator' && dist < 36 && player.invulnerableTimer <= 0) {
        if (player.fitness >= 60) {
          // High fitness player repels predator!
          repelledDelta += 1;
          player.energy = Math.max(0, player.energy - 6);
          player.invulnerableTimer = 1.2;
          // Knockback predator
          other.vx = -other.vx * 1.5;
          other.vy = -other.vy * 1.5;
          logEvent(`🛡️ Repelled predator ambush! High adaptation held ground (-6 energy).`);
        } else {
          // Low fitness player takes heavy strike
          player.energy = Math.max(0, player.energy - 26);
          player.invulnerableTimer = 1.5;
          logEvent(`⚠️ Struck by ${other.name}! Anatomical vulnerabilities exposed (-26 energy).`);
        }

        if (player.energy <= 0) {
          player.isAlive = false;
          isExtinct = true;
          extinctionReason = `Killed in combat by ${other.name} (${prevState.ecosystem.threat}).`;
          logEvent(`💀 ${player.name} was devoured by an apex predator.`);
        }
      }
    }
  }

  // 4. Update Ambient Particles
  const particles = prevState.particles.map((p) => {
    let nx = p.x + p.vx * effectiveDt * 30;
    let ny = p.y + p.vy * effectiveDt * 30;
    if (nx < 0) nx += width;
    if (nx > width) nx -= width;
    if (ny < 0) ny += height;
    if (ny > height) ny -= height;
    return { ...p, x: nx, y: ny };
  });

  return {
    ...prevState,
    agents,
    particles,
    playerAgent: player,
    elapsedSeconds: newElapsed,
    preyEaten: prevState.preyEaten + preyEatenDelta,
    predatorsRepelled: prevState.predatorsRepelled + repelledDelta,
    apexDominanceAchieved: apexDominance,
    isExtinct,
    extinctionReason,
    actionLog,
  };
}

// -------------------------------------------------------------
// Interactive Entity Addition & Respawn
// -------------------------------------------------------------

export function addPreyAgent(state: BiosphereState, width: number, height: number): BiosphereState {
  const newIndex = state.agents.filter((a) => a.role === 'prey').length;
  const genome = createPreyGenome(newIndex);
  const newPrey: BiosphereAgent = {
    id: `prey-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    role: 'prey',
    name: genome.name,
    genome,
    x: 40 + Math.random() * (width - 80),
    y: 40 + Math.random() * (height - 80),
    vx: (Math.random() - 0.5) * 0.5,
    vy: (Math.random() - 0.5) * 0.5,
    heading: Math.random() * Math.PI * 2,
    speed: 0.9,
    maxSpeed: 1.8,
    size: 0.26,
    energy: 50,
    maxEnergy: 50,
    fitness: 45,
    isAlive: true,
    invulnerableTimer: 0,
    animationPhase: Math.random() * 10,
    targetX: Math.random() * width,
    targetY: Math.random() * height,
    retargetTimer: 2.5,
  };

  const actionLog = [`🌱 Introduced new bio-spore prey to the biome.`, ...state.actionLog].slice(0, 5);
  return {
    ...state,
    agents: [...state.agents, newPrey],
    actionLog,
  };
}

export function addPredatorAgent(state: BiosphereState, width: number, height: number): BiosphereState {
  const newIndex = state.agents.filter((a) => a.role === 'predator').length;
  const genome = createPredatorGenome(state.ecosystem.threat, newIndex);
  const newPredator: BiosphereAgent = {
    id: `predator-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    role: 'predator',
    name: genome.name,
    genome,
    x: Math.random() < 0.5 ? 50 : width - 50,
    y: Math.random() < 0.5 ? 50 : height - 50,
    vx: 0,
    vy: 0,
    heading: Math.random() * Math.PI * 2,
    speed: 1.2,
    maxSpeed: 2.1,
    size: 0.55,
    energy: 100,
    maxEnergy: 100,
    fitness: 80,
    isAlive: true,
    invulnerableTimer: 0,
    animationPhase: Math.random() * 10,
    targetX: width / 2,
    targetY: height / 2,
    retargetTimer: 1.5,
  };

  const actionLog = [`⚠️ Hostile predator (${genome.name}) stalked into the territory!`, ...state.actionLog].slice(0, 5);
  return {
    ...state,
    agents: [...state.agents, newPredator],
    actionLog,
  };
}

export function respawnPlayer(state: BiosphereState, width: number, height: number): BiosphereState {
  if (!state.playerAgent) return state;

  const respawned: BiosphereAgent = {
    ...state.playerAgent,
    x: width / 2,
    y: height / 2,
    vx: 0,
    vy: 0,
    heading: -Math.PI / 2,
    speed: 0,
    energy: 100,
    isAlive: true,
    invulnerableTimer: 2.0,
    targetX: width / 2,
    targetY: height / 2,
  };

  const updatedAgents = state.agents.map((a) => (a.role === 'player' ? respawned : a));
  const actionLog = [`✨ ${respawned.name} revived with full energy!`, ...state.actionLog].slice(0, 5);

  return {
    ...state,
    agents: updatedAgents,
    playerAgent: respawned,
    isExtinct: false,
    extinctionReason: '',
    actionLog,
  };
}

// -------------------------------------------------------------
// Evolutionary Extinction Diagnostic Advisor
// -------------------------------------------------------------

export function generateExtinctionAdvice(
  genome: BiomorphGenome,
  ecosystem: EcosystemConfig,
  reason: string
): { analysis: string; advice: string } {
  const fitnessData = calculateFitness(genome, ecosystem);
  const weakestCons = fitnessData.cons;

  let advice = 'Return to the Breeding Lab and select offspring with higher locomotion speed or defensive armor.';

  if (ecosystem.threat === 'airborne') {
    advice = 'Airborne swarms dominate unshielded biomorphs. Mutate wings or multiple articulated limb pairs to boost evasion speed.';
  } else if (ecosystem.threat === 'stalkers') {
    advice = 'Apex stalkers strike from darkness. Evolve sensory eye clusters (>= 4 optics) and mandibles to detect and repel ambushers.';
  } else if (ecosystem.climate === 'frost' || ecosystem.climate === 'acidic') {
    advice = 'Harsh ambient weather accelerates metabolic exhaustion. Increase body segment thickness and dorsal carapace to insulate against exposure.';
  } else if (weakestCons.length > 0) {
    advice = `Address primary evolutionary flaws: ${weakestCons.join(', ')}.`;
  }

  const analysis = `Extinction occurred after encountering hostile conditions in ${ecosystem.terrain} under ${ecosystem.climate} climate. Reason: ${reason}`;

  return { analysis, advice };
}

// -------------------------------------------------------------
// HTML5 Canvas 2D Renderer for Biosphere
// -------------------------------------------------------------

export function drawBiosphere(
  ctx: CanvasRenderingContext2D,
  state: BiosphereState,
  width: number,
  height: number,
  animTime: number
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  // 1. Draw Biome Atmospheric Background
  drawBiomeBackground(ctx, state.ecosystem.terrain, width, height, animTime);

  // 2. Draw Ambient Particles
  for (const p of state.particles) {
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 3. Draw All Alive Agents
  for (const agent of state.agents) {
    if (!agent.isAlive) continue;

    ctx.save();
    ctx.translate(agent.x, agent.y);

    // Rotate agent to heading (biomorph faces up by default, so add PI/2)
    ctx.rotate(agent.heading + Math.PI / 2);
    ctx.scale(agent.size, agent.size);

    // Role-specific Aura
    if (agent.role === 'player') {
      // Celestial player beacon ring
      const pulse = Math.sin(animTime * 4) * 0.2;
      const auraGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, 80);
      auraGrad.addColorStop(0, `rgba(56, 189, 248, ${0.45 + pulse})`);
      auraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 80, 0, Math.PI * 2);
      ctx.fill();

      // Invulnerability shield flash
      if (agent.invulnerableTimer > 0) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.beginPath();
        ctx.arc(0, 0, 75, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Apex Dominance Crown Aura
      if (state.apexDominanceAchieved) {
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 90, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (agent.role === 'predator') {
      // Threat aura
      const threatGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 65);
      threatGrad.addColorStop(0, 'rgba(239, 68, 68, 0.35)');
      threatGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = threatGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 65, 0, Math.PI * 2);
      ctx.fill();
    }

    renderBiomorphBody(ctx, agent.genome, animTime + agent.animationPhase);

    ctx.restore();

    // 4. Draw Player HUD Indicator on Canvas
    if (agent.role === 'player') {
      ctx.save();
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('YOU', agent.x, agent.y - 38);

      // Mini Health/Energy bar above player
      const barW = 44;
      const barH = 5;
      const barX = agent.x - barW / 2;
      const barY = agent.y - 32;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(barX, barY, barW, barH);

      const fillRatio = Math.max(0, Math.min(1, agent.energy / agent.maxEnergy));
      ctx.fillStyle = fillRatio > 0.4 ? '#38bdf8' : fillRatio > 0.2 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(barX, barY, barW * fillRatio, barH);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX, barY, barW, barH);
      ctx.restore();
    }
  }

  // 5. Climate Overlay
  drawClimateOverlay(ctx, state.ecosystem.climate, width, height, animTime);

  ctx.restore();
}

// -------------------------------------------------------------
// Atmospheric Backdrop Helper
// -------------------------------------------------------------

function drawBiomeBackground(
  ctx: CanvasRenderingContext2D,
  terrain: TerrainType,
  width: number,
  height: number,
  animTime: number
) {
  const grad = ctx.createLinearGradient(0, 0, 0, height);

  switch (terrain) {
    case 'swamp':
      grad.addColorStop(0, '#091e14');
      grad.addColorStop(0.5, '#051610');
      grad.addColorStop(1, '#020b07');
      break;
    case 'crags':
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.5, '#0f0e0d');
      grad.addColorStop(1, '#0a0908');
      break;
    case 'canopy':
      grad.addColorStop(0, '#062413');
      grad.addColorStop(0.5, '#04160c');
      grad.addColorStop(1, '#020d07');
      break;
    case 'desert':
      grad.addColorStop(0, '#26170d');
      grad.addColorStop(0.5, '#170e08');
      grad.addColorStop(1, '#0c0704');
      break;
    case 'abyss':
      grad.addColorStop(0, '#040b17');
      grad.addColorStop(0.5, '#020610');
      grad.addColorStop(1, '#010206');
      break;
    case 'cavern':
      grad.addColorStop(0, '#160d26');
      grad.addColorStop(0.5, '#0e0817');
      grad.addColorStop(1, '#07040d');
      break;
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Subtle terrain accents
  ctx.save();
  if (terrain === 'swamp') {
    // Water ripple rings
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.08)';
    ctx.lineWidth = 1.5;
    for (let r = 1; r <= 3; r++) {
      const rippleSize = ((animTime * 20 + r * 60) % 180) + 20;
      ctx.beginPath();
      ctx.ellipse(width * 0.3, height * 0.4, rippleSize, rippleSize * 0.5, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (terrain === 'abyss') {
    // Bioluminescent glow spot
    const abyssGlow = ctx.createRadialGradient(width * 0.7, height * 0.6, 20, width * 0.7, height * 0.6, 220);
    abyssGlow.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
    abyssGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = abyssGlow;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}

function drawClimateOverlay(
  ctx: CanvasRenderingContext2D,
  climate: ClimateType,
  width: number,
  height: number,
  animTime: number
) {
  ctx.save();
  if (climate === 'acidic') {
    ctx.fillStyle = 'rgba(163, 230, 53, 0.06)';
    ctx.fillRect(0, 0, width, height);
  } else if (climate === 'frost') {
    ctx.fillStyle = 'rgba(224, 242, 254, 0.05)';
    ctx.fillRect(0, 0, width, height);
  } else if (climate === 'geothermal') {
    const heatWave = Math.sin(animTime * 3) * 0.03;
    ctx.fillStyle = `rgba(249, 115, 22, ${0.05 + heatWave})`;
    ctx.fillRect(0, 0, width, height);
  } else if (climate === 'darkness') {
    // Darkness vignette
    const darkGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.25, width / 2, height / 2, width * 0.6);
    darkGrad.addColorStop(0, 'transparent');
    darkGrad.addColorStop(1, 'rgba(2, 6, 23, 0.75)');
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, width, height);
  }
  ctx.restore();
}
