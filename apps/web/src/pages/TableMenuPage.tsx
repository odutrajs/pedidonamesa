import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import type { CreateOrderInput } from '@pedidonamesa/shared';
import { useTableMenu } from '../hooks/useMenu';
import { useSubmitTableOrder } from '../hooks/usePayment';
import { MenuPage } from './MenuPage';

export function TableMenuPage() {
  const { token } = useParams<{ token: string }>();
  const { data: menu, isLoading, error: menuError } = useTableMenu(token);
  const submitOrder = useSubmitTableOrder(token);

  const handleSubmitOrder = useCallback(
    async (payload: CreateOrderInput) => submitOrder.mutateAsync(payload),
    [submitOrder],
  );

  return (
    <MenuPage
      mode="table"
      menu={menu}
      isLoading={isLoading}
      hasError={!!menuError}
      paymentContext={token ? { kind: 'table', token } : undefined}
      emptyIcon={QrCode}
      emptyTitle="QR Code inválido"
      emptyDescription="Esta mesa não foi encontrada. Peça ao garçom um novo QR Code."
      onSubmitOrder={handleSubmitOrder}
      isSubmitting={submitOrder.isPending}
    />
  );
}
