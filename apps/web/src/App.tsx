import { Suspense, lazy } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShellSkeleton } from './components/AppShellSkeleton';
import { MenuPageSkeleton } from './components/menu/MenuPageSkeleton';
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

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/login"
            element={
              <Suspense fallback={<AppShellSkeleton variant="login" />}>
                <LoginPage />
              </Suspense>
            }
          />
          <Route
            path="/mesa/:token"
            element={
              <Suspense fallback={<MenuPageSkeleton />}>
                <TableMenuPage />
              </Suspense>
            }
          />
          <Route
            path="/entrega/:slug"
            element={
              <Suspense fallback={<MenuPageSkeleton />}>
                <DeliveryMenuPage />
              </Suspense>
            }
          />

          <Route element={<ProtectedRoute roles={['ADMIN', 'KITCHEN', 'WAITER']} />}>
            <Route
              path="/cozinha"
              element={
                <Suspense fallback={<AppShellSkeleton variant="grid" />}>
                  <KitchenPage />
                </Suspense>
              }
            />
          </Route>

          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route
              path="/admin/*"
              element={
                <Suspense fallback={<AppShellSkeleton variant="sidebar" />}>
                  <AdminPage />
                </Suspense>
              }
            />
          </Route>

          <Route element={<ProtectedRoute roles={['SUPER_ADMIN']} />}>
            <Route
              path="/super-admin/*"
              element={
                <Suspense fallback={<AppShellSkeleton variant="content" />}>
                  <SuperAdminPage />
                </Suspense>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
