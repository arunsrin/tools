import { useCallback, useEffect, useRef, useState } from 'react';
import type { AlertVariant } from '../../shared/components/types';
import InlineAlert from '../../shared/components/InlineAlert';
import Modal from '../../shared/components/Modal';
import SegmentedControl from '../../shared/components/SegmentedControl';
import Toast from '../../shared/components/Toast';
import ToolHeader from '../../shared/components/ToolHeader';
import { useCopyFeedback } from '../../shared/hooks/useCopyFeedback';
import { usePersistedState } from '../../shared/hooks/usePersistedState';
import { useTimeoutRegistry, type TimeoutId } from '../../shared/hooks/useTimeoutRegistry';
import { downloadCanvasPng, getCanvasPointerPos } from '../../shared/utils/canvas';
import {
  calculateFitness,
  CLIMATES,
  createPrimordialGenome,
  createRandomEcosystem,
  drawBiomorph,
  mutateGenome,
  TERRAINS,
  THREATS,
  type BiomorphGenome,
  type ClimateType,
  type EcosystemConfig,
  type TerrainType,
  type ThreatType,
} from './biomorphEngine';
import {
  BIOMORPHS_STORAGE_KEY,
  createInitialPersistedState,
  decodeDnaPayload,
  encodeDnaPayload,
  MAX_LINEAGE_GENERATIONS,
  serializeBiomorphPersistedState,
  validateBiomorphPersistedState,
} from './biomorphPersistence';
import {
  addPredatorAgent,
  addPreyAgent,
  drawBiosphere,
  generateExtinctionAdvice,
  respawnPlayer,
  stepBiosphere,
  type BiosphereState,
  createInitialBiosphere,
} from './ecosystemEngine';
import LineageThumbnail from './LineageThumbnail';
import SpecimenCard from './SpecimenCard';
import type { BiomorphPersistedState, BiomorphsProps, CandidateSpecimen } from './types';
import './Biomorphs.css';

const MODE_OPTIONS: readonly { value: 'lab' | 'biosphere'; label: string }[] = [
  { value: 'lab', label: '🧬 Breeding Lab' },
  { value: 'biosphere', label: '🌍 Living Biosphere' },
];

const SPEED_OPTIONS: readonly { value: '1' | '2' | '3'; label: string }[] = [
  { value: '1', label: '1x' },
  { value: '2', label: '2x' },
  { value: '3', label: '3x' },
];

