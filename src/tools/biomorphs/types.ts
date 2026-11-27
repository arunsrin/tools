import type { RefObject } from 'react';
import type { BiomorphGenome, EcosystemConfig, FitnessResult } from './biomorphEngine';

export interface BiomorphsProps {
  onBack: () => void;
}

export interface CandidateSpecimen {
  genome: BiomorphGenome;
  traits: string[];
}

export interface BiomorphPersistedState {
  parentGenome: BiomorphGenome;
  lineage: BiomorphGenome[];
  ecosystem: EcosystemConfig;
}

export interface SpecimenCardProps {
  offspringLabel: string;
  specimen: BiomorphGenome;
  traits: string[];
  fitness: FitnessResult;
  delta: number;
  canvasRef: RefObject<HTMLCanvasElement | null>;
  cardTestId: string;
  fitnessTestId: string;
  onSelect: (specimen: BiomorphGenome) => void;
  onLaunch: (specimen: BiomorphGenome) => void;
}

export interface LineageThumbnailProps {
  ancestor: BiomorphGenome;
  isActive: boolean;
  onClick: () => void;
}
