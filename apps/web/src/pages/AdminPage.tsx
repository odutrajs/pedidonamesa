import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChefHat, LogOut } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { CategoriesTab } from '../components/admin/CategoriesTab';
import { ProductsTab } from '../components/admin/ProductsTab';
import { TablesTab } from '../components/admin/TablesTab';
import { Tabs } from '../components/ui/Tabs';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';

const TABS = [
  { id: 'categories', label: 'Categorias' },
  { id: 'products', label: 'Produtos' },
  { id: 'tables', label: 'Mesas' },
];

export function AdminPage() {
  const { logout } = useAuth();
  const [tab, setTab] = useState('categories');

  return (
    <AppShell
      title="Administração"
      subtitle="Cardápio, mesas e QR codes"
      actions={
        <>
          <Link to="/cozinha">
            <Button variant="outline" size="sm">
              <ChefHat className="h-4 w-4" />
              Cozinha
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </>
      }
    >
      <Tabs tabs={TABS} activeTab={tab} onChange={setTab} className="mb-8" />

      {tab === 'categories' && <CategoriesTab />}
      {tab === 'products' && <ProductsTab />}
      {tab === 'tables' && <TablesTab />}
    </AppShell>
  );
}
