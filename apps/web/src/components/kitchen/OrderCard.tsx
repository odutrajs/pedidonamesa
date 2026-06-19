import { memo } from 'react';
import {
  ORDER_ITEM_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  OrderDto,
  OrderItemStatus,
  OrderStatus,
} from '@pedidonamesa/shared';
import { Clock } from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '../../lib/utils';
import {
  ORDER_ITEM_STATUS_BADGE,
  ORDER_STATUS_ACCENT,
  ORDER_STATUS_BADGE,
} from '../../lib/status-colors';
import { cn } from '../../lib/cn';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface OrderCardProps {
  order: OrderDto;
  onUpdateOrder: (id: string, status: OrderStatus) => void;
  onUpdateItem: (itemId: string, status: OrderItemStatus) => void;
  isUpdating: boolean;
}

function getPrimaryOrderAction(status: OrderStatus) {
  switch (status) {
    case OrderStatus.PENDING:
    case OrderStatus.CONFIRMED:
      return { label: 'Iniciar preparo', next: OrderStatus.PREPARING, variant: 'primary' as const };
    case OrderStatus.PREPARING:
      return { label: 'Tudo pronto', next: OrderStatus.READY, variant: 'success' as const };
    case OrderStatus.READY:
      return { label: 'Entregue na mesa', next: OrderStatus.DELIVERED, variant: 'primary' as const };
    default:
      return null;
  }
}

function getItemAction(status: OrderItemStatus) {
  switch (status) {
    case OrderItemStatus.PENDING:
      return { label: 'Preparar', next: OrderItemStatus.PREPARING, variant: 'outline' as const };
    case OrderItemStatus.PREPARING:
      return { label: 'Pronto', next: OrderItemStatus.READY, variant: 'success' as const };
    case OrderItemStatus.READY:
      return { label: 'Entregue', next: OrderItemStatus.DELIVERED, variant: 'primary' as const };
    default:
      return null;
  }
}

export const OrderCard = memo(function OrderCard({
  order,
  onUpdateOrder,
  onUpdateItem,
  isUpdating,
}: OrderCardProps) {
  const tableName = order.tableLabel
    ? `Mesa ${order.tableNumber} — ${order.tableLabel}`
    : `Mesa ${order.tableNumber}`;

  const primaryAction = getPrimaryOrderAction(order.status);
  const canCancel =
    order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED;

  return (
    <article
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 border-l-4 bg-white shadow-xs dark:border-zinc-800 dark:bg-zinc-900',
        ORDER_STATUS_ACCENT[order.status],
      )}
    >
      <header className="border-b border-zinc-100 px-4 py-4 dark:border-zinc-800">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{tableName}</h2>
              <Badge variant={ORDER_STATUS_BADGE[order.status]}>
                {ORDER_STATUS_LABELS[order.status]}
              </Badge>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {formatRelativeTime(order.createdAt)}
            </p>
          </div>
          <p className="shrink-0 text-lg font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            {formatCurrency(order.total)}
          </p>
        </div>

        {order.notes && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900 ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800">
            <span className="font-semibold">Obs:</span> {order.notes}
          </p>
        )}
      </header>

      <ul className="flex-1 divide-y divide-zinc-100 dark:divide-zinc-800">
        {order.items.map((item) => {
          const itemAction = getItemAction(item.status);

          return (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-sm font-bold text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                {item.quantity}x
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-medium leading-snug text-zinc-900 dark:text-zinc-50">{item.productName}</p>
                {item.notes && (
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    <span className="font-medium text-zinc-600 dark:text-zinc-300">Obs:</span> {item.notes}
                  </p>
                )}
                <Badge
                  variant={ORDER_ITEM_STATUS_BADGE[item.status]}
                  className="mt-1.5"
                >
                  {ORDER_ITEM_STATUS_LABELS[item.status]}
                </Badge>
              </div>

              {itemAction && (
                <Button
                  variant={itemAction.variant}
                  size="sm"
                  className="min-h-[40px] shrink-0 px-3"
                  disabled={isUpdating}
                  onClick={() => onUpdateItem(item.id, itemAction.next)}
                >
                  {itemAction.label}
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      {primaryAction && (
        <footer className="mt-auto border-t border-zinc-100 bg-zinc-50/80 p-4 dark:border-zinc-800 dark:bg-zinc-800/50">
          <div className="flex flex-col gap-2">
            <Button
              variant={primaryAction.variant}
              className="min-h-[44px] w-full"
              disabled={isUpdating}
              onClick={() => onUpdateOrder(order.id, primaryAction.next)}
            >
              {primaryAction.label}
            </Button>

            {canCancel && (
              <Button
                variant="outline"
                className="min-h-[44px] w-full border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:border-red-800 dark:hover:bg-red-950"
                disabled={isUpdating}
                onClick={() => onUpdateOrder(order.id, OrderStatus.CANCELLED)}
              >
                Cancelar pedido
              </Button>
            )}
          </div>
        </footer>
      )}
    </article>
  );
});
