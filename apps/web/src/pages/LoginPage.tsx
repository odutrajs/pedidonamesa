import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useLogin } from '../hooks/useLogin';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: { email: 'admin@demo.com', password: 'admin123' },
  });

  function onSubmit(data: LoginFormValues) {
    loginMutation.mutate(data, {
      onSuccess: (response) => {
        login(response.accessToken, response.user);
        if (response.user.role === 'KITCHEN') {
          navigate('/cozinha');
        } else {
          navigate('/admin');
        }
      },
    });
  }

  return (
    <AppShell title="Entrar" subtitle="Admin, cozinha ou garçom">
      <form onSubmit={handleSubmit(onSubmit)} className="card mx-auto max-w-md space-y-4 p-6">
        <div>
          <label className="mb-1 block text-sm font-medium">E-mail</label>
          <input className="input" type="email" {...register('email', { required: true })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Senha</label>
          <input className="input" type="password" {...register('password', { required: true })} />
        </div>
        {(loginMutation.isError || errors.email || errors.password) && (
          <p className="text-sm text-red-600">Credenciais inválidas</p>
        )}
        <button className="btn-primary w-full" disabled={loginMutation.isPending}>
          {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
        </button>
        <p className="text-center text-xs text-stone-500">
          Demo: admin@demo.com ou cozinha@demo.com — senha admin123
        </p>
      </form>
    </AppShell>
  );
}
