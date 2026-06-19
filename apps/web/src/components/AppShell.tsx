import { Link } from 'react-router-dom';
import { cn } from '../lib/cn';
import { ThemeToggle } from './ui/ThemeToggle';

export function AppShell({
  title,
  subtitle,
  children,
  actions,
  variant = 'default',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  variant?: 'default' | 'minimal';
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div className="min-w-0">
            {variant === 'default' && (
              <Link
                to="/"
                className="text-sm font-medium text-zinc-500 transition hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400"
              >
                Pedido na Mesa
              </Link>
            )}
            <h1
              className={cn(
                'font-semibold tracking-tight text-zinc-900 dark:text-zinc-50',
                variant === 'default' ? 'text-xl' : 'text-2xl',
              )}
            >
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {actions}
            <ThemeToggle size="sm" />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
