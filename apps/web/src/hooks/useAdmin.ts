import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { http, withAuth } from '../lib/axios';
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

export function useCreateCategory() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CategoryFormValues) =>
      http.post('/admin/categories', { name: data.name }, withAuth(token)),
    onSuccess: () => {
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
    }: {
      data: ProductFormValues;
      image: File | null;
    }) => {
      const created = await http
        .post<AdminProduct>(
          '/admin/products',
          {
            name: data.name,
            description: data.description || undefined,
            price: Number(data.price),
            categoryId: data.categoryId,
          },
          withAuth(token),
        )
        .then((r) => r.data);

      if (image) {
        const formData = new FormData();
        formData.append('file', image);
        await http.post(`/admin/products/${created.id}/image`, formData, withAuth(token));
      }

      return created;
    },
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
