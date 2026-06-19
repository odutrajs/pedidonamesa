import { useCallback, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  OrderDto,
  OrderItemStatus,
  OrderStatus,
  WS_EVENTS,
} from '@pedidonamesa/shared';
import { useAuth } from '../context/AuthContext';
import { http, withAuth } from '../lib/axios';
import { queryKeys } from '../lib/query-keys';
import { connectOrdersSocket, disconnectOrdersSocket } from '../lib/socket';
import { playNewOrderSound } from '../lib/utils';

const ACTIVE_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];

function isActiveOrder(order: OrderDto) {
  return ACTIVE_STATUSES.includes(order.status);
}

function upsertOrder(orders: OrderDto[], order: OrderDto): OrderDto[] {
  if (!isActiveOrder(order)) {
    return orders.filter((o) => o.id !== order.id);
  }
  const exists = orders.some((o) => o.id === order.id);
  if (!exists) return [...orders, order];
  return orders.map((o) => (o.id === order.id ? order : o));
}

export function useKitchenOrders() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.kitchenOrders,
    queryFn: () =>
      http.get<OrderDto[]>('/orders/kitchen', withAuth(token)).then((r) => r.data),
    enabled: !!token,
    staleTime: 10_000,
  });

  const setOrders = useCallback(
    (updater: (prev: OrderDto[]) => OrderDto[]) => {
      queryClient.setQueryData<OrderDto[]>(queryKeys.kitchenOrders, (prev) =>
        updater(prev ?? []),
      );
    },
    [queryClient],
  );

  useEffect(() => {
    if (!token) return;

    const socket = connectOrdersSocket(token);

    socket.on(WS_EVENTS.ORDER_CREATED, (order: OrderDto) => {
      playNewOrderSound();
      setOrders((prev) => upsertOrder(prev, order));
    });

    socket.on(WS_EVENTS.ORDER_UPDATED, (order: OrderDto) => {
      setOrders((prev) => upsertOrder(prev, order));
    });

    socket.on(WS_EVENTS.ORDER_ITEM_UPDATED, (payload: { order: OrderDto }) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === payload.order.id ? payload.order : o)),
      );
    });

    return () => disconnectOrdersSocket();
  }, [token, setOrders]);

  return query;
}

export function useUpdateOrderStatus() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      http
        .patch<OrderDto>(`/orders/${id}/status`, { status }, withAuth(token))
        .then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData<OrderDto[]>(queryKeys.kitchenOrders, (prev) => {
        const orders = prev ?? [];
        if (!isActiveOrder(updated)) {
          return orders.filter((o) => o.id !== updated.id);
        }
        return orders.map((o) => (o.id === updated.id ? updated : o));
      });
    },
  });
}

export function useUpdateOrderItemStatus() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, status }: { itemId: string; status: OrderItemStatus }) =>
      http
        .patch<OrderDto>(`/orders/items/${itemId}/status`, { status }, withAuth(token))
        .then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData<OrderDto[]>(queryKeys.kitchenOrders, (prev) =>
        (prev ?? []).map((o) => (o.id === updated.id ? updated : o)),
      );
    },
  });
}
