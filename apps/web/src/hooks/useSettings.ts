import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PaymentMode, RestaurantSettingsDto } from '@pedidonamesa/shared';
import { http, withAuth } from '../lib/axios';
import { queryKeys } from '../lib/query-keys';
import { useAuth } from '../context/AuthContext';

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
    mutationFn: (paymentMode: PaymentMode) =>
      http
        .patch<RestaurantSettingsDto>('/admin/settings', { paymentMode }, withAuth(token))
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings });
    },
  });
}
