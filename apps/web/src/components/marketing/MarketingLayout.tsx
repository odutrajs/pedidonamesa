import { Link } from 'react-router-dom';
import { ThemeToggle } from '../ui/ThemeToggle';

interface MarketingLayoutProps {
  children: React.ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.06] bg-black/70 backdrop-blur-2xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
          <Link
            to="/"
            className="text-[15px] font-semibold tracking-tight text-white/95 transition hover:text-white"
          >
            Pedido na Mesa
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="#recursos"
              className="hidden rounded-full px-3.5 py-1.5 text-[13px] text-white/60 transition hover:bg-white/5 hover:text-white sm:inline"
            >
              Recursos
            </a>
            <a
              href="#como-funciona"
              className="hidden rounded-full px-3.5 py-1.5 text-[13px] text-white/60 transition hover:bg-white/5 hover:text-white sm:inline"
            >
              Como funciona
            </a>
            <ThemeToggle
              size="sm"
              className="border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            />
            <Link
              to="/login"
              className="ml-1 rounded-full bg-[#0071e3] px-4 py-1.5 text-[13px] font-medium text-white transition hover:bg-[#0077ed]"
            >
              Ver demo
            </Link>
          </nav>
        </div>
      </header>
      <main className="pt-[52px]">{children}</main>
    </div>
  );
}
