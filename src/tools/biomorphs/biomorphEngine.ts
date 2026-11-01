export interface LimbGene {
  length1: number;
  length2: number;
  angle1: number;
  angle2: number;
  thickness: number;
  tipType: 'claw' | 'pad' | 'taper' | 'glow-orb' | 'wing';
}

export interface SegmentGene {
  width: number;
  height: number;
  yOffset: number;
}

export interface BiomorphGenome {
  id: string;
  generation: number;
  name: string;
  segments: SegmentGene[];
  limbPairs: LimbGene[];
  antennaCount: number;
  antennaLength: number;
  antennaCurve: number;
  antennaTip: 'beaded' | 'bulb' | 'feather';
  eyeCount: number;
  eyeSize: number;
  eyeSpacing: number;
  primaryHue: number; // 0 - 360
  secondaryHue: number; // 0 - 360
  glowHue: number; // 0 - 360
  markingsCount: number;
  markingsStyle: 'stripes' | 'dots' | 'chevrons';
  glowIntensity: number;
  asymmetry: number;
  headApparatus?: 'none' | 'proboscis' | 'mandibles';
}

export type MutationIntensity = 'subtle' | 'moderate' | 'radical';

// Ecosystem & Environmental Fitness Types
export type TerrainType = 'swamp' | 'crags' | 'canopy' | 'desert' | 'abyss' | 'cavern';
export type ClimateType = 'acidic' | 'geothermal' | 'frost' | 'oxygen' | 'darkness';
export type ThreatType = 'stalkers' | 'airborne' | 'parasites' | 'gravity' | 'scarcity';

export interface EcosystemConfig {
  terrain: TerrainType;
  climate: ClimateType;
  threat: ThreatType;
}

export interface FitnessResult {
  score: number; // 0 - 100
  pros: string[];
  cons: string[];
}

export const TERRAINS: { id: TerrainType; name: string; icon: string; desc: string }[] = [
  { id: 'swamp', name: 'Murky Swamp', icon: '🌿', desc: 'Turbid mud pools favoring camouflage, reduced eye exposure, and high limb traction.' },
  { id: 'crags', name: 'Basalt Crags', icon: '🌋', desc: 'Jagged volcanic shelves favoring heavy chitin armor, rock-climbing claws, and obsidian tones.' },
  { id: 'canopy', name: 'Cloud Canopy', icon: '🌲', desc: 'Arboreal forest favoring glider wings, grasping talons, and emerald foliage blending.' },
  { id: 'desert', name: 'Glass Desert', icon: '☀️', desc: 'Blistering solar heat favoring reflective pale gold hues, slender heat radiators, and water conservation.' },
  { id: 'abyss', name: 'Abyssal Trench', icon: '🌊', desc: 'Crushing pitch-black waters demanding high bioluminescence, glowing lures, and expanded optic clusters.' },
  { id: 'cavern', name: 'Crystalline Caverns', icon: '💎', desc: 'Resonant subterranean grottos favoring echolocating feelers, mineral flecks, and silent pads.' },
];

export const CLIMATES: { id: ClimateType; name: string; icon: string; desc: string }[] = [
  { id: 'acidic', name: 'Acidic Smog', icon: '☣️', desc: 'Corrosive vapors rewarding chitinous chemical shields and specialized feeding mouthparts.' },
  { id: 'geothermal', name: 'Geothermal Heat', icon: '🔥', desc: 'Superheated thermal vents rewarding heat discharge radiators and thermal sensory bulbs.' },
  { id: 'frost', name: 'Sub-Zero Frost', icon: '❄️', desc: 'Glacial tundra favoring insulating body mass, thick limbs, and reduced surface area.' },
  { id: 'oxygen', name: 'Oxygen Surge', icon: '💨', desc: 'Hyper-oxygenated atmosphere driving gigantism, sprawling reach, and multi-segmented biomass.' },
  { id: 'darkness', name: 'Pitch Darkness', icon: '🌑', desc: 'Absence of visible daylight penalizing dim sight and rewarding bioluminescent glow.' },
];

