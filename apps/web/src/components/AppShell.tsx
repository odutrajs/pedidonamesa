import { Link } from 'react-router-dom';

export function AppShell({
  title,
  subtitle,
  children,
  actions,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <Link to="/" className="text-lg font-bold text-brand-700">Pedido na Mesa</Link>
            <h1 className="text-xl font-bold">{title}</h1>
            {subtitle && <p className="text-sm text-stone-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
