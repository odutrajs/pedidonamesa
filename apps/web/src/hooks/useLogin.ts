import { useMutation } from '@tanstack/react-query';
import { http } from '../lib/axios';

interface LoginResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    restaurantId: string;
  };
}

interface LoginFormValues {
  email: string;
  password: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginFormValues) =>
      http.post<LoginResponse>('/auth/login', data).then((r) => r.data),
  });
}