export default function Biomorphs({ onBack }: BiomorphsProps) {
  const [viewMode, setViewMode] = useState<'lab' | 'biosphere'>('lab');

  const [persisted, setPersisted] = usePersistedState<BiomorphPersistedState>(
    BIOMORPHS_STORAGE_KEY,
    createInitialPersistedState,
    {
      validate: validateBiomorphPersistedState,
      serialize: serializeBiomorphPersistedState,
    }
  );

  const parentGenome = persisted.parentGenome;
  const lineage = persisted.lineage;
  const ecosystem = persisted.ecosystem;

  const [candidateAlpha, setCandidateAlpha] = useState<CandidateSpecimen>(() => {
    const res = mutateGenome(parentGenome);
    return { genome: res.child, traits: res.mutatedTraits };
  });

  const [candidateBeta, setCandidateBeta] = useState<CandidateSpecimen>(() => {
    const res = mutateGenome(parentGenome);
    return { genome: res.child, traits: res.mutatedTraits };
  });

  const specimenAlpha = candidateAlpha.genome;
  const alphaTraits = candidateAlpha.traits;
  const specimenBeta = candidateBeta.genome;
  const betaTraits = candidateBeta.traits;

  const [biosphere, setBiosphere] = useState<BiosphereState | null>(null);
  const biosphereRef = useRef<BiosphereState | null>(null);

  const [showDnaModal, setShowDnaModal] = useState(false);
  const [dnaInput, setDnaInput] = useState('');
  const [dnaError, setDnaError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: AlertVariant } | null>(null);

  const canvasRefAlpha = useRef<HTMLCanvasElement | null>(null);
  const canvasRefBeta = useRef<HTMLCanvasElement | null>(null);
  const canvasRefBiosphere = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<TimeoutId | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastUiSyncRef = useRef<number>(0);
  const lastUiFlagsRef = useRef<{ isExtinct: boolean; apexDominanceAchieved: boolean }>({
    isExtinct: false,
    apexDominanceAchieved: false,
  });

  const { schedule: scheduleTimeout, clear: clearTimeoutId } = useTimeoutRegistry();
  const { copy: copyDnaToClipboard } = useCopyFeedback(2000);

  const dismissToast = useCallback(() => {
    clearTimeoutId(toastTimeoutRef.current);
    toastTimeoutRef.current = null;
    setToast(null);
  }, [clearTimeoutId]);

  const showToast = useCallback(
    (message: string, variant: AlertVariant = 'info') => {
      clearTimeoutId(toastTimeoutRef.current);
      setToast({ message, variant });
      toastTimeoutRef.current = scheduleTimeout(() => {
        toastTimeoutRef.current = null;
        setToast(null);
      }, 2800);
    },
    [clearTimeoutId, scheduleTimeout]
  );

  const handleLaunchBiosphere = useCallback(
    (organism: BiomorphGenome) => {
      setPersisted((prev) => ({ ...prev, parentGenome: organism }));
      const initial = createInitialBiosphere(organism, ecosystem, 800, 500);
      biosphereRef.current = initial;
      lastUiFlagsRef.current = {
        isExtinct: initial.isExtinct,
        apexDominanceAchieved: initial.apexDominanceAchieved,
      };
      setBiosphere(initial);
      setViewMode('biosphere');
      showToast(`🚀 Launched ${organism.name} into ${ecosystem.terrain} biosphere!`);
    },
    [ecosystem, setPersisted, showToast]
  );

  const handleReturnToLab = useCallback(() => {
    setViewMode('lab');
  }, []);

  const handleTogglePause = useCallback(() => {
    if (!biosphereRef.current) return;
    const nextPaused = !biosphereRef.current.isPaused;
    biosphereRef.current = { ...biosphereRef.current, isPaused: nextPaused };
    setBiosphere(biosphereRef.current);
    showToast(nextPaused ? '⏸️ Simulation Paused' : '▶️ Simulation Resumed');
  }, [showToast]);

  const handleChangeSimSpeed = useCallback((speed: number) => {
    if (!biosphereRef.current) return;
    biosphereRef.current = { ...biosphereRef.current, simSpeed: speed };
    setBiosphere(biosphereRef.current);
  }, []);

  const handleAddPrey = useCallback(() => {
    if (!biosphereRef.current) return;
    const next = addPreyAgent(biosphereRef.current, 800, 500);
    biosphereRef.current = next;
    setBiosphere(next);
  }, []);

  const handleAddPredator = useCallback(() => {
    if (!biosphereRef.current) return;
    const next = addPredatorAgent(biosphereRef.current, 800, 500);
    biosphereRef.current = next;
    setBiosphere(next);
  }, []);

  const handleRespawn = useCallback(() => {
    if (!biosphereRef.current) return;
    const next = respawnPlayer(biosphereRef.current, 800, 500);
    biosphereRef.current = next;
    lastUiFlagsRef.current = {
      isExtinct: next.isExtinct,
      apexDominanceAchieved: next.apexDominanceAchieved,
    };
    setBiosphere(next);
    showToast('✨ Organism revived!');
  }, [showToast]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRefBiosphere.current;
    if (!canvas || !biosphereRef.current?.playerAgent) return;
    const pos = getCanvasPointerPos(e, canvas);
    biosphereRef.current.playerAgent.targetX = pos.x;
    biosphereRef.current.playerAgent.targetY = pos.y;
    biosphereRef.current.playerAgent.retargetTimer = 3.5;
  }, []);

  // Static specimen rendering in Lab mode (zero 60fps RAF overhead)
  useEffect(() => {
    if (viewMode !== 'lab') return;

    if (canvasRefAlpha.current) {
      const ctxA = canvasRefAlpha.current.getContext('2d');
      if (ctxA) {
        drawBiomorph(
          ctxA,
          specimenAlpha,
          canvasRefAlpha.current.width,
          canvasRefAlpha.current.height,
          0
        );
      }
    }

    if (canvasRefBeta.current) {
      const ctxB = canvasRefBeta.current.getContext('2d');
      if (ctxB) {
        drawBiomorph(
          ctxB,
          specimenBeta,
          canvasRefBeta.current.width,
          canvasRefBeta.current.height,
          0
        );
      }
    }
  }, [viewMode, specimenAlpha, specimenBeta]);

  // Living Biosphere RAF loop (gated strictly on biosphere mode; dynamic state read via refs)
  useEffect(() => {
    if (viewMode !== 'biosphere') {
      return;
    }

    const startTime = performance.now();
    lastTimeRef.current = startTime;
    lastUiSyncRef.current = startTime;

    const loop = (now: number) => {
      const dt = lastTimeRef.current
        ? Math.min(0.06, Math.max(0, (now - lastTimeRef.current) / 1000))
        : 0.016;
      lastTimeRef.current = now;
      const animElapsed = (now - startTime) / 1000;

      if (canvasRefBiosphere.current && biosphereRef.current) {
        const canvas = canvasRefBiosphere.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const nextState = stepBiosphere(biosphereRef.current, dt, canvas.width, canvas.height);
          biosphereRef.current = nextState;
          drawBiosphere(ctx, nextState, canvas.width, canvas.height, animElapsed);

          const flagsChanged =
            nextState.isExtinct !== lastUiFlagsRef.current.isExtinct ||
            nextState.apexDominanceAchieved !== lastUiFlagsRef.current.apexDominanceAchieved;

          if (now - lastUiSyncRef.current > 100 || flagsChanged) {
            lastUiSyncRef.current = now;
            lastUiFlagsRef.current = {
              isExtinct: nextState.isExtinct,
              apexDominanceAchieved: nextState.apexDominanceAchieved,
            };
            setBiosphere({ ...nextState });
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [viewMode]);

  const parentFitness = calculateFitness(parentGenome, ecosystem);
  const alphaFitness = calculateFitness(specimenAlpha, ecosystem);
  const betaFitness = calculateFitness(specimenBeta, ecosystem);

  const alphaDelta = alphaFitness.score - parentFitness.score;
  const betaDelta = betaFitness.score - parentFitness.score;

  const handleEcosystemChange = useCallback(
    <K extends keyof EcosystemConfig>(dimension: K, value: EcosystemConfig[K]) => {
      setPersisted((prev) => ({
        ...prev,
        ecosystem: {
          ...prev.ecosystem,
          [dimension]: value,
        },
      }));
    },
    [setPersisted]
  );

  const handleRandomizeEcosystem = useCallback(() => {
    const newEco = createRandomEcosystem();
    setPersisted((prev) => ({ ...prev, ecosystem: newEco }));
    const tObj = TERRAINS.find((t) => t.id === newEco.terrain);
    const cObj = CLIMATES.find((c) => c.id === newEco.climate);
    const thObj = THREATS.find((th) => th.id === newEco.threat);
    showToast(`New Biosphere: ${tObj?.name} + ${cObj?.name} + ${thObj?.name}`);

    if (viewMode === 'biosphere') {
      const resetBio = createInitialBiosphere(parentGenome, newEco, 800, 500);
      biosphereRef.current = resetBio;
      lastUiFlagsRef.current = {
        isExtinct: resetBio.isExtinct,
        apexDominanceAchieved: resetBio.apexDominanceAchieved,
      };
      setBiosphere(resetBio);
    }
  }, [parentGenome, setPersisted, showToast, viewMode]);

  const selectSpecimen = useCallback(
    (chosen: BiomorphGenome) => {
      setPersisted((prev) => ({
        ...prev,
        parentGenome: chosen,
        lineage: [...prev.lineage, chosen].slice(-MAX_LINEAGE_GENERATIONS),
      }));

      const resA = mutateGenome(chosen);
      const resB = mutateGenome(chosen);

      setCandidateAlpha({ genome: resA.child, traits: resA.mutatedTraits });
      setCandidateBeta({ genome: resB.child, traits: resB.mutatedTraits });

      const chosenFit = calculateFitness(chosen, ecosystem);
      if (chosenFit.score >= 90) {
        showToast(
          `🏆 Apex Organism Evolved! Selected ${chosen.name} (${chosenFit.score}% fitness)`
        );
      } else {
        showToast(`Selected ${chosen.name} (${chosenFit.score}% Adapted)`);
      }
    },
    [ecosystem, setPersisted, showToast]
  );

  const handleNewGenesis = useCallback(() => {
    const fresh = createPrimordialGenome();
    setPersisted((prev) => ({
      ...prev,
      parentGenome: fresh,
      lineage: [fresh],
    }));

    const resA = mutateGenome(fresh);
    const resB = mutateGenome(fresh);

    setCandidateAlpha({ genome: resA.child, traits: resA.mutatedTraits });
    setCandidateBeta({ genome: resB.child, traits: resB.mutatedTraits });

    showToast('New Genesis initiated: Generation 0 primed.');
  }, [setPersisted, showToast]);

  const handleTimeTravel = useCallback(
    (ancestor: BiomorphGenome) => {
      setPersisted((prev) => ({ ...prev, parentGenome: ancestor }));

      const resA = mutateGenome(ancestor);
      const resB = mutateGenome(ancestor);

      setCandidateAlpha({ genome: resA.child, traits: resA.mutatedTraits });
      setCandidateBeta({ genome: resB.child, traits: resB.mutatedTraits });

      showToast(`Rewound to Gen ${ancestor.generation} (${ancestor.name})`);
    },
    [setPersisted, showToast]
  );

  // Global keyboard shortcuts (disabled while DNA modal is open or focus is in inputs)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showDnaModal) {
        return;
      }

      const tagName = (e.target as HTMLElement | null)?.tagName;
      if (tagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName)) {
        return;
      }

      if (viewMode === 'lab') {
        if (e.key === 'ArrowLeft' || e.key === '1') {
          e.preventDefault();
          selectSpecimen(specimenAlpha);
        } else if (e.key === 'ArrowRight' || e.key === '2') {
          e.preventDefault();
          selectSpecimen(specimenBeta);
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          handleNewGenesis();
        } else if (e.key.toLowerCase() === 'l') {
          e.preventDefault();
          handleLaunchBiosphere(parentGenome);
        }
      } else if (viewMode === 'biosphere') {
        if (e.key === ' ') {
          e.preventDefault();
          handleTogglePause();
        } else if (e.key.toLowerCase() === 'r') {
          e.preventDefault();
          handleRespawn();
        } else if (e.key.toLowerCase() === 'l' || e.key === 'Escape') {
          e.preventDefault();
          handleReturnToLab();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    showDnaModal,
    viewMode,
    selectSpecimen,
    handleNewGenesis,
    handleLaunchBiosphere,
    handleTogglePause,
    handleRespawn,
    handleReturnToLab,
    specimenAlpha,
    specimenBeta,
    parentGenome,
  ]);

  const handleCopyDNA = useCallback(async () => {
    try {
      const payload = encodeDnaPayload(parentGenome);
      const ok = await copyDnaToClipboard(payload);
      showToast(
        ok ? 'DNA sequence copied to clipboard!' : 'Could not copy DNA payload.',
        ok ? 'info' : 'error'
      );
    } catch {
      showToast('Could not copy DNA payload.', 'error');
    }
  }, [copyDnaToClipboard, parentGenome, showToast]);

  const handleOpenDnaModal = useCallback(() => {
    setDnaError(null);
    setShowDnaModal(true);
  }, []);

  const handleCloseDnaModal = useCallback(() => {
    setDnaError(null);
    setShowDnaModal(false);
  }, []);

  const handleLoadDNA = useCallback(() => {
    try {
      const loaded = decodeDnaPayload(dnaInput);
      if (!loaded) {
        setDnaError('Invalid genome DNA format. Ensure id, segments, and limbPairs are present.');
        return;
      }

      setPersisted((prev) => ({
        ...prev,
        parentGenome: loaded,
        lineage: [...prev.lineage, loaded].slice(-MAX_LINEAGE_GENERATIONS),
      }));

      const resA = mutateGenome(loaded);
      const resB = mutateGenome(loaded);

      setCandidateAlpha({ genome: resA.child, traits: resA.mutatedTraits });
      setCandidateBeta({ genome: resB.child, traits: resB.mutatedTraits });

      setDnaError(null);
      setShowDnaModal(false);
      setDnaInput('');
      showToast(`Loaded creature: ${loaded.name}`);
    } catch {
      setDnaError('Failed to parse DNA string. Please ensure it is a valid base64 payload.');
    }
  }, [dnaInput, setPersisted, showToast]);

  const handleExportPNG = useCallback(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 1024;
    offscreen.height = 1024;
    const ctx = offscreen.getContext('2d');
    if (!ctx) {
      showToast('Unable to export PNG: 2D canvas unavailable.', 'error');
      return;
    }

    const bg = ctx.createRadialGradient(512, 512, 50, 512, 512, 700);
    bg.addColorStop(0, '#111827');
    bg.addColorStop(0.6, '#080d1a');
    bg.addColorStop(1, '#02040a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.save();
    ctx.translate(512 - 200, 512 - 150);
    ctx.scale(2.4, 2.4);
    drawBiomorph(ctx, parentGenome, 1024 / 2.4, 1024 / 2.4, 0);
    ctx.restore();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${parentGenome.name} · Generation ${parentGenome.generation}`, 512, 970);

    const exported = downloadCanvasPng(offscreen, `biomorph-gen${parentGenome.generation}.png`);
    showToast(
      exported ? 'Exported HD specimen snapshot!' : 'Failed to export HD specimen snapshot.',
      exported ? 'success' : 'error'
    );
  }, [parentGenome, showToast]);

  const activeTerrain = TERRAINS.find((t) => t.id === ecosystem.terrain) || TERRAINS[0];
  const activeClimate = CLIMATES.find((c) => c.id === ecosystem.climate) || CLIMATES[0];
  const activeThreat = THREATS.find((th) => th.id === ecosystem.threat) || THREATS[0];

  const extinctionData =
    biosphere?.isExtinct && biosphere.extinctionReason
      ? generateExtinctionAdvice(
          biosphere.playerAgent?.genome || parentGenome,
          ecosystem,
          biosphere.extinctionReason
        )
      : null;

  const playerEnergy = biosphere?.playerAgent?.energy ?? 100;
  const energyClass = playerEnergy > 50 ? 'high' : playerEnergy > 20 ? 'med' : 'low';
  const elapsedMinutes = Math.floor((biosphere?.elapsedSeconds ?? 0) / 60);
  const elapsedSeconds = Math.floor((biosphere?.elapsedSeconds ?? 0) % 60);
  const formattedTime = `${elapsedMinutes}:${elapsedSeconds.toString().padStart(2, '0')}`;

  return (
    <div className="biomorphs-container">
      <div className="biomorphs-header-wrap">
        <ToolHeader
          onBack={onBack}
          title="Biomorphs: The Evolutionary Watchmaker"
          badge="🧬 Ecosystem Adaptation"
          subtitle="Guide the morphology of generative organisms and test their survival in living autonomous biospheres."
          className="biomorphs-header"
          actions={
            <SegmentedControl<'lab' | 'biosphere'>
              mode="tablist"
              ariaLabel="Simulation Mode"
              value={viewMode}
              onChange={(mode) => {
                if (mode === 'lab') {
                  handleReturnToLab();
                } else {
                  handleLaunchBiosphere(parentGenome);
                }
              }}
              options={MODE_OPTIONS}
              className="biomorph-mode-switcher"
            />
          }
        />

        <div className="how-to-play-guide" data-testid="how-to-play-guide">
          <span className="guide-title">💡 How to Play:</span>
          <div className="guide-steps">
            <span>
              1. Study the <strong>Active Biosphere</strong> pressures (Terrain, Climate, Threat).
            </span>
            <span>
              2. Compare candidate offspring and select the one with adaptive strengths (
              <code>+pros</code>) that counter these hazards.
            </span>
            <span>
              3. Breed through generations to maximize fitness, then click <strong>🚀 Launch</strong>{' '}
              (or press <strong>L</strong>) to watch it hunt and survive!
            </span>
          </div>
        </div>
      </div>

      {/* VIEW MODE 1: BREEDING LAB */}
      {viewMode === 'lab' && (
        <>
          <section
            className="ecosystem-bar"
            aria-label="Ecosystem & Environmental Pressures"
            data-testid="ecosystem-bar"
          >
            <div className="ecosystem-controls-row">
              <div className="ecosystem-select-group">
                <label htmlFor="terrain-select" className="ecosystem-label">
                  Terrain:
                </label>
                <select
                  id="terrain-select"
                  aria-label="Terrain"
                  value={ecosystem.terrain}
                  onChange={(e) => handleEcosystemChange('terrain', e.target.value as TerrainType)}
                  className="ecosystem-dropdown"
                >
                  {TERRAINS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ecosystem-select-group">
                <label htmlFor="climate-select" className="ecosystem-label">
                  Climate:
                </label>
                <select
                  id="climate-select"
                  aria-label="Climate"
                  value={ecosystem.climate}
                  onChange={(e) => handleEcosystemChange('climate', e.target.value as ClimateType)}
                  className="ecosystem-dropdown"
                >
                  {CLIMATES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ecosystem-select-group">
                <label htmlFor="threat-select" className="ecosystem-label">
                  Threat:
                </label>
                <select
                  id="threat-select"
                  aria-label="Threat"
                  value={ecosystem.threat}
                  onChange={(e) => handleEcosystemChange('threat', e.target.value as ThreatType)}
                  className="ecosystem-dropdown"
                >
                  {THREATS.map((th) => (
                    <option key={th.id} value={th.id}>
                      {th.icon} {th.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                className="bio-btn btn-random-ecosystem"
                onClick={handleRandomizeEcosystem}
                title="Roll random new biosphere"
                aria-label="Roll random ecosystem"
              >
                🎲 Random Biosphere
              </button>
            </div>

            <div className="ecosystem-narrative-bar">
              <div className="narrative-headline">
                <span className="narrative-tag">Active Biosphere:</span>
                <span className="narrative-title">
                  {activeTerrain.icon} {activeTerrain.name} · {activeClimate.icon}{' '}
                  {activeClimate.name} · {activeThreat.icon} {activeThreat.name}
                </span>
              </div>
              <p className="narrative-desc">
                {activeTerrain.desc} {activeClimate.desc} {activeThreat.desc}
              </p>
            </div>
          </section>

          {/* 2-Way Comparative Duel Arena */}
          <main className="duel-arena">
            <SpecimenCard
              offspringLabel="OFFSPRING 1"
              specimen={specimenAlpha}
              traits={alphaTraits}
              fitness={alphaFitness}
              delta={alphaDelta}
              canvasRef={canvasRefAlpha}
              cardTestId="specimen-alpha-card"
              fitnessTestId="alpha-fitness-val"
              onSelect={selectSpecimen}
              onLaunch={handleLaunchBiosphere}
            />

            <SpecimenCard
              offspringLabel="OFFSPRING 2"
              specimen={specimenBeta}
              traits={betaTraits}
              fitness={betaFitness}
              delta={betaDelta}
              canvasRef={canvasRefBeta}
              cardTestId="specimen-beta-card"
              fitnessTestId="beta-fitness-val"
              onSelect={selectSpecimen}
              onLaunch={handleLaunchBiosphere}
            />
          </main>

          {/* Ancestor Lineage Scrubber */}
          <section className="lineage-section" aria-label="Ancestor Evolutionary Lineage">
            <div className="lineage-header">
              <div className="lineage-title">
                <span>📜 Lineage & Ancestor Tree</span>
                <span className="stat-label">({lineage.length} generations)</span>
              </div>
              <span className="lineage-hint">Click any ancestor to rewind & branch evolution</span>
            </div>

            <div className="lineage-scroll" data-testid="lineage-timeline">
              {lineage.map((ancestor, index) => (
                <LineageThumbnail
                  key={`${ancestor.id}-${index}`}
                  ancestor={ancestor}
                  isActive={ancestor.id === parentGenome.id}
                  onClick={() => handleTimeTravel(ancestor)}
                />
              ))}
            </div>
          </section>

          {/* Streamlined Bottom Utility Dock */}
          <div className="biomorphs-bottom-dock">
            <div className="dock-stats">
              <div className="stat-item" data-testid="generation-counter">
                <span className="stat-label">Generation</span>
                <span className="stat-value">Gen {parentGenome.generation}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Champion</span>
                <span className="stat-value champion-name">{parentGenome.name}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Champion Fitness</span>
                <span className="stat-value fitness-highlight">{parentFitness.score}%</span>
              </div>
            </div>

            <div className="dock-actions">
              <button
                type="button"
                className="bio-btn btn-primary"
                onClick={() => handleLaunchBiosphere(parentGenome)}
                title="Launch champion organism into autonomous living biosphere (L)"
                data-testid="btn-launch-champion"
              >
                🚀 Launch (L)
              </button>
              <button
                type="button"
                className="bio-btn"
                onClick={() => void handleCopyDNA()}
                title="Copy DNA sequence payload"
              >
                📋 Copy DNA
              </button>
              <button
                type="button"
                className="bio-btn"
                onClick={handleOpenDnaModal}
                title="Load DNA from sequence payload"
              >
                🧬 Import DNA
              </button>
              <button
                type="button"
                className="bio-btn"
                onClick={handleExportPNG}
                title="Export off-screen HD specimen image"
              >
                🖼️ Export HD PNG
              </button>
              <button
                type="button"
                className="bio-btn"
                onClick={handleRandomizeEcosystem}
                title="Migrate species to a new random biosphere"
              >
                🌍 Migrate Biome
              </button>
              <button
                type="button"
                className="bio-btn"
                onClick={handleNewGenesis}
                title="Restart simulation from Gen 0"
              >
                🌱 New Genesis (R)
              </button>
            </div>
          </div>
        </>
      )}

      {/* VIEW MODE 2: LIVING AUTONOMOUS BIOSPHERE */}
      {viewMode === 'biosphere' && (
        <section className="biosphere-stage-section" data-testid="biosphere-section">
          {biosphere?.apexDominanceAchieved && (
            <div className="apex-dominance-banner" data-testid="apex-dominance-banner">
              🏆 APEX DOMINANCE ACHIEVED: {parentGenome.name} is the supreme adapted ruler of this
              biosphere!
            </div>
          )}

          <div className="biosphere-hud-bar">
            <div className="hud-biome-badge">
              <span>
                {activeTerrain.icon} {activeTerrain.name}
              </span>
              <span>·</span>
              <span>
                {activeClimate.icon} {activeClimate.name}
              </span>
              <span>·</span>
              <span>
                {activeThreat.icon} {activeThreat.name}
              </span>
            </div>

            <div className="hud-vitals-group">
              <div className="bio-energy-bar-wrap" title="Organism Energy / Stamina">
                <span className="hud-vital-item">
                  ⚡ Energy:{' '}
                  <span className="hud-vital-val" data-testid="player-energy-val">
                    {Math.round(playerEnergy)}%
                  </span>
                </span>
                <div className="bio-energy-track">
                  <div
                    className={`bio-energy-fill ${energyClass}`}
                    style={{ width: `${Math.max(0, Math.min(100, playerEnergy))}%` }}
                  />
                </div>
              </div>

              <div className="hud-vital-item">
                🌿 Fitness: <span className="hud-vital-val">{parentFitness.score}%</span>
              </div>

              <div className="hud-vital-item">
                ⏱️ Survived:{' '}
                <span className="hud-vital-val" data-testid="survival-timer">
                  {formattedTime}
                </span>
              </div>

              <div className="hud-vital-item">
                🌱 Eaten: <span className="hud-vital-val">{biosphere?.preyEaten ?? 0}</span>
              </div>
              <div className="hud-vital-item">
                🛡️ Repelled:{' '}
                <span className="hud-vital-val">{biosphere?.predatorsRepelled ?? 0}</span>
              </div>
            </div>
          </div>

          <div className="biosphere-canvas-card">
            <canvas
              ref={canvasRefBiosphere}
              width={800}
              height={500}
              className="biosphere-canvas"
              onClick={handleCanvasClick}
              data-testid="biosphere-canvas"
            />
            <div className="biosphere-canvas-hint">Click canvas to attract organism</div>

            {biosphere?.isExtinct && extinctionData && (
              <div className="extinction-overlay" data-testid="extinction-overlay">
                <div className="extinction-card">
                  <div className="extinction-header">
                    <span className="extinction-badge">Extinction Event</span>
                    <h3 className="extinction-title">Organism Extinct in Biosphere</h3>
                  </div>

                  <div className="extinction-stats-row">
                    <div className="extinction-stat-cell">
                      <span className="stat-lbl">Time Survived</span>
                      <span className="stat-num">{formattedTime}</span>
                    </div>
                    <div className="extinction-stat-cell">
                      <span className="stat-lbl">Prey Consumed</span>
                      <span className="stat-num">{biosphere.preyEaten}</span>
                    </div>
                    <div className="extinction-stat-cell">
                      <span className="stat-lbl">Threats Repelled</span>
                      <span className="stat-num">{biosphere.predatorsRepelled}</span>
                    </div>
                  </div>

                  <div className="extinction-advice-box">
                    <strong>🔬 Evolutionary Diagnosis:</strong>
                    <p style={{ margin: '0 0 0.4rem 0' }}>{extinctionData.analysis}</p>
                    <p style={{ margin: 0, color: '#fef08a' }}>💡 {extinctionData.advice}</p>
                  </div>

                  <div className="extinction-actions">
                    <button
                      type="button"
                      className="bio-btn"
                      onClick={handleRespawn}
                      title="Respawn current creature with full energy"
                    >
                      🔄 Respawn
                    </button>
                    <button
                      type="button"
                      className="bio-btn btn-primary"
                      onClick={handleReturnToLab}
                      title="Return to Breeding Lab to evolve counter-adaptations"
                      data-testid="btn-extinction-back-to-lab"
                    >
                      🔬 Return to Lab to Adapt
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="biosphere-action-ticker" data-testid="biosphere-action-ticker">
              <span className="ticker-label">Action Log:</span>
              <span className="ticker-msg">
                {biosphere?.actionLog[0] ?? 'Biosphere operating in equilibrium.'}
              </span>
            </div>
          </div>

          <div className="biosphere-controls-bar">
            <div className="controls-group">
              <button
                type="button"
                className="bio-btn"
                onClick={handleTogglePause}
                title="Pause / Resume simulation (Space)"
                data-testid="btn-toggle-pause"
              >
                {biosphere?.isPaused ? '▶️ Resume (Space)' : '⏸️ Pause (Space)'}
              </button>

              <SegmentedControl<'1' | '2' | '3'>
                mode="group"
                ariaLabel="Simulation Speed"
                value={String(biosphere?.simSpeed ?? 1) as '1' | '2' | '3'}
                onChange={(spd) => handleChangeSimSpeed(Number(spd))}
                options={SPEED_OPTIONS}
                className="speed-btn-group"
              />

              <button
                type="button"
                className="bio-btn"
                onClick={handleAddPrey}
                title="Introduce new bio-spore prey to the biome"
              >
                🌱 +Prey
              </button>
              <button
                type="button"
                className="bio-btn"
                onClick={handleAddPredator}
                title="Spawn a hostile native predator"
              >
                ⚠️ +Predator
              </button>
            </div>

            <div className="controls-group">
              <button
                type="button"
                className="bio-btn"
                onClick={handleRespawn}
                title="Respawn organism with full health (R)"
              >
                🔄 Respawn (R)
              </button>
              <button
                type="button"
                className="bio-btn btn-primary"
                onClick={handleReturnToLab}
                title="Return to Breeding Lab to mutate new generations (L)"
                data-testid="btn-back-to-lab"
              >
                🔬 Back to Lab (L)
              </button>
            </div>
          </div>
        </section>
      )}

      {/* DNA Load Modal */}
      <Modal
        isOpen={showDnaModal}
        onClose={handleCloseDnaModal}
        title="🧬 Import Creature DNA"
        closeLabel="Close DNA import modal"
        maxWidth="520px"
        className="dna-modal"
      >
        <p className="dna-modal-desc">
          Paste a base64 encoded genome string to reconstruct an ancestor organism.
        </p>

        {dnaError ? (
          <InlineAlert variant="error" message={dnaError} onDismiss={() => setDnaError(null)} />
        ) : null}

        <textarea
          className="dna-textarea"
          placeholder="Paste base64 DNA sequence here..."
          aria-label="Base64 DNA sequence"
          value={dnaInput}
          onChange={(e) => {
            setDnaInput(e.target.value);
            if (dnaError) setDnaError(null);
          }}
        />
        <div className="dna-modal-actions">
          <button type="button" className="bio-btn" onClick={handleCloseDnaModal}>
            Cancel
          </button>
          <button
            type="button"
            className="bio-btn btn-primary"
            onClick={handleLoadDNA}
            disabled={!dnaInput.trim()}
          >
            Load DNA
          </button>
        </div>
      </Modal>

      <Toast
        visible={toast !== null}
        message={toast?.message ?? ''}
        variant={toast?.variant ?? 'info'}
        onDismiss={dismissToast}
        className="bio-toast"
      />
    </div>
  );
}
