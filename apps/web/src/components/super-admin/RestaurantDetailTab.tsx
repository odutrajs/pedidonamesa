import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { PAYMENT_MODE_LABELS, UserRole } from '@pedidonamesa/shared';
import {
  useCreateRestaurantUser,
  useSuperAdminRestaurant,
  useSuperAdminRestaurantUsers,
  useUpdateRestaurant,
} from '../../hooks/useSuperAdmin';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { FieldError, Input, Label } from '../ui/Input';
import { Skeleton } from '../ui/Skeleton';
import { formConfig } from '../../lib/validation';

interface SettingsFormValues {
  name: string;
  slug: string;
  description: string;
  active: boolean;
  inventoryEnabled: boolean;
  financeEnabled: boolean;
  whatsappEnabled: boolean;
  deliveryEnabled: boolean;
  whatsappBotEnabled: boolean;
}

interface UserFormValues {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

function ToggleField({
  id,
  label,
  description,
  register,
}: {
  id: keyof SettingsFormValues;
  label: string;
  description: string;
  register: ReturnType<typeof useForm<SettingsFormValues>>['register'];
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-700">
      <input id={id} type="checkbox" className="mt-1" {...register(id)} />
      <span>
        <span className="block font-medium text-zinc-900 dark:text-zinc-50">{label}</span>
        <span className="block text-sm text-zinc-500 dark:text-zinc-400">{description}</span>
      </span>
    </label>
  );
}

export function RestaurantDetailTab() {
  const { id = '' } = useParams();
  const { data: restaurant, isLoading } = useSuperAdminRestaurant(id);
  const { data: users } = useSuperAdminRestaurantUsers(id);
  const updateRestaurant = useUpdateRestaurant(id);
  const createUser = useCreateRestaurantUser(id);

  const settingsForm = useForm<SettingsFormValues>({ ...formConfig });
  const userForm = useForm<UserFormValues>({
    ...formConfig,
    defaultValues: { role: UserRole.KITCHEN },
  });

  useEffect(() => {
    if (!restaurant) return;
    settingsForm.reset({
      name: restaurant.name,
      slug: restaurant.slug,
      description: restaurant.description ?? '',
      active: restaurant.active,
      inventoryEnabled: restaurant.inventoryEnabled,
      financeEnabled: restaurant.financeEnabled,
      whatsappEnabled: restaurant.whatsappEnabled,
      deliveryEnabled: restaurant.deliveryEnabled,
      whatsappBotEnabled: restaurant.whatsappBotEnabled,
    });
  }, [restaurant, settingsForm]);

  function onSaveSettings(data: SettingsFormValues) {
    updateRestaurant.mutate({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      active: data.active,
      inventoryEnabled: data.inventoryEnabled,
      financeEnabled: data.financeEnabled,
      whatsappEnabled: data.whatsappEnabled,
      deliveryEnabled: data.deliveryEnabled,
      whatsappBotEnabled: data.whatsappBotEnabled,
    });
  }

  function onCreateUser(data: UserFormValues) {
    createUser.mutate(data, {
      onSuccess: () => userForm.reset({ name: '', email: '', password: '', role: UserRole.KITCHEN }),
    });
  }

  if (isLoading) {
    return <Skeleton className="h-96 w-full rounded-xl" />;
  }

  if (!restaurant) {
    return (
      <Card className="p-6 text-center text-zinc-500">
        Restaurante não encontrado.{' '}
        <Link to="/super-admin" className="text-zinc-900 underline dark:text-zinc-100">
          Voltar
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        to="/super-admin"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar aos restaurantes
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{restaurant.name}</h2>
        <Badge variant={restaurant.active ? 'success' : 'danger'}>
          {restaurant.active ? 'Ativo' : 'Inativo'}
        </Badge>
        <span className="text-sm text-zinc-500">
          Pagamento: {PAYMENT_MODE_LABELS[restaurant.paymentMode]}
        </span>
      </div>

      <form onSubmit={settingsForm.handleSubmit(onSaveSettings)} className="space-y-6">
        <Card className="space-y-4 p-6">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Dados do restaurante</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input id="name" {...settingsForm.register('name', { required: true })} />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" {...settingsForm.register('slug', { required: true })} />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Input id="description" {...settingsForm.register('description')} />
            </div>
          </div>
        </Card>

        <Card className="space-y-4 p-6">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Funcionalidades</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Controle quais módulos ficam disponíveis no painel do restaurante.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ToggleField
              id="active"
              label="Restaurante ativo"
              description="Desativa cardápio delivery e bot WhatsApp."
              register={settingsForm.register}
            />
            <ToggleField
              id="inventoryEnabled"
              label="Estoque e CMV"
              description="Ficha técnica, baixa automática e relatório de CMV."
              register={settingsForm.register}
            />
            <ToggleField
              id="financeEnabled"
              label="Financeiro"
              description="Dashboard, DRE, despesas e fechamento de caixa."
              register={settingsForm.register}
            />
            <ToggleField
              id="whatsappEnabled"
              label="WhatsApp (módulo)"
              description="Exibe a aba WhatsApp no painel do restaurante."
              register={settingsForm.register}
            />
            <ToggleField
              id="whatsappBotEnabled"
              label="Bot WhatsApp"
              description="Permite ativar o bot de atendimento automático."
              register={settingsForm.register}
            />
            <ToggleField
              id="deliveryEnabled"
              label="Delivery"
              description="Habilita cardápio e pedidos por /entrega/:slug."
              register={settingsForm.register}
            />
          </div>
        </Card>

        <Button type="submit" disabled={updateRestaurant.isPending}>
          {updateRestaurant.isPending ? 'Salvando...' : 'Salvar alterações'}
        </Button>
      </form>

      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-medium text-zinc-900 dark:text-zinc-50">Usuários</h3>
          <Badge variant="muted">{users?.length ?? 0} cadastrado(s)</Badge>
        </div>

        {users && users.length > 0 && (
          <ul className="divide-y divide-zinc-200 rounded-lg border border-zinc-200 dark:divide-zinc-700 dark:border-zinc-700">
            {users.map((user) => (
              <li key={user.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">{user.name}</p>
                  <p className="text-zinc-500">{user.email}</p>
                </div>
                <Badge>{user.role}</Badge>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={userForm.handleSubmit(onCreateUser)} className="grid gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-700 sm:grid-cols-2">
          <h4 className="flex items-center gap-2 font-medium text-zinc-900 sm:col-span-2 dark:text-zinc-50">
            <UserPlus className="h-4 w-4" />
            Novo usuário
          </h4>
          <div>
            <Label htmlFor="userName">Nome</Label>
            <Input id="userName" {...userForm.register('name', { required: true })} />
            <FieldError message={userForm.formState.errors.name?.message} />
          </div>
          <div>
            <Label htmlFor="userEmail">E-mail</Label>
            <Input id="userEmail" type="email" {...userForm.register('email', { required: true })} />
            <FieldError message={userForm.formState.errors.email?.message} />
          </div>
          <div>
            <Label htmlFor="userPassword">Senha</Label>
            <Input id="userPassword" type="password" {...userForm.register('password', { required: true, minLength: 6 })} />
            <FieldError message={userForm.formState.errors.password?.message} />
          </div>
          <div>
            <Label htmlFor="userRole">Papel</Label>
            <select
              id="userRole"
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-900"
              {...userForm.register('role', { required: true })}
            >
              <option value={UserRole.ADMIN}>Admin</option>
              <option value={UserRole.KITCHEN}>Cozinha</option>
              <option value={UserRole.WAITER}>Garçom</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" variant="outline" disabled={createUser.isPending}>
              {createUser.isPending ? 'Criando...' : 'Adicionar usuário'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
