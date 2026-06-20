import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  CreateRestaurantInput,
  CreateRestaurantUserInput,
  RestaurantDetailDto,
  RestaurantSummaryDto,
  RestaurantUserDto,
  UpdateRestaurantInput,
} from '@pedidonamesa/shared';
import { http, withAuth } from '../lib/axios';
import { queryKeys } from '../lib/query-keys';
import { useAuth } from '../context/AuthContext';

export function useSuperAdminRestaurants() {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.superAdminRestaurants,
    queryFn: () =>
      http
        .get<RestaurantSummaryDto[]>('/super-admin/restaurants', withAuth(token))
        .then((r) => r.data),
    enabled: !!token,
  });
}

export function useSuperAdminRestaurant(id: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.superAdminRestaurant(id),
    queryFn: () =>
      http
        .get<RestaurantDetailDto>(`/super-admin/restaurants/${id}`, withAuth(token))
        .then((r) => r.data),
    enabled: !!token && !!id,
  });
}

export function useCreateRestaurant() {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRestaurantInput) =>
      http
        .post<RestaurantDetailDto>('/super-admin/restaurants', data, withAuth(token))
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdminRestaurants });
    },
  });
}

export function useUpdateRestaurant(id: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateRestaurantInput) =>
      http
        .patch<RestaurantDetailDto>(`/super-admin/restaurants/${id}`, data, withAuth(token))
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdminRestaurants });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdminRestaurant(id) });
    },
  });
}

export function useSuperAdminRestaurantUsers(restaurantId: string) {
  const { token } = useAuth();
  return useQuery({
    queryKey: queryKeys.superAdminRestaurantUsers(restaurantId),
    queryFn: () =>
      http
        .get<RestaurantUserDto[]>(`/super-admin/restaurants/${restaurantId}/users`, withAuth(token))
        .then((r) => r.data),
    enabled: !!token && !!restaurantId,
  });
}

export function useCreateRestaurantUser(restaurantId: string) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRestaurantUserInput) =>
      http
        .post<RestaurantUserDto>(
          `/super-admin/restaurants/${restaurantId}/users`,
          data,
          withAuth(token),
        )
        .then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.superAdminRestaurantUsers(restaurantId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdminRestaurant(restaurantId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.superAdminRestaurants });
    },
  });
}