export const THREATS: { id: ThreatType; name: string; icon: string; desc: string }[] = [
  { id: 'stalkers', name: 'Apex Stalkers', icon: '🐺', desc: 'Ground prowlers that punish slow locomotion and reward combat claws, mandibles, and camouflage.' },
  { id: 'airborne', name: 'Airborne Hunters', icon: '🦅', desc: 'Swooping raptors that target tall silhouettes and reward low ground profiles or defensive glider wings.' },
  { id: 'parasites', name: 'Parasite Swarms', icon: '🦟', desc: 'Microscopic pests that penetrate thin tissue, rewarding protective cuticle armor and scaled tips.' },
  { id: 'gravity', name: 'Extreme Gravity', icon: '🪐', desc: 'Crushing planetary pull that snaps spindly limbs, rewarding squat multi-legged structural stability.' },
  { id: 'scarcity', name: 'Resource Scarcity', icon: '🌵', desc: 'Barren nutrition that starves bulky organisms, rewarding streamlined caloric metabolic efficiency.' },
];

export function createRandomEcosystem(): EcosystemConfig {
  const terrain = TERRAINS[Math.floor(Math.random() * TERRAINS.length)].id;
  const climate = CLIMATES[Math.floor(Math.random() * CLIMATES.length)].id;
  const threat = THREATS[Math.floor(Math.random() * THREATS.length)].id;
  return { terrain, climate, threat };
}

const PREFIXES = ['Xeno', 'Arthro', 'Spectra', 'Chitin', 'Bioluma', 'Astro', 'Vesper', 'Exo', 'Cryo', 'Omni', 'Nova', 'Solaris', 'Nebula', 'Zephyr', 'Apex'];
const ROOTS = ['mandra', 'pede', 'morph', 'saur', 'lisk', 'pod', 'tera', 'myrmex', 'rachnid', 'thorax', 'draco', 'phasma', 'scorpio', 'luma'];
const SUFFIXES = ['Alpha', 'Prime', 'Nova', 'Viper', 'Rex', 'Major', 'Nebula', 'Eclipse', 'Apex', 'Helix', 'Spectre', 'Vortex', 'Chroma'];

export function generateCreatureName(gen: number): string {
  const p = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
  const r = ROOTS[Math.floor(Math.random() * ROOTS.length)];
  const s = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return `${p}${r} ${s} · G${gen}`;
}

// Expansive starting palettes across the color spectrum
const BASE_HUES = [195, 280, 145, 38, 330, 215, 88, 18, 255, 170];

