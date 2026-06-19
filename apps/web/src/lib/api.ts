import type { AxiosRequestConfig } from 'axios';
import { ApiError, http, withAuth } from './axios';

export { ApiError };

export async function api<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase();
  const config: AxiosRequestConfig = {
    ...withAuth(token),
    method,
    data: options.body,
  };

  const response = await http.request<T>({
    url: path,
    ...config,
  });

  return response.data;
}
