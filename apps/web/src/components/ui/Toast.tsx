import { CheckCircle2, X } from 'lucide-react';
import { cn } from '../../lib/cn';

interface ToastProps {
  message: string;
  visible: boolean;
  onClose?: () => void;
  variant?: 'success' | 'error';
}

export function Toast({ message, visible, onClose, variant = 'success' }: ToastProps) {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'fixed left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-3 rounded-xl border px-4 py-3 shadow-lg animate-slide-down',
        variant === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-800',
      )}
      role="alert"
    >
      {variant === 'success' ? (
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
      ) : null}
      <p className="text-sm font-medium">{message}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 rounded-md p-0.5 opacity-70 hover:opacity-100"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