export function createPrimordialGenome(): BiomorphGenome {
  const startHue = BASE_HUES[Math.floor(Math.random() * BASE_HUES.length)];
  const secHue = (startHue + 120 + Math.random() * 60) % 360;
  const glowHue = (startHue + 210) % 360;

  return {
    id: `bio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    generation: 0,
    name: generateCreatureName(0),
    segments: [
      { width: 32, height: 26, yOffset: -38 }, // Head
      { width: 44, height: 38, yOffset: 0 },   // Thorax
      { width: 36, height: 48, yOffset: 46 },  // Abdomen
    ],
    limbPairs: [
      { length1: 34, length2: 30, angle1: -30, angle2: 45, thickness: 4, tipType: 'claw' },
      { length1: 40, length2: 36, angle1: 5, angle2: 30, thickness: 4.5, tipType: 'claw' },
      { length1: 36, length2: 40, angle1: 35, angle2: 20, thickness: 4, tipType: 'taper' },
    ],
    antennaCount: 2,
    antennaLength: 42,
    antennaCurve: 25,
    antennaTip: 'bulb',
    eyeCount: 2,
    eyeSize: 6,
    eyeSpacing: 16,
    primaryHue: startHue,
    secondaryHue: secHue,
    glowHue: glowHue,
    markingsCount: 4,
    markingsStyle: 'stripes',
    glowIntensity: 0.85,
    asymmetry: 0,
    headApparatus: 'none',
  };
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max);
}

export function mutateGenome(
  parent: BiomorphGenome,
  intensity: MutationIntensity = 'moderate'
): { child: BiomorphGenome; mutatedTraits: string[] } {
  const child: BiomorphGenome = JSON.parse(JSON.stringify(parent));
  child.id = `bio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  child.generation = parent.generation + 1;
  child.name = generateCreatureName(child.generation);

  const deltaMultiplier = intensity === 'subtle' ? 0.12 : intensity === 'moderate' ? 0.22 : 0.38;
  const traits: string[] = [];

  // 1. Natural chromatic drift: maintain familial color semblance with gentle shifts
  if (Math.random() < 0.7) {
    const shift = (Math.random() - 0.5) * 50 * deltaMultiplier;
    child.primaryHue = (child.primaryHue + shift + 360) % 360;
    const secShift = (Math.random() - 0.5) * 40 * deltaMultiplier;
    child.secondaryHue = (child.secondaryHue + secShift + 360) % 360;
    const glowShift = (Math.random() - 0.5) * 40 * deltaMultiplier;
    child.glowHue = (child.glowHue + glowShift + 360) % 360;
    traits.push('Spectral Shift');
  }

  // 2. Limb articulation drift: subtle length & angle mutations preserving posture
  if (Math.random() < 0.75) {
    const pairIdx = Math.floor(Math.random() * child.limbPairs.length);
    const limb = child.limbPairs[pairIdx];
    if (limb) {
      limb.length1 = clamp(limb.length1 * (1 + (Math.random() - 0.5) * deltaMultiplier * 0.8), 18, 65);
      limb.length2 = clamp(limb.length2 * (1 + (Math.random() - 0.5) * deltaMultiplier * 0.8), 16, 65);
      limb.angle1 = clamp(limb.angle1 + (Math.random() - 0.5) * 35 * deltaMultiplier, -75, 75);
      limb.angle2 = clamp(limb.angle2 + (Math.random() - 0.5) * 40 * deltaMultiplier, -90, 90);
      limb.thickness = clamp(limb.thickness * (1 + (Math.random() - 0.5) * deltaMultiplier * 0.6), 2, 8.5);
      traits.push('Limb Articulation');
    }
  }

  // 3. Rare macro-mutation: addition or loss of an appendage pair (~10% chance)
  if (Math.random() < 0.10) {
    if (child.limbPairs.length < 5 && Math.random() > 0.4) {
      const clone = JSON.parse(JSON.stringify(child.limbPairs[0]));
      child.limbPairs.push(clone);
      traits.push('+Appendage Pair');
    } else if (child.limbPairs.length > 2) {
      child.limbPairs.pop();
      traits.push('-Appendage Pair');
    }
  }

  // 4. Appendage tip adaptation (wings, claws, pads, orbs, tapers)
  if (Math.random() < 0.22) {
    const tips: ('claw' | 'pad' | 'taper' | 'glow-orb' | 'wing')[] = ['claw', 'pad', 'taper', 'glow-orb', 'wing'];
    const pIdx = Math.floor(Math.random() * child.limbPairs.length);
    if (child.limbPairs[pIdx]) {
      const newTip = tips[Math.floor(Math.random() * tips.length)];
      child.limbPairs[pIdx].tipType = newTip;
      traits.push(newTip === 'wing' ? 'Glider Wings' : `${newTip.toUpperCase()} Appendage`);
    }
  }

  // 5. Body segment morphology: gradual width & height shifts
  if (Math.random() < 0.65) {
    const segIdx = Math.floor(Math.random() * child.segments.length);
    const seg = child.segments[segIdx];
    if (seg) {
      seg.width = clamp(seg.width * (1 + (Math.random() - 0.5) * deltaMultiplier * 0.75), 16, 60);
      seg.height = clamp(seg.height * (1 + (Math.random() - 0.5) * deltaMultiplier * 0.75), 14, 60);
      traits.push('Segment Morphology');
    }
  }

  // 6. Mutate antennae / feelers
  if (Math.random() < 0.55) {
    child.antennaLength = clamp(child.antennaLength * (1 + (Math.random() - 0.5) * deltaMultiplier * 0.8), 15, 85);
    child.antennaCurve = clamp(child.antennaCurve + (Math.random() - 0.5) * 25 * deltaMultiplier, -55, 55);
    if (Math.random() < 0.10) {
      const tips: ('beaded' | 'bulb' | 'feather')[] = ['beaded', 'bulb', 'feather'];
      child.antennaTip = tips[Math.floor(Math.random() * tips.length)];
      traits.push('Sensory Feeler Tip');
    } else {
      traits.push('Feeler Curvature');
    }
  }

  // 7. Mutate eyes
  if (Math.random() < 0.5) {
    if (Math.random() < 0.10) {
      const eyeOpts = [1, 2, 4, 6];
      child.eyeCount = eyeOpts[Math.floor(Math.random() * eyeOpts.length)];
      traits.push(`${child.eyeCount}-Eye Array`);
    } else {
      child.eyeSize = clamp(child.eyeSize * (1 + (Math.random() - 0.5) * deltaMultiplier * 0.6), 4, 15);
      child.eyeSpacing = clamp(child.eyeSpacing * (1 + (Math.random() - 0.5) * deltaMultiplier * 0.6), 6, 35);
      traits.push('Optical Orbs');
    }
  }

  // 8. Mutate bioluminescent markings
  if (Math.random() < 0.5) {
    if (Math.random() < 0.12) {
      const styles: ('stripes' | 'dots' | 'chevrons')[] = ['stripes', 'dots', 'chevrons'];
      child.markingsStyle = styles[Math.floor(Math.random() * styles.length)];
    }
    child.glowIntensity = clamp(child.glowIntensity + (Math.random() - 0.5) * 0.2 * deltaMultiplier, 0.35, 1.0);
    traits.push('Bioluminescent Markings');
  }

  // 9. Mutate head apparatus (proboscis, mandibles, none)
  if (Math.random() < 0.16) {
    const mouthOpts: ('none' | 'proboscis' | 'mandibles')[] = ['none', 'proboscis', 'mandibles'];
    child.headApparatus = mouthOpts[Math.floor(Math.random() * mouthOpts.length)];
    if (child.headApparatus !== 'none') {
      traits.push(child.headApparatus === 'proboscis' ? 'Feeding Proboscis' : 'Predatory Mandibles');
    }
  }

  if (traits.length === 0) {
    traits.push('Adaptive Drift');
  }

  return { child, mutatedTraits: Array.from(new Set(traits)) };
}

// Objective Ecosystem Fitness Engine
export function calculateFitness(genome: BiomorphGenome, ecosystem: EcosystemConfig): FitnessResult {
  let score = 50;
  const pros: string[] = [];
  const cons: string[] = [];

  const avgThickness = genome.limbPairs.reduce((s, l) => s + l.thickness, 0) / (genome.limbPairs.length || 1);
  const avgSegWidth = genome.segments.reduce((s, seg) => s + seg.width, 0) / (genome.segments.length || 1);
  const avgSegHeight = genome.segments.reduce((s, seg) => s + seg.height, 0) / (genome.segments.length || 1);
  const hasClaws = genome.limbPairs.some((l) => l.tipType === 'claw');
  const hasWings = genome.limbPairs.some((l) => l.tipType === 'wing');
  const hasPads = genome.limbPairs.some((l) => l.tipType === 'pad');
  const hasGlowOrbs = genome.limbPairs.some((l) => l.tipType === 'glow-orb');

  // --- 1. Terrain Evaluation ---
  switch (ecosystem.terrain) {
    case 'swamp':
      if (genome.primaryHue >= 70 && genome.primaryHue <= 165) {
        score += 15;
        pros.push('+Swamp Camouflage');
      } else if (genome.primaryHue >= 25 && genome.primaryHue < 70) {
        score += 8;
        pros.push('+Mud Tone Blending');
      } else {
        score -= 10;
        cons.push('-High Contrast in Mire');
      }

      if (genome.eyeCount <= 2) {
        score += 12;
        pros.push('+Mud-Shielded Optics');
      } else {
        score -= 14;
        cons.push('-Vulnerable Eyes in Turbid Sludge');
      }

      if (genome.limbPairs.length >= 3) {
        score += 12;
        pros.push('+Multi-Legged Mire Traction');
      } else {
        score -= 10;
        cons.push('-Sluggish Mobility in Sludge');
      }

      if (avgSegWidth >= 34) {
        score += 8;
        pros.push('+Sturdy Silt Mass');
      }
      break;

    case 'crags':
      if (genome.primaryHue <= 45 || genome.primaryHue >= 320) {
        score += 16;
        pros.push('+Basalt Blending');
      } else {
        score -= 10;
        cons.push('-Conspicuous Against Obsidian');
      }

      if (avgThickness >= 4.2) {
        score += 14;
        pros.push('+Reinforced Exoskeleton');
      } else {
        score -= 12;
        cons.push('-Brittle Limbs on Jagged Rock');
      }

      if (hasClaws) {
        score += 12;
        pros.push('+Rock-Gripping Claws');
      }
      if (hasWings) {
        score -= 12;
        cons.push('-Wings Torn by Sharp Basalt');
      }
      if (genome.headApparatus === 'mandibles') {
        score += 10;
        pros.push('+Rock-Crushing Mandibles');
      }
      break;

    case 'canopy':
      if (hasWings) {
        score += 18;
        pros.push('+Canopy Glider Wings');
      } else {
        score -= 8;
        cons.push('-Ground-Bound in High Canopy');
      }

      if (genome.primaryHue >= 90 && genome.primaryHue <= 220) {
        score += 14;
        pros.push('+Foliage Camouflage');
      } else {
        score -= 8;
        cons.push('-Visible Against Green Canopy');
      }

      if (hasClaws) {
        score += 10;
        pros.push('+Arboreal Branch Talons');
      }
      if (genome.limbPairs.length <= 2) {
        score -= 10;
        cons.push('-Insecure Tree Hold');
      }
      break;

    case 'desert':
      if (genome.primaryHue >= 30 && genome.primaryHue <= 70) {
        score += 18;
        pros.push('+Solar UV Heat Deflection');
      } else {
        score -= 12;
        cons.push('-Heat-Absorbing Dark Pigment');
      }

      if (genome.antennaLength >= 45) {
        score += 12;
        pros.push('+Thermal Dissipation Feelers');
      }

      if (genome.segments.length <= 2) {
        score += 12;
        pros.push('+Water-Conserving Core Mass');
      } else {
        score -= 12;
        cons.push('-Dehydration via High Surface Area');
      }

      if (avgThickness <= 3.8) {
        score += 10;
        pros.push('+Slender Heat-Radiating Legs');
      }
      break;

    case 'abyss':
      if (genome.glowIntensity >= 0.7) {
        score += 18;
        pros.push('+Bioluminescent Lure');
      } else {
        score -= 16;
        cons.push('-Invisible in Crushing Darkness');
      }

      if (hasGlowOrbs) {
        score += 12;
        pros.push('+Deep-Sea Photophores');
      }

      if (genome.eyeCount >= 4 || genome.eyeSize >= 8) {
        score += 14;
        pros.push('+Expanded Low-Light Optics');
      } else {
        score -= 10;
        cons.push('-Dim Monocular Vision');
      }

      if (genome.primaryHue >= 200 && genome.primaryHue <= 290) {
        score += 10;
        pros.push('+Abyssal Oceanic Hue');
      }
      break;

    case 'cavern':
      if (genome.antennaLength >= 45) {
        score += 14;
        pros.push('+Echolocating Feelers');
      }
      if (hasPads) {
        score += 12;
        pros.push('+Silent Rock Pads');
      }
      if (genome.markingsStyle === 'dots' || genome.markingsStyle === 'chevrons') {
        score += 12;
        pros.push('+Mineral Speckle Camouflage');
      }
      if (genome.glowIntensity >= 0.6) {
        score += 10;
        pros.push('+Grotto Luminescence');
      }
      break;
  }

  // --- 2. Climate Evaluation ---
  switch (ecosystem.climate) {
    case 'acidic':
      if (genome.headApparatus === 'proboscis' || genome.headApparatus === 'mandibles') {
        score += 12;
        pros.push('+Acid-Proof Mouthparts');
      }
      if (genome.markingsCount >= 4) {
        score += 10;
        pros.push('+Chitinous Acid Shielding');
      } else {
        score -= 10;
        cons.push('-Thin Corrosive Skin');
      }
      if (hasWings) {
        score -= 12;
        cons.push('-Corrosive Smog Wing Degradation');
      }
      break;

    case 'geothermal':
      if (genome.glowIntensity >= 0.75) {
        score += 12;
        pros.push('+Thermal Vent Heat Dispersion');
      }
      if (genome.antennaTip === 'bulb') {
        score += 10;
        pros.push('+Heat-Shielded Sensor Bulbs');
      }
      if (avgSegWidth >= 36) {
        score += 10;
        pros.push('+Thermal Shock Buffer');
      }
      break;

    case 'frost':
      if (avgSegWidth >= 34 && avgSegHeight >= 30) {
        score += 14;
        pros.push('+Insulating Core Bulk');
      }
      if (avgThickness >= 4.5) {
        score += 12;
        pros.push('+Frost-Resistant Stout Limbs');
      } else if (avgThickness < 3.2) {
        score -= 12;
        cons.push('-Frostbite-Prone Appendages');
      }
      if (genome.antennaLength >= 50) {
        score -= 8;
        cons.push('-Heat Loss via Spanning Feelers');
      }
      break;

    case 'oxygen':
      if (genome.segments.length >= 3 && genome.limbPairs.length >= 3) {
        score += 16;
        pros.push('+Oxygen Surge Gigantism');
      } else if (genome.segments.length <= 1) {
        score -= 10;
        cons.push('-Underdeveloped Metabolic Mass');
      }
      break;

    case 'darkness':
      if (genome.glowIntensity >= 0.65 || genome.eyeCount >= 4 || genome.antennaLength >= 50) {
        score += 16;
        pros.push('+Nocturnal Sensory Receptors');
      } else {
        score -= 18;
        cons.push('-Sensory Deprivation in Blackness');
      }
      break;
  }

  // --- 3. Threat Evaluation ---
  switch (ecosystem.threat) {
    case 'stalkers':
      if (genome.limbPairs.length >= 3) {
        score += 12;
        pros.push('+Ambush Escape Speed');
      }
      if (hasClaws || genome.headApparatus === 'mandibles') {
        score += 12;
        pros.push('+Defensive Counter-Weapons');
      }
      break;

    case 'airborne':
      if (hasWings) {
        score += 14;
        pros.push('+Aerial Counter-Flight');
      }
      if (avgSegHeight <= 32) {
        score += 10;
        pros.push('+Low Ground Silhouette');
      } else if (avgSegHeight >= 42) {
        score -= 12;
        cons.push('-High Silhouette for Raptors');
      }
      break;

    case 'parasites':
      if (genome.antennaTip === 'bulb' || genome.antennaTip === 'beaded') {
        score += 12;
        pros.push('+Parasite-Resistant Scaled Tips');
      }
      if (avgThickness >= 4.2) {
        score += 10;
        pros.push('+Thick Cuticle Parasite Barrier');
      } else if (avgThickness <= 3.0) {
        score -= 10;
        cons.push('-Vulnerable Appendage Seams');
      }
      break;

    case 'gravity':
      if (avgThickness >= 4.4 && genome.limbPairs.length >= 3) {
        score += 16;
        pros.push('+Squat Multi-Legged High-G Support');
      }
      if (genome.limbPairs.some((l) => l.length1 >= 46 || l.length2 >= 46)) {
        score -= 16;
        cons.push('-Spindly Limbs Collapsing under Gravity');
      }
      break;

    case 'scarcity':
      if (genome.segments.length <= 2 && genome.limbPairs.length <= 3) {
        score += 16;
        pros.push('+Caloric Metabolic Efficiency');
      } else if (genome.segments.length >= 3 && genome.limbPairs.length >= 4) {
        score -= 14;
        cons.push('-High Caloric Starvation Risk');
      }
      break;
  }

  // Clamp final score to 10 - 100
  const finalScore = Math.min(100, Math.max(10, Math.round(score)));

  // Return unique top pros and cons
  return {
    score: finalScore,
    pros: Array.from(new Set(pros)).slice(0, 3),
    cons: Array.from(new Set(cons)).slice(0, 2),
  };
}

export function renderBiomorphBody(
  ctx: CanvasRenderingContext2D,
  genome: BiomorphGenome,
  animTime = 0
) {
  const glowPulse = Math.sin(animTime * 3) * 0.15;
  const primaryFill = `hsl(${genome.primaryHue}, 75%, 26%)`;
  const primaryStroke = `hsl(${genome.primaryHue}, 85%, 65%)`;
  const secondaryStroke = `hsl(${genome.secondaryHue}, 90%, 70%)`;
  const glowColor = `hsl(${genome.glowHue}, 95%, ${60 + glowPulse * 15}%)`;

  // 1. Draw Limbs & Wings (Rendered behind body segments)
  genome.limbPairs.forEach((limb, idx) => {
    const segAnchorY = genome.segments[Math.min(idx, genome.segments.length - 1)]?.yOffset ?? 0;
    const sides = [-1, 1]; // Left (-1), Right (+1)

    sides.forEach((side) => {
      ctx.save();
      const asymOffset = side < 0 ? 0 : genome.asymmetry * 10;
      const angle1Rad = ((limb.angle1 + asymOffset) * Math.PI) / 180;
      const angle2Rad = (limb.angle2 * Math.PI) / 180;
      const limbWave = Math.sin(animTime * 2 + idx * 0.8) * 0.05 * side;

      // Anchor near outer edge of segment
      const x0 = side * 14;
      const y0 = segAnchorY;

      // Joint 1
      const x1 = x0 + Math.cos(angle1Rad + limbWave) * limb.length1 * side;
      const y1 = y0 + Math.sin(angle1Rad + limbWave) * limb.length1;

      // Joint 2 / Tip
      const x2 = x1 + Math.cos(angle1Rad + angle2Rad + limbWave) * limb.length2 * side;
      const y2 = y1 + Math.sin(angle1Rad + angle2Rad + limbWave) * limb.length2;

      // Wing membrane rendering
      if (limb.tipType === 'wing') {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.quadraticCurveTo(x1 + side * 20, y1 - 15, x2, y2);
        ctx.quadraticCurveTo(x1, y1 + 18, x0, y0 + 12);
        ctx.fillStyle = `hsla(${genome.secondaryHue}, 85%, 65%, 0.35)`;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = secondaryStroke;
        ctx.stroke();
        ctx.restore();
      }

      ctx.beginPath();
      ctx.lineWidth = limb.thickness;
      ctx.strokeStyle = primaryStroke;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      // Foot / Tip rendering
      if (limb.tipType === 'claw') {
        ctx.beginPath();
        ctx.arc(x2, y2, limb.thickness * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();
      } else if (limb.tipType === 'glow-orb') {
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(x2, y2, limb.thickness * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.fill();
        ctx.restore();
      } else if (limb.tipType === 'pad') {
        ctx.beginPath();
        ctx.ellipse(x2, y2, limb.thickness * 1.5, limb.thickness * 0.9, 0, 0, Math.PI * 2);
        ctx.fillStyle = secondaryStroke;
        ctx.fill();
      }

      ctx.restore();
    });
  });

  // 2. Draw Antennae / Feelers (From top segment / head)
  const headSeg = genome.segments[0];
  const headY = headSeg ? headSeg.yOffset : -38;
  const antennaBaseY = headSeg ? headSeg.yOffset - headSeg.height * 0.7 : -40;

  if (genome.antennaCount > 0) {
    const antennaSides = genome.antennaCount === 1 ? [0] : [-1, 1];
    antennaSides.forEach((side) => {
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = secondaryStroke;
      ctx.lineCap = 'round';

      const startX = side * (genome.eyeSpacing * 0.6);
      ctx.moveTo(startX, antennaBaseY);

      const curveX = startX + (side === 0 ? 0 : side * genome.antennaCurve);
      const tipX = startX + (side === 0 ? 0 : side * (genome.antennaCurve * 1.3));
      const tipY = antennaBaseY - genome.antennaLength;

      ctx.quadraticCurveTo(curveX, antennaBaseY - genome.antennaLength * 0.5, tipX, tipY);
      ctx.stroke();

      // Antenna tip style
      if (genome.antennaTip === 'bulb') {
        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;
        ctx.fillStyle = glowColor;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (genome.antennaTip === 'beaded') {
        for (let b = 1; b <= 3; b++) {
          const by = antennaBaseY - (genome.antennaLength * b) / 3;
          ctx.beginPath();
          ctx.arc(tipX * (b / 3), by, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = secondaryStroke;
          ctx.fill();
        }
      }
      ctx.restore();
    });
  }

  // 3. Draw Cranial Mouthparts (Proboscis / Mandibles)
  if (genome.headApparatus === 'proboscis') {
    ctx.save();
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = secondaryStroke;
    ctx.lineCap = 'round';
    ctx.moveTo(0, headY + 12);
    const siphWave = Math.sin(animTime * 3) * 3;
    ctx.quadraticCurveTo(siphWave, headY + 28, siphWave * 1.5, headY + 44);
    ctx.stroke();
    // Tip bulb
    ctx.beginPath();
    ctx.arc(siphWave * 1.5, headY + 44, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.fill();
    ctx.restore();
  } else if (genome.headApparatus === 'mandibles') {
    [-1, 1].forEach((mside) => {
      ctx.save();
      ctx.beginPath();
      ctx.lineWidth = 3;
      ctx.strokeStyle = primaryStroke;
      ctx.lineCap = 'round';
      ctx.moveTo(mside * 8, headY + 12);
      ctx.quadraticCurveTo(mside * 22, headY + 24, mside * 6, headY + 36);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(mside * 6, headY + 36, 2, 0, Math.PI * 2);
      ctx.fillStyle = glowColor;
      ctx.fill();
      ctx.restore();
    });
  }

  // 4. Draw Body Segments (Head, Thorax, Abdomen)
  genome.segments.forEach((seg, i) => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(0, seg.yOffset, seg.width, seg.height, 0, 0, Math.PI * 2);

    // Segment Gradient
    const segGrad = ctx.createRadialGradient(0, seg.yOffset - 5, 4, 0, seg.yOffset, Math.max(seg.width, seg.height));
    segGrad.addColorStop(0, `hsl(${genome.primaryHue}, 80%, 36%)`);
    segGrad.addColorStop(0.7, primaryFill);
    segGrad.addColorStop(1, `hsl(${genome.primaryHue}, 85%, 12%)`);

    ctx.fillStyle = segGrad;
    ctx.fill();

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = primaryStroke;
    ctx.stroke();

    // Dorsal bioluminescent markings
    if (genome.markingsCount > 0 && i > 0) {
      ctx.save();
      ctx.shadowColor = glowColor;
      ctx.shadowBlur = 8;
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;

      for (let m = 0; m < genome.markingsCount; m++) {
        const markY = seg.yOffset - seg.height * 0.5 + ((m + 1) * seg.height) / (genome.markingsCount + 1);
        const markWidth = seg.width * (1 - Math.abs(markY - seg.yOffset) / seg.height) * 0.7;

        ctx.beginPath();
        if (genome.markingsStyle === 'stripes') {
          ctx.moveTo(-markWidth, markY);
          ctx.lineTo(markWidth, markY);
        } else if (genome.markingsStyle === 'chevrons') {
          ctx.moveTo(-markWidth, markY - 3);
          ctx.lineTo(0, markY + 3);
          ctx.lineTo(markWidth, markY - 3);
        } else {
          // Dots
          ctx.arc(-markWidth * 0.6, markY, 2, 0, Math.PI * 2);
          ctx.arc(markWidth * 0.6, markY, 2, 0, Math.PI * 2);
        }
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();
  });

  // 5. Draw Optical Sensory Orbs / Eyes
  const eyeRadius = genome.eyeSize;

  const renderEye = (ex: number, ey: number) => {
    ctx.save();
    // Eye Socket
    ctx.beginPath();
    ctx.arc(ex, ey, eyeRadius + 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#050811';
    ctx.fill();

    // Eye Core Glow
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(ex, ey, eyeRadius, 0, Math.PI * 2);
    ctx.fillStyle = glowColor;
    ctx.fill();

    // Dark Pupil
    ctx.beginPath();
    ctx.arc(ex, ey, eyeRadius * 0.45, 0, Math.PI * 2);
    ctx.fillStyle = '#020617';
    ctx.fill();

    // White Glint
    ctx.beginPath();
    ctx.arc(ex - eyeRadius * 0.3, ey - eyeRadius * 0.3, eyeRadius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();
  };

  if (genome.eyeCount === 1) {
    renderEye(0, headY - 4);
  } else if (genome.eyeCount === 2) {
    renderEye(-genome.eyeSpacing, headY - 4);
    renderEye(genome.eyeSpacing, headY - 4);
  } else if (genome.eyeCount === 4) {
    renderEye(-genome.eyeSpacing, headY - 8);
    renderEye(genome.eyeSpacing, headY - 8);
    renderEye(-genome.eyeSpacing * 0.55, headY + 3);
    renderEye(genome.eyeSpacing * 0.55, headY + 3);
  } else {
    // 6 Eyes Cluster
    renderEye(-genome.eyeSpacing, headY - 10);
    renderEye(genome.eyeSpacing, headY - 10);
    renderEye(-genome.eyeSpacing * 0.6, headY - 2);
    renderEye(genome.eyeSpacing * 0.6, headY - 2);
    renderEye(-genome.eyeSpacing * 1.2, headY + 4);
    renderEye(genome.eyeSpacing * 1.2, headY + 4);
  }
}

export function drawBiomorph(
  ctx: CanvasRenderingContext2D,
  genome: BiomorphGenome,
  width: number,
  height: number,
  animTime = 0
) {
  ctx.save();
  ctx.clearRect(0, 0, width, height);

  const cx = width / 2;
  const cy = height / 2 + 5;

  // Ambient breathing pulse
  const breath = Math.sin(animTime * 2.5) * 0.03;
  ctx.translate(cx, cy);
  ctx.scale(1 + breath, 1 + breath);

  // Background subtle glow under creature
  const bgGlow = ctx.createRadialGradient(0, 0, 10, 0, 0, 120);
  bgGlow.addColorStop(0, `hsla(${genome.glowHue}, 90%, 50%, ${0.14 * genome.glowIntensity})`);
  bgGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = bgGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.fill();

  renderBiomorphBody(ctx, genome, animTime);

  ctx.restore();
}
