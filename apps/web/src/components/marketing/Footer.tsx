import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-black py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-5 md:flex-row md:px-8">
        <div className="text-center md:text-left">
          <p className="font-semibold tracking-tight text-white">Pedido na Mesa</p>
          <p className="mt-1 text-[13px] text-white/35">
            Pedidos por QR para restaurantes
          </p>
        </div>
        <nav className="flex items-center gap-8 text-[13px] text-white/45">
          <a href="#recursos" className="transition hover:text-white/80">
            Recursos
          </a>
          <a href="#como-funciona" className="transition hover:text-white/80">
            Como funciona
          </a>
          <Link to="/login" className="transition hover:text-white/80">
            Entrar
          </Link>
        </nav>
        <p className="text-[12px] text-white/25">
          © {new Date().getFullYear()} Pedido na Mesa
        </p>
      </div>
    </footer>
  );
}
