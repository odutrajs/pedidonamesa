import { memo } from 'react';
import {
  ORDER_ITEM_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  OrderDto,
  OrderItemStatus,
  OrderStatus,
} from '@pedidonamesa/shared';
import { Check, Circle, Clock } from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '../../lib/utils';
import { ORDER_STATUS_ACCENT, ORDER_STATUS_BADGE } from '../../lib/status-colors';
import { cn } from '../../lib/cn';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

function ItemStatusIcon({ status }: { status: OrderItemStatus }) {
  if (status === OrderItemStatus.DELIVERED) {
    return <Check className="h-4 w-4 text-emerald-600" />;
  }
  if (status === OrderItemStatus.READY) {
    return <Check className="h-4 w-4 text-emerald-500" />;
  }
  if (status === OrderItemStatus.PREPARING) {
    return <Clock className="h-4 w-4 text-orange-500" />;
  }
  return <Circle className="h-4 w-4 text-zinc-300" />;
}

interface OrderCardProps {
  order: OrderDto;
  onUpdateOrder: (id: string, status: OrderStatus) => void;
  onUpdateItem: (itemId: string, status: OrderItemStatus) => void;
  isUpdating: boolean;
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

  return (
    <article
      className={cn(
        'overflow-hidden rounded-xl border border-zinc-200 border-l-4 bg-white',
        ORDER_STATUS_ACCENT[order.status],
      )}
    >
      <div className="border-b border-zinc-100 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-zinc-900">{tableName}</h2>
            <p className="mt-0.5 text-sm text-zinc-500">
              {formatRelativeTime(order.createdAt)} · {ORDER_STATUS_LABELS[order.status]}
            </p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-zinc-900">{formatCurrency(order.total)}</p>
            <Badge variant={ORDER_STATUS_BADGE[order.status]} className="mt-1">
              {ORDER_STATUS_LABELS[order.status]}
            </Badge>
          </div>
        </div>

        {order.notes && (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 ring-1 ring-amber-200">
            Obs: {order.notes}
          </p>
        )}
      </div>

      <ul className="divide-y divide-zinc-100 px-4">
        {order.items.map((item) => (
          <li key={item.id} className="flex items-start justify-between gap-3 py-3">
            <div className="flex gap-3">
              <div className="mt-0.5">
                <ItemStatusIcon status={item.status} />
              </div>
              <div>
                <p className="font-medium text-zinc-900">
                  {item.quantity}x {item.productName}
                </p>
                {item.notes && (
                  <p className="mt-0.5 text-sm text-zinc-500">Obs: {item.notes}</p>
                )}
                <p className="mt-0.5 text-xs text-zinc-400">
                  {ORDER_ITEM_STATUS_LABELS[item.status]}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              {item.status === OrderItemStatus.PENDING && (
                <Button
                  variant="outline"
                  size="sm"
                  className="min-h-[44px]"
                  disabled={isUpdating}
                  onClick={() => onUpdateItem(item.id, OrderItemStatus.PREPARING)}
                >
                  Preparar
                </Button>
              )}
              {item.status === OrderItemStatus.PREPARING && (
                <Button
                  variant="success"
                  size="sm"
                  className="min-h-[44px]"
                  disabled={isUpdating}
                  onClick={() => onUpdateItem(item.id, OrderItemStatus.READY)}
                >
                  Pronto
                </Button>
              )}
              {item.status === OrderItemStatus.READY && (
                <Button
                  variant="primary"
                  size="sm"
                  className="min-h-[44px]"
                  disabled={isUpdating}
                  onClick={() => onUpdateItem(item.id, OrderItemStatus.DELIVERED)}
                >
                  Entregue
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2 border-t border-zinc-100 p-4">
        {order.status === OrderStatus.PENDING && (
          <Button
            variant="outline"
            className="min-h-[44px]"
            disabled={isUpdating}
            onClick={() => onUpdateOrder(order.id, OrderStatus.CONFIRMED)}
          >
            Confirmar
          </Button>
        )}
        {(order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) && (
          <Button
            variant="primary"
            className="min-h-[44px]"
            disabled={isUpdating}
            onClick={() => onUpdateOrder(order.id, OrderStatus.PREPARING)}
          >
            Iniciar preparo
          </Button>
        )}
        {order.status === OrderStatus.PREPARING && (
          <Button
            variant="success"
            className="min-h-[44px]"
            disabled={isUpdating}
            onClick={() => onUpdateOrder(order.id, OrderStatus.READY)}
          >
            Tudo pronto
          </Button>
        )}
        {order.status === OrderStatus.READY && (
          <Button
            variant="primary"
            className="min-h-[44px]"
            disabled={isUpdating}
            onClick={() => onUpdateOrder(order.id, OrderStatus.DELIVERED)}
          >
            Entregue na mesa
          </Button>
        )}
        {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED && (
          <Button
            variant="danger"
            className="min-h-[44px]"
            disabled={isUpdating}
            onClick={() => onUpdateOrder(order.id, OrderStatus.CANCELLED)}
          >
            Cancelar
          </Button>
        )}
      </div>
    </article>
  );
});
