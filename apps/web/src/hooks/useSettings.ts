import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaymentMode, RestaurantSettingsDto } from '@pedidonamesa/shared';
import { http, withAuth } from '../lib/axios';
import { queryKeys } from '../lib/query-keys';
import { useAuth } from '../context/AuthContext';

export type RestaurantSettingsUpdate = Partial<
  Pick<
    RestaurantSettingsDto,
    | 'paymentMode'
    | 'upsellDrinkCategoryId'
    | 'upsellFoodOnlyEnabled'
    | 'upsellFoodOnlyCategoryId'
    | 'upsellDrinksOnlyEnabled'
    | 'upsellDrinksOnlyCategoryId'
  >
>;

export function useRestaurantSettings(enabled = true) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.settings,
    queryFn: () =>
      http.get<RestaurantSettingsDto>('/admin/settings', withAuth(token)).then((r) => r.data),
    enabled: !!token && enabled,
  });
}

export function useUpdateRestaurantSettings() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: RestaurantSettingsUpdate) =>
      http
        .patch<RestaurantSettingsDto>('/admin/settings', data, withAuth(token))
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}

export function useUpdatePaymentMode() {
  const updateSettings = useUpdateRestaurantSettings();

  return useMutation({
    mutationFn: (paymentMode: PaymentMode) => updateSettings.mutateAsync({ paymentMode }),
  });
}
