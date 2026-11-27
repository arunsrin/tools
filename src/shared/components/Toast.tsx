import type { ToastProps } from './types';
import './Toast.css';

export default function Toast({
  message,
  visible = true,
  variant = 'info',
  onDismiss,
  className = '',
}: ToastProps) {
  if (!visible) {
    return null;
  }

  const isError = variant === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`shared-toast shared-toast--${variant} ${className}`.trim()}
    >
      <span className="shared-toast-message">{message}</span>
      {onDismiss ? (
        <button
          type="button"
          className="shared-toast-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          ✕
        </button>
      ) : null}
    </div>
  );
}
