import { useCallback } from 'react';
import { ChefHat, LogOut } from 'lucide-react';
import { OrderStatus, OrderItemStatus } from '@pedidonamesa/shared';
import { AppShell } from '../components/AppShell';
import { OrderCard } from '../components/kitchen/OrderCard';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
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
        <Button variant="ghost" size="sm" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sair
        </Button>
      }
    >
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ChefHat className="h-5 w-5 animate-pulse" />}
          title="Aguardando pedidos..."
          description="Novos pedidos aparecem aqui automaticamente em tempo real."
          className="rounded-xl border border-zinc-200 bg-white py-16"
        />
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
