import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useLogin } from '../hooks/useLogin';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';

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
    <AppShell title="Entrar no painel" subtitle="Admin, cozinha ou garçom" variant="minimal">
      <div className="mx-auto max-w-sm">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao site
        </Link>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" {...register('email', { required: true })} />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" {...register('password', { required: true })} />
            </div>
            {(loginMutation.isError || errors.email || errors.password) && (
              <p className="text-sm text-red-600">Credenciais inválidas</p>
            )}
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-zinc-400">
          Demo: admin@demo.com ou cozinha@demo.com — senha admin123
        </p>
      </div>
    </AppShell>
  );
}
