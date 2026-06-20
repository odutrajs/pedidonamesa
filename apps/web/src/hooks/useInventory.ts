import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CmvReportDto,
  IngredientDto,
  IngredientUnit,
  InventoryCountDto,
  ProductRecipeDto,
  StockMovementDto,
} from '@pedidonamesa/shared';
import { http, withAuth } from '../lib/axios';
import { queryKeys } from '../lib/query-keys';
import { useAuth } from '../context/AuthContext';

export function useIngredients() {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.ingredients,
    queryFn: () =>
      http.get<IngredientDto[]>('/admin/inventory/ingredients', withAuth(token)).then((r) => r.data),
    enabled: !!token,
  });
}

export function useStockMovements() {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.stockMovements,
    queryFn: () =>
      http
        .get<StockMovementDto[]>('/admin/inventory/movements', withAuth(token))
        .then((r) => r.data),
    enabled: !!token,
  });
}

export function useStockAlerts() {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.stockAlerts,
    queryFn: () =>
      http.get<IngredientDto[]>('/admin/inventory/alerts', withAuth(token)).then((r) => r.data),
    enabled: !!token,
  });
}

export function useCmvReport(from?: string, to?: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.cmvReport(from, to),
    queryFn: () =>
      http
        .get<CmvReportDto>('/admin/inventory/cmv', {
          ...withAuth(token),
          params: { from, to },
        })
        .then((r) => r.data),
    enabled: !!token,
  });
}

export function useProductRecipe(productId: string | null) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.productRecipe(productId ?? ''),
    queryFn: () =>
      http
        .get<ProductRecipeDto>(`/admin/inventory/products/${productId}/recipe`, withAuth(token))
        .then((r) => r.data),
    enabled: !!token && !!productId,
  });
}

export function useCreateIngredient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name: string;
      unit: IngredientUnit;
      costPerUnit?: number;
      currentStock?: number;
      minStock?: number;
    }) => http.post('/admin/inventory/ingredients', data, withAuth(token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAlerts });
      queryClient.invalidateQueries({ queryKey: queryKeys.cmvReport() });
    },
  });
}

export function useUpdateIngredient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        unit: IngredientUnit;
        costPerUnit: number;
        minStock: number;
        active: boolean;
      }>;
    }) => http.patch(`/admin/inventory/ingredients/${id}`, data, withAuth(token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAlerts });
    },
  });
}

export function useDeleteIngredient() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      http.delete(`/admin/inventory/ingredients/${id}`, withAuth(token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients });
    },
  });
}

export function useRecordPurchase() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      ingredientId: string;
      quantity: number;
      unitCost?: number;
      notes?: string;
    }) => http.post('/admin/inventory/movements/purchase', data, withAuth(token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockMovements });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockAlerts });
    },
  });
}

export function useUpdateProductRecipe() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      lines,
    }: {
      productId: string;
      lines: Array<{ ingredientId: string; quantity: number }>;
    }) =>
      http.put(`/admin/inventory/products/${productId}/recipe`, { lines }, withAuth(token)),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.productRecipe(variables.productId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cmvReport() });
    },
  });
}

export function useSubmitInventoryCount() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      notes?: string;
      lines: Array<{ ingredientId: string; physicalQuantity: number }>;
    }) => http.post('/admin/inventory/counts', data, withAuth(token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients });
      queryClient.invalidateQueries({ queryKey: queryKeys.stockMovements });
      queryClient.invalidateQueries({ queryKey: queryKeys.cmvReport() });
    },
  });
}
