import { useCallback } from 'react';
import { OrderStatus, OrderItemStatus } from '@pedidonamesa/shared';
import { AppShell } from '../components/AppShell';
import { OrderCard } from '../components/kitchen/OrderCard';
import { useAuth } from '../context/AuthContext';
import {
  useKitchenOrders,
  useUpdateOrderItemStatus,
  useUpdateOrderStatus,
} from '../hooks/useKitchen';

export function KitchenPage() {
  const { logout } = useAuth();
  const { data: orders = [], isLoading } = useKitchenOrders();
  const updateOrder = useUpdateOrderStatus();
  const updateItem = useUpdateOrderItemStatus();

  const handleUpdateOrder = useCallback(
    (id: string, status: OrderStatus) => {
      updateOrder.mutate({ id, status });
    },
    [updateOrder],
  );

  const handleUpdateItem = useCallback(
    (itemId: string, status: OrderItemStatus) => {
      updateItem.mutate({ itemId, status });
    },
    [updateItem],
  );

  const isUpdating = updateOrder.isPending || updateItem.isPending;

  return (
    <AppShell
      title="Cozinha"
      subtitle={`${orders.length} pedido(s) ativo(s)`}
      actions={
        <button className="btn-secondary" onClick={logout}>
          Sair
        </button>
      }
    >
      {isLoading ? (
        <p className="text-stone-500">Carregando pedidos...</p>
      ) : orders.length === 0 ? (
        <div className="card p-8 text-center">
          <p className="text-lg font-semibold text-stone-600">Nenhum pedido na cozinha</p>
          <p className="mt-2 text-sm text-stone-500">Novos pedidos aparecem aqui automaticamente</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onUpdateOrder={handleUpdateOrder}
              onUpdateItem={handleUpdateItem}
              isUpdating={isUpdating}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
