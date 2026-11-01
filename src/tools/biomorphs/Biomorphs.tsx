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

  // UI Modals & Toast
  const [showDnaModal, setShowDnaModal] = useState(false);
  const [dnaInput, setDnaInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvasRefAlpha = useRef<HTMLCanvasElement | null>(null);
  const canvasRefBeta = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Animation Loop for both specimen canvases
  useEffect(() => {
    const startTime = performance.now();

    const loop = (now: number) => {
      const elapsed = (now - startTime) / 1000;

      if (canvasRefAlpha.current) {
        const ctxA = canvasRefAlpha.current.getContext('2d');
        if (ctxA) {
          drawBiomorph(ctxA, specimenAlpha, canvasRefAlpha.current.width, canvasRefAlpha.current.height, elapsed);
        }
      }

      if (canvasRefBeta.current) {
        const ctxB = canvasRefBeta.current.getContext('2d');
        if (ctxB) {
          drawBiomorph(ctxB, specimenBeta, canvasRefBeta.current.width, canvasRefBeta.current.height, elapsed);
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
  }, [specimenAlpha, specimenBeta]);

  // Environmental Fitness Calculations
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
  }, [showToast]);

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

  // Keyboard Navigation: ArrowLeft / ArrowRight / 1 / 2 / R
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if inside textarea/input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowLeft' || e.key === '1') {
        e.preventDefault();
        selectSpecimen(specimenAlpha);
      } else if (e.key === 'ArrowRight' || e.key === '2') {
        e.preventDefault();
        selectSpecimen(specimenBeta);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleNewGenesis();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectSpecimen, handleNewGenesis, specimenAlpha, specimenBeta]);

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
    const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 600);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(0.7, '#080d1a');
    grad.addColorStop(1, '#020408');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Render scaled up
    ctx.save();
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

  return (
    <div className="biomorphs-container">
      {/* Streamlined Clean Header */}
      <header className="biomorphs-header">
        <div className="biomorphs-title-group">
          <span className="biomorphs-badge">🧬 Ecosystem Adaptation</span>
          <h1>Biomorphs: The Evolutionary Watchmaker</h1>
          <p className="biomorphs-subtitle">
            Guide the procedural morphology of alien organisms to adapt to dynamic planetary biospheres.
          </p>
        </div>

        <div className="biomorphs-top-actions">
          <button className="bio-btn btn-back" onClick={onBack} aria-label="Back to Tools Hub">
            ← Hub
          </button>
        </div>
      </header>

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
        {/* Specimen Alpha (Left) */}
        <div
          className={`specimen-card ${alphaFitness.score >= 90 ? 'apex-specimen' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => selectSpecimen(specimenAlpha)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectSpecimen(specimenAlpha)}
          data-testid="specimen-alpha-card"
          aria-label={`Select Specimen Alpha: ${specimenAlpha.name}`}
        >
          {alphaFitness.score >= 90 && (
            <div className="apex-banner">🏆 APEX ORGANISM</div>
          )}

          <div className="card-header-bar">
            <div className="specimen-tag">
              <span className="tag-badge">ALPHA</span>
              <span className="specimen-name">{specimenAlpha.name}</span>
            </div>
            <span className="shortcut-indicator" title="Keyboard shortcut: Left Arrow or 1">
              ← / 1
            </span>
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

          <div className="canvas-wrapper">
            <canvas ref={canvasRefAlpha} width={400} height={300} className="specimen-canvas" />
          </div>

          {/* Environmental Adaptation Diagnostics */}
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

          {/* Mutated Traits Bar */}
          <div className="card-traits-bar">
            {alphaTraits.map((t, idx) => (
              <span key={idx} className="trait-pill">
                ✦ {t}
              </span>
            ))}
          </div>

          <div className="card-select-footer">
            <span className="select-action-text">Select as Champion →</span>
          </div>
        </div>

        {/* Specimen Beta (Right) */}
        <div
          className={`specimen-card ${betaFitness.score >= 90 ? 'apex-specimen' : ''}`}
          role="button"
          tabIndex={0}
          onClick={() => selectSpecimen(specimenBeta)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectSpecimen(specimenBeta)}
          data-testid="specimen-beta-card"
          aria-label={`Select Specimen Beta: ${specimenBeta.name}`}
        >
          {betaFitness.score >= 90 && (
            <div className="apex-banner">🏆 APEX ORGANISM</div>
          )}

          <div className="card-header-bar">
            <div className="specimen-tag">
              <span className="tag-badge">BETA</span>
              <span className="specimen-name">{specimenBeta.name}</span>
            </div>
            <span className="shortcut-indicator" title="Keyboard shortcut: Right Arrow or 2">
              → / 2
            </span>
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

          <div className="canvas-wrapper">
            <canvas ref={canvasRefBeta} width={400} height={300} className="specimen-canvas" />
          </div>

          {/* Environmental Adaptation Diagnostics */}
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

          {/* Mutated Traits Bar */}
          <div className="card-traits-bar">
            {betaTraits.map((t, idx) => (
              <span key={idx} className="trait-pill">
                ✦ {t}
              </span>
            ))}
          </div>

          <div className="card-select-footer">
            <span className="select-action-text">Select as Champion →</span>
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
          <button className="bio-btn btn-primary" onClick={handleNewGenesis} title="Restart simulation from Gen 0">
            🌱 New Genesis (R)
          </button>
        </div>
      </div>

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
