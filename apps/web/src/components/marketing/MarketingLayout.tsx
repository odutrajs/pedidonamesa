import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="text-lg font-semibold tracking-tight text-zinc-900">
            Pedido na Mesa
          </Link>
          <nav className="flex items-center gap-3">
            <a href="#como-funciona" className="hidden text-sm text-zinc-600 hover:text-zinc-900 sm:inline">
              Como funciona
            </a>
            <Link to="/login">
              <Button variant="primary" size="sm">
                Ver demo
              </Button>
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
