import { Link, Outlet } from 'react-router-dom';
import { ChefHat, LogOut } from 'lucide-react';
import { AppShell } from '../AppShell';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

export function AdminLayout() {
  const { logout } = useAuth();

  return (
    <AppShell
      title="Administração"
      subtitle="Gerencie pedidos, cardápio e operação do restaurante"
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
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <AdminSidebar />
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </AppShell>
  );
}
