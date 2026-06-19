import { memo } from 'react';
import {
  ORDER_ITEM_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  OrderDto,
  OrderItemStatus,
  OrderStatus,
} from '@pedidonamesa/shared';
import { formatCurrency, formatTime } from '../../lib/utils';

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-amber-100 text-amber-900 border-amber-300',
  [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-900 border-blue-300',
  [OrderStatus.PREPARING]: 'bg-orange-100 text-orange-900 border-orange-300',
  [OrderStatus.READY]: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  [OrderStatus.DELIVERED]: 'bg-stone-100 text-stone-600 border-stone-300',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-900 border-red-300',
};

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
    <article className={`card border-2 p-4 ${STATUS_COLORS[order.status]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">{tableName}</h2>
          <p className="text-sm opacity-80">
            {formatTime(order.createdAt)} · {ORDER_STATUS_LABELS[order.status]}
          </p>
        </div>
        <p className="text-xl font-bold">{formatCurrency(order.total)}</p>
      </div>

      {order.notes && (
        <p className="mt-3 rounded-lg bg-white/60 px-3 py-2 text-sm font-medium">
          Obs: {order.notes}
        </p>
      )}

      <ul className="mt-4 space-y-2">
        {order.items.map((item) => (
          <li key={item.id} className="rounded-xl bg-white/70 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">
                  {item.quantity}x {item.productName}
                </p>
                {item.notes && <p className="text-sm text-stone-600">Obs: {item.notes}</p>}
                <p className="text-xs text-stone-500">{ORDER_ITEM_STATUS_LABELS[item.status]}</p>
              </div>
              <div className="flex flex-wrap gap-1">
                {item.status === OrderItemStatus.PENDING && (
                  <button
                    className="btn-secondary px-2 py-1 text-xs"
                    disabled={isUpdating}
                    onClick={() => onUpdateItem(item.id, OrderItemStatus.PREPARING)}
                  >
                    Preparar
                  </button>
                )}
                {item.status === OrderItemStatus.PREPARING && (
                  <button
                    className="btn-success px-2 py-1 text-xs"
                    disabled={isUpdating}
                    onClick={() => onUpdateItem(item.id, OrderItemStatus.READY)}
                  >
                    Pronto
                  </button>
                )}
                {item.status === OrderItemStatus.READY && (
                  <button
                    className="btn-primary px-2 py-1 text-xs"
                    disabled={isUpdating}
                    onClick={() => onUpdateItem(item.id, OrderItemStatus.DELIVERED)}
                  >
                    Entregue
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap gap-2">
        {order.status === OrderStatus.PENDING && (
          <button
            className="btn-secondary"
            disabled={isUpdating}
            onClick={() => onUpdateOrder(order.id, OrderStatus.CONFIRMED)}
          >
            Confirmar
          </button>
        )}
        {(order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) && (
          <button
            className="btn-primary"
            disabled={isUpdating}
            onClick={() => onUpdateOrder(order.id, OrderStatus.PREPARING)}
          >
            Iniciar preparo
          </button>
        )}
        {order.status === OrderStatus.PREPARING && (
          <button
            className="btn-success"
            disabled={isUpdating}
            onClick={() => onUpdateOrder(order.id, OrderStatus.READY)}
          >
            Tudo pronto
          </button>
        )}
        {order.status === OrderStatus.READY && (
          <button
            className="btn-primary"
            disabled={isUpdating}
            onClick={() => onUpdateOrder(order.id, OrderStatus.DELIVERED)}
          >
            Entregue na mesa
          </button>
        )}
        {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED && (
          <button
            className="btn-danger"
            disabled={isUpdating}
            onClick={() => onUpdateOrder(order.id, OrderStatus.CANCELLED)}
          >
            Cancelar
          </button>
        )}
      </div>
    </article>
  );
});
