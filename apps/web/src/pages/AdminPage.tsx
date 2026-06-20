import { Navigate, Route, Routes } from 'react-router-dom';
import type { RestaurantSettingsDto } from '@pedidonamesa/shared';
import { AdminLayout } from '../components/admin/AdminLayout';
import { OrdersTab } from '../components/admin/OrdersTab';
import { CategoriesTab } from '../components/admin/CategoriesTab';
import { ProductsTab } from '../components/admin/ProductsTab';
import { TablesTab } from '../components/admin/TablesTab';
import { DeliveryTab } from '../components/admin/DeliveryTab';
import { WhatsAppTab } from '../components/admin/WhatsAppTab';
import { CarrinhoTab } from '../components/admin/CarrinhoTab';
import { EstoqueTab } from '../components/admin/EstoqueTab';
import { FinanceiroTab } from '../components/admin/FinanceiroTab';
import { useRestaurantSettings } from '../hooks/useSettings';

function FeatureRoute({
  feature,
  children,
}: {
  feature: keyof Pick<
    RestaurantSettingsDto,
    'inventoryEnabled' | 'financeEnabled' | 'whatsappEnabled' | 'deliveryEnabled'
  >;
  children: React.ReactNode;
}) {
  const { data: settings, isLoading } = useRestaurantSettings();

  if (isLoading) return null;
  if (settings && !settings[feature]) {
    return <Navigate to="/admin/pedidos" replace />;
  }

  return <>{children}</>;
}

export function AdminPage() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="pedidos" replace />} />
        <Route path="pedidos" element={<OrdersTab />} />
        <Route path="cardapio/categorias" element={<CategoriesTab />} />
        <Route path="cardapio/produtos" element={<ProductsTab />} />
        <Route path="cardapio/mesas" element={<TablesTab />} />
        <Route
          path="cardapio/delivery"
          element={
            <FeatureRoute feature="deliveryEnabled">
              <DeliveryTab />
            </FeatureRoute>
          }
        />
        <Route
          path="whatsapp"
          element={
            <FeatureRoute feature="whatsappEnabled">
              <WhatsAppTab />
            </FeatureRoute>
          }
        />
        <Route path="carrinho" element={<CarrinhoTab />} />
        <Route
          path="estoque"
          element={
            <FeatureRoute feature="inventoryEnabled">
              <EstoqueTab />
            </FeatureRoute>
          }
        />
        <Route
          path="financeiro"
          element={
            <FeatureRoute feature="financeEnabled">
              <FinanceiroTab />
            </FeatureRoute>
          }
        />
        <Route path="*" element={<Navigate to="pedidos" replace />} />
      </Route>
    </Routes>
  );
}
