import {
  CLIMATES,
  createPrimordialGenome,
  createRandomEcosystem,
  TERRAINS,
  THREATS,
  type BiomorphGenome,
  type EcosystemConfig,
} from './biomorphEngine';
import type { BiomorphPersistedState } from './types';

export const BIOMORPHS_STORAGE_KEY = 'tools_hub_biomorphs';
export const MAX_LINEAGE_GENERATIONS = 25;

const VALID_TERRAINS = new Set<string>(TERRAINS.map((t) => t.id));
const VALID_CLIMATES = new Set<string>(CLIMATES.map((c) => c.id));
const VALID_THREATS = new Set<string>(THREATS.map((th) => th.id));
const VALID_TIP_TYPES = new Set<string>(['claw', 'pad', 'taper', 'glow-orb', 'wing']);
const VALID_ANTENNA_TIPS = new Set<string>(['beaded', 'bulb', 'feather']);
const VALID_MARKINGS = new Set<string>(['stripes', 'dots', 'chevrons']);

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isValidBiomorphGenome(raw: unknown): raw is BiomorphGenome {
  if (!raw || typeof raw !== 'object') {
    return false;
  }
  const g = raw as Record<string, unknown>;
  if (
    typeof g.id !== 'string' ||
    g.id.trim().length === 0 ||
    typeof g.name !== 'string' ||
    g.name.trim().length === 0 ||
    !isFiniteNumber(g.generation) ||
    g.generation < 0
  ) {
    return false;
  }

  if (!Array.isArray(g.segments) || g.segments.length === 0) {
    return false;
  }
  for (const seg of g.segments) {
    if (!seg || typeof seg !== 'object') return false;
    const s = seg as Record<string, unknown>;
    if (!isFiniteNumber(s.width) || !isFiniteNumber(s.height) || !isFiniteNumber(s.yOffset)) {
      return false;
    }
  }

  if (!Array.isArray(g.limbPairs)) {
    return false;
  }
  for (const limb of g.limbPairs) {
    if (!limb || typeof limb !== 'object') return false;
    const l = limb as Record<string, unknown>;
    if (
      !isFiniteNumber(l.length1) ||
      !isFiniteNumber(l.length2) ||
      !isFiniteNumber(l.angle1) ||
      !isFiniteNumber(l.angle2) ||
      !isFiniteNumber(l.thickness) ||
      typeof l.tipType !== 'string' ||
      !VALID_TIP_TYPES.has(l.tipType)
    ) {
      return false;
    }
  }

  if (
    !isFiniteNumber(g.antennaCount) ||
    !isFiniteNumber(g.antennaLength) ||
    !isFiniteNumber(g.antennaCurve) ||
    typeof g.antennaTip !== 'string' ||
    !VALID_ANTENNA_TIPS.has(g.antennaTip) ||
    !isFiniteNumber(g.eyeCount) ||
    !isFiniteNumber(g.eyeSize) ||
    !isFiniteNumber(g.eyeSpacing) ||
    !isFiniteNumber(g.primaryHue) ||
    !isFiniteNumber(g.secondaryHue) ||
    !isFiniteNumber(g.glowHue) ||
    !isFiniteNumber(g.markingsCount) ||
    typeof g.markingsStyle !== 'string' ||
    !VALID_MARKINGS.has(g.markingsStyle) ||
    !isFiniteNumber(g.glowIntensity) ||
    !isFiniteNumber(g.asymmetry)
  ) {
    return false;
  }

  return true;
}

export function validateEcosystemConfig(raw: unknown): EcosystemConfig {
  if (!raw || typeof raw !== 'object') {
    return createRandomEcosystem();
  }
  const eco = raw as Record<string, unknown>;
  if (
    typeof eco.terrain === 'string' &&
    VALID_TERRAINS.has(eco.terrain) &&
    typeof eco.climate === 'string' &&
    VALID_CLIMATES.has(eco.climate) &&
    typeof eco.threat === 'string' &&
    VALID_THREATS.has(eco.threat)
  ) {
    return {
      terrain: eco.terrain as EcosystemConfig['terrain'],
      climate: eco.climate as EcosystemConfig['climate'],
      threat: eco.threat as EcosystemConfig['threat'],
    };
  }
  return createRandomEcosystem();
}

export function createInitialPersistedState(): BiomorphPersistedState {
  const parentGenome = createPrimordialGenome();
  return {
    parentGenome,
    lineage: [parentGenome],
    ecosystem: createRandomEcosystem(),
  };
}

export function validateBiomorphPersistedState(raw: unknown): BiomorphPersistedState {
  if (!raw || typeof raw !== 'object') {
    return createInitialPersistedState();
  }
  const obj = raw as Record<string, unknown>;
  const parentGenome = isValidBiomorphGenome(obj.parentGenome)
    ? obj.parentGenome
    : createPrimordialGenome();

  const rawLineage = Array.isArray(obj.lineage)
    ? obj.lineage.filter((item): item is BiomorphGenome => isValidBiomorphGenome(item))
    : [];
  const lineage =
    rawLineage.length > 0 ? rawLineage.slice(-MAX_LINEAGE_GENERATIONS) : [parentGenome];

  const ecosystem = validateEcosystemConfig(obj.ecosystem);

  return { parentGenome, lineage, ecosystem };
}

export function serializeBiomorphPersistedState(state: BiomorphPersistedState): string {
  return JSON.stringify({
    parentGenome: state.parentGenome,
    lineage: state.lineage.slice(-MAX_LINEAGE_GENERATIONS),
    ecosystem: state.ecosystem,
  });
}

/**
 * Encodes a genome JSON payload into UTF-8-safe Base64.
 */
export function encodeDnaPayload(genome: BiomorphGenome): string {
  const json = JSON.stringify(genome);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Decodes a UTF-8-safe Base64 DNA payload and validates the genome schema.
 * Throws if the Base64, UTF-8, or JSON parsing fails, and returns `null` if
 * the decoded object does not satisfy the BiomorphGenome schema.
 */
export function decodeDnaPayload(encoded: string): BiomorphGenome | null {
  const binary = atob(encoded.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  let json: string;
  try {
    json = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    // Support legacy Latin-1 btoa payloads (e.g. middle dot '·')
    json = binary;
  }
  const parsed: unknown = JSON.parse(json);
  return isValidBiomorphGenome(parsed) ? parsed : null;
}
