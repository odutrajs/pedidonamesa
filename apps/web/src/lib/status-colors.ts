import { OrderStatus } from '@pedidonamesa/shared';

export const ORDER_STATUS_ACCENT: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'border-l-amber-500',
  [OrderStatus.CONFIRMED]: 'border-l-blue-500',
  [OrderStatus.PREPARING]: 'border-l-orange-500',
  [OrderStatus.READY]: 'border-l-emerald-500',
  [OrderStatus.DELIVERED]: 'border-l-zinc-400',
  [OrderStatus.CANCELLED]: 'border-l-red-500',
};

export const ORDER_STATUS_BADGE: Record<OrderStatus, 'warning' | 'info' | 'default' | 'success' | 'muted' | 'danger'> = {
  [OrderStatus.PENDING]: 'warning',
  [OrderStatus.CONFIRMED]: 'info',
  [OrderStatus.PREPARING]: 'default',
  [OrderStatus.READY]: 'success',
  [OrderStatus.DELIVERED]: 'muted',
  [OrderStatus.CANCELLED]: 'danger',
};
