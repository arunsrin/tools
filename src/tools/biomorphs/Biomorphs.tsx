import { useState, useEffect, useRef, useCallback } from 'react';
import {
  type BiomorphGenome,
  createPrimordialGenome,
  mutateGenome,
  drawBiomorph,
} from './biomorphEngine';
import './Biomorphs.css';

interface BiomorphsProps {
  onBack: () => void;
}

const STORAGE_KEY = 'tools_hub_biomorphs';

export default function Biomorphs({ onBack }: BiomorphsProps) {
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

  // Mutated candidates: Both Alpha and Beta are independently mutated from parentGenome by equal amounts
  const [specimenAlpha, setSpecimenAlpha] = useState<BiomorphGenome>(() => mutateGenome(parentGenome).child);
  const [alphaTraits, setAlphaTraits] = useState<string[]>(() => mutateGenome(parentGenome).mutatedTraits);

  const [specimenBeta, setSpecimenBeta] = useState<BiomorphGenome>(() => mutateGenome(parentGenome).child);
  const [betaTraits, setBetaTraits] = useState<string[]>(() => mutateGenome(parentGenome).mutatedTraits);

  // UI Modals & Toast
  const [showDnaModal, setShowDnaModal] = useState(false);
  const [dnaInput, setDnaInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const canvasRefAlpha = useRef<HTMLCanvasElement | null>(null);
  const canvasRefBeta = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Show temporary toast
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    try {
      const data = {
        parentGenome,
        lineage: lineage.slice(-25), // keep last 25 generations
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // LocalStorage error tolerated gracefully
    }
  }, [parentGenome, lineage]);

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

  // Selection Handler: Both Alpha and Beta mutate equally from the chosen winner
  const selectSpecimen = useCallback(
    (chosen: BiomorphGenome) => {
      setParentGenome(chosen);
      setLineage((prev) => [...prev, chosen]);

      const { child: childA, mutatedTraits: traitsA } = mutateGenome(chosen);
      const { child: childB, mutatedTraits: traitsB } = mutateGenome(chosen);

      setSpecimenAlpha(childA);
      setAlphaTraits(traitsA);
      setSpecimenBeta(childB);
      setBetaTraits(traitsB);

      showToast(`Selected ${chosen.name}!`);
    },
    [showToast]
  );

  // Restart / New Genesis
  const handleNewGenesis = useCallback(() => {
    const fresh = createPrimordialGenome();
    setParentGenome(fresh);
    setLineage([fresh]);

    const { child: childA, mutatedTraits: traitsA } = mutateGenome(fresh);
    const { child: childB, mutatedTraits: traitsB } = mutateGenome(fresh);

    setSpecimenAlpha(childA);
    setAlphaTraits(traitsA);
    setSpecimenBeta(childB);
    setBetaTraits(traitsB);

    showToast('New Genesis initiated: Generation 0 primed.');
  }, [showToast]);

  // Time Travel to Ancestor
  const handleTimeTravel = useCallback(
    (ancestor: BiomorphGenome) => {
      setParentGenome(ancestor);

      const { child: childA, mutatedTraits: traitsA } = mutateGenome(ancestor);
      const { child: childB, mutatedTraits: traitsB } = mutateGenome(ancestor);

      setSpecimenAlpha(childA);
      setAlphaTraits(traitsA);
      setSpecimenBeta(childB);
      setBetaTraits(traitsB);

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

  // DNA Export & Import
  const handleCopyDNA = useCallback(() => {
    try {
      const json = JSON.stringify(parentGenome);
      const encoded = btoa(json);
      navigator.clipboard.writeText(encoded);
      showToast('DNA code copied to clipboard!');
    } catch {
      showToast('Could not copy DNA to clipboard.');
    }
  }, [parentGenome, showToast]);

  const handleApplyDNA = useCallback(() => {
    try {
      const trimmed = dnaInput.trim();
      const decoded = atob(trimmed);
      const genome = JSON.parse(decoded) as BiomorphGenome;
      if (genome && genome.segments && genome.limbPairs) {
        setParentGenome(genome);
        setLineage((prev) => [...prev, genome]);

        const { child: childA, mutatedTraits: traitsA } = mutateGenome(genome);
        const { child: childB, mutatedTraits: traitsB } = mutateGenome(genome);

        setSpecimenAlpha(childA);
        setAlphaTraits(traitsA);
        setSpecimenBeta(childB);
        setBetaTraits(traitsB);

        setShowDnaModal(false);
        setDnaInput('');
        showToast(`Loaded DNA for ${genome.name}`);
      } else {
        alert('Invalid genome format.');
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

  return (
    <div className="biomorphs-container">
      {/* Streamlined Clean Header */}
      <header className="biomorphs-header">
        <div className="biomorphs-title-group">
          <span className="biomorphs-badge">🧬 Artificial Selection</span>
          <h1>Biomorphs: The Evolutionary Watchmaker</h1>
          <p className="biomorphs-subtitle">
            Guide the procedural morphology of alien organisms across generations through comparative duels.
          </p>
        </div>

        <div className="biomorphs-top-actions">
          <button className="bio-btn btn-back" onClick={onBack} aria-label="Back to Tools Hub">
            ← Hub
          </button>
        </div>
      </header>

      {/* 2-Way Comparative Duel Arena */}
      <main className="duel-arena">
        {/* Specimen Alpha (Left) */}
        <div
          className="specimen-card"
          role="button"
          tabIndex={0}
          onClick={() => selectSpecimen(specimenAlpha)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectSpecimen(specimenAlpha)}
          data-testid="specimen-alpha-card"
          aria-label={`Select Specimen Alpha: ${specimenAlpha.name}`}
        >
          <div className="card-header-bar">
            <div className="specimen-tag">
              <span className="tag-badge">ALPHA (MUTANT)</span>
              <span className="specimen-name">{specimenAlpha.name}</span>
            </div>
            <span className="shortcut-indicator" title="Keyboard shortcut: Left Arrow or 1">
              ← / 1
            </span>
          </div>

          <div className="canvas-wrapper">
            <canvas ref={canvasRefAlpha} width={400} height={300} className="specimen-canvas" />
          </div>

          <div className="card-traits-bar">
            {alphaTraits.map((t, idx) => (
              <span key={idx} className="trait-pill">
                ✦ {t}
              </span>
            ))}
          </div>

          <div className="card-select-footer">
            <span className="select-action-text">Select as Parent →</span>
          </div>
        </div>

        {/* Specimen Beta (Right) */}
        <div
          className="specimen-card"
          role="button"
          tabIndex={0}
          onClick={() => selectSpecimen(specimenBeta)}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && selectSpecimen(specimenBeta)}
          data-testid="specimen-beta-card"
          aria-label={`Select Specimen Beta: ${specimenBeta.name}`}
        >
          <div className="card-header-bar">
            <div className="specimen-tag">
              <span className="tag-badge">BETA (MUTANT)</span>
              <span className="specimen-name">{specimenBeta.name}</span>
            </div>
            <span className="shortcut-indicator" title="Keyboard shortcut: Right Arrow or 2">
              → / 2
            </span>
          </div>

          <div className="canvas-wrapper">
            <canvas ref={canvasRefBeta} width={400} height={300} className="specimen-canvas" />
          </div>

          <div className="card-traits-bar">
            {betaTraits.map((t, idx) => (
              <span key={idx} className="trait-pill">
                ✦ {t}
              </span>
            ))}
          </div>

          <div className="card-select-footer">
            <span className="select-action-text">Select as Parent →</span>
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

      {/* Bottom Utility Controls Dock */}
      <footer className="biomorphs-bottom-dock" aria-label="Specimen Utilities and Evolution Actions">
        <div className="dock-stats">
          <div className="stat-item">
            <span className="stat-label">Generation</span>
            <span className="stat-value" data-testid="generation-counter">
              Gen {parentGenome.generation}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Active Specimen</span>
            <span className="stat-value specimen-stat-name">
              {parentGenome.name}
            </span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Ancestors</span>
            <span className="stat-value">{lineage.length}</span>
          </div>
        </div>

        <div className="dock-actions">
          <button className="bio-btn" onClick={() => setShowDnaModal(true)} title="Import / Export DNA string">
            🧬 DNA
          </button>
          <button className="bio-btn" onClick={handleCopyDNA} title="Copy DNA code to clipboard">
            📋 Copy DNA
          </button>
          <button className="bio-btn" onClick={handleExportPNG} title="Download high-res PNG">
            📸 Export PNG
          </button>
          <button className="bio-btn btn-primary" onClick={handleNewGenesis} title="Restart with a fresh organism (R)">
            ⚡ New Genesis
          </button>
        </div>
      </footer>

      {/* DNA Modal */}
      {showDnaModal && (
        <div className="dna-modal-backdrop" onClick={() => setShowDnaModal(false)}>
          <div className="dna-modal" onClick={(e) => e.stopPropagation()}>
            <h3>🧬 Organism DNA Code</h3>
            <p>Paste an encoded genome string below to restore a specimen, or copy the active champion DNA.</p>
            <textarea
              className="dna-textarea"
              placeholder="Paste base64 DNA code here..."
              value={dnaInput}
              onChange={(e) => setDnaInput(e.target.value)}
            />
            <div className="dna-modal-actions">
              <button className="bio-btn" onClick={() => setShowDnaModal(false)}>
                Cancel
              </button>
              <button className="bio-btn btn-primary" onClick={handleApplyDNA}>
                Load DNA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && <div className="bio-toast">{toastMessage}</div>}
    </div>
  );
}

// Lineage Thumbnail sub-component
function LineageThumbnail({
  ancestor,
  isActive,
  onClick,
}: {
  ancestor: BiomorphGenome;
  isActive: boolean;
  onClick: () => void;
}) {
  const thumbRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (thumbRef.current) {
      const ctx = thumbRef.current.getContext('2d');
      if (ctx) {
        ctx.save();
        ctx.scale(0.38, 0.38);
        drawBiomorph(ctx, ancestor, thumbRef.current.width / 0.38, thumbRef.current.height / 0.38, 0);
        ctx.restore();
      }
    }
  }, [ancestor]);

  return (
    <div
      className={`lineage-card ${isActive ? 'active-ancestor' : ''}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick()}
      data-testid={`lineage-ancestor-${ancestor.generation}`}
      title={`Gen ${ancestor.generation}: ${ancestor.name}`}
    >
      <canvas ref={thumbRef} width={76} height={60} className="lineage-thumb-canvas" />
      <span className="lineage-gen-label">Gen {ancestor.generation}</span>
      <span className="lineage-name-label">{ancestor.name.split('·')[0]}</span>
    </div>
  );
}
