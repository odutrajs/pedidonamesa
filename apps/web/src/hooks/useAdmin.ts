import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { MenuChannel, OrderDto, ProductOptionGroupDto } from '@pedidonamesa/shared';
import { http, withAuth } from '../lib/axios';
import { parsePriceInput } from '../lib/utils';
import { queryKeys } from '../lib/query-keys';
import type {
  AdminProduct,
  Category,
  CategoryFormValues,
  ProductFormValues,
  TableFormValues,
  TableRow,
} from '../types/admin';
import { useAuth } from '../context/AuthContext';

export function useCategories(enabled = true) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () =>
      http.get<Category[]>('/admin/categories', withAuth(token)).then((r) => r.data),
    enabled: !!token && enabled,
  });
}

export function useProducts(enabled = true) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: () =>
      http.get<AdminProduct[]>('/admin/products', withAuth(token)).then((r) => r.data),
    enabled: !!token && enabled,
  });
}

export function useTables(enabled = true) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.tables,
    queryFn: () =>
      http.get<TableRow[]>('/admin/tables', withAuth(token)).then((r) => r.data),
    enabled: !!token && enabled,
  });
}

export function useOrders(enabled = true) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: () =>
      http.get<OrderDto[]>('/admin/orders', withAuth(token)).then((r) => r.data),
    enabled: !!token && enabled,
    staleTime: 15_000,
  });
}

export function useCreateCategory() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryFormValues) =>
      http.post(
        '/admin/categories',
        {
          name: data.name.trim(),
          description: data.description.trim() || undefined,
        },
        withAuth(token),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useUpdateCategory() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: CategoryFormValues & { active?: boolean };
    }) =>
      http.patch(
        `/admin/categories/${id}`,
        {
          name: data.name.trim(),
          description: data.description.trim() || undefined,
          active: data.active,
        },
        withAuth(token),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useReorderCategories() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderedIds: string[]) =>
      http
        .patch<Category[]>('/admin/categories/reorder', { orderedIds }, withAuth(token))
        .then((r) => r.data),
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.categories });
      const previous = queryClient.getQueryData<Category[]>(queryKeys.categories);

      if (previous) {
        const byId = new Map(previous.map((category) => [category.id, category]));
        const reordered = orderedIds
          .map((id, index) => {
            const category = byId.get(id);
            return category ? { ...category, sortOrder: index + 1 } : null;
          })
          .filter((category): category is Category => category !== null);

        queryClient.setQueryData<Category[]>(queryKeys.categories, reordered);
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.categories, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useCreateProduct() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
      image,
      optionGroups,
    }: {
      data: ProductFormValues;
      image: File | null;
      optionGroups?: ProductOptionGroupDto[];
    }) => {
      const formData = new FormData();
      formData.append('name', data.name.trim());
      formData.append('price', String(data.price));
      formData.append('categoryId', data.categoryId);
      if (data.description?.trim()) {
        formData.append('description', data.description.trim());
      }
      if (optionGroups?.length) {
        formData.append('optionGroups', JSON.stringify(optionGroups));
      }
      if (image) {
        formData.append('file', image);
      }

      return http
        .post<AdminProduct>('/admin/products', formData, withAuth(token))
        .then((r) => r.data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useUpdateProduct() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      image,
      channels,
      optionGroups,
    }: {
      id: string;
      data: ProductFormValues;
      image: File | null;
      channels?: MenuChannel[];
      optionGroups?: ProductOptionGroupDto[];
    }) => {
      const product = await http
        .patch<AdminProduct>(
          `/admin/products/${id}`,
          {
            name: data.name.trim(),
            price: parsePriceInput(data.price),
            categoryId: data.categoryId,
            description: data.description?.trim() || undefined,
            channels,
            optionGroups,
          },
          withAuth(token),
        )
        .then((r) => r.data);

      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        await http.post(`/admin/products/${id}/image`, formData, withAuth(token));
      }

      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useUpdateProductSuggestions() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, suggestedProductIds }: { id: string; suggestedProductIds: string[] }) =>
      http
        .put<{ suggestedProductIds: string[] }>(
          `/admin/products/${id}/suggestions`,
          { suggestedProductIds },
          withAuth(token),
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useUploadProductImage() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, file }: { productId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      return http.post(`/admin/products/${productId}/image`, formData, withAuth(token));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useToggleProduct() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      http.patch(`/admin/products/${id}`, { available }, withAuth(token)),
    onMutate: async ({ id, available }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products });
      const previous = queryClient.getQueryData<AdminProduct[]>(queryKeys.products);
      queryClient.setQueryData<AdminProduct[]>(queryKeys.products, (old) =>
        old?.map((p) => (p.id === id ? { ...p, available } : p)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.products, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });
}

export function useCreateTable() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TableFormValues) =>
      http.post(
        '/admin/tables',
        {
          number: Number(data.number),
          label: data.label || undefined,
        },
        withAuth(token),
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables });
    },
  });
}

export function useRegenerateTableToken() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      http.post(`/admin/tables/${id}/regenerate-token`, undefined, withAuth(token)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tables });
    },
  });
}
