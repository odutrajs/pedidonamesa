import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { useLogin } from '../hooks/useLogin';
import { ApiError } from '../lib/axios';
import { emailRules, formConfig, passwordRules } from '../lib/validation';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { FieldError, Input, Label } from '../components/ui/Input';

interface LoginFormValues {
  email: string;
  password: string;
}

function getLoginErrorMessage(error: unknown): string | null {
  if (!error) return null;

  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Credenciais inválidas.';
    }
    if (error.status >= 500) {
      return 'Servidor indisponível. Verifique se a API está rodando (pnpm dev:api).';
    }
    return error.message;
  }

  return 'Não foi possível entrar. Tente novamente.';
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isValid, isValidating },
  } = useForm<LoginFormValues>({
    ...formConfig,
    defaultValues: { email: 'admin@demo.com', password: 'admin123' },
  });

  useEffect(() => {
    void trigger();
  }, [trigger]);

  function onSubmit(data: LoginFormValues) {
    loginMutation.mutate(data, {
      onSuccess: (response) => {
        login(response.accessToken, response.user);
        if (response.user.role === 'SUPER_ADMIN') {
          navigate('/super-admin');
        } else if (response.user.role === 'KITCHEN') {
          navigate('/cozinha');
        } else {
          navigate('/admin');
        }
      },
    });
  }

  const errorMessage = getLoginErrorMessage(loginMutation.error);

  return (
    <AppShell title="Entrar no painel" subtitle="Admin, cozinha, garçom ou plataforma" variant="minimal">
      <div className="mx-auto max-w-sm">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao site
        </Link>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" {...register('email', emailRules)} />
              <FieldError message={errors.email?.message} />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password', passwordRules)}
              />
              <FieldError message={errors.password?.message} />
            </div>
            {errorMessage && <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>}
            <Button
              type="submit"
              className="w-full"
              disabled={!isValid || isValidating || loginMutation.isPending}
            >
              {loginMutation.isPending ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>

        <p className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-500">
          Demo: admin@demo.com ou cozinha@demo.com — senha admin123
          <br />
          Plataforma: super@pedidonamesa.com — senha superadmin123
        </p>
      </div>
    </AppShell>
  );
}
