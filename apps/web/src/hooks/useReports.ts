import { useQuery } from '@tanstack/react-query';
import type { ReportsDashboardDto } from '@pedidonamesa/shared';
import { http, withAuth } from '../lib/axios';
import { queryKeys } from '../lib/query-keys';
import { useAuth } from '../context/AuthContext';

export function useReportsDashboard(from?: string, to?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.reportsDashboard(from, to),
    queryFn: () =>
      http
        .get<ReportsDashboardDto>('/admin/reports/dashboard', {
          ...withAuth(token),
          params: { from, to },
        })
        .then((r) => r.data),
    enabled: !!token,
  });
}
