import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  CreateDeliveryOrderInput,
  CreateOrderInput,
  CreateOrderResponse,
  MenuDto,
  PaymentStatusDto,
  PixCheckoutDto,
  StripeCheckoutDto,
} from '@pedidonamesa/shared';
import { http } from '../lib/axios';
import { queryKeys } from '../lib/query-keys';

export type OrderPaymentContext =
  | { kind: 'table'; token: string }
  | { kind: 'delivery'; slug: string };

function ordersPath(context: OrderPaymentContext) {
  return context.kind === 'table'
    ? `/orders/mesa/${context.token}`
    : `/orders/entrega/${context.slug}`;
}

function paymentsPath(context: OrderPaymentContext, orderId: string, action: string) {
  const base =
    context.kind === 'table'
      ? `/payments/mesa/${context.token}/orders/${orderId}`
      : `/payments/entrega/${context.slug}/orders/${orderId}`;
  return `${base}/${action}`;
}

export function useTableMenu(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.menuTable(token ?? ''),
    queryFn: () => http.get<MenuDto>(`/menu/mesa/${token}`).then((response) => response.data),
    enabled: !!token,
    staleTime: 60_000,
  });
}

export function useDeliveryMenu(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.menuDelivery(slug ?? ''),
    queryFn: () => http.get<MenuDto>(`/menu/entrega/${slug}`).then((response) => response.data),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export function useSubmitTableOrder(token: string | undefined) {
  return useMutation({
    mutationFn: (payload: CreateOrderInput) =>
      http.post<CreateOrderResponse>(`/orders/mesa/${token}`, payload).then((response) => response.data),
  });
}

export function useSubmitDeliveryOrder(slug: string | undefined) {
  return useMutation({
    mutationFn: (payload: CreateDeliveryOrderInput) =>
      http
        .post<CreateOrderResponse>(`/orders/entrega/${slug}`, payload)
        .then((response) => response.data),
  });
}

export function useCreateStripeCheckout(context: OrderPaymentContext | undefined) {
  return useMutation({
    mutationFn: (orderId: string) =>
      http
        .post<StripeCheckoutDto>(paymentsPath(context!, orderId, 'stripe'))
        .then((response) => response.data),
  });
}

export function useCreatePixCheckout(context: OrderPaymentContext | undefined) {
  return useMutation({
    mutationFn: (orderId: string) =>
      http.post<PixCheckoutDto>(paymentsPath(context!, orderId, 'pix')).then((response) => response.data),
  });
}

export function useConfirmStripePayment(context: OrderPaymentContext | undefined) {
  return useMutation({
    mutationFn: ({ orderId, paymentIntentId }: { orderId: string; paymentIntentId: string }) =>
      http
        .post(paymentsPath(context!, orderId, 'confirm-stripe'), { paymentIntentId })
        .then((response) => response.data),
  });
}

export function useMockPayment(context: OrderPaymentContext | undefined) {
  return useMutation({
    mutationFn: (orderId: string) =>
      http.post(paymentsPath(context!, orderId, 'mock')).then((response) => response.data),
  });
}

export function usePaymentStatus(
  context: OrderPaymentContext | undefined,
  orderId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['payment-status', context?.kind, context?.kind === 'table' ? context.token : context?.slug, orderId],
    queryFn: () =>
      http.get<PaymentStatusDto>(`${paymentsPath(context!, orderId!, 'status')}`).then((response) => response.data),
    enabled: !!context && !!orderId && enabled,
    refetchInterval: (query) =>
      query.state.data?.paymentStatus === 'PENDING' ? 3000 : false,
  });
}

export { ordersPath, paymentsPath };
