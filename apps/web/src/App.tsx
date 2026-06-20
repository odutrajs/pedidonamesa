import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';

const LoginPage = lazy(() =>
  import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const TableMenuPage = lazy(() =>
  import('./pages/TableMenuPage').then((m) => ({ default: m.TableMenuPage })),
);
const DeliveryMenuPage = lazy(() =>
  import('./pages/DeliveryMenuPage').then((m) => ({ default: m.DeliveryMenuPage })),
);
const KitchenPage = lazy(() =>
  import('./pages/KitchenPage').then((m) => ({ default: m.KitchenPage })),
);
const AdminPage = lazy(() =>
  import('./pages/AdminPage').then((m) => ({ default: m.AdminPage })),
);

const SuperAdminPage = lazy(() =>
  import('./pages/SuperAdminPage').then((m) => ({ default: m.SuperAdminPage })),
);

const PageLoader = () => (
  <div className="flex min-h-[40vh] items-center justify-center text-zinc-500 dark:text-zinc-400">
    Carregando...
  </div>
);

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/mesa/:token" element={<TableMenuPage />} />
            <Route path="/entrega/:slug" element={<DeliveryMenuPage />} />

            <Route element={<ProtectedRoute roles={['ADMIN', 'KITCHEN', 'WAITER']} />}>
              <Route path="/cozinha" element={<KitchenPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={['ADMIN']} />}>
              <Route path="/admin/*" element={<AdminPage />} />
            </Route>

            <Route element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
              <Route path="/super-admin/*" element={<SuperAdminPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
