import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Truck } from 'lucide-react';
import type { CreateDeliveryOrderInput } from '@pedidonamesa/shared';
import { useDeliveryMenu } from '../hooks/useMenu';
import { useSubmitDeliveryOrder } from '../hooks/usePayment';
import { MenuPage } from './MenuPage';

export function DeliveryMenuPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: menu, isLoading, error: menuError } = useDeliveryMenu(slug);
  const submitOrder = useSubmitDeliveryOrder(slug);

  const handleSubmitOrder = useCallback(
    async (payload: CreateDeliveryOrderInput) => submitOrder.mutateAsync(payload),
    [submitOrder],
  );

  return (
    <MenuPage
      mode="delivery"
      menu={menu}
      isLoading={isLoading}
      hasError={!!menuError}
      paymentContext={slug ? { kind: 'delivery', slug } : undefined}
      emptyIcon={Truck}
      emptyTitle="Restaurante não encontrado"
      emptyDescription="Este link de delivery não existe ou está indisponível."
      onSubmitOrder={handleSubmitOrder}
      isSubmitting={submitOrder.isPending}
    />
  );
}
