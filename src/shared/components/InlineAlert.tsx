import type { InlineAlertProps } from './types';
import './InlineAlert.css';

export default function InlineAlert({
  message,
  variant = 'error',
  onDismiss,
  className = '',
}: InlineAlertProps) {
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`shared-inline-alert shared-inline-alert--${variant} ${className}`.trim()}
    >
      <div className="shared-inline-alert-content">{message}</div>
      {onDismiss ? (
        <button
          type="button"
          className="shared-inline-alert-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss alert"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
