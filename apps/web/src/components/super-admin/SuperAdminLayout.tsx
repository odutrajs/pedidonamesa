import { Link, Outlet } from 'react-router-dom';
import { Building2, LogOut } from 'lucide-react';
import { AppShell } from '../AppShell';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

export function SuperAdminLayout() {
  const { logout } = useAuth();

  return (
    <AppShell
      title="Plataforma"
      subtitle="Gerencie restaurantes, funcionalidades e acessos"
      actions={
        <>
          <Link to="/super-admin">
            <Button variant="outline" size="sm">
              <Building2 className="h-4 w-4" />
              Restaurantes
            </Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </>
      }
    >
      <Outlet />
    </AppShell>
  );
}
