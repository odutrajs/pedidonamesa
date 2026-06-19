import axios, { type AxiosRequestConfig } from 'axios';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export const http = axios.create({
  baseURL: API_BASE,
});

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data;
    const message =
      (typeof data === 'object' && data?.message) ||
      (typeof data === 'string' ? data : null) ||
      error.message;
    const status = error.response?.status ?? 500;
    return Promise.reject(new ApiError(String(message), status));
  },
);

export function withAuth(token: string | null | undefined): AxiosRequestConfig {
  if (!token) return {};
  return { headers: { Authorization: `Bearer ${token}` } };
}
