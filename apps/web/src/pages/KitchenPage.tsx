import { useCallback, useEffect, useState } from 'react';
import {
  ORDER_ITEM_STATUS_LABELS,
  ORDER_STATUS_LABELS,
  OrderDto,
  OrderItemStatus,
  OrderStatus,
  WS_EVENTS,
} from '@pedidonamesa/shared';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { connectOrdersSocket, disconnectOrdersSocket } from '../lib/socket';
import { formatCurrency, formatTime, playNewOrderSound } from '../lib/utils';

const STATUS_COLORS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-amber-100 text-amber-900 border-amber-300',
  [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-900 border-blue-300',
  [OrderStatus.PREPARING]: 'bg-orange-100 text-orange-900 border-orange-300',
  [OrderStatus.READY]: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  [OrderStatus.DELIVERED]: 'bg-stone-100 text-stone-600 border-stone-300',
  [OrderStatus.CANCELLED]: 'bg-red-100 text-red-900 border-red-300',
};

function OrderCard({
  order,
  onUpdateOrder,
  onUpdateItem,
}: {
  order: OrderDto;
  onUpdateOrder: (id: string, status: OrderStatus) => void;
  onUpdateItem: (itemId: string, status: OrderItemStatus) => void;
}) {
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
                    onClick={() => onUpdateItem(item.id, OrderItemStatus.PREPARING)}
                  >
                    Preparar
                  </button>
                )}
                {item.status === OrderItemStatus.PREPARING && (
                  <button
                    className="btn-success px-2 py-1 text-xs"
                    onClick={() => onUpdateItem(item.id, OrderItemStatus.READY)}
                  >
                    Pronto
                  </button>
                )}
                {item.status === OrderItemStatus.READY && (
                  <button
                    className="btn-primary px-2 py-1 text-xs"
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
            onClick={() => onUpdateOrder(order.id, OrderStatus.CONFIRMED)}
          >
            Confirmar
          </button>
        )}
        {(order.status === OrderStatus.PENDING || order.status === OrderStatus.CONFIRMED) && (
          <button
            className="btn-primary"
            onClick={() => onUpdateOrder(order.id, OrderStatus.PREPARING)}
          >
            Iniciar preparo
          </button>
        )}
        {order.status === OrderStatus.PREPARING && (
          <button
            className="btn-success"
            onClick={() => onUpdateOrder(order.id, OrderStatus.READY)}
          >
            Tudo pronto
          </button>
        )}
        {order.status === OrderStatus.READY && (
          <button
            className="btn-primary"
            onClick={() => onUpdateOrder(order.id, OrderStatus.DELIVERED)}
          >
            Entregue na mesa
          </button>
        )}
        {order.status !== OrderStatus.CANCELLED && order.status !== OrderStatus.DELIVERED && (
          <button
            className="btn-danger"
            onClick={() => onUpdateOrder(order.id, OrderStatus.CANCELLED)}
          >
            Cancelar
          </button>
        )}
      </div>
    </article>
  );
}

export function KitchenPage() {
  const { token, logout } = useAuth();
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = useCallback(async () => {
    if (!token) return;
    const data = await api<OrderDto[]>('/orders/kitchen', {}, token);
    setOrders(data);
    setLoading(false);
  }, [token]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!token) return;

    const socket = connectOrdersSocket(token);

    socket.on(WS_EVENTS.ORDER_CREATED, (order: OrderDto) => {
      playNewOrderSound();
      setOrders((prev) => {
        const exists = prev.some((o) => o.id === order.id);
        if (exists) return prev.map((o) => (o.id === order.id ? order : o));
        return [...prev, order];
      });
    });

    socket.on(WS_EVENTS.ORDER_UPDATED, (order: OrderDto) => {
      setOrders((prev) => {
        const activeStatuses = [
          OrderStatus.PENDING,
          OrderStatus.CONFIRMED,
          OrderStatus.PREPARING,
          OrderStatus.READY,
        ];
        if (!activeStatuses.includes(order.status)) {
          return prev.filter((o) => o.id !== order.id);
        }
        const exists = prev.some((o) => o.id === order.id);
        if (!exists) return [...prev, order];
        return prev.map((o) => (o.id === order.id ? order : o));
      });
    });

    socket.on(WS_EVENTS.ORDER_ITEM_UPDATED, (payload: { order: OrderDto }) => {
      const order = payload.order;
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    });

    return () => disconnectOrdersSocket();
  }, [token]);

  async function updateOrder(id: string, status: OrderStatus) {
    if (!token) return;
    const updated = await api<OrderDto>(
      `/orders/${id}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      token,
    );
    setOrders((prev) => {
      const active = [
        OrderStatus.PENDING,
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.READY,
      ];
      if (!active.includes(updated.status)) return prev.filter((o) => o.id !== id);
      return prev.map((o) => (o.id === id ? updated : o));
    });
  }

  async function updateItem(itemId: string, status: OrderItemStatus) {
    if (!token) return;
    const updated = await api<OrderDto>(
      `/orders/items/${itemId}/status`,
      { method: 'PATCH', body: JSON.stringify({ status }) },
      token,
    );
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

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
      {loading ? (
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
              onUpdateOrder={updateOrder}
              onUpdateItem={updateItem}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
