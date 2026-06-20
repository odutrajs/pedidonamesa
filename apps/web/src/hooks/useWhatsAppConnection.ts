import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WhatsAppConnectionStatusDto } from '@pedidonamesa/shared';
import { http, withAuth } from '../lib/axios';
import { queryKeys } from '../lib/query-keys';
import { useAuth } from '../context/AuthContext';

export function useWhatsAppConnection(enabled = true) {
  const { token } = useAuth();

  return useQuery({
    queryKey: queryKeys.whatsappConnection,
    queryFn: () =>
      http
        .get<WhatsAppConnectionStatusDto>('/admin/whatsapp/connection', withAuth(token))
        .then((response) => response.data),
    enabled: !!token && enabled,
    refetchInterval: (query) => {
      const state = query.state.data?.state;
      if (state === 'connected') return 15000;
      return 3000;
    },
  });
}

export function useDisconnectWhatsApp() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      http
        .post<WhatsAppConnectionStatusDto>('/admin/whatsapp/disconnect', {}, withAuth(token))
        .then((response) => response.data),
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.whatsappConnection, data);
    },
  });
}
