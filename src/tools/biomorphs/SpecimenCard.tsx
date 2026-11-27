import type { SpecimenCardProps } from './types';

export default function SpecimenCard({
  offspringLabel,
  specimen,
  traits,
  fitness,
  delta,
  canvasRef,
  cardTestId,
  fitnessTestId,
  onSelect,
  onLaunch,
}: SpecimenCardProps) {
  const isApex = fitness.score >= 90;

  return (
    <article
      className={`specimen-card ${isApex ? 'apex-specimen' : ''}`}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('button')) {
          onSelect(specimen);
        }
      }}
      data-testid={cardTestId}
    >
      {isApex ? <div className="apex-banner">🏆 APEX ORGANISM</div> : null}

      <div className="card-header-bar">
        <div className="specimen-tag">
          <span className="tag-badge">{offspringLabel}</span>
          <span className="specimen-name">{specimen.name}</span>
        </div>
        <button
          type="button"
          className="btn-select-champion"
          onClick={() => onSelect(specimen)}
          title={`Select ${offspringLabel} as Champion to breed next generation`}
          aria-label={`Select ${offspringLabel}: ${specimen.name} as Champion`}
        >
          👑 Select as Champion
        </button>
      </div>

      {/* Fitness & Adaptation Metrics Bar */}
      <div className="specimen-fitness-badge-row">
        <div className={`fitness-score-tag ${isApex ? 'apex-score' : ''}`}>
          <span className="fitness-icon">🌿</span>
          <span className="fitness-val" data-testid={fitnessTestId}>
            {fitness.score}% Adapted
          </span>
        </div>
        <span
          className={`adaptive-delta-badge ${delta > 0 ? 'delta-pos' : delta < 0 ? 'delta-neg' : 'delta-neu'}`}
          title="Adaptive shift relative to parent champion"
        >
          {delta > 0 ? `+${delta}% vs Parent` : delta < 0 ? `${delta}% vs Parent` : '0% vs Parent'}
        </span>
      </div>

      {/* Environmental Adaptation Diagnostics (ABOVE Canvas) */}
      <div className="adaptation-diagnostics-section">
        <span className="trait-section-label">Active Biosphere Adaptation:</span>
        <div className="adaptation-diagnostics">
          {fitness.pros.map((p, idx) => (
            <span key={`${cardTestId}-pro-${idx}`} className="diagnostic-tag tag-pro">
              {p}
            </span>
          ))}
          {fitness.cons.map((c, idx) => (
            <span key={`${cardTestId}-con-${idx}`} className="diagnostic-tag tag-con">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={400} height={300} className="specimen-canvas" />
      </div>

      {/* Mutated Traits Bar (BELOW Canvas) */}
      <div className="mutations-section">
        <span className="trait-section-label">✦ Next-Gen Mutations:</span>
        <div className="card-traits-bar">
          {traits.map((t, idx) => (
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
          onClick={() => onLaunch(specimen)}
          title={`Launch ${offspringLabel} into living biosphere`}
          aria-label={`Launch ${offspringLabel}: ${specimen.name}`}
        >
          🚀 Launch
        </button>
      </div>
    </article>
  );
}
