import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose?: () => void;
  variant?: 'success' | 'error';
  duration?: number;
}

export function Toast({
  message,
  visible,
  onClose,
  variant = 'success',
  duration = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!visible || !onClose || duration <= 0) return;

    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [visible, onClose, duration]);

  if (!visible) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:top-6"
      role="alert"
      aria-live="polite"
    >
      <div
        className={cn(
          'pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl border px-4 py-3 shadow-lg animate-toast-in sm:max-w-md',
          variant === 'success'
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-100'
            : 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
        )}
      >
        {variant === 'success' ? (
          <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
        )}
        <p className="min-w-0 flex-1 text-sm font-medium leading-snug">{message}</p>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1 text-current opacity-60 transition hover:opacity-100"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
