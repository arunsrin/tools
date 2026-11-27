import type { ToolHeaderProps } from './types';
import './ToolHeader.css';

export default function ToolHeader({
  onBack,
  title,
  badge,
  subtitle,
  actions,
  backLabel = '← Back to Tools Hub',
  className = '',
}: ToolHeaderProps) {
  return (
    <header className={`shared-tool-header ${className}`.trim()}>
      <div className="shared-tool-header-top">
        <button
          type="button"
          className="shared-tool-back-btn"
          onClick={onBack}
        >
          {backLabel}
        </button>
        {actions ? (
          <div className="shared-tool-header-actions">{actions}</div>
        ) : null}
      </div>

      <div className="shared-tool-header-main">
        {badge ? <span className="shared-tool-badge">{badge}</span> : null}
        <h1 className="shared-tool-title">{title}</h1>
        {subtitle ? <p className="shared-tool-subtitle">{subtitle}</p> : null}
      </div>
    </header>
  );
}
