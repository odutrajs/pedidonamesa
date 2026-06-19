import { memo, useMemo, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import {
  KITCHEN_ACTIVE_STATUSES,
  ORDER_STATUS_LABELS,
  OrderDto,
  OrderStatus,
} from '@pedidonamesa/shared';
import { useOrders } from '../../hooks/useAdmin';
import { formatCurrency, formatDateTime } from '../../lib/utils';
import { ORDER_STATUS_BADGE } from '../../lib/status-colors';
import { Tabs } from '../ui/Tabs';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';

const FILTERS = [
  { id: 'all', label: 'Todos' },
  { id: 'active', label: 'Em andamento' },
  { id: 'delivered', label: 'Entregues' },
  { id: 'cancelled', label: 'Cancelados' },
];

function filterOrders(orders: OrderDto[], filter: string) {
  switch (filter) {
    case 'active':
      return orders.filter((order) => KITCHEN_ACTIVE_STATUSES.includes(order.status));
    case 'delivered':
      return orders.filter((order) => order.status === OrderStatus.DELIVERED);
    case 'cancelled':
      return orders.filter((order) => order.status === OrderStatus.CANCELLED);
    default:
      return orders;
  }
}

function summarizeItems(order: OrderDto) {
  return order.items
    .map((item) => `${item.quantity}x ${item.productName}`)
    .join(', ');
}

const OrderRow = memo(function OrderRow({ order }: { order: OrderDto }) {
  const tableName = order.tableLabel
    ? `Mesa ${order.tableNumber} — ${order.tableLabel}`
    : `Mesa ${order.tableNumber}`;

  return (
    <li className="px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">{tableName}</p>
            <Badge variant={ORDER_STATUS_BADGE[order.status]}>
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{formatDateTime(order.createdAt)}</p>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{summarizeItems(order)}</p>
          {order.notes && (
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">
              <span className="font-medium">Obs:</span> {order.notes}
            </p>
          )}
        </div>
        <p className="text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          {formatCurrency(order.total)}
        </p>
      </div>
    </li>
  );
});

export const OrdersTab = memo(function OrdersTab() {
  const { data: orders = [], isLoading } = useOrders();
  const [filter, setFilter] = useState('all');

  const filteredOrders = useMemo(
    () => filterOrders(orders, filter),
    [orders, filter],
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-full max-w-md" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Pedidos</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Histórico de pedidos feitos pelas mesas do restaurante.
        </p>
      </div>

      <Tabs tabs={FILTERS} activeTab={filter} onChange={setFilter} />

      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="h-5 w-5" />}
          title="Nenhum pedido encontrado"
          description={
            filter === 'all'
              ? 'Os pedidos das mesas aparecerão aqui assim que forem enviados.'
              : 'Nenhum pedido neste filtro no momento.'
          }
          className="rounded-xl border border-zinc-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-900"
        />
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {filteredOrders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </ul>
      )}
    </div>
  );
});
