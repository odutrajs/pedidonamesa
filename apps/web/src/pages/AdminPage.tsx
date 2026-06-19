import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../components/admin/AdminLayout';
import { OrdersTab } from '../components/admin/OrdersTab';
import { CategoriesTab } from '../components/admin/CategoriesTab';
import { ProductsTab } from '../components/admin/ProductsTab';
import { TablesTab } from '../components/admin/TablesTab';
import { DeliveryTab } from '../components/admin/DeliveryTab';
import { CarrinhoTab } from '../components/admin/CarrinhoTab';
import { FinanceiroTab } from '../components/admin/FinanceiroTab';

export function AdminPage() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Navigate to="pedidos" replace />} />
        <Route path="pedidos" element={<OrdersTab />} />
        <Route path="cardapio/categorias" element={<CategoriesTab />} />
        <Route path="cardapio/produtos" element={<ProductsTab />} />
        <Route path="cardapio/mesas" element={<TablesTab />} />
        <Route path="cardapio/delivery" element={<DeliveryTab />} />
        <Route path="carrinho" element={<CarrinhoTab />} />
        <Route path="financeiro" element={<FinanceiroTab />} />
        <Route path="*" element={<Navigate to="pedidos" replace />} />
      </Route>
    </Routes>
  );
}
