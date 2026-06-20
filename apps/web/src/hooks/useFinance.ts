import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CashClosingDto,
  DreReportDto,
  ExpenseCategory,
  ExpenseDto,
  FinancialDashboardDto,
} from '@pedidonamesa/shared';
import { http, withAuth } from '../lib/axios';
import { queryKeys } from '../lib/query-keys';
import { useAuth } from '../context/AuthContext';

function invalidateFinanceQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['admin', 'finance'] });
}

export function useFinancialDashboard(from?: string, to?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.financeDashboard(from, to),
    queryFn: () =>
      http
        .get<FinancialDashboardDto>('/admin/finance/dashboard', {
          ...withAuth(token),
          params: { from, to },
        })
        .then((r) => r.data),
    enabled: !!token,
  });
}

export function useDreReport(from?: string, to?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.financeDre(from, to),
    queryFn: () =>
      http
        .get<DreReportDto>('/admin/finance/dre', {
          ...withAuth(token),
          params: { from, to },
        })
        .then((r) => r.data),
    enabled: !!token,
  });
}

export function useCashClosing(date?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.financeCashClosing(date),
    queryFn: () =>
      http
        .get<CashClosingDto>('/admin/finance/cash-closing', {
          ...withAuth(token),
          params: { date },
        })
        .then((r) => r.data),
    enabled: !!token,
  });
}

export function useExpenses(from?: string, to?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.financeExpenses(from, to),
    queryFn: () =>
      http
        .get<ExpenseDto[]>('/admin/finance/expenses', {
          ...withAuth(token),
          params: { from, to },
        })
        .then((r) => r.data),
    enabled: !!token,
  });
}

export function useCreateExpense() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      category: ExpenseCategory;
      description: string;
      amount: number;
      dueDate: string;
      paid?: boolean;
    }) =>
      http.post<ExpenseDto>('/admin/finance/expenses', data, withAuth(token)).then((r) => r.data),
    onSuccess: () => invalidateFinanceQueries(queryClient),
  });
}

export function useUpdateExpense() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      category?: ExpenseCategory;
      description?: string;
      amount?: number;
      dueDate?: string;
      paid?: boolean;
    }) =>
      http
        .patch<ExpenseDto>(`/admin/finance/expenses/${id}`, data, withAuth(token))
        .then((r) => r.data),
    onSuccess: () => invalidateFinanceQueries(queryClient),
  });
}

export function useDeleteExpense() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      http.delete(`/admin/finance/expenses/${id}`, withAuth(token)).then((r) => r.data),
    onSuccess: () => invalidateFinanceQueries(queryClient),
  });
}
