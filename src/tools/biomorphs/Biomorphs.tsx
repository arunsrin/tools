import { useState, useEffect, useRef, useCallback } from 'react';
import {
  type BiomorphGenome,
  type EcosystemConfig,
  type TerrainType,
  type ClimateType,
  type ThreatType,
  TERRAINS,
  CLIMATES,
  THREATS,
  createRandomEcosystem,
  calculateFitness,
  createPrimordialGenome,
  mutateGenome,
  drawBiomorph,
} from './biomorphEngine';
import {
  type BiosphereState,
  createInitialBiosphere,
  stepBiosphere,
  drawBiosphere,
  addPreyAgent,
  addPredatorAgent,
  respawnPlayer,
  generateExtinctionAdvice,
} from './ecosystemEngine';
import './Biomorphs.css';

interface BiomorphsProps {
  onBack: () => void;
}

interface CandidateSpecimen {
  genome: BiomorphGenome;
  traits: string[];
}

const STORAGE_KEY = 'tools_hub_biomorphs';

export default function Biomorphs({ onBack }: BiomorphsProps) {
  // Mode switcher: 'lab' (Breeding Lab) vs 'biosphere' (Living Autonomous Ecosystem)
  const [viewMode, setViewMode] = useState<'lab' | 'biosphere'>('lab');

  // Initialize ecosystem configuration
  const [ecosystem, setEcosystem] = useState<EcosystemConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.ecosystem?.terrain && parsed?.ecosystem?.climate && parsed?.ecosystem?.threat) {
          return parsed.ecosystem;
        }
      }
    } catch {
      // ignore
    }
    return createRandomEcosystem();
  });

  // Initialize state with persistence
  const [parentGenome, setParentGenome] = useState<BiomorphGenome>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.parentGenome?.id) return parsed.parentGenome;
      }
    } catch {
      // ignore
    }
    return createPrimordialGenome();
  });

  const [lineage, setLineage] = useState<BiomorphGenome[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.lineage) && parsed.lineage.length > 0) return parsed.lineage;
      }
    } catch {
      // ignore
    }
    return [parentGenome];
  });

  // Mutated candidates: Both Alpha and Beta mutate atomically from parentGenome
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

  // Biosphere Simulation State & Refs
  const [biosphere, setBiosphere] = useState<BiosphereState | null>(null);
  const biosphereRef = useRef<BiosphereState | null>(null);

  // UI Modals & Toast
  const [showDnaModal, setShowDnaModal] = useState(false);
  const [dnaInput, setDnaInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvasRefAlpha = useRef<HTMLCanvasElement | null>(null);
  const canvasRefBeta = useRef<HTMLCanvasElement | null>(null);
  const canvasRefBiosphere = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTimeRef = useRef<number>(0);
  const lastUiSyncRef = useRef<number>(0);

  // Show temporary toast with timer collision avoidance
  const showToast = useCallback((msg: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2800);
  }, []);

  // Cleanup pending toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      const data = {
        parentGenome,
        lineage: lineage.slice(-25), // keep last 25 generations
        ecosystem,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // LocalStorage error tolerated gracefully
    }
  }, [parentGenome, lineage, ecosystem]);

  // Launch Champion / Specimen into Living Biosphere
  const handleLaunchBiosphere = useCallback(
    (organism: BiomorphGenome) => {
      setParentGenome(organism);
      const initial = createInitialBiosphere(organism, ecosystem, 800, 500);
      biosphereRef.current = initial;
      setBiosphere(initial);
      setViewMode('biosphere');
      showToast(`🚀 Launched ${organism.name} into ${ecosystem.terrain} biosphere!`);
    },
    [ecosystem, showToast]
  );

  const handleReturnToLab = useCallback(() => {
    setViewMode('lab');
  }, []);

  // Biosphere Interactive Controls
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
    setBiosphere(next);
    showToast('✨ Organism revived!');
  }, [showToast]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRefBiosphere.current || !biosphereRef.current?.playerAgent) return;
    const rect = canvasRefBiosphere.current.getBoundingClientRect();
    const scaleX = canvasRefBiosphere.current.width / rect.width;
    const scaleY = canvasRefBiosphere.current.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Direct player agent target towards click point
    biosphereRef.current.playerAgent.targetX = clickX;
    biosphereRef.current.playerAgent.targetY = clickY;
    biosphereRef.current.playerAgent.retargetTimer = 3.5;
  }, []);

  // Unified Animation Loop
  useEffect(() => {
    const startTime = performance.now();
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = lastTimeRef.current ? Math.min(0.06, (now - lastTimeRef.current) / 1000) : 0.016;
      lastTimeRef.current = now;
      const animElapsed = (now - startTime) / 1000;

      if (viewMode === 'lab') {
        if (canvasRefAlpha.current) {
          const ctxA = canvasRefAlpha.current.getContext('2d');
          if (ctxA) {
            drawBiomorph(ctxA, specimenAlpha, canvasRefAlpha.current.width, canvasRefAlpha.current.height, animElapsed);
          }
        }
        if (canvasRefBeta.current) {
          const ctxB = canvasRefBeta.current.getContext('2d');
          if (ctxB) {
            drawBiomorph(ctxB, specimenBeta, canvasRefBeta.current.width, canvasRefBeta.current.height, animElapsed);
          }
        }
      } else if (viewMode === 'biosphere') {
        if (canvasRefBiosphere.current && biosphereRef.current) {
          const canvas = canvasRefBiosphere.current;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            const nextState = stepBiosphere(biosphereRef.current, dt, canvas.width, canvas.height);
            biosphereRef.current = nextState;
            drawBiosphere(ctx, nextState, canvas.width, canvas.height, animElapsed);

            // Throttle React state synchronization for HUD and modals to 10 FPS
            if (
              now - lastUiSyncRef.current > 100 ||
              nextState.isExtinct !== biosphere?.isExtinct ||
              nextState.apexDominanceAchieved !== biosphere?.apexDominanceAchieved
            ) {
              lastUiSyncRef.current = now;
              setBiosphere({ ...nextState });
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [viewMode, specimenAlpha, specimenBeta, biosphere?.isExtinct, biosphere?.apexDominanceAchieved]);

  // Environmental Fitness Calculations for Breeding Lab
  const parentFitness = calculateFitness(parentGenome, ecosystem);
  const alphaFitness = calculateFitness(specimenAlpha, ecosystem);
  const betaFitness = calculateFitness(specimenBeta, ecosystem);

  const alphaDelta = alphaFitness.score - parentFitness.score;
  const betaDelta = betaFitness.score - parentFitness.score;

  // Ecosystem Dimension Change Handlers
  const handleEcosystemChange = useCallback(
    <K extends keyof EcosystemConfig>(dimension: K, value: EcosystemConfig[K]) => {
      setEcosystem((prev) => ({
        ...prev,
        [dimension]: value,
      }));
    },
    []
  );

  const handleRandomizeEcosystem = useCallback(() => {
    const newEco = createRandomEcosystem();
    setEcosystem(newEco);
    const tObj = TERRAINS.find((t) => t.id === newEco.terrain);
    const cObj = CLIMATES.find((c) => c.id === newEco.climate);
    const thObj = THREATS.find((th) => th.id === newEco.threat);
    showToast(`New Biosphere: ${tObj?.name} + ${cObj?.name} + ${thObj?.name}`);

    // If in biosphere, re-seed state with new ecosystem
    if (viewMode === 'biosphere') {
      const resetBio = createInitialBiosphere(parentGenome, newEco, 800, 500);
      biosphereRef.current = resetBio;
      setBiosphere(resetBio);
    }
  }, [showToast, viewMode, parentGenome]);

  // Selection Handler: Both Alpha and Beta mutate atomically from the chosen winner
  const selectSpecimen = useCallback(
    (chosen: BiomorphGenome) => {
      setParentGenome(chosen);
      setLineage((prev) => [...prev, chosen]);

      const resA = mutateGenome(chosen);
      const resB = mutateGenome(chosen);

      setCandidateAlpha({ genome: resA.child, traits: resA.mutatedTraits });
      setCandidateBeta({ genome: resB.child, traits: resB.mutatedTraits });

      const chosenFit = calculateFitness(chosen, ecosystem);
      if (chosenFit.score >= 90) {
        showToast(`🏆 Apex Organism Evolved! Selected ${chosen.name} (${chosenFit.score}% fitness)`);
      } else {
        showToast(`Selected ${chosen.name} (${chosenFit.score}% Adapted)`);
      }
    },
    [ecosystem, showToast]
  );

  // Restart / New Genesis
  const handleNewGenesis = useCallback(() => {
    const fresh = createPrimordialGenome();
    setParentGenome(fresh);
    setLineage([fresh]);

    const resA = mutateGenome(fresh);
    const resB = mutateGenome(fresh);

    setCandidateAlpha({ genome: resA.child, traits: resA.mutatedTraits });
    setCandidateBeta({ genome: resB.child, traits: resB.mutatedTraits });

    showToast('New Genesis initiated: Generation 0 primed.');
  }, [showToast]);

  // Time Travel to Ancestor
  const handleTimeTravel = useCallback(
    (ancestor: BiomorphGenome) => {
      setParentGenome(ancestor);

      const resA = mutateGenome(ancestor);
      const resB = mutateGenome(ancestor);

      setCandidateAlpha({ genome: resA.child, traits: resA.mutatedTraits });
      setCandidateBeta({ genome: resB.child, traits: resB.mutatedTraits });

      showToast(`Rewound to Gen ${ancestor.generation} (${ancestor.name})`);
    },
    [showToast]
  );

  // Keyboard Navigation: ArrowLeft / ArrowRight / 1 / 2 / R / L / Space
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
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

  // DNA Export & Copy
  const handleCopyDNA = useCallback(() => {
    try {
      const payload = btoa(JSON.stringify(parentGenome));
      navigator.clipboard.writeText(payload);
      showToast('DNA sequence copied to clipboard!');
    } catch {
      showToast('Could not copy DNA payload.');
    }
  }, [parentGenome, showToast]);

  // DNA Load
  const handleLoadDNA = useCallback(() => {
    try {
      const decoded = atob(dnaInput.trim());
      const loaded: BiomorphGenome = JSON.parse(decoded);
      if (loaded.id && Array.isArray(loaded.segments) && Array.isArray(loaded.limbPairs)) {
        setParentGenome(loaded);
        setLineage((prev) => [...prev, loaded]);

        const resA = mutateGenome(loaded);
        const resB = mutateGenome(loaded);

        setCandidateAlpha({ genome: resA.child, traits: resA.mutatedTraits });
        setCandidateBeta({ genome: resB.child, traits: resB.mutatedTraits });

        setShowDnaModal(false);
        setDnaInput('');
        showToast(`Loaded creature: ${loaded.name}`);
      } else {
        alert('Invalid genome DNA format.');
      }
    } catch {
      alert('Failed to parse DNA string. Please ensure it is a valid base64 payload.');
    }
  }, [dnaInput, showToast]);

  // HD PNG Export
  const handleExportPNG = useCallback(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = 1024;
    offscreen.height = 1024;
    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    // Rich cosmic background gradient
    const bg = ctx.createRadialGradient(512, 512, 50, 512, 512, 700);
    bg.addColorStop(0, '#111827');
    bg.addColorStop(0.6, '#080d1a');
    bg.addColorStop(1, '#02040a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1024, 1024);

    // Render large high-res biomorph
    ctx.save();
    ctx.translate(512 - 200, 512 - 150);
    ctx.scale(2.4, 2.4);
    drawBiomorph(ctx, parentGenome, 1024 / 2.4, 1024 / 2.4, 0);
    ctx.restore();

    // Caption
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${parentGenome.name} · Generation ${parentGenome.generation}`, 512, 970);

    const link = document.createElement('a');
    link.download = `biomorph-gen${parentGenome.generation}.png`;
    link.href = offscreen.toDataURL('image/png');
    link.click();
    showToast('Exported HD specimen snapshot!');
  }, [parentGenome, showToast]);

  const activeTerrain = TERRAINS.find((t) => t.id === ecosystem.terrain) || TERRAINS[0];
  const activeClimate = CLIMATES.find((c) => c.id === ecosystem.climate) || CLIMATES[0];
  const activeThreat = THREATS.find((th) => th.id === ecosystem.threat) || THREATS[0];

  // Extinction Analysis if extinct
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
      {/* Header & Mode Switcher */}
      <header className="biomorphs-header">
        <div className="biomorphs-title-group">
          <span className="biomorphs-badge">🧬 Ecosystem Adaptation</span>
          <h1>Biomorphs: The Evolutionary Watchmaker</h1>
          <p className="biomorphs-subtitle">
            Guide the morphology of generative organisms and test their survival in living autonomous biospheres.
          </p>
          <div className="how-to-play-guide" data-testid="how-to-play-guide">
            <span className="guide-title">💡 How to Play:</span>
            <div className="guide-steps">
              <span>1. Study the <strong>Active Biosphere</strong> pressures (Terrain, Climate, Threat).</span>
              <span>2. Compare candidate offspring and select the one with adaptive strengths (<code>+pros</code>) that counter these hazards.</span>
              <span>3. Breed through generations to maximize fitness, then click <strong>🚀 Launch</strong> (or press <strong>L</strong>) to watch it hunt and survive!</span>
            </div>
          </div>
        </div>

        <div className="biomorphs-top-actions">
          {/* Mode Switcher Tabs */}
          <div className="biomorph-mode-switcher" role="tablist" aria-label="Simulation Mode">
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'lab'}
              className={`mode-tab-btn ${viewMode === 'lab' ? 'active' : ''}`}
              onClick={handleReturnToLab}
              data-testid="tab-breeding-lab"
            >
              🧬 Breeding Lab
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={viewMode === 'biosphere'}
              className={`mode-tab-btn ${viewMode === 'biosphere' ? 'active' : ''}`}
              onClick={() => handleLaunchBiosphere(parentGenome)}
              data-testid="tab-living-biosphere"
            >
              🌍 Living Biosphere
            </button>
          </div>

          <button className="bio-btn btn-back" onClick={onBack} aria-label="Back to Tools Hub">
            ← Hub
          </button>
        </div>
      </header>

      {/* VIEW MODE 1: BREEDING LAB */}
      {viewMode === 'lab' && (
        <>
          {/* Combinable Ecosystem Environmental Pressures Bar */}
          <section className="ecosystem-bar" aria-label="Ecosystem & Environmental Pressures" data-testid="ecosystem-bar">
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
                className="bio-btn btn-random-ecosystem"
                onClick={handleRandomizeEcosystem}
                title="Roll random new biosphere"
                aria-label="Roll random ecosystem"
              >
                🎲 Random Biosphere
              </button>
            </div>

            {/* Dynamic Biome Narrative & Pressure Guidance */}
            <div className="ecosystem-narrative-bar">
              <div className="narrative-headline">
                <span className="narrative-tag">Active Biosphere:</span>
                <span className="narrative-title">
                  {activeTerrain.icon} {activeTerrain.name} · {activeClimate.icon} {activeClimate.name} · {activeThreat.icon} {activeThreat.name}
                </span>
              </div>
              <p className="narrative-desc">
                {activeTerrain.desc} {activeClimate.desc} {activeThreat.desc}
              </p>
            </div>
          </section>

          {/* 2-Way Comparative Duel Arena */}
          <main className="duel-arena">
            {/* Specimen Offspring 1 (Left) */}
            <div
              className={`specimen-card ${alphaFitness.score >= 90 ? 'apex-specimen' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => selectSpecimen(specimenAlpha)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectSpecimen(specimenAlpha)}
              data-testid="specimen-alpha-card"
              aria-label={`Select Offspring 1: ${specimenAlpha.name}`}
            >
              {alphaFitness.score >= 90 && (
                <div className="apex-banner">🏆 APEX ORGANISM</div>
              )}

              <div className="card-header-bar">
                <div className="specimen-tag">
                  <span className="tag-badge">OFFSPRING 1</span>
                  <span className="specimen-name">{specimenAlpha.name}</span>
                </div>
                <button
                  type="button"
                  className="btn-select-champion"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectSpecimen(specimenAlpha);
                  }}
                  title="Select Offspring 1 as Champion to breed next generation"
                  aria-label={`Select Offspring 1: ${specimenAlpha.name} as Champion`}
                >
                  👑 Select as Champion
                </button>
              </div>

              {/* Fitness & Adaptation Metrics Bar */}
              <div className="specimen-fitness-badge-row">
                <div className={`fitness-score-tag ${alphaFitness.score >= 90 ? 'apex-score' : ''}`}>
                  <span className="fitness-icon">🌿</span>
                  <span className="fitness-val" data-testid="alpha-fitness-val">{alphaFitness.score}% Adapted</span>
                </div>
                <span
                  className={`adaptive-delta-badge ${alphaDelta > 0 ? 'delta-pos' : alphaDelta < 0 ? 'delta-neg' : 'delta-neu'}`}
                  title="Adaptive shift relative to parent champion"
                >
                  {alphaDelta > 0 ? `+${alphaDelta}% vs Parent` : alphaDelta < 0 ? `${alphaDelta}% vs Parent` : '0% vs Parent'}
                </span>
              </div>

              {/* Environmental Adaptation Diagnostics (ABOVE Canvas) */}
              <div className="adaptation-diagnostics-section">
                <span className="trait-section-label">Active Biosphere Adaptation:</span>
                <div className="adaptation-diagnostics">
                  {alphaFitness.pros.map((p, idx) => (
                    <span key={`alpha-pro-${idx}`} className="diagnostic-tag tag-pro">
                      {p}
                    </span>
                  ))}
                  {alphaFitness.cons.map((c, idx) => (
                    <span key={`alpha-con-${idx}`} className="diagnostic-tag tag-con">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="canvas-wrapper">
                <canvas ref={canvasRefAlpha} width={400} height={300} className="specimen-canvas" />
              </div>

              {/* Mutated Traits Bar (BELOW Canvas) */}
              <div className="mutations-section">
                <span className="trait-section-label">✦ Next-Gen Mutations:</span>
                <div className="card-traits-bar">
                  {alphaTraits.map((t, idx) => (
                    <span key={idx} className="trait-pill">
                      ✦ {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card-action-footer">
                <span className="card-click-hint">Click card to select</span>
                <button
                  type="button"
                  className="btn-launch-specimen"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunchBiosphere(specimenAlpha);
                  }}
                  title="Launch Offspring 1 into living biosphere"
                  aria-label={`Launch Offspring 1: ${specimenAlpha.name}`}
                >
                  🚀 Launch
                </button>
              </div>
            </div>

            {/* Specimen Offspring 2 (Right) */}
            <div
              className={`specimen-card ${betaFitness.score >= 90 ? 'apex-specimen' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => selectSpecimen(specimenBeta)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectSpecimen(specimenBeta)}
              data-testid="specimen-beta-card"
              aria-label={`Select Offspring 2: ${specimenBeta.name}`}
            >
              {betaFitness.score >= 90 && (
                <div className="apex-banner">🏆 APEX ORGANISM</div>
              )}

              <div className="card-header-bar">
                <div className="specimen-tag">
                  <span className="tag-badge">OFFSPRING 2</span>
                  <span className="specimen-name">{specimenBeta.name}</span>
                </div>
                <button
                  type="button"
                  className="btn-select-champion"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectSpecimen(specimenBeta);
                  }}
                  title="Select Offspring 2 as Champion to breed next generation"
                  aria-label={`Select Offspring 2: ${specimenBeta.name} as Champion`}
                >
                  👑 Select as Champion
                </button>
              </div>

              {/* Fitness & Adaptation Metrics Bar */}
              <div className="specimen-fitness-badge-row">
                <div className={`fitness-score-tag ${betaFitness.score >= 90 ? 'apex-score' : ''}`}>
                  <span className="fitness-icon">🌿</span>
                  <span className="fitness-val" data-testid="beta-fitness-val">{betaFitness.score}% Adapted</span>
                </div>
                <span
                  className={`adaptive-delta-badge ${betaDelta > 0 ? 'delta-pos' : betaDelta < 0 ? 'delta-neg' : 'delta-neu'}`}
                  title="Adaptive shift relative to parent champion"
                >
                  {betaDelta > 0 ? `+${betaDelta}% vs Parent` : betaDelta < 0 ? `${betaDelta}% vs Parent` : '0% vs Parent'}
                </span>
              </div>

              {/* Environmental Adaptation Diagnostics (ABOVE Canvas) */}
              <div className="adaptation-diagnostics-section">
                <span className="trait-section-label">Active Biosphere Adaptation:</span>
                <div className="adaptation-diagnostics">
                  {betaFitness.pros.map((p, idx) => (
                    <span key={`beta-pro-${idx}`} className="diagnostic-tag tag-pro">
                      {p}
                    </span>
                  ))}
                  {betaFitness.cons.map((c, idx) => (
                    <span key={`beta-con-${idx}`} className="diagnostic-tag tag-con">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="canvas-wrapper">
                <canvas ref={canvasRefBeta} width={400} height={300} className="specimen-canvas" />
              </div>

              {/* Mutated Traits Bar (BELOW Canvas) */}
              <div className="mutations-section">
                <span className="trait-section-label">✦ Next-Gen Mutations:</span>
                <div className="card-traits-bar">
                  {betaTraits.map((t, idx) => (
                    <span key={idx} className="trait-pill">
                      ✦ {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="card-action-footer">
                <span className="card-click-hint">Click card to select</span>
                <button
                  type="button"
                  className="btn-launch-specimen"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunchBiosphere(specimenBeta);
                  }}
                  title="Launch Offspring 2 into living biosphere"
                  aria-label={`Launch Offspring 2: ${specimenBeta.name}`}
                >
                  🚀 Launch
                </button>
              </div>
            </div>
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
                className="bio-btn btn-primary"
                onClick={() => handleLaunchBiosphere(parentGenome)}
                title="Launch champion organism into autonomous living biosphere (L)"
                data-testid="btn-launch-champion"
              >
                🚀 Launch (L)
              </button>
              <button className="bio-btn" onClick={handleCopyDNA} title="Copy DNA sequence payload">
                📋 Copy DNA
              </button>
              <button className="bio-btn" onClick={() => setShowDnaModal(true)} title="Load DNA from sequence payload">
                🧬 Import DNA
              </button>
              <button className="bio-btn" onClick={handleExportPNG} title="Export off-screen HD specimen image">
                🖼️ Export HD PNG
              </button>
              <button className="bio-btn" onClick={handleRandomizeEcosystem} title="Migrate species to a new random biosphere">
                🌍 Migrate Biome
              </button>
              <button className="bio-btn" onClick={handleNewGenesis} title="Restart simulation from Gen 0">
                🌱 New Genesis (R)
              </button>
            </div>
          </div>
        </>
      )}

      {/* VIEW MODE 2: LIVING AUTONOMOUS BIOSPHERE */}
      {viewMode === 'biosphere' && (
        <section className="biosphere-stage-section" data-testid="biosphere-section">
          {/* Apex Dominance Announcement */}
          {biosphere?.apexDominanceAchieved && (
            <div className="apex-dominance-banner" data-testid="apex-dominance-banner">
              🏆 APEX DOMINANCE ACHIEVED: {parentGenome.name} is the supreme adapted ruler of this biosphere!
            </div>
          )}

          {/* Biosphere Top HUD Bar */}
          <div className="biosphere-hud-bar">
            <div className="hud-biome-badge">
              <span>{activeTerrain.icon} {activeTerrain.name}</span>
              <span>·</span>
              <span>{activeClimate.icon} {activeClimate.name}</span>
              <span>·</span>
              <span>{activeThreat.icon} {activeThreat.name}</span>
            </div>

            <div className="hud-vitals-group">
              {/* Energy Bar */}
              <div className="energy-bar-wrap" title="Organism Energy / Stamina">
                <span className="hud-vital-item">
                  ⚡ Energy: <span className="hud-vital-val" data-testid="player-energy-val">{Math.round(playerEnergy)}%</span>
                </span>
                <div className="energy-track">
                  <div
                    className={`energy-fill ${energyClass}`}
                    style={{ width: `${Math.max(0, Math.min(100, playerEnergy))}%` }}
                  />
                </div>
              </div>

              {/* Fitness */}
              <div className="hud-vital-item">
                🌿 Fitness: <span className="hud-vital-val">{parentFitness.score}%</span>
              </div>

              {/* Survival Time */}
              <div className="hud-vital-item">
                ⏱️ Survived: <span className="hud-vital-val" data-testid="survival-timer">{formattedTime}</span>
              </div>

              {/* Prey & Threats */}
              <div className="hud-vital-item">
                🌱 Eaten: <span className="hud-vital-val">{biosphere?.preyEaten ?? 0}</span>
              </div>
              <div className="hud-vital-item">
                🛡️ Repelled: <span className="hud-vital-val">{biosphere?.predatorsRepelled ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Living Biosphere Canvas Card */}
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

            {/* Extinction Debrief Overlay */}
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
                      className="bio-btn"
                      onClick={handleRespawn}
                      title="Respawn current creature with full energy"
                    >
                      🔄 Respawn
                    </button>
                    <button
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

            {/* Biosphere Action Ticker */}
            <div className="biosphere-action-ticker" data-testid="biosphere-action-ticker">
              <span className="ticker-label">Action Log:</span>
              <span className="ticker-msg">
                {biosphere?.actionLog[0] ?? 'Biosphere operating in equilibrium.'}
              </span>
            </div>
          </div>

          {/* Biosphere Interactive Controls Bar */}
          <div className="biosphere-controls-bar">
            <div className="controls-group">
              <button
                className="bio-btn"
                onClick={handleTogglePause}
                title="Pause / Resume simulation (Space)"
                data-testid="btn-toggle-pause"
              >
                {biosphere?.isPaused ? '▶️ Resume (Space)' : '⏸️ Pause (Space)'}
              </button>

              <div className="speed-btn-group" role="group" aria-label="Simulation Speed">
                {[1, 2, 3].map((spd) => (
                  <button
                    key={spd}
                    type="button"
                    className={`speed-btn ${biosphere?.simSpeed === spd ? 'active' : ''}`}
                    onClick={() => handleChangeSimSpeed(spd)}
                    title={`Run at ${spd}x speed`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>

              <button
                className="bio-btn"
                onClick={handleAddPrey}
                title="Introduce new bio-spore prey to the biome"
              >
                🌱 +Prey
              </button>
              <button
                className="bio-btn"
                onClick={handleAddPredator}
                title="Spawn a hostile native predator"
              >
                ⚠️ +Predator
              </button>
            </div>

            <div className="controls-group">
              <button
                className="bio-btn"
                onClick={handleRespawn}
                title="Respawn organism with full health (R)"
              >
                🔄 Respawn (R)
              </button>
              <button
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
      {showDnaModal && (
        <div className="dna-modal-backdrop" onClick={() => setShowDnaModal(false)}>
          <div className="dna-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🧬 Import Creature DNA</h3>
            <p>Paste a base64 encoded genome string to reconstruct an ancestor organism.</p>
            <textarea
              className="dna-textarea"
              placeholder="Paste base64 DNA sequence here..."
              value={dnaInput}
              onChange={(e) => setDnaInput(e.target.value)}
            />
            <div className="dna-modal-actions">
              <button className="bio-btn" onClick={() => setShowDnaModal(false)}>
                Cancel
              </button>
              <button className="bio-btn btn-primary" onClick={handleLoadDNA} disabled={!dnaInput.trim()}>
                Load DNA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Temporary Toast */}
      {toastMessage && <div className="bio-toast">{toastMessage}</div>}
    </div>
  );
}

// Lineage Thumbnail Component
interface LineageThumbnailProps {
  ancestor: BiomorphGenome;
  isActive: boolean;
  onClick: () => void;
}

function LineageThumbnail({ ancestor, isActive, onClick }: LineageThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      if (ctx) {
        drawBiomorph(ctx, ancestor, 76, 60, 0);
      }
    }
  }, [ancestor]);

  return (
    <div
      className={`lineage-card ${isActive ? 'active-ancestor' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={`Gen ${ancestor.generation}: ${ancestor.name}`}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
    >
      <canvas ref={canvasRef} width={76} height={60} className="lineage-thumb-canvas" />
      <span className="lineage-gen-label">Gen {ancestor.generation}</span>
      <span className="lineage-name-label">{ancestor.name.split(' ')[0]}</span>
    </div>
  );
}
