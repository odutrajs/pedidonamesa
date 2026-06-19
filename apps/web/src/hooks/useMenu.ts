import { useMutation, useQuery } from '@tanstack/react-query';
import type { CreateOrderInput, MenuDto } from '@pedidonamesa/shared';
import { http } from '../lib/axios';
import { queryKeys } from '../lib/query-keys';

export function useMenu(token: string | undefined) {
  return useQuery({
    queryKey: queryKeys.menu(token ?? ''),
    queryFn: () =>
      http.get<MenuDto>(`/menu/mesa/${token}`).then((r) => r.data),
    enabled: !!token,
    staleTime: 60_000,
  });
}

export { useSubmitOrder } from './usePayment';
