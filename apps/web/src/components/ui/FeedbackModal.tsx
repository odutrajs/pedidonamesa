import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

export type FeedbackVariant = 'success' | 'error' | 'info' | 'warning';

const variantConfig: Record<
  FeedbackVariant,
  {
    icon: LucideIcon;
    iconClass: string;
    ringClass: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    ringClass: 'bg-emerald-50 dark:bg-emerald-950/50',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-red-600 dark:text-red-400',
    ringClass: 'bg-red-50 dark:bg-red-950/50',
  },
  info: {
    icon: Info,
    iconClass: 'text-brand-600 dark:text-brand-400',
    ringClass: 'bg-brand-50 dark:bg-brand-950/50',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-600 dark:text-amber-400',
    ringClass: 'bg-amber-50 dark:bg-amber-950/50',
  },
};

export interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  variant?: FeedbackVariant;
  title: string;
  description?: string;
  confirmLabel?: string;
  onConfirm?: () => void;
  cancelLabel?: string;
  onCancel?: () => void;
  icon?: ReactNode;
  children?: ReactNode;
  closeOnBackdrop?: boolean;
}

export function FeedbackModal({
  open,
  onClose,
  variant = 'info',
  title,
  description,
  confirmLabel = 'Entendi',
  onConfirm,
  cancelLabel,
  onCancel,
  icon,
  children,
  closeOnBackdrop = true,
}: FeedbackModalProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-modal-title"
      onClick={closeOnBackdrop ? onClose : undefined}
    >
      <div
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-toast-in dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div
            className={cn(
              'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
              config.ringClass,
            )}
          >
            {icon ?? <Icon className={cn('h-6 w-6', config.iconClass)} />}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4">
          <h2
            id="feedback-modal-title"
            className="text-xl font-semibold text-zinc-900 dark:text-zinc-50"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>

        {children && <div className="mt-4">{children}</div>}

        <div className={cn('mt-6 flex gap-3', cancelLabel ? 'flex-col sm:flex-row' : '')}>
          {cancelLabel && (
            <Button variant="outline" className="flex-1" onClick={handleCancel}>
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={variant === 'error' ? 'danger' : variant === 'success' ? 'success' : 'primary'}
            className="flex-1"
            onClick={handleConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
