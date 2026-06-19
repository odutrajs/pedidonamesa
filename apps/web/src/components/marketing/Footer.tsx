import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 sm:flex-row">
        <div>
          <p className="font-semibold text-zinc-900">Pedido na Mesa</p>
          <p className="mt-1 text-sm text-zinc-500">Pedidos por QR para restaurantes</p>
        </div>
        <nav className="flex items-center gap-6 text-sm text-zinc-600">
          <a href="#como-funciona" className="hover:text-zinc-900">
            Como funciona
          </a>
          <Link to="/login" className="hover:text-zinc-900">
            Entrar
          </Link>
        </nav>
        <p className="text-xs text-zinc-400">
          © {new Date().getFullYear()} Pedido na Mesa
        </p>
      </div>
    </footer>
  );
}
