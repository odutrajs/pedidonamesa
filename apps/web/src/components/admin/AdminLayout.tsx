import { Link, Outlet } from 'react-router-dom';
import { ChefHat, LogOut } from 'lucide-react';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useRestaurantSettings } from '../../hooks/useSettings';

export function AdminLayout() {
  const { logout } = useAuth();
  const { data: settings } = useRestaurantSettings();

  return (
    <div className="flex min-h-screen bg-[#f4f4f5] dark:bg-zinc-950">
      <AdminSidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-background px-6 py-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {settings?.name ?? 'Restaurante'} / Administração
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
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
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
