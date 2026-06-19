import { Link } from 'react-router-dom';
import { AppShell } from '../components/AppShell';

export function HomePage() {
  return (
    <AppShell title="Bem-vindo" subtitle="Sistema de pedidos por mesa">
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/login" className="card p-6 hover:border-brand-500">
          <h2 className="text-lg font-bold">Admin / Cozinha</h2>
          <p className="mt-2 text-sm text-stone-600">
            Login para gerenciar cardápio, mesas e ver pedidos na cozinha.
          </p>
        </Link>
        <div className="card p-6">
          <h2 className="text-lg font-bold">Cliente na mesa</h2>
          <p className="mt-2 text-sm text-stone-600">
            O cliente acessa via QR Code: <code className="text-xs">/mesa/&lt;token&gt;</code>
          </p>
        </div>
        <div className="card p-6">
          <h2 className="text-lg font-bold">Fluxo</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-4 text-sm text-stone-600">
            <li>Cliente escaneia QR e pede</li>
            <li>Cozinha recebe em tempo real</li>
            <li>Prepara e marca como pronto</li>
            <li>Garçom entrega na mesa</li>
          </ol>
        </div>
      </div>
    </AppShell>
  );
}
