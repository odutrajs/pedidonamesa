import { useMutation, useQuery } from '@tanstack/react-query';
import type {
  CreateOrderInput,
  CreateOrderResponse,
  PaymentStatusDto,
  PixCheckoutDto,
  StripeCheckoutDto,
} from '@pedidonamesa/shared';
import { http } from '../lib/axios';

export function useSubmitOrder(token: string | undefined) {
  return useMutation({
    mutationFn: (payload: CreateOrderInput) =>
      http.post<CreateOrderResponse>(`/orders/mesa/${token}`, payload).then((r) => r.data),
  });
}

export function useCreateStripeCheckout(token: string | undefined) {
  return useMutation({
    mutationFn: (orderId: string) =>
      http
        .post<StripeCheckoutDto>(`/payments/mesa/${token}/orders/${orderId}/stripe`)
        .then((r) => r.data),
  });
}

export function useCreatePixCheckout(token: string | undefined) {
  return useMutation({
    mutationFn: (orderId: string) =>
      http
        .post<PixCheckoutDto>(`/payments/mesa/${token}/orders/${orderId}/pix`)
        .then((r) => r.data),
  });
}

export function useConfirmStripePayment(token: string | undefined) {
  return useMutation({
    mutationFn: ({ orderId, paymentIntentId }: { orderId: string; paymentIntentId: string }) =>
      http
        .post(`/payments/mesa/${token}/orders/${orderId}/confirm-stripe`, {
          paymentIntentId,
        })
        .then((r) => r.data),
  });
}

export function useMockPayment(token: string | undefined) {
  return useMutation({
    mutationFn: (orderId: string) =>
      http.post(`/payments/mesa/${token}/orders/${orderId}/mock`).then((r) => r.data),
  });
}

export function usePaymentStatus(
  token: string | undefined,
  orderId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['payment-status', token, orderId],
    queryFn: () =>
      http
        .get<PaymentStatusDto>(`/payments/mesa/${token}/orders/${orderId}/status`)
        .then((r) => r.data),
    enabled: !!token && !!orderId && enabled,
    refetchInterval: (query) =>
      query.state.data?.paymentStatus === 'PENDING' ? 3000 : false,
  });
}
