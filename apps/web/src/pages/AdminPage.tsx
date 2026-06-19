import { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { CategoriesTab } from '../components/admin/CategoriesTab';
import { ProductsTab } from '../components/admin/ProductsTab';
import { TablesTab } from '../components/admin/TablesTab';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'categories' as const, label: 'Categorias' },
  { id: 'products' as const, label: 'Produtos' },
  { id: 'tables' as const, label: 'Mesas' },
];

export function AdminPage() {
  const { logout } = useAuth();
  const [tab, setTab] = useState<'categories' | 'products' | 'tables'>('categories');

  return (
    <AppShell
      title="Administração"
      subtitle="Cardápio, mesas e QR codes"
      actions={
        <div className="flex gap-2">
          <a className="btn-secondary" href="/cozinha">Cozinha</a>
          <button className="btn-secondary" onClick={logout}>Sair</button>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={tab === t.id ? 'btn-primary' : 'btn-secondary'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'categories' && <CategoriesTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'tables' && <TablesTab />}
    </AppShell>
  );
}
