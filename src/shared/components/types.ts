import type { ReactNode } from 'react';

export interface ToolHeaderProps {
  onBack: () => void;
  title: string;
  badge?: string;
  subtitle?: string;
  actions?: ReactNode;
  backLabel?: string;
  className?: string;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  closeLabel?: string;
  maxWidth?: string;
  className?: string;
}

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: ReactNode;
  disabled?: boolean;
  ariaLabel?: string;
}

export interface SegmentedControlProps<T extends string = string> {
  options: readonly SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  mode?: 'group' | 'tablist';
  className?: string;
}

export type AlertVariant = 'error' | 'warning' | 'success' | 'info';

export interface InlineAlertProps {
  message: ReactNode;
  variant?: AlertVariant;
  onDismiss?: () => void;
  className?: string;
}

export interface ToastProps {
  message: ReactNode;
  visible?: boolean;
  variant?: AlertVariant;
  onDismiss?: () => void;
  className?: string;
}

export interface ToolErrorBoundaryProps {
  children: ReactNode;
  onBack: () => void;
  toolName?: string;
  resetKey?: string;
}
