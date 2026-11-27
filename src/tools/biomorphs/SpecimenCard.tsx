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
      className={`biomorphs-specimen-card ${isApex ? 'biomorphs-apex-specimen' : ''}`}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('button')) {
          onSelect(specimen);
        }
      }}
      data-testid={cardTestId}
    >
      {isApex ? <div className="biomorphs-apex-banner">🏆 APEX ORGANISM</div> : null}

      <div className="biomorphs-card-header-bar">
        <div className="biomorphs-specimen-tag">
          <span className="biomorphs-tag-badge">{offspringLabel}</span>
          <span className="biomorphs-specimen-name">{specimen.name}</span>
        </div>
        <button
          type="button"
          className="biomorphs-btn-select-champion"
          onClick={() => onSelect(specimen)}
          title={`Select ${offspringLabel} as Champion to breed next generation`}
          aria-label={`Select ${offspringLabel}: ${specimen.name} as Champion`}
        >
          👑 Select as Champion
        </button>
      </div>

      {/* Fitness & Adaptation Metrics Bar */}
      <div className="biomorphs-specimen-fitness-badge-row">
        <div className={`biomorphs-fitness-score-tag ${isApex ? 'biomorphs-apex-score' : ''}`}>
          <span className="biomorphs-fitness-icon">🌿</span>
          <span className="biomorphs-fitness-val" data-testid={fitnessTestId}>
            {fitness.score}% Adapted
          </span>
        </div>
        <span
          className={`biomorphs-adaptive-delta-badge ${
            delta > 0 ? 'biomorphs-delta-pos' : delta < 0 ? 'biomorphs-delta-neg' : 'biomorphs-delta-neu'
          }`}
          title="Adaptive shift relative to parent champion"
        >
          {delta > 0 ? `+${delta}% vs Parent` : delta < 0 ? `${delta}% vs Parent` : '0% vs Parent'}
        </span>
      </div>

      {/* Environmental Adaptation Diagnostics (ABOVE Canvas) */}
      <div className="biomorphs-adaptation-diagnostics-section">
        <span className="biomorphs-trait-section-label">Active Biosphere Adaptation:</span>
        <div className="biomorphs-adaptation-diagnostics">
          {fitness.pros.map((p, idx) => (
            <span key={`${cardTestId}-pro-${idx}`} className="biomorphs-diagnostic-tag biomorphs-tag-pro">
              {p}
            </span>
          ))}
          {fitness.cons.map((c, idx) => (
            <span key={`${cardTestId}-con-${idx}`} className="biomorphs-diagnostic-tag biomorphs-tag-con">
              {c}
            </span>
          ))}
        </div>
      </div>

      <div className="biomorphs-canvas-wrapper">
        <canvas ref={canvasRef} width={400} height={300} className="biomorphs-specimen-canvas" />
      </div>

      {/* Mutated Traits Bar (BELOW Canvas) */}
      <div className="biomorphs-mutations-section">
        <span className="biomorphs-trait-section-label">✦ Next-Gen Mutations:</span>
        <div className="biomorphs-card-traits-bar">
          {traits.map((t, idx) => (
            <span key={idx} className="biomorphs-trait-pill">
              ✦ {t}
            </span>
          ))}
        </div>
      </div>

      <div className="biomorphs-card-action-footer">
        <span className="biomorphs-card-click-hint">Click card to select</span>
        <button
          type="button"
          className="biomorphs-btn-launch-specimen"
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
