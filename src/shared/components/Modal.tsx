import { useEffect, useId, useRef, type CSSProperties } from 'react';
import type { ModalProps } from './types';
import './Modal.css';

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  closeLabel = 'Close dialog',
  maxWidth = '500px',
  className = '',
}: ModalProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    if (dialogRef.current && !dialogRef.current.contains(document.activeElement)) {
      dialogRef.current.focus();
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      const previous = previousFocusRef.current;
      previousFocusRef.current = null;
      if (previous && previous.isConnected) {
        previous.focus();
      }
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const dialogStyle = { '--shared-modal-max-width': maxWidth } as CSSProperties;

  return (
    <div
      className="shared-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`shared-modal-dialog ${className}`.trim()}
        style={dialogStyle}
      >
        <div className="shared-modal-header">
          <h2 id={titleId} className="shared-modal-title">
            {title}
          </h2>
          <button
            type="button"
            className="shared-modal-close"
            onClick={onClose}
            aria-label={closeLabel}
          >
            ✕
          </button>
        </div>
        <div className="shared-modal-body">{children}</div>
      </div>
    </div>
  );
}
